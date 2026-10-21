import { Router, Response } from 'express';
import { dbStore } from '../db/store';
import { authenticate, requirePermission, AuthenticatedRequest } from '../middleware/auth';

export const hospitalityRouter = Router();

/**
 * GET /api/v1/hospitality/floor-sections
 */
hospitalityRouter.get('/floor-sections', authenticate, (req: AuthenticatedRequest, res: Response): void => {
  const sections = dbStore.getState().floorSections;
  res.json({ success: true, data: sections });
});

/**
 * GET /api/v1/hospitality/tables
 */
hospitalityRouter.get('/tables', authenticate, (req: AuthenticatedRequest, res: Response): void => {
  const tables = dbStore.getTables(req.user?.branchId);
  res.json({ success: true, data: tables });
});

/**
 * POST /api/v1/hospitality/tables/transfer
 * Moves active order from one table to another with full audit logging
 */
hospitalityRouter.post(
  '/tables/transfer',
  authenticate,
  requirePermission('tables.transfer'),
  (req: AuthenticatedRequest, res: Response): void => {
    const { source_table_id, target_table_id } = req.body;

    if (!source_table_id || !target_table_id) {
      res.status(400).json({ success: false, error: 'Both source and target table IDs are required.' });
      return;
    }

    const success = dbStore.transferTable(source_table_id, target_table_id, {
      id: req.user!.id,
      name: req.user!.name,
      role: req.user!.role
    });

    if (!success) {
      res.status(400).json({
        success: false,
        error: 'Unable to transfer table. Source table may not have an active order or target table is invalid.'
      });
      return;
    }

    res.json({
      success: true,
      message: 'Table transferred successfully.',
      tables: dbStore.getTables(req.user?.branchId)
    });
  }
);
