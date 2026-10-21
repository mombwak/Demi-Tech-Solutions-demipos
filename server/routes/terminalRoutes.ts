import { Router, Request, Response } from 'express';
import { dbStore } from '../db/store';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';

export const terminalRouter = Router();

/**
 * GET /api/v1/terminals
 * Retrieve all registered hardware and mobile terminals for the branch
 */
terminalRouter.get('/', authenticate, (req: AuthenticatedRequest, res: Response): void => {
  const terminals = dbStore.getTerminals(req.user?.branchId);
  res.json({ success: true, data: terminals });
});

/**
 * POST /api/v1/terminals/heartbeat
 * Terminal ping with presence and status
 */
terminalRouter.post('/heartbeat', authenticate, (req: AuthenticatedRequest, res: Response): void => {
  const { terminal_id } = req.body;
  if (terminal_id) {
    dbStore.updateTerminalHeartbeat(terminal_id, req.user?.id);
  }
  res.json({ success: true, timestamp: new Date().toISOString() });
});
