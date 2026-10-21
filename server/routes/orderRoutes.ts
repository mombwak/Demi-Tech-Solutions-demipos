import { Router, Response } from 'express';
import { dbStore } from '../db/store';
import { authenticate, requirePermission, AuthenticatedRequest } from '../middleware/auth';
import { DbOrder } from '../db/schema';

export const orderRouter = Router();

/**
 * GET /api/v1/orders
 * Returns orders filtered by status (e.g. OPEN, BILLED)
 */
orderRouter.get('/', authenticate, (req: AuthenticatedRequest, res: Response): void => {
  const status = req.query.status as DbOrder['status'] | undefined;
  const orders = dbStore.getOrders(status);
  res.json({ success: true, data: orders });
});

/**
 * GET /api/v1/orders/:id
 */
orderRouter.get('/:id', authenticate, (req: AuthenticatedRequest, res: Response): void => {
  const order = dbStore.getOrderById(req.params.id);
  if (!order) {
    res.status(404).json({ success: false, error: 'Order not found.' });
    return;
  }
  res.json({ success: true, data: order });
});

/**
 * POST /api/v1/orders
 * Creates or updates an order with Optimistic Concurrency Control
 */
orderRouter.post(
  '/',
  authenticate,
  requirePermission('orders.create'),
  (req: AuthenticatedRequest, res: Response): void => {
    const { order, expected_version } = req.body;

    if (!order || !order.id) {
      res.status(400).json({ success: false, error: 'Invalid order payload. Order ID is required.' });
      return;
    }

    const result = dbStore.saveOrderWithConcurrency(
      {
        ...order,
        waiterId: req.user!.id,
        waiterName: req.user!.name
      },
      expected_version,
      {
        id: req.user!.id,
        name: req.user!.name,
        role: req.user!.role
      }
    );

    if (!result.success) {
      // 409 Conflict for stale edits / race conditions
      res.status(409).json({
        success: false,
        error: result.error,
        conflict: true,
        currentVersion: result.currentVersion,
        currentOrder: result.order
      });
      return;
    }

    res.json({
      success: true,
      data: result.order,
      version: result.order?.version
    });
  }
);
