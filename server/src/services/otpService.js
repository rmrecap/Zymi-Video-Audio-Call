import { get, run, all } from '../db/postgres.js';
import { generateOTP, generateSecureToken, hashToken } from './tokenHashService.js';
import { sendOTPEmail } from './emailService.js';

export const requestEmailOTP = async (userId, email) => {
  const otp = generateOTP();
  const otpHash = hashToken(otp);
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString(); // 5 minutes

  // Invalidate previous OTPs
  await run('UPDATE otp_tokens SET is_used = 1 WHERE user_id = $1 AND type = $2', [userId, 'email']);

  await run(`
    INSERT INTO otp_tokens (user_id, type, otp_hash, expires_at)
    VALUES ($1, $2, $3, $4)
  `, [userId, 'email', otpHash, expiresAt]);

  await sendOTPEmail(email, otp);
  return { success: true };
};

export const verifyEmailOTP = async (userId, otp) => {
  const otpHash = hashToken(otp);
  const token = await get(`
    SELECT * FROM otp_tokens 
    WHERE user_id = $1 AND type = $2 AND otp_hash = $3 AND is_used = 0 AND expires_at > CURRENT_TIMESTAMP
  `, [userId, 'email', otpHash]);

  if (!token) return { success: false, error: 'Invalid or expired OTP' };

  await run('UPDATE otp_tokens SET is_used = 1 WHERE id = $1', [token.id]);
  await run('UPDATE users SET email_verified = 1 WHERE id = $1', [userId]);
  
  return { success: true };
};

export const requestPhoneVerificationLink = async (userId, phoneData) => {
  const otp = generateOTP();
  const otpHash = hashToken(otp);
  const token = generateSecureToken();
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString(); // 5 minutes

  // Invalidate previous
  await run('UPDATE otp_tokens SET is_used = 1 WHERE user_id = $1 AND type = $2', [userId, 'phone']);

  await run(`
    INSERT INTO otp_tokens (user_id, type, otp_hash, token_hash, expires_at)
    VALUES ($1, $2, $3, $4, $5)
  `, [userId, 'phone', otpHash, tokenHash, expiresAt]);

  // Update user phone info (but not verified yet)
  await run(`
    UPDATE users SET 
      country_code = $1,
      country_name = $2,
      phone_country_iso = $3,
      phone_normalized = $4
    WHERE id = $5
  `, [
    phoneData.countryCode,
    phoneData.countryName,
    phoneData.phoneCountryIso,
    phoneData.phoneNormalized,
    userId
  ]);

  return { token, otp, expiresAt };
};

export const verifyPhoneOTPInline = async (userId, otp) => {
  const otpHash = hashToken(otp);
  
  const otpToken = await get(`
    SELECT * FROM otp_tokens 
    WHERE user_id = $1 AND type = 'phone' AND is_used = 0 AND expires_at > CURRENT_TIMESTAMP
  `, [userId]);

  if (!otpToken) return { success: false, error: 'No active verification session' };
  if (otpToken.otp_hash !== otpHash) return { success: false, error: 'Invalid OTP' };

  await run('UPDATE otp_tokens SET is_used = 1 WHERE id = $1', [otpToken.id]);
  await run('UPDATE users SET phone_verified = 1, verification_status = \'verified\' WHERE id = $1', [userId]);

  return { success: true };
};

export const verifyPhoneOTP = async (token, otp) => {
  const tokenHash = hashToken(token);
  const otpHash = hashToken(otp);
  
  const otpToken = await get(`
    SELECT * FROM otp_tokens 
    WHERE token_hash = $1 AND is_used = 0 AND expires_at > CURRENT_TIMESTAMP
  `, [tokenHash]);

  if (!otpToken) return { success: false, error: 'Invalid or expired link' };
  if (otpToken.otp_hash !== otpHash) return { success: false, error: 'Invalid OTP' };

  await run('UPDATE otp_tokens SET is_used = 1 WHERE id = $1', [otpToken.id]);
  await run('UPDATE users SET phone_verified = 1, verification_status = \'verified\' WHERE id = $1', [otpToken.user_id]);

  return { success: true };
};

export const markTokenOpened = async (token) => {
  const tokenHash = hashToken(token);
  await run('UPDATE otp_tokens SET is_opened = 1 WHERE token_hash = $1', [tokenHash]);
};

export const checkTokenStatus = async (token) => {
  const tokenHash = hashToken(token);
  return await get('SELECT * FROM otp_tokens WHERE token_hash = $1', [tokenHash]);
};
