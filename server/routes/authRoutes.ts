import { Router, Request, Response } from 'express';
import { dbStore } from '../db/store';
import { generateToken, authenticate, AuthenticatedRequest } from '../middleware/auth';

export const authRouter = Router();

/**
 * POST /api/v1/auth/pin-login
 * Fast Terminal PIN login for multi-waiter and multi-cashier operations.
 */
authRouter.post('/pin-login', (req: Request, res: Response): void => {
  const { pin, terminal_id } = req.body;

  if (!pin || pin.length < 4) {
    res.status(400).json({ success: false, error: 'A 4-digit PIN is required.' });
    return;
  }

  const user = dbStore.getUserByPin(pin);
  if (!user) {
    dbStore.recordAudit({
      actorId: 'anonymous',
      actorName: 'Unknown Staff',
      actorRole: 'UNKNOWN',
      action: 'LOGIN_FAILED',
      entityType: 'AUTH',
      entityId: terminal_id || 'UNKNOWN_TERMINAL',
      details: `Failed PIN login attempt on terminal [${terminal_id || 'none'}]`
    });

    res.status(401).json({ success: false, error: 'Invalid PIN. Access denied.' });
    return;
  }

  // Update terminal active user if terminal ID is provided
  if (terminal_id) {
    dbStore.updateTerminalHeartbeat(terminal_id, user.id);
  }

  const token = generateToken(user);
  const activeTill = dbStore.getActiveTillSession();

  dbStore.recordAudit({
    actorId: user.id,
    actorName: user.name,
    actorRole: user.role,
    action: 'LOGIN_SUCCESS',
    entityType: 'AUTH',
    entityId: user.id,
    details: `Staff member [${user.name} - ${user.role}] logged in successfully via PIN`
  });

  res.json({
    success: true,
    data: {
      token,
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        role: user.role,
        permissions: user.permissions,
        branchId: user.branchId
      },
      activeTillSession: activeTill || null
    }
  });
});

/**
 * GET /api/v1/auth/me
 */
authRouter.get('/me', authenticate, (req: AuthenticatedRequest, res: Response): void => {
  if (!req.user) {
    res.status(401).json({ success: false, error: 'Not authenticated' });
    return;
  }

  res.json({
    success: true,
    data: {
      user: {
        id: req.user.id,
        name: req.user.name,
        phone: req.user.phone,
        email: req.user.email,
        role: req.user.role,
        permissions: req.user.permissions,
        branchId: req.user.branchId
      }
    }
  });
});

/**
 * GET /api/v1/auth/users
 */
authRouter.get('/users', authenticate, (req: AuthenticatedRequest, res: Response): void => {
  const users = dbStore.getUsers(req.user?.branchId).map(u => ({
    id: u.id,
    name: u.name,
    role: u.role,
    phone: u.phone,
    isActive: u.isActive
  }));

  res.json({ success: true, data: users });
});
