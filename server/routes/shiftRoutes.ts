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
