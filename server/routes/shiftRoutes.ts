import { Router, Response } from 'express';
import { dbStore } from '../db/store';
import { authenticate, requirePermission, AuthenticatedRequest } from '../middleware/auth';

export const shiftRouter = Router();

/**
 * GET /api/v1/shifts/active
 */
shiftRouter.get('/active', authenticate, (req: AuthenticatedRequest, res: Response): void => {
  const session = dbStore.getActiveTillSession(req.terminal?.id);
  res.json({ success: true, data: session || null });
});

/**
 * POST /api/v1/shifts/open
 * Start shift with opening cash float
 */
shiftRouter.post(
  '/open',
  authenticate,
  requirePermission('shifts.open'),
  (req: AuthenticatedRequest, res: Response): void => {
    const { terminal_id, opening_float } = req.body;

    const termId = terminal_id || req.terminal?.id || 'term-cashier-01';
    const floatAmount = Number(opening_float) || 0;

    const session = dbStore.openTillSession(termId, floatAmount, {
      id: req.user!.id,
      name: req.user!.name,
      role: req.user!.role,
      branchId: req.user!.branchId
    });

    res.json({
      success: true,
      message: `Shift opened on terminal ${termId} with opening float of KES ${floatAmount}`,
      data: session
    });
  }
);

/**
 * POST /api/v1/shifts/cash-movement
 * Record paid-in or paid-out petty cash
 */
shiftRouter.post(
  '/cash-movement',
  authenticate,
  (req: AuthenticatedRequest, res: Response): void => {
    const { session_id, type, amount, reason } = req.body;

    if (!session_id || !type || !amount || Number(amount) <= 0) {
      res.status(400).json({ success: false, error: 'Valid session_id, type (PAID_IN/PAID_OUT), and amount are required.' });
      return;
    }

    const result = dbStore.recordCashMovement(
      session_id,
      type,
      Number(amount),
      reason || 'Petty cash movement',
      {
        id: req.user!.id,
        name: req.user!.name,
        role: req.user!.role
      }
    );

    if (!result.success) {
      res.status(400).json({ success: false, error: result.error });
      return;
    }

    res.json({
      success: true,
      message: `Recorded ${type} of KES ${amount}`,
      data: result.session
    });
  }
);

/**
 * POST /api/v1/shifts/close
 * End of shift blind cash drawer count and Z-report generation
 */
shiftRouter.post(
  '/close',
  authenticate,
  requirePermission('shifts.close'),
  (req: AuthenticatedRequest, res: Response): void => {
    const { session_id, actual_cash_count } = req.body;

    if (!session_id || actual_cash_count === undefined) {
      res.status(400).json({ success: false, error: 'Session ID and actual counted cash are required.' });
      return;
    }

    const closed = dbStore.closeTillSession(session_id, Number(actual_cash_count), {
      id: req.user!.id,
      name: req.user!.name,
      role: req.user!.role
    });

    if (!closed) {
      res.status(404).json({ success: false, error: 'Shift session not found.' });
      return;
    }

    res.json({
      success: true,
      message: 'Shift closed and Z-Report recorded.',
      data: closed
    });
  }
);
