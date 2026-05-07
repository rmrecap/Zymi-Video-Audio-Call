import express from 'express';
import * as featureFlagService from '../services/featureFlagService.js';
import { requireAuth, requireAdmin } from '../middleware/authMiddleware.js';
import { get, run, all } from '../db/postgres.js';
import { logAudit } from '../services/auditService.js';

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
    const { default_radius_km, report_threshold, approximate_only } = req.body;

    await run(`
      UPDATE nearby_global_settings 
      SET default_radius_km = $1, report_threshold = $2, approximate_only = $3, updated_at = CURRENT_TIMESTAMP 
      WHERE id = 1
    `, [default_radius_km, report_threshold, approximate_only]);

    await logAudit(req.adminUser.id, 'UPDATE_NEARBY_SETTINGS', null, JSON.stringify({
      default_radius_km,
      report_threshold,
      approximate_only
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

export default router;
