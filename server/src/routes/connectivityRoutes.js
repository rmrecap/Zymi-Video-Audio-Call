import { Router } from 'express';
import { requireAuth, requireAdmin } from '../middleware/authMiddleware.js';
import * as connectivityPolicyService from '../services/connectivityPolicyService.js';
import * as connectivityAuditService from '../services/connectivityAuditService.js';

import * as relayUsageService from '../services/relayUsageService.js';
import * as relayCostGuardService from '../services/relayCostGuardService.js';

const router = Router();

router.post('/relay-usage', requireAuth, (req, res) => {
  try {
    relayUsageService.logRelayUsage({
      ...req.body,
      user_id: req.user.id
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/admin/relay-usage', requireAdmin, (req, res) => {
  try {
    res.json({
      summary: relayUsageService.getRelayUsageSummary(),
      sessions: relayUsageService.getRecentRelaySessions(),
      anomalies: relayCostGuardService.getRelayAnomalies()
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/admin/cost-guard', requireAdmin, (req, res) => {
  try {
    res.json(relayCostGuardService.getAllRules());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/admin/cost-guard', requireAdmin, (req, res) => {
  try {
    relayCostGuardService.createOrUpdateRule(req.body);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/policy', requireAuth, (req, res) => {
  try {
    const country = req.query.country || null;
    const policy = connectivityPolicyService.getPolicyForCountry(country);
    res.json(policy);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/event', requireAuth, (req, res) => {
  try {
    connectivityAuditService.logConnectivityEvent({
      ...req.body,
      user_id: req.user.id
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/admin/policies', requireAdmin, (req, res) => {
  try {
    res.json(connectivityPolicyService.getPolicies());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/admin/policies', requireAdmin, (req, res) => {
  try {
    connectivityPolicyService.createOrUpdatePolicy(req.body);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/admin/stats', requireAdmin, (req, res) => {
  try {
    res.json({
      summary: connectivityAuditService.getConnectivityStats(),
      regions: connectivityAuditService.getRegionStats()
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
