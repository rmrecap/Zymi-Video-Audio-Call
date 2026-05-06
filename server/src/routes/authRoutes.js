import bcrypt from 'bcryptjs';
import { db } from '../db/db_provider.js';
import { createToken } from '../services/sessionService.js';
import { logAudit } from '../services/auditService.js';
import { requestEmailOTP, verifyEmailOTP } from '../services/otpService.js';
import { updateProfileCompletion } from '../services/profileCompletionService.js';

export const register = async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ error: 'Username, email and password required' });
  }

  try {
    const hash = bcrypt.hashSync(password, 12);
    const result = await db.run(
      'INSERT INTO users (username, email, password_hash, role, profile_completion) VALUES (?, ?, ?, ?, ?)', 
      username, email, hash, 'user', 40
    );
    const user = await db.get('SELECT id, username, email, role, token_version FROM users WHERE id = ?', result.lastInsertRowid);
    const token = createToken(user);
    
    // Mask email for auditing
    const maskedEmail = email.replace(/(.{2}).*(@.*)/, '$1***$2');
    logAudit(user.id, 'user_registered', user.id, `User registered with email: ${maskedEmail}`);

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
    const user = await db.get('SELECT * FROM users WHERE username = ? OR email = ?', username, username);
    
    if (!user) {
      console.log('[AUTH] User not found');
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    console.log('[AUTH] User found, verifying password...');
    if (!bcrypt.compareSync(password, user.password_hash)) {
      console.log('[AUTH] Password mismatch');
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (user.is_banned) {
      console.log('[AUTH] User is banned');
      return res.status(403).json({ error: 'Account suspended' });
    }

    console.log('[AUTH] Login successful, creating token...');
    try {
      await db.run('UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = ?', user.id);
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
  // Client handles token removal, but we can log it
  logAudit(req.user?.id, 'user_logout', req.user?.id, 'User logged out');
  res.json({ success: true });
};

export const me = async (req, res) => {
  const user = await db.get(`
    SELECT id, username, email, role, email_verified, phone_verified, 
           profile_completion, country_code, country_name, phone_country_iso, 
           phone_normalized, verification_status, last_login_at, avatar
    FROM users WHERE id = ?
  `, req.user.id);
  
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
};

export const forgotPassword = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email required' });

  const user = await db.get('SELECT id, email FROM users WHERE email = ?', email);
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

  const user = await db.get('SELECT id FROM users WHERE email = ?', email);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const verify = await verifyEmailOTP(user.id, otp);
  if (!verify.success) return res.status(400).json({ error: verify.error });

  const hash = bcrypt.hashSync(newPassword, 12);
  await db.run('UPDATE users SET password_hash = ?, token_version = token_version + 1 WHERE id = ?', hash, user.id);
  
  logAudit(user.id, 'password_reset', user.id, 'User reset password via OTP');
  res.json({ success: true, message: 'Password updated successfully' });
};

export const adminLogin = async (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }

  const admin = await db.get('SELECT * FROM users WHERE (username = ? OR email = ?) AND role IN (?, ?)', username, username, 'admin', 'super_admin');

  if (!admin) {
    return res.status(401).json({ error: 'Invalid admin credentials' });
  }

  if (!bcrypt.compareSync(password, admin.password_hash)) {
    return res.status(401).json({ error: 'Invalid admin credentials' });
  }

  await db.run('UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = ?', admin.id);

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