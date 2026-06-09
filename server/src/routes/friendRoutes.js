import express from 'express';
import { requireAuth } from '../middleware/authMiddleware.js';
import { get, all, run } from '../db/postgres.js';
import { getRedisClient } from '../socket/redisAdapter.js';

const router = express.Router();

const notifyUser = (io, userId, event, data) => {
  const redis = getRedisClient();
  if (redis) {
    redis.publish('zymi:notify', JSON.stringify({ userId, event, data }));
  }
  if (io) {
    io.to(`user:${userId}`).emit(event, data);
  }
};

router.post('/request', requireAuth, async (req, res) => {
  try {
    const { addresseeId } = req.body;
    const requesterId = req.user.id;

    if (!addresseeId || requesterId === addresseeId) {
      return res.status(400).json({ error: 'Invalid addressee' });
    }

    const existing = await get(
      `SELECT id, status FROM friendships
       WHERE (requester_id = $1 AND addressee_id = $2)
          OR (requester_id = $2 AND addressee_id = $1)`,
      [requesterId, addresseeId]
    );

    if (existing) {
      if (existing.status === 'pending') {
        return res.status(409).json({ error: 'Friend request already pending' });
      }
      if (existing.status === 'accepted') {
        return res.status(409).json({ error: 'Already friends' });
      }
      // blocked/rejected — allow re-request by updating
      await run(
        `UPDATE friendships SET status = 'pending', updated_at = NOW()
         WHERE id = $1`,
        [existing.id]
      );
      const io = req.app.get('io');
      notifyUser(io, addresseeId, 'friend-request-received', {
        from: requesterId,
        status: 'pending'
      });
      return res.json({ success: true, status: 'pending' });
    }

    const result = await run(
      `INSERT INTO friendships (requester_id, addressee_id, status)
       VALUES ($1, $2, 'pending') RETURNING id`,
      [requesterId, addresseeId]
    );

    const io = req.app.get('io');
    notifyUser(io, addresseeId, 'friend-request-received', {
      from: requesterId,
      status: 'pending'
    });

    res.json({ success: true, id: result.lastID, status: 'pending' });
  } catch (err) {
    console.error('[FRIENDS] Request error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

router.post('/respond', requireAuth, async (req, res) => {
  try {
    const { requesterId, action } = req.body;
    const addresseeId = req.user.id;

    if (!['accepted', 'rejected'].includes(action)) {
      return res.status(400).json({ error: 'Action must be accepted or rejected' });
    }

    const row = await get(
      `SELECT id, status FROM friendships
       WHERE requester_id = $1 AND addressee_id = $2`,
      [requesterId, addresseeId]
    );

    if (!row) {
      return res.status(404).json({ error: 'Friend request not found' });
    }
    if (row.status !== 'pending') {
      return res.status(409).json({ error: `Request already ${row.status}` });
    }

    await run(
      `UPDATE friendships SET status = $1, updated_at = NOW() WHERE id = $2`,
      [action, row.id]
    );

    const io = req.app.get('io');
    notifyUser(io, requesterId, 'friend-request-response', {
      from: addresseeId,
      status: action
    });

    res.json({ success: true, status: action });
  } catch (err) {
    console.error('[FRIENDS] Respond error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

router.post('/remove', requireAuth, async (req, res) => {
  try {
    const { friendId } = req.body;
    const userId = req.user.id;

    await run(
      `DELETE FROM friendships
       WHERE (requester_id = $1 AND addressee_id = $2)
          OR (requester_id = $2 AND addressee_id = $1)`,
      [userId, friendId]
    );

    res.json({ success: true });
  } catch (err) {
    console.error('[FRIENDS] Remove error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

router.get('/list', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const userSockets = req.app.get('userSockets');

    const friends = await all(
      `SELECT u.id, u.username, u.avatar, f.status, f.created_at
       FROM friendships f
       JOIN users u ON u.id = CASE WHEN f.requester_id = $1 THEN f.addressee_id ELSE f.requester_id END
       WHERE (f.requester_id = $1 OR f.addressee_id = $1) AND f.status = 'accepted'
       ORDER BY f.created_at DESC`,
      [userId]
    );

    const friendsWithOnline = friends.map((f) => ({
      ...f,
      is_online: userSockets ? userSockets.has(String(f.id)) : false,
    }));

    res.json(friendsWithOnline);
  } catch (err) {
    console.error('[FRIENDS] List error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

router.get('/requests', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;

    const requests = await all(
      `SELECT u.id, u.username, u.avatar, f.created_at
       FROM friendships f
       JOIN users u ON u.id = f.requester_id
       WHERE f.addressee_id = $1 AND f.status = 'pending'
       ORDER BY f.created_at DESC`,
      [userId]
    );

    res.json(requests);
  } catch (err) {
    console.error('[FRIENDS] Requests error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

router.get('/check/:peerId', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { peerId } = req.params;

    const row = await get(
      `SELECT status FROM friendships
       WHERE (requester_id = $1 AND addressee_id = $2)
          OR (requester_id = $2 AND addressee_id = $1)`,
      [userId, parseInt(peerId, 10)]
    );

    res.json({ status: row?.status || 'none' });
  } catch (err) {
    console.error('[FRIENDS] Check error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

export default router;
