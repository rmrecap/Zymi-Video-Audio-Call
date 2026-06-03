import { db } from '../db/db_provider.js';
import { verifyToken } from '../services/sessionService.js';
import { USER_ROLES, ROLE_PERMISSIONS } from '../../shared/socketEvents.js';

export const requireAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const token = authHeader.substring(7);
  const decoded = verifyToken(token);

  if (!decoded) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  const userId = decoded.userId;
  
  // If we are using SERIAL (INTEGER) IDs, but get a UUID string, it's an old session
  if (isNaN(parseInt(userId))) {
     return res.status(401).json({ error: 'Invalid session format. Please log in again.' });
  }

  try {
    // Fetch user with settings
    const user = await db.get('SELECT id, username, role, is_banned, token_version, notification_sound, call_ringtone, theme, online_visibility, read_receipt FROM users WHERE id = $1', userId);
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    if (user.is_banned) {
      return res.status(403).json({ error: 'Account suspended' });
    }

    if (decoded.tokenVersion !== user.token_version) {
      return res.status(401).json({ error: 'Session invalidated (password changed)' });
    }

    req.user = {
      id: user.id,
      username: user.username,
      role: user.role,
      tokenVersion: user.token_version,
      jti: decoded.jti,
      sub: decoded.userId,
      settings: {
        notificationSound: !!user.notification_sound,
        callRingtone: !!user.call_ringtone,
        theme: user.theme || 'dark',
        onlineVisibility: !!user.online_visibility,
        readReceipt: !!user.read_receipt
      }
    };
    next();
  } catch (err) {
    console.error('[AUTH_MIDDLEWARE] Error:', err);
    res.status(500).json({ error: 'Internal server error during authentication' });
  }
};

/**
 * Strict admin route guard. Every request to /api/admin/* passes through this.
 * - Verifies JWT from Authorization header.
 * - Validates user exists, is not banned, and has role === 'admin' || 'super_admin'.
 * - Logs every rejection as a CRITICAL security anomaly.
 * - Returns 403 Forbidden with no additional hints on failure.
 */
export const requireAdmin = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.warn('[SECURITY_ANOMALY] Admin route accessed without Authorization header');
    return res.status(403).json({ error: 'Forbidden' });
  }

  const token = authHeader.substring(7);
  const decoded = verifyToken(token);

  if (!decoded) {
    console.warn('[SECURITY_ANOMALY] Admin route accessed with invalid/expired token');
    return res.status(403).json({ error: 'Forbidden' });
  }

  const userId = decoded.userId;
  try {
    const user = await db.get('SELECT id, username, role, is_banned, token_version FROM users WHERE id = $1', userId);

    if (!user) {
      console.warn(`[SECURITY_ANOMALY] Admin route accessed by non-existent user ID=${userId}`);
      return res.status(403).json({ error: 'Forbidden' });
    }

    if (user.role !== 'admin' && user.role !== 'super_admin') {
      console.warn(`[SECURITY_ANOMALY] Non-admin user ${user.username} (ID=${userId}, role=${user.role}) attempted admin route: ${req.method} ${req.originalUrl}`);
      return res.status(403).json({ error: 'Forbidden' });
    }

    if (user.is_banned) {
      console.warn(`[SECURITY_ANOMALY] Banned user ${user.username} (ID=${userId}) attempted admin route: ${req.method} ${req.originalUrl}`);
      return res.status(403).json({ error: 'Forbidden' });
    }

    if (decoded.tokenVersion !== user.token_version) {
      console.warn(`[SECURITY_ANOMALY] Stale session for admin ${user.username} (ID=${userId})`);
      return res.status(403).json({ error: 'Forbidden' });
    }

    req.adminUser = {
      id: user.id,
      username: user.username,
      role: user.role
    };
    next();
  } catch (err) {
    console.error('[ADMIN_MIDDLEWARE] Internal error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    if (!decoded || !allowedRoles.includes(decoded.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    req.adminUser = decoded;
    next();
  };
};

export const requirePermission = (permission) => {
  return (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    const userPermissions = ROLE_PERMISSIONS[decoded?.role] || [];
    if (!decoded || !userPermissions.includes(permission)) {
      return res.status(403).json({ error: 'Permission denied' });
    }
    req.adminUser = decoded;
    next();
  };
};

export const checkPermission = (role, permission) => {
  const permissions = ROLE_PERMISSIONS[role] || [];
  return permissions.includes(permission);
};

export const getUserPermissions = (role) => {
  return ROLE_PERMISSIONS[role] || [];
};

export const isUserBanned = async (userId) => {
  try {
    const user = await db.get('SELECT is_banned FROM users WHERE id = $1', userId);
    return user ? !!user.is_banned : false;
  } catch (err) {
    return false;
  }
};

export { USER_ROLES, ROLE_PERMISSIONS };
