import { Router } from 'express';
import { requireAdmin } from '../middleware/authMiddleware.js';
import { getEmailSettings, updateEmailSettings } from '../services/smtpConfigService.js';
import { testEmailConfig } from '../services/emailService.js';
import { logAudit } from '../services/auditService.js';

const router = Router();

router.get('/email-settings', requireAdmin, (req, res) => {
  const settings = getEmailSettings();
  if (settings) {
    // Don't send passwords to frontend
    const safeSettings = { ...settings };
    delete safeSettings.smtp_pass;
    delete safeSettings.gmail_app_password;
    res.json(safeSettings);
  } else {
    res.status(404).json({ error: 'Settings not found' });
  }
});

router.post('/email-settings', requireAdmin, (req, res) => {
  try {
    const settings = updateEmailSettings(req.body);
    logAudit(req.user.id, 'email_settings_updated', null, `Email provider changed to ${req.body.provider}`);
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
