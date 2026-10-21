import { Router, Response } from 'express';
import { dbStore } from '../db/store';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';

export const syncRouter = Router();

/**
 * GET /api/v1/sync
 * Real-time convergence endpoint for all connected POS terminals and KDS displays.
 * Supports sequence-based delta checks.
 */
syncRouter.get('/', authenticate, (req: AuthenticatedRequest, res: Response): void => {
  const clientSeq = Number(req.query.sequence) || 0;
  const state = dbStore.getState();

  // If client already has the latest state sequence, return lightweight ping
  if (clientSeq > 0 && clientSeq === state.syncSequence) {
    res.json({
      success: true,
      upToDate: true,
      sequence: state.syncSequence
    });
    return;
  }

  // Otherwise, return synchronized operational state
  res.json({
    success: true,
    upToDate: false,
    sequence: state.syncSequence,
    data: {
      tables: state.tables,
      orders: state.orders.filter(o => o.status === 'OPEN' || o.status === 'BILLED'),
      kotTickets: state.kotTickets.filter(k => k.status !== 'SERVED' && k.status !== 'CANCELLED'),
      activeTillSession: state.tillSessions.find(s => s.status === 'OPEN') || null,
      salesCount: state.sales.length,
      terminals: state.terminals.map(t => ({
        id: t.id,
        terminalCode: t.terminalCode,
        name: t.name,
        terminalType: t.terminalType,
        status: t.status,
        lastSeenAt: t.lastSeenAt
      }))
    }
  });
});
