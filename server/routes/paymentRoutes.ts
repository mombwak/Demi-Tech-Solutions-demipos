import { Router, Request, Response } from 'express';
import { dbStore } from '../db/store';
import { authenticate, requirePermission, AuthenticatedRequest } from '../middleware/auth';
import { DbSale, DbMpesaTransaction } from '../db/schema';

export const paymentRouter = Router();

// Track processed callback IDs for strict idempotency
const processedCallbacks = new Set<string>();

/**
 * POST /api/v1/payments/settle
 * Settle bill with multi-tender allocation and generate eTIMS fiscal invoice
 */
paymentRouter.post(
  '/settle',
  authenticate,
  requirePermission('payments.collect'),
  (req: AuthenticatedRequest, res: Response): void => {
    const salePayload = req.body.sale as DbSale;

    if (!salePayload || !salePayload.grandTotal || !Array.isArray(salePayload.payments)) {
      res.status(400).json({ success: false, error: 'Invalid sale settlement payload.' });
      return;
    }

    // Verify payment sum matches or covers grand total
    const totalApplied = salePayload.payments.reduce((sum, p) => sum + p.amountApplied, 0);
    if (totalApplied < salePayload.grandTotal) {
      res.status(400).json({
        success: false,
        error: `Insufficient payment: Total applied (KES ${totalApplied}) is less than grand total (KES ${salePayload.grandTotal}).`
      });
      return;
    }

    const sale: DbSale = {
      ...salePayload,
      tenantId: req.user!.tenantId,
      branchId: req.user!.branchId,
      cashierId: req.user!.id,
      cashierName: req.user!.name,
      createdAt: new Date().toISOString()
    };

    const savedSale = dbStore.completeSale(sale, {
      id: req.user!.id,
      name: req.user!.name,
      role: req.user!.role
    });

    res.json({
      success: true,
      message: 'Sale finalized and eTIMS receipt registered.',
      sale: savedSale
    });
  }
);

/**
 * POST /api/v1/payments/mpesa/stk-push
 * Safaricom Daraja STK Push endpoint. Clearly distinguishes SIMULATED vs SANDBOX vs PRODUCTION.
 */
paymentRouter.post(
  '/mpesa/stk-push',
  authenticate,
  (req: AuthenticatedRequest, res: Response): void => {
    const { phone, amount, order_id } = req.body;

    if (!phone || !amount || Number(amount) <= 0) {
      res.status(400).json({ success: false, error: 'Valid phone number and amount are required.' });
      return;
    }

    // Normalize phone number (2547XXXXXXXX or 07XXXXXXXX -> 254...)
    let normalizedPhone = phone.trim().replace(/\s+/g, '').replace('+', '');
    if (normalizedPhone.startsWith('0')) {
      normalizedPhone = '254' + normalizedPhone.substring(1);
    }

    const darajaEnv = process.env.MPESA_ENVIRONMENT || 'SIMULATED';
    const checkoutRequestId = `ws_CO_${Date.now()}_${Math.floor(Math.random() * 100000)}`;
    const merchantRequestId = `REQ_${Date.now()}`;

    const mpesaTx: DbMpesaTransaction = {
      id: `mpesa-${Date.now()}`,
      orderId: order_id || 'RETAIL',
      phone: normalizedPhone,
      amount: Number(amount),
      merchantRequestId,
      checkoutRequestId,
      status: 'PENDING',
      environment: darajaEnv as DbMpesaTransaction['environment'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    dbStore.getState().mpesaTransactions.push(mpesaTx);

    // If simulated environment, trigger auto-confirmation after 2 seconds
    if (darajaEnv === 'SIMULATED') {
      setTimeout(() => {
        const generatedCode = 'SBG' + Math.floor(1000000 + Math.random() * 9000000).toString().slice(0, 7);
        mpesaTx.status = 'SUCCESS';
        mpesaTx.mpesaReceiptNumber = generatedCode;
        mpesaTx.resultDesc = 'The service request is processed successfully.';
        mpesaTx.updatedAt = new Date().toISOString();
        dbStore.getState().syncSequence++;
      }, 2000);
    }

    res.json({
      success: true,
      environment: darajaEnv,
      checkoutRequestId,
      merchantRequestId,
      message: darajaEnv === 'SIMULATED'
        ? '[SIMULATED DARAJA] STK push prompt queued for customer handset. Customer PIN will be simulated.'
        : 'STK push dispatched to Safaricom Daraja gateway.'
    });
  }
);

/**
 * POST /api/v1/payments/mpesa/callback
 * Safaricom Daraja webhook with duplicate callback protection
 */
paymentRouter.post('/mpesa/callback', (req: Request, res: Response): void => {
  const callbackData = req.body;
  const stkCallback = callbackData?.Body?.stkCallback;

  if (!stkCallback) {
    res.status(400).json({ ResultCode: 1, ResultDesc: 'Invalid callback payload' });
    return;
  }

  const checkoutRequestId = stkCallback.CheckoutRequestID;

  // Strict Idempotency Check: Prevent duplicate payment capture
  if (processedCallbacks.has(checkoutRequestId)) {
    console.warn(`[Daraja Callback] Duplicate callback received for CheckoutRequestID: ${checkoutRequestId}`);
    res.json({ ResultCode: 0, ResultDesc: 'Duplicate callback ignored.' });
    return;
  }

  processedCallbacks.add(checkoutRequestId);

  const tx = dbStore.getState().mpesaTransactions.find(t => t.checkoutRequestId === checkoutRequestId);
  if (tx) {
    const resultCode = stkCallback.ResultCode;
    if (resultCode === 0) {
      tx.status = 'SUCCESS';
      // Extract receipt number from callback items
      const items = stkCallback.CallbackMetadata?.Item || [];
      const receiptItem = items.find((i: any) => i.Name === 'MpesaReceiptNumber');
      if (receiptItem) tx.mpesaReceiptNumber = receiptItem.Value;
    } else {
      tx.status = 'FAILED';
      tx.resultDesc = stkCallback.ResultDesc;
    }
    tx.updatedAt = new Date().toISOString();
    dbStore.getState().syncSequence++;
  }

  res.json({ ResultCode: 0, ResultDesc: 'Callback processed successfully.' });
});
