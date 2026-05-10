import express from 'express';
import { requireAdmin } from '../middleware/authMiddleware.js';
import { adConfigService } from '../services/adConfigService.js';
import { adConfigSafetyService } from '../services/adConfigSafetyService.js';
import { adConfigValidator } from '../services/adConfigValidator.js';

const router = express.Router();

// PUBLIC ENDPOINT - Mobile App Config
router.get('/v1/ad-settings', (req, res) => {
  const countryCode = req.query.country || req.headers['cf-ipcountry'] || null;
  const appVersion = req.query.version || null;
  
  try {
    const rawConfig = adConfigService.getAppConfig(countryCode, appVersion);
    const safeConfig = adConfigSafetyService.enforceSafeConfig(rawConfig);
    res.json(safeConfig);
  } catch (err) {
    console.error('[ZRCS] App config fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch ad settings' });
  }
});

// PUBLIC HEALTH ENDPOINT
router.get('/v1/ad-settings/health', (req, res) => {
  res.json({
    status: "ok",
    contract_version: "zrcs-v1",
    safe_defaults: true,
    no_ads_during_call: true
  });
});

router.get('/zrcs/ping', (req, res) => {
  res.json({ ok: true, module: "zrcs-admin", mounted: true });
});

// PRIVATE ENDPOINTS - Admin Control
router.get('/admin/ad-control/settings', requireAdmin, (req, res) => {
  try {
    // Temporary mock response until DB is fixed
    res.json({
      global: { ads_enabled: true, test_mode: false, active_network: 'admob', fallback_network: 'applovin', interstitial_gap_seconds: 1800, native_refresh_seconds: 60 },
      networks: [],
      placements: [],
      countryRules: [],
      versionRules: []
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/admin/ad-control/global', requireAdmin, (req, res) => {
  try {
    const settings = adConfigService.updateGlobalSettings(req.body, req.adminUser.id);
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/admin/ad-control/network', requireAdmin, (req, res) => {
  try {
    const config = adConfigService.updateNetworkConfig(req.body, req.adminUser.id);
    res.json(config);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/admin/ad-control/placement', requireAdmin, (req, res) => {
  try {
    const placements = adConfigService.updatePlacement(req.body, req.adminUser.id);
    res.json(placements);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/admin/ad-control/country-rule', requireAdmin, (req, res) => {
  try {
    const rules = adConfigService.addCountryRule(req.body, req.adminUser.id);
    res.json(rules);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/admin/ad-control/country-rule/:id', requireAdmin, (req, res) => {
  try {
    const rules = adConfigService.removeCountryRule(req.params.id, req.adminUser.id);
    res.json(rules);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/admin/ad-control/version-rule', requireAdmin, (req, res) => {
  try {
    const rules = adConfigService.addVersionRule(req.body, req.adminUser.id);
    res.json(rules);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/admin/ad-control/version-rule/:id', requireAdmin, (req, res) => {
  try {
    const rules = adConfigService.removeVersionRule(req.params.id, req.adminUser.id);
    res.json(rules);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/admin/ad-control/audit', requireAdmin, (req, res) => {
  try {
    const logs = adConfigService.getAuditLogs();
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/admin/ad-control/validate', requireAdmin, (req, res) => {
  try {
    const { global, networks, placements, countryRules, versionRules } = req.body;
    const validation = adConfigValidator.validateConfig(global, networks, placements, countryRules, versionRules);
    res.json(validation);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/admin/ad-control/rollback', requireAdmin, (req, res) => {
  try {
    const result = adConfigService.rollbackToLastSnapshot(req.adminUser.id);
    if (!result.success) {
      return res.status(400).json({ error: result.message });
    }
    res.json({ message: 'Rollback successful' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/admin/ad-control/export', requireAdmin, (req, res) => {
  try {
    const data = adConfigService.exportConfig();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
