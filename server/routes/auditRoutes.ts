import { Router, Response } from 'express';
import { dbStore } from '../db/store';
import { authenticate, requirePermission, AuthenticatedRequest } from '../middleware/auth';

export const auditRouter = Router();

/**
 * GET /api/v1/audit-logs
 * Protected audit trail endpoint for managers, accountants, and auditors
 */
auditRouter.get(
  '/',
  authenticate,
  requirePermission('reports.financials.view'),
  (req: AuthenticatedRequest, res: Response): void => {
    const limit = Number(req.query.limit) || 100;
    const logs = dbStore.getAuditLogs(limit);
    res.json({ success: true, count: logs.length, data: logs });
  }
);
