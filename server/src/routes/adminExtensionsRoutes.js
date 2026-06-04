import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { requireAdmin } from '../middleware/authMiddleware.js';
import { get, all, run } from '../db/postgres.js';
import { registry } from '../socket/userSocketRegistry.js';
import { incrementTokenVersion } from '../services/sessionService.js';
import { logAudit } from '../services/auditService.js';
import { getRedisClient } from '../socket/redisAdapter.js';
import { systemSettingsService } from '../services/systemSettingsService.js';

const router = Router();

// ─── Socket Registry Map ──────────────────────────────────────────────────
router.get('/socket-registry/map', requireAdmin, async (req, res) => {
  try {
    const localMapSize = req.app.get('userSockets')?.size || 0;
    const redisClient = getRedisClient();
    let redisEntries = [];
    let redisAvailable = !!redisClient;

    if (redisClient) {
      try {
        const keys = await redisClient.keys('user_sockets:*');
        for (const key of keys) {
          const userId = key.replace('user_sockets:', '');
          const sockets = await redisClient.hGetAll(key);
          for (const [type, dataStr] of Object.entries(sockets)) {
            let sid = dataStr;
            let ts = 0;
            try {
              const parsed = JSON.parse(dataStr);
              sid = parsed.sid;
              ts = parsed.ts || 0;
            } catch (e) {}
            redisEntries.push({ userId, type, socketId: sid, connectedAt: new Date(ts).toISOString() });
          }
        }
      } catch (err) {
        console.warn('[ADMIN] Redis socket map error:', err.message);
        redisAvailable = false;
      }
    }

    const io = req.app.get('io');
    let connectedSockets = 0;
    let rooms = [];
    if (io) {
      connectedSockets = io.sockets?.sockets?.size || 0;
      const roomMap = io.sockets?.adapter?.rooms || new Map();
      rooms = Array.from(roomMap.entries())
        .filter(([name, s]) => !name.startsWith(io.sockets?.adapter?.sidPrefix || ''))
        .map(([name, s]) => ({
          room: name,
          sockets: typeof s === 'object' ? (s.size || s.length || 0) : s
        }))
        .filter(r => r.sockets > 0);
    }

    res.json({
      localMapSize,
      redisAvailable,
      redisEntries,
      connectedSockets,
      rooms,
      warnings: []
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Force Disconnect Socket ──────────────────────────────────────────────
router.post('/socket-registry/disconnect', requireAdmin, async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: 'userId is required' });

    const io = req.app.get('io');
    const userSockets = req.app.get('userSockets');

    if (userSockets) {
      const socketId = userSockets.get(String(userId));
      if (socketId && io) {
        io.to(socketId).emit('force-logout', { reason: 'Disconnected by admin' });
        io.sockets.sockets.get(socketId)?.disconnect(true);
        userSockets.delete(String(userId));
      }
    }

    await registry.purgeUser(userId);
    await logAudit(req.adminUser.id, 'admin_force_disconnect', parseInt(userId), 'Admin forced socket disconnect');
    res.json({ success: true, message: `User ${userId} disconnected` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Invalidate Token Version ─────────────────────────────────────────────
router.post('/socket-registry/invalidate-token', requireAdmin, async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: 'userId is required' });

    const user = await get('SELECT id FROM users WHERE id = $1', [userId]);
    if (!user) return res.status(404).json({ error: 'User not found' });

    await incrementTokenVersion(parseInt(userId));

    const io = req.app.get('io');
    const userSockets = req.app.get('userSockets');
    const socketId = userSockets?.get(String(userId));
    if (socketId && io) {
      io.to(socketId).emit('force-logout', { reason: 'Token invalidated by admin' });
      io.sockets.sockets.get(socketId)?.disconnect(true);
      userSockets.delete(String(userId));
    }

    await registry.purgeUser(userId);
    await logAudit(req.adminUser.id, 'admin_invalidate_token', parseInt(userId), 'Admin invalidated user token');
    res.json({ success: true, message: `Token invalidated for user ${userId}` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Admin Delete Message ─────────────────────────────────────────────────
router.post('/messages/delete', requireAdmin, async (req, res) => {
  try {
    const { messageId } = req.body;
    if (!messageId) return res.status(400).json({ error: 'messageId is required' });

    const msg = await get('SELECT id FROM messages WHERE id = $1', [messageId]);
    if (!msg) return res.status(404).json({ error: 'Message not found' });

    await run('UPDATE messages SET is_hidden = TRUE, deleted_at = CURRENT_TIMESTAMP, deleted_by = $1 WHERE id = $2',
      [req.adminUser.id, messageId]);
    await logAudit(req.adminUser.id, 'admin_delete_message', null, `Admin deleted message ${messageId}`);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Active Rooms ─────────────────────────────────────────────────────────
router.get('/rooms', requireAdmin, (req, res) => {
  try {
    const io = req.app.get('io');
    if (!io) return res.json({ rooms: [], total: 0 });

    const roomMap = io.sockets?.adapter?.rooms || new Map();
    const rooms = Array.from(roomMap.entries())
      .filter(([name, s]) => {
        if (name.startsWith(io.sockets?.adapter?.sidPrefix || '')) return false;
        const size = typeof s === 'object' ? (s.size || s.length || 0) : s;
        return size > 0;
      })
      .map(([name, s]) => ({
        room: name,
        sockets: typeof s === 'object' ? (s.size || s.length || 0) : s
      }));

    res.json({ rooms, total: rooms.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Global Location Tracking Toggle ──────────────────────────────────────
router.post('/location/toggle', requireAdmin, async (req, res) => {
  try {
    const { enabled } = req.body;
    if (typeof enabled !== 'boolean') return res.status(400).json({ error: 'enabled must be boolean' });

    await systemSettingsService.set('location_tracking_global_enabled', enabled, req.adminUser.id);

    const io = req.app.get('io');
    if (io) {
      io.emit('policy-update', {
        featureKey: 'location_tracking',
        enabled,
        updateId: Date.now().toString(36)
      });
    }

    await logAudit(req.adminUser.id, 'location_tracking_toggle', null, `Global location tracking ${enabled ? 'ENABLED' : 'DISABLED'}`);
    res.json({ success: true, enabled });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Force Global Ban (instant) ───────────────────────────────────────────
router.post('/global-ban', requireAdmin, async (req, res) => {
  try {
    const { userId, reason } = req.body;
    if (!userId) return res.status(400).json({ error: 'userId is required' });

    const user = await get('SELECT id, role FROM users WHERE id = $1', [userId]);
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.role === 'admin' || user.role === 'super_admin') return res.status(403).json({ error: 'Cannot ban admin' });

    await run('UPDATE users SET is_banned = TRUE, banned_at = NOW() WHERE id = $1', [userId]);

    const io = req.app.get('io');
    const userSockets = req.app.get('userSockets');
    const socketId = userSockets?.get(String(userId));
    if (socketId && io) {
      io.to(socketId).emit('banned', { reason: reason || 'Account suspended by administrator' });
      io.sockets.sockets.get(socketId)?.disconnect(true);
      userSockets.delete(String(userId));
    }

    await registry.purgeUser(userId);
    await logAudit(req.adminUser.id, 'admin_global_ban', parseInt(userId), reason || 'No reason provided');
    res.json({ success: true, message: 'User banned globally' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Revenue Analytics ────────────────────────────────────────────────────
router.get('/revenue/summary', requireAdmin, async (req, res) => {
  try {
    const telemetryLogs = await all(
      "SELECT data FROM audit_logs WHERE log_type = 'AD_TELEMETRY_BULK' ORDER BY id DESC LIMIT 100"
    );
    let totalImpressions = 0;
    let totalClicks = 0;
    let totalRevenue = 0;
    let eventCount = 0;

    for (const row of telemetryLogs) {
      try {
        const parsed = typeof row.data === 'string' ? JSON.parse(row.data) : row.data;
        if (Array.isArray(parsed.events)) {
          for (const event of parsed.events) {
            eventCount++;
            if (event.type === 'impression') totalImpressions++;
            if (event.type === 'click') totalClicks++;
            if (event.revenue) totalRevenue += parseFloat(event.revenue) || 0;
          }
        }
      } catch (e) {}
    }

    res.json({
      totalImpressions,
      totalClicks,
      totalRevenue,
      estimatedECPM: totalImpressions > 0 ? (totalRevenue / totalImpressions) * 1000 : 0,
      eventCount,
      period: 'last 100 batches'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── SMS Gateway Settings ─────────────────────────────────────────────────
router.get('/sms-settings', requireAdmin, async (req, res) => {
  try {
    const settings = await systemSettingsService.get('sms_gateway');
    res.json(settings || { provider: 'twilio', enabled: false, config: {} });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/sms-settings', requireAdmin, async (req, res) => {
  try {
    const { provider, enabled, config } = req.body;
    if (!provider) return res.status(400).json({ error: 'provider is required' });
    await systemSettingsService.set('sms_gateway', { provider, enabled: !!enabled, config: config || {} }, req.adminUser.id);
    await logAudit(req.adminUser.id, 'sms_settings_update', null, `SMS provider set to ${provider}`);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Gateway Health ──────────────────────────────────────────────────────
router.get('/gateway-health', requireAdmin, async (req, res) => {
  try {
    const emailSettings = await systemSettingsService.get('email_gateway');
    const smsSettings = await systemSettingsService.get('sms_gateway');
    res.json({
      email: {
        configured: !!(emailSettings?.smtp_host || emailSettings?.gmail_user),
        provider: emailSettings?.provider || 'none'
      },
      sms: {
        configured: !!(smsSettings?.config?.accountSid || smsSettings?.provider !== 'none'),
        provider: smsSettings?.provider || 'none',
        enabled: !!smsSettings?.enabled
      },
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
