import { Router, Response } from 'express';
import { dbStore } from '../db/store';
import { authenticate, requirePermission, AuthenticatedRequest } from '../middleware/auth';

export const kotRouter = Router();

/**
 * GET /api/v1/kot/tickets
 */
kotRouter.get('/tickets', authenticate, (req: AuthenticatedRequest, res: Response): void => {
  const station = req.query.station as string | undefined;
  const tickets = dbStore.getKotTickets(station);
  res.json({ success: true, data: tickets });
});

/**
 * POST /api/v1/kot/fire
 * Routes items to kitchen/bar stations
 */
kotRouter.post(
  '/fire',
  authenticate,
  requirePermission('orders.fire'),
  (req: AuthenticatedRequest, res: Response): void => {
    const { order_id, items, table_number } = req.body;

    if (!order_id || !items || !Array.isArray(items) || items.length === 0) {
      res.status(400).json({ success: false, error: 'Order ID and items to fire are required.' });
      return;
    }

    const createdTickets = dbStore.dispatchKotTickets(
      order_id,
      items,
      table_number || 'Quick Order',
      req.user!.name,
      {
        id: req.user!.id,
        name: req.user!.name,
        role: req.user!.role
      }
    );

    res.json({
      success: true,
      message: `Dispatched ${createdTickets.length} KOT tickets to kitchen/bar.`,
      tickets: createdTickets
    });
  }
);

/**
 * POST /api/v1/kot/bump
 * Bump KOT ticket status in the KDS pipeline
 */
kotRouter.post(
  '/bump',
  authenticate,
  (req: AuthenticatedRequest, res: Response): void => {
    const { ticket_id, next_status } = req.body;

    if (!ticket_id || !next_status) {
      res.status(400).json({ success: false, error: 'ticket_id and next_status are required.' });
      return;
    }

    const updated = dbStore.bumpKotStatus(ticket_id, next_status, {
      id: req.user!.id,
      name: req.user!.name,
      role: req.user!.role
    });

    if (!updated) {
      res.status(404).json({ success: false, error: 'KOT ticket not found.' });
      return;
    }

    res.json({ success: true, ticket: updated });
  }
);
