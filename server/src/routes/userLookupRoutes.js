import { Router } from 'express';
import { requireAuth } from '../middleware/authMiddleware.js';
import { get, all } from '../db/postgres.js';
import { normalizePhone } from '../utils/phoneNormalizer.js';
import { rateLimitMiddleware } from '../middleware/rateLimit.js';
import { logAudit } from '../services/auditService.js';

const router = Router();

// GET /api/users/search?q=username — partial text search (ILIKE)
router.get('/search', requireAuth, async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || String(q).trim().length < 1) {
      return res.json([]);
    }
    const query = String(q).trim();
    const pattern = `%${query}%`;
    const users = await all(
      `SELECT id, username, avatar
       FROM users
       WHERE username ILIKE $1
          OR email ILIKE $1
       LIMIT 20`,
      [pattern]
    );
    res.json(users);
  } catch (err) {
    console.error('[SEARCH] Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Phone lookup rate limit: 10 requests per minute
const lookupRateLimit = rateLimitMiddleware({
  windowMs: 60 * 1000,
  maxRequests: 10,
  handler: (req, res) => {
    res.status(429).json({
      error: 'খুব বেশি চেষ্টা করেছেন। কিছুক্ষণ পর আবার চেষ্টা করুন।',
      retryAfter: 60
    });
  }
});

router.post('/lookup-phone', lookupRateLimit, async (req, res) => {
  const { phone } = req.body;
  
  if (!phone) {
    return res.status(400).json({ error: 'ফোন নম্বর প্রয়োজন' });
  }

  const normalized = normalizePhone(phone);
  if (!normalized) {
    return res.status(400).json({ error: 'ভুল ফোন নম্বর' });
  }

  // Mask phone for auditing
  const maskedPhone = normalized.replace(/(\+\d{3})\d+(\d{2})/, '$1*****$2');

  try {
    const user = await get(
      "SELECT id, username, avatar, is_banned, phone_verified FROM users WHERE phone_normalized = $1",
      [normalized]
    );

    if (user) {
      if (user.is_banned) {
         await logAudit(null, 'phone_lookup_found_banned', null, `Looked up masked phone: ${maskedPhone}`);
         return res.status(404).json({ found: false, message: 'এই নম্বরটি ZYMI-তে নিবন্ধিত নেই' });
      }

      await logAudit(null, 'phone_lookup_found', user.id, `Looked up masked phone: ${maskedPhone}`);
      
      return res.json({
        found: true,
        user: {
          id: user.id.toString(),
          username: user.username,
          avatar: user.avatar,
          phoneVerified: !!user.phone_verified
        }
      });
    }

    await logAudit(null, 'phone_lookup_not_found', null, `Looked up masked phone: ${maskedPhone}`);
    return res.status(404).json({
      found: false,
      message: 'এই নম্বরটি ZYMI-তে নিবন্ধিত নেই'
    });
  } catch (err) {
    console.error('[LOOKUP_ERR]', err);
    return res.status(500).json({ error: 'সার্ভার ত্রুটি' });
  }
});

export default router;
