import { Router } from 'express';
import { requireAdmin } from '../middleware/authMiddleware.js';
import { systemSettingsService } from '../services/systemSettingsService.js';
import { logAudit } from '../services/auditService.js';

const router = Router();

router.get('/system-settings', requireAdmin, async (req, res) => {
  try {
    const forceRefresh = req.query.refresh === 'true';
    const settings = await systemSettingsService.getAll(forceRefresh);
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/system-settings/:key', requireAdmin, async (req, res) => {
  try {
    const value = await systemSettingsService.get(req.params.key);
    res.json({ key: req.params.key, value });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/system-settings', requireAdmin, async (req, res) => {
  try {
    const { key, value } = req.body;
    if (!key) return res.status(400).json({ error: 'key is required' });
    await systemSettingsService.set(key, value, req.adminUser.id);
    await logAudit(req.adminUser.id, 'system_settings_update', null, `Set ${key}=${JSON.stringify(value)}`);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/system-settings/bulk', requireAdmin, async (req, res) => {
  try {
    const { updates } = req.body;
    if (!updates || typeof updates !== 'object') return res.status(400).json({ error: 'updates object is required' });
    await systemSettingsService.updateBulk(updates, req.adminUser.id);
    await logAudit(req.adminUser.id, 'system_settings_bulk_update', null, `Updated ${Object.keys(updates).length} keys`);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/system-settings/:key', requireAdmin, async (req, res) => {
  try {
    await systemSettingsService.delete(req.params.key, req.adminUser.id);
    await logAudit(req.adminUser.id, 'system_settings_delete', null, `Deleted key ${req.params.key}`);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
