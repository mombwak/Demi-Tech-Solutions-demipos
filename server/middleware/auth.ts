/**
 * DEMIPOS Server-side Authentication & Authorization Middleware
 * Verifies Bearer tokens, Terminal enrollment headers, and granular RBAC permissions.
 */

import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { dbStore, ROLE_PERMISSIONS } from '../db/store';
import { DbUser, DbTerminal } from '../db/schema';

const SERVER_SECRET = process.env.POS_SERVER_SECRET || 'demipos-enterprise-security-secret-2026';

export interface AuthenticatedRequest extends Request {
  user?: DbUser;
  terminal?: DbTerminal;
}

// Generate signed auth token (HMAC-SHA256 stateless session)
export const generateToken = (user: DbUser): string => {
  const payload = {
    sub: user.id,
    role: user.role,
    tenantId: user.tenantId,
    branchId: user.branchId,
    iat: Date.now(),
    exp: Date.now() + 1000 * 60 * 60 * 12 // 12 hours
  };
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', SERVER_SECRET)
    .update(encodedPayload)
    .digest('base64url');
  return `${encodedPayload}.${signature}`;
};

// Verify signed auth token
export const verifyToken = (token: string): { sub: string; role: string; branchId: string } | null => {
  try {
    const [encodedPayload, signature] = token.split('.');
    if (!encodedPayload || !signature) return null;

    const expectedSignature = crypto
      .createHmac('sha256', SERVER_SECRET)
      .update(encodedPayload)
      .digest('base64url');

    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
      return null;
    }

    const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf-8'));
    if (Date.now() > payload.exp) return null;

    return payload;
  } catch {
    return null;
  }
};

/**
 * Authentication Middleware:
 * Inspects Authorization Bearer token and optional X-Terminal-ID header.
 */
export const authenticate = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  const terminalId = req.headers['x-terminal-id'] as string;

  // Check terminal enrollment if provided
  if (terminalId) {
    const terminal = dbStore.getTerminals().find(t => t.id === terminalId || t.terminalCode === terminalId);
    if (terminal) {
      req.terminal = terminal;
      dbStore.updateTerminalHeartbeat(terminal.id);
    }
  }

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      error: 'Unauthorized: Missing or invalid Authorization Bearer token header.'
    });
    return;
  }

  const token = authHeader.substring(7);
  const payload = verifyToken(token);

  if (!payload) {
    res.status(401).json({
      success: false,
      error: 'Unauthorized: Session expired or invalid token signature.'
    });
    return;
  }

  const user = dbStore.getUserById(payload.sub);
  if (!user || !user.isActive) {
    res.status(401).json({
      success: false,
      error: 'Unauthorized: User account not found or deactivated.'
    });
    return;
  }

  req.user = user;
  next();
};

/**
 * Role-Based Access Control (RBAC) Guard Middleware
 * Verifies that the authenticated user possesses the specific permission.
 */
export const requirePermission = (permission: string) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized: Authentication required.' });
      return;
    }

    const userPermissions = req.user.permissions || ROLE_PERMISSIONS[req.user.role] || [];
    const hasPermission = userPermissions.includes('*') || userPermissions.includes('pos.all') || userPermissions.includes(permission);

    if (!hasPermission) {
      res.status(403).json({
        success: false,
        error: `Forbidden: User role [${req.user.role}] does not possess required permission [${permission}].`,
        requiredPermission: permission,
        userRole: req.user.role
      });
      return;
    }

    next();
  };
};
