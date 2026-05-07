import { verifySocketToken, checkTokenVersion, attachAuthMiddleware, getAuthStats, resetAuthStats } from '../socket/socketAuthGuard.js';
import { login, register, adminLogin } from '../../routes/authRoutes.js';
import { requireAuth } from '../../middleware/authMiddleware.js';
import { requireAdmin } from '../../middleware/adminMiddleware.js';
import { run } from '../../db/postgres.js';

export { verifySocketToken, checkTokenVersion, attachAuthMiddleware, getAuthStats, resetAuthStats };
export { login, register, adminLogin };
export { requireAuth };
export { requireAdmin };

export const authenticateUser = async (username, password, isAdmin = false) => {
  console.log(`[AUTH] Authenticating user: ${username}, isAdmin: ${isAdmin}`);
  return isAdmin ? adminLogin : login;
};

export const invalidateUserTokens = async (userId) => {
  await run('UPDATE users SET token_version = token_version + 1 WHERE id = $1', [userId]);
  console.log(`[AUTH] Invalidated tokens for user: ${userId}`);
};

export const validateToken = (token) => {
  return verifySocketToken(token);
};