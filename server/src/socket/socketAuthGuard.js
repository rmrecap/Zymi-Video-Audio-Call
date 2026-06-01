import jwt from 'jsonwebtoken';
import { config, isProduction } from '../config/env.js';
import { get } from '../db/postgres.js';

let decodeCount = 0;

export const verifySocketToken = (token) => {
  if (!token) {
    return { valid: false, error: 'No token provided', code: 'NO_TOKEN' };
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret, {
      expiresIn: config.jwtExpiresIn
    });

    decodeCount++;
    if (decodeCount % 100 === 0) {
      console.log(`[SOCKET_AUTH] Token verifications: ${decodeCount}`);
    }

    return { valid: true, userId: decoded.userId, user: decoded };
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return { valid: false, error: 'Token expired', code: 'TOKEN_EXPIRED' };
    }
    if (err.name === 'JsonWebTokenError') {
      return { valid: false, error: 'Invalid token', code: 'INVALID_TOKEN' };
    }
    return { valid: false, error: err.message, code: 'TOKEN_ERROR' };
  }
};

export const checkTokenVersion = async (userId, socketTokenVersion) => {
  if (!userId || !socketTokenVersion) {
    return { valid: true };
  }

  try {
    const user = await get('SELECT token_version FROM users WHERE id = $1', [userId]);
    if (!user) {
      return { valid: false, error: 'User not found', code: 'USER_NOT_FOUND' };
    }

    const serverVersion = user.token_version || 1;
    if (serverVersion !== socketTokenVersion) {
      return {
        valid: false,
        error: 'Token version mismatch',
        code: 'TOKEN_VERSION_MISMATCH',
        serverVersion,
        clientVersion: socketTokenVersion
      };
    }

    return { valid: true };
  } catch (err) {
    return { valid: false, error: err.message, code: 'VERSION_CHECK_ERROR' };
  }
};

export const attachAuthMiddleware = (io) => {
  io.use(async (socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;

    if (!token) {
      console.log('[SOCKET_AUTH] No token in handshake');
      return next(new Error('Authentication required'));
    }

    const result = verifySocketToken(token);
    if (!result.valid) {
      console.log(`[SOCKET_AUTH] Failed: ${result.code} - ${result.error}`);
      return next(new Error(result.error));
    }

    socket.userId = result.userId;
    socket.user = result.user;
    socket.tokenVersion = result.user?.tokenVersion;

    // Socket Type Protocol: UI (volatile view) or BACKGROUND (persistent daemon)
    const socketType = socket.handshake.auth?.type || 'UI';
    socket.socketType = socketType;

    console.log(`[SOCKET_AUTH] User ${result.userId} authenticated (type: ${socketType})`);
    next();
  });
};

export const getAuthStats = () => {
  return {
    decodeCount,
    timestamp: new Date().toISOString()
  };
};

export const resetAuthStats = () => {
  decodeCount = 0;
};