import { get, run } from '../db/database.js';
import { encrypt, decrypt } from '../utils/encryption.js';

export const getEmailSettings = () => {
  const settings = get('SELECT * FROM email_settings WHERE id = 1');
  if (settings) {
    return {
      ...settings,
      smtp_pass: settings.smtp_pass ? decrypt(settings.smtp_pass) : null,
      gmail_app_password: settings.gmail_app_password ? decrypt(settings.gmail_app_password) : null
    };
  }
  return null;
};

export const updateEmailSettings = (data) => {
  const { provider, smtp_host, smtp_port, smtp_user, smtp_pass, smtp_secure, gmail_user, gmail_app_password } = data;
  
  const current = getEmailSettings();
  
  const encryptedSmtpPass = smtp_pass ? encrypt(smtp_pass) : current?.smtp_pass ? encrypt(current.smtp_pass) : null;
  const encryptedGmailPass = gmail_app_password ? encrypt(gmail_app_password) : current?.gmail_app_password ? encrypt(current.gmail_app_password) : null;

  run(`
    UPDATE email_settings SET 
      provider = ?,
      smtp_host = ?,
      smtp_port = ?,
      smtp_user = ?,
      smtp_pass = ?,
      smtp_secure = ?,
      gmail_user = ?,
      gmail_app_password = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = 1
  `, 
  provider || 'gmail',
  smtp_host || null,
  smtp_port || null,
  smtp_user || null,
  encryptedSmtpPass,
  smtp_secure !== undefined ? (smtp_secure ? 1 : 0) : 1,
  gmail_user || null,
  encryptedGmailPass
  );
  
  return getEmailSettings();
};
