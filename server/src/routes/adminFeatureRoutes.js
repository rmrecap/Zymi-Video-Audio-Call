import express from 'express';
import crypto from 'crypto';
import * as featureFlagService from '../services/featureFlagService.js';
import { requireAuth, requireAdmin } from '../middleware/authMiddleware.js';
import { get, run, all } from '../db/postgres.js';
import { logAudit } from '../services/auditService.js';

import { getRedisClient } from '../socket/redisAdapter.js';

const router = express.Router();

// Admin Endpoints
router.get('/features', requireAuth, requireAdmin, async (req, res) => {
  try {
    const flags = await featureFlagService.getAllFeatureFlags();
    res.json(flags);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/features/update', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { featureKey, enabled } = req.body;
    await featureFlagService.updateFeatureFlag(featureKey, enabled, req.adminUser.id);
    
    // Write to Redis features cache
    const redisClient = getRedisClient();
    if (redisClient) {
      await redisClient.hSet('zymi:features', featureKey, enabled ? 'true' : 'false');
    }

    // Broadcast policy-update to all sockets (UI and BACKGROUND)
    const io = req.app.get('io');
    if (io) {
      io.emit('policy-update', {
        featureKey,
        enabled: !!enabled,
        updateId: crypto.randomUUID()
      });
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/features/audit-logs', requireAuth, requireAdmin, async (req, res) => {
  try {
    const logs = await featureFlagService.getGovernanceAuditLogs();
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/features/simulate', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { featureKey, userId, countryCode, cityName } = req.body;
    const result = await featureFlagService.evaluateFeatureAccess({
      featureKey,
      userId: userId ? parseInt(userId) : null,
      countryCode,
      cityName
    });
    res.json({
      ...result,
      evaluatedAt: new Date().toISOString(),
      params: { featureKey, userId, countryCode, cityName }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/features/geo-rules', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { featureKey } = req.query;
    const rules = await featureFlagService.getGeoRules(featureKey);
    res.json(rules);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/features/geo-rules', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { featureKey, countryCode, cityName, enabled, reason } = req.body;
    await featureFlagService.setGeoRule(featureKey, countryCode, cityName, enabled, reason, req.adminUser.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/features/user-rules', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.query;
    const rules = await featureFlagService.getUserRules(userId);
    res.json(rules);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/features/user-rules', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { featureKey, userId, enabled, reason, expiresAt } = req.body;
    await featureFlagService.setUserRule(featureKey, userId, enabled, reason, expiresAt, req.adminUser.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/features/nearby-settings', requireAuth, requireAdmin, async (req, res) => {
  try {
    const settings = await get('SELECT * FROM nearby_global_settings WHERE id = 1');
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/features/nearby-settings', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { default_radius_km, report_threshold, approximate_only, privacy_mode } = req.body;
    const resolvedPrivacyMode = privacy_mode || 'NORMAL';

    await run(`
      UPDATE nearby_global_settings 
      SET default_radius_km = $1, report_threshold = $2, approximate_only = $3, privacy_mode = $4, updated_at = CURRENT_TIMESTAMP 
      WHERE id = 1
    `, [default_radius_km, report_threshold, approximate_only, resolvedPrivacyMode]);

    // Mirror to Redis cache
    const redisClient = getRedisClient();
    const radiusMeters = (default_radius_km || 5) * 1000;
    const fuzzing = approximate_only ? '0.005' : '0.0';
    if (redisClient) {
      await redisClient.hSet('zymi:config:nearby', {
        radius: String(radiusMeters),
        fuzzing: fuzzing,
        privacy_mode: resolvedPrivacyMode
      });
    }

    // Broadcast update to sockets
    const io = req.app.get('io');
    if (io) {
      io.emit('nearby-settings-update', {
        radius: radiusMeters,
        fuzzing: fuzzing === '0.005',
        privacy_mode: resolvedPrivacyMode,
        updateId: crypto.randomUUID()
      });
    }

    await logAudit(req.adminUser.id, 'UPDATE_NEARBY_SETTINGS', null, JSON.stringify({
      default_radius_km,
      report_threshold,
      approximate_only,
      privacy_mode: resolvedPrivacyMode
    }));

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Public Check Endpoint
router.post('/features/check-access', requireAuth, async (req, res) => {
  try {
    const { featureKey } = req.body;
    
    const userLocation = await get('SELECT country_code as country, country_name as city FROM users WHERE id = $1', [req.user.id]);
    
    const result = await featureFlagService.evaluateFeatureAccess({
      featureKey,
      userId: req.user.id,
      countryCode: userLocation?.country,
      cityName: userLocation?.city
    });
    res.json({ allowed: result.allowed, reason: result.reason });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Diagnostics Endpoint
router.get('/features/diagnostics', requireAuth, requireAdmin, async (req, res) => {
  try {
    const redisClient = getRedisClient();
    let redisConnected = false;
    let revokedSessionsCount = 0;
    let activeDaemonsCount = 0;
    
    if (redisClient) {
      try {
        const ping = await redisClient.ping();
        redisConnected = ping === 'PONG';
        revokedSessionsCount = await redisClient.sCard('zymi:revoked_sessions');
        const keys = await redisClient.keys('user_sockets:*');
        activeDaemonsCount = keys.length;
      } catch (err) {
        console.error('[DIAGNOSTICS] Redis telemetry check failed:', err.message);
      }
    }

    // PostGIS health check
    let postgisHealthy = false;
    let postgisVersion = null;
    try {
      const versionResult = await get("SELECT PostGIS_Full_Version() as ver");
      if (versionResult && versionResult.ver) {
        postgisHealthy = true;
        postgisVersion = versionResult.ver;
      }
    } catch (err) {
      console.warn('[DIAGNOSTICS] PostGIS telemetry check failed:', err.message);
    }

    // Audit logs count
    let totalAuditLogs = 0;
    try {
      const countResult = await get("SELECT COUNT(*) as count FROM audit_logs");
      totalAuditLogs = parseInt(countResult?.count || '0', 10);
    } catch (err) {
      console.warn('[DIAGNOSTICS] audit_logs count check failed:', err.message);
    }

    res.json({
      status: (redisConnected && postgisHealthy) ? 'HEALTHY' : 'DEGRADED',
      redis: {
        connected: redisConnected,
        revokedSessions: revokedSessionsCount,
        activeDaemons: activeDaemonsCount,
      },
      postgis: {
        healthy: postgisHealthy,
        version: postgisVersion,
      },
      telemetry: {
        totalAuditLogs: totalAuditLogs,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
