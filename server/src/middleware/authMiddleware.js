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

export const requireAdmin = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = authHeader.substring(7);
  const decoded = verifyToken(token);

  if (!decoded) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  const userId = decoded.userId;
  try {
    const user = await db.get('SELECT id, username, role, is_banned, token_version FROM users WHERE id = $1', userId);

    if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    if (user.is_banned) {
      return res.status(403).json({ error: 'Account suspended' });
    }

    if (decoded.tokenVersion !== user.token_version) {
      return res.status(401).json({ error: 'Session invalidated (password changed)' });
    }

    req.adminUser = {
      id: user.id,
      username: user.username,
      role: user.role
    };
    next();
  } catch (err) {
    console.error('[ADMIN_MIDDLEWARE] Error:', err);
    res.status(500).json({ error: 'Internal server error during admin validation' });
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
