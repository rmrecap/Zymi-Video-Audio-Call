import { Router } from 'express';
import { requireAuth, requireAdmin } from '../middleware/authMiddleware.js';
import * as turnConfigService from '../services/turnConfigService.js';

import * as turnHealthCheckService from '../services/turnHealthCheckService.js';

const router = Router();

router.get('/ice-servers', requireAuth, async (req, res) => {
  try {
    const country = req.query.country || null;
    const servers = await turnConfigService.getActiveIceServers(country);
    res.json(servers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/admin/servers', requireAdmin, async (req, res) => {
  try {
    const servers = await turnConfigService.getTurnServers();
    res.json(servers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/admin/servers', requireAdmin, async (req, res) => {
  try {
    await turnConfigService.addTurnServer(req.body);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/admin/servers/:id', requireAdmin, async (req, res) => {
  try {
    await turnConfigService.updateTurnServer(req.params.id, req.body);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/health', requireAdmin, async (req, res) => {
  try {
    const health = await turnHealthCheckService.getLatestHealth();
    res.json(health);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/admin/servers/:id/test', requireAdmin, async (req, res) => {
  try {
    // Perform real reachability check
    const config = await turnConfigService.testTurnServer(req.params.id);
    const health = await turnHealthCheckService.performHealthCheck();
    const serverHealth = health.find(h => h.server_id === parseInt(req.params.id));
    res.json({ config, health: serverHealth });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/admin/health-history/:id', requireAdmin, async (req, res) => {
  try {
    const history = await turnHealthCheckService.getHealthHistory(req.params.id);
    res.json(history);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
