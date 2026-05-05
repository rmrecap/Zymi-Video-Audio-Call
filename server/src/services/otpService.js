import { get, run, all } from '../db/database.js';
import { generateOTP, generateSecureToken, hashToken } from './tokenHashService.js';
import { sendOTPEmail } from './emailService.js';

export const requestEmailOTP = async (userId, email) => {
  const otp = generateOTP();
  const otpHash = hashToken(otp);
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString(); // 5 minutes

  // Invalidate previous OTPs
  run('UPDATE otp_tokens SET is_used = 1 WHERE user_id = ? AND type = ?', userId, 'email');

  run(`
    INSERT INTO otp_tokens (user_id, type, otp_hash, expires_at)
    VALUES (?, ?, ?, ?)
  `, userId, 'email', otpHash, expiresAt);

  await sendOTPEmail(email, otp);
  return { success: true };
};

export const verifyEmailOTP = (userId, otp) => {
  const otpHash = hashToken(otp);
  const token = get(`
    SELECT * FROM otp_tokens 
    WHERE user_id = ? AND type = ? AND otp_hash = ? AND is_used = 0 AND expires_at > CURRENT_TIMESTAMP
  `, userId, 'email', otpHash);

  if (!token) return { success: false, error: 'Invalid or expired OTP' };

  run('UPDATE otp_tokens SET is_used = 1 WHERE id = ?', token.id);
  run('UPDATE users SET email_verified = 1 WHERE id = ?', userId);
  
  return { success: true };
};

export const requestPhoneVerificationLink = async (userId, phoneData) => {
  const otp = generateOTP();
  const otpHash = hashToken(otp);
  const token = generateSecureToken();
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString(); // 5 minutes

  // Invalidate previous
  run('UPDATE otp_tokens SET is_used = 1 WHERE user_id = ? AND type = ?', userId, 'phone');

  run(`
    INSERT INTO otp_tokens (user_id, type, otp_hash, token_hash, expires_at)
    VALUES (?, ?, ?, ?, ?)
  `, userId, 'phone', otpHash, tokenHash, expiresAt);

  // Update user phone info (but not verified yet)
  run(`
    UPDATE users SET 
      country_code = ?,
      country_name = ?,
      phone_country_iso = ?,
      phone_normalized = ?
    WHERE id = ?
  `, 
  phoneData.countryCode,
  phoneData.countryName,
  phoneData.phoneCountryIso,
  phoneData.phoneNormalized,
  userId
  );

  return { token, otp, expiresAt };
};

export const verifyPhoneOTPInline = (userId, otp) => {
  const otpHash = hashToken(otp);
  
  const otpToken = get(`
    SELECT * FROM otp_tokens 
    WHERE user_id = ? AND type = 'phone' AND is_used = 0 AND expires_at > CURRENT_TIMESTAMP
  `, userId);

  if (!otpToken) return { success: false, error: 'No active verification session' };
  if (otpToken.otp_hash !== otpHash) return { success: false, error: 'Invalid OTP' };

  run('UPDATE otp_tokens SET is_used = 1 WHERE id = ?', otpToken.id);
  run('UPDATE users SET phone_verified = 1, verification_status = "verified" WHERE id = ?', userId);

  return { success: true };
};

export const verifyPhoneOTP = (token, otp) => {
  const tokenHash = hashToken(token);
  const otpHash = hashToken(otp);
  
  const otpToken = get(`
    SELECT * FROM otp_tokens 
    WHERE token_hash = ? AND is_used = 0 AND expires_at > CURRENT_TIMESTAMP
  `, tokenHash);

  if (!otpToken) return { success: false, error: 'Invalid or expired link' };
  if (otpToken.otp_hash !== otpHash) return { success: false, error: 'Invalid OTP' };

  run('UPDATE otp_tokens SET is_used = 1 WHERE id = ?', otpToken.id);
  run('UPDATE users SET phone_verified = 1, verification_status = "verified" WHERE id = ?', otpToken.user_id);

  return { success: true };
};

export const markTokenOpened = (token) => {
  const tokenHash = hashToken(token);
  run('UPDATE otp_tokens SET is_opened = 1 WHERE token_hash = ?', tokenHash);
};

export const checkTokenStatus = (token) => {
  const tokenHash = hashToken(token);
  return get('SELECT * FROM otp_tokens WHERE token_hash = ?', tokenHash);
};
