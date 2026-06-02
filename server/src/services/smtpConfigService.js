import { db } from '../db/db_provider.js';
import { encrypt, decrypt } from '../utils/encryption.js';

export const getEmailSettings = async () => {
  const settings = await db.get('SELECT * FROM email_settings WHERE id = 1');
  if (settings) {
    return {
      ...settings,
      smtp_pass: settings.smtp_pass ? decrypt(settings.smtp_pass) : null,
      gmail_app_password: settings.gmail_app_password ? decrypt(settings.gmail_app_password) : null
    };
  }
  return null;
};

export const updateEmailSettings = async (data) => {
  const { provider, smtp_host, smtp_port, smtp_user, smtp_pass, smtp_secure, gmail_user, gmail_app_password } = data;
  
  const current = await getEmailSettings();
  
  let encryptedSmtpPass;
  if (smtp_pass && smtp_pass.trim() !== '') {
    encryptedSmtpPass = encrypt(smtp_pass);
  } else if (current?.smtp_pass) {
    encryptedSmtpPass = current.smtp_pass;
  } else {
    encryptedSmtpPass = null;
  }
  
  let encryptedGmailPass;
  if (gmail_app_password && gmail_app_password.trim() !== '') {
    encryptedGmailPass = encrypt(gmail_app_password);
  } else if (current?.gmail_app_password) {
    encryptedGmailPass = current.gmail_app_password;
  } else {
    encryptedGmailPass = null;
  }

  const result = await db.run(`
    UPDATE email_settings SET 
      provider = $1,
      smtp_host = $2,
      smtp_port = $3,
      smtp_user = $4,
      smtp_pass = $5,
      smtp_secure = $6,
      gmail_user = $7,
      gmail_app_password = $8,
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

  if (!result || result.changes === 0) {
    throw new Error('Failed to update email settings - row may not exist');
  }
  
  return await getEmailSettings();
};
