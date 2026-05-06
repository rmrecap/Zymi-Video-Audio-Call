import { Router } from 'express';
import { requireAdmin } from '../middleware/authMiddleware.js';
import { getEmailSettings, updateEmailSettings } from '../services/smtpConfigService.js';
import { testEmailConfig } from '../services/emailService.js';
import { logAudit } from '../services/auditService.js';

const router = Router();

router.get('/email-settings', requireAdmin, async (req, res) => {
  try {
    const settings = await getEmailSettings();
    if (settings) {
      const safeSettings = { ...settings };
      delete safeSettings.smtp_pass;
      delete safeSettings.gmail_app_password;
      res.json(safeSettings);
    } else {
      res.status(404).json({ error: 'Settings not found' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/email-settings', requireAdmin, async (req, res) => {
  try {
    await updateEmailSettings(req.body);
    logAudit(req.adminUser.id, 'email_settings_updated', null, `Email provider changed to ${req.body.provider}`).catch(console.error);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/email-settings/test', requireAdmin, async (req, res) => {
  const { testEmail } = req.body;
  if (!testEmail) return res.status(400).json({ error: 'Test email required' });

  try {
    await testEmailConfig(testEmail);
    res.json({ success: true, message: 'Test email sent' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
