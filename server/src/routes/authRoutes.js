import bcrypt from 'bcryptjs';
import { get, run } from '../db/postgres.js';
import { createToken } from '../services/sessionService.js';
import { logAudit } from '../services/auditService.js';
import { requestEmailOTP, verifyEmailOTP } from '../services/otpService.js';
import { updateProfileCompletion } from '../services/profileCompletionService.js';
import { registry } from '../socket/userSocketRegistry.js';

export const register = async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ error: 'Username, email and password required' });
  }

  try {
    const hash = bcrypt.hashSync(password, 12);
    const result = await run(
      'INSERT INTO users (username, email, password_hash, role, profile_completion) VALUES ($1, $2, $3, $4, $5) RETURNING id', 
      username, email, hash, 'user', 40
    );
    const user = await get('SELECT id, username, email, role, token_version FROM users WHERE id = $1', result.lastID);
    const token = createToken(user);
    
    // Mask email for auditing
    const maskedEmail = email.replace(/(.{2}).*(@.*)/, '$1***$2');
    await logAudit(user.id, 'user_registered', user.id, `User registered with email: ${maskedEmail}`);

    res.json({ id: user.id, username: user.username, email: user.email, role: user.role, token });
  } catch (err) {
    if (err.message.includes('UNIQUE constraint failed: users.email') || err.message.includes('duplicate key value')) {
      return res.status(400).json({ error: 'Email already exists' });
    }
    res.status(400).json({ error: 'Username already exists' });
  }
};

export const login = async (req, res) => {
  const { username, password } = req.body;
  console.log(`[AUTH] Login attempt for: ${username}`);

  if (!username || !password) {
    return res.status(400).json({ error: 'Credentials and password required' });
  }

  try {
    console.log('[AUTH] Querying database for user...');
    const user = await get('SELECT * FROM users WHERE username = $1 OR email = $2', username, username);
    
    if (!user) {
      console.log('[AUTH] User not found');
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    console.log('[AUTH] User found, verifying password...');
    const storedHash = user.password_hash || user.password;
    if (!storedHash || !bcrypt.compareSync(password, storedHash)) {
      console.log('[AUTH] Password mismatch');
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (user.is_banned) {
      console.log('[AUTH] User is banned');
      return res.status(403).json({ error: 'Account suspended' });
    }

    console.log('[AUTH] Login successful, creating token...');
    try {
      await run('UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = $1', user.id);
    } catch (updateErr) {
      console.warn('[AUTH] Could not update last_login_at (column might be missing):', updateErr.message);
    }

    const token = createToken(user);
    console.log('[AUTH] Token created, sending response');
    res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      token
    });
  } catch (err) {
    console.error('[AUTH] Login error:', err);
    res.status(500).json({ error: 'Internal server error during login' });
  }
};

export const logout = async (req, res) => {
  const userId = req.user?.id;
  // Atomic registry purge: removes UI + BACKGROUND socket entries from Redis
  if (userId) {
    try {
      await registry.purgeUser(userId);
    } catch (err) {
      console.error('[LOGOUT] Registry purge failed:', err.message);
    }
  }
  await logAudit(userId, 'user_logout', userId, 'User logged out');
  res.json({ success: true });
};

export const me = async (req, res) => {
  const user = await get(`
    SELECT id, username, email, role, email_verified, phone_verified, 
           profile_completion, country_code, country_name, phone_country_iso, 
           phone_normalized, verification_status, last_login_at, avatar
    FROM users WHERE id = $1
  `, req.user.id);
  
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
};

export const forgotPassword = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email required' });

  const user = await get('SELECT id, email FROM users WHERE email = $1', email);
  if (!user) {
    // Return success anyway to prevent user enumeration
    return res.json({ success: true, message: 'If email exists, OTP sent.' });
  }

  try {
    await requestEmailOTP(user.id, user.email);
    res.json({ success: true, message: 'OTP sent to your email' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to send OTP' });
  }
};

export const resetPassword = async (req, res) => {
  const { email, otp, newPassword } = req.body;
  if (!email || !otp || !newPassword) return res.status(400).json({ error: 'All fields required' });

  const user = await get('SELECT id FROM users WHERE email = $1', email);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const verify = await verifyEmailOTP(user.id, otp);
  if (!verify.success) return res.status(400).json({ error: verify.error });

  const hash = bcrypt.hashSync(newPassword, 12);
  await run('UPDATE users SET password_hash = $1, token_version = token_version + 1 WHERE id = $2', hash, user.id);
  
  await logAudit(user.id, 'password_reset', user.id, 'User reset password via OTP');
  res.json({ success: true, message: 'Password updated successfully' });
};

export const adminLogin = async (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }

  const admin = await get('SELECT * FROM users WHERE (username = $1 OR email = $2) AND role IN ($3, $4)', username, username, 'admin', 'super_admin');

  if (!admin) {
    return res.status(401).json({ error: 'Invalid admin credentials' });
  }

  const storedHash = admin.password_hash || admin.password;
  if (!storedHash || !bcrypt.compareSync(password, storedHash)) {
    return res.status(401).json({ error: 'Invalid admin credentials' });
  }

  await run('UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = $1', admin.id);

  const token = createToken(admin);
  res.json({
    token,
    admin: { id: admin.id, username: admin.username, role: admin.role }
  });
};

// Router
import { Router } from 'express';
import { requireAuth } from '../middleware/authMiddleware.js';
import { authRateLimit } from '../middleware/rateLimit.js';

const router = Router();

router.post('/register', register);
router.post('/login', authRateLimit(), login);
router.post('/logout', requireAuth, logout);
router.get('/me', requireAuth, me);
router.post('/forgot-password', authRateLimit(), forgotPassword);
router.post('/reset-password', authRateLimit(), resetPassword);

export default router;