import nodemailer from 'nodemailer';
import { getEmailSettings } from './smtpConfigService.js';

export const sendOTPEmail = async (email, otp) => {
  const settings = await getEmailSettings();

  if (!settings) {
    console.warn('[EMAIL] No email settings configured — OTP will be logged instead of sent');
    console.log(`[EMAIL] OTP for ${email}: ${otp}`);
    return { success: true, fallback: true };
  }

  try {
    let transporter;

    if (settings.provider === 'smtp' && settings.smtp_host) {
      transporter = nodemailer.createTransport({
        host: settings.smtp_host,
        port: settings.smtp_port,
        secure: settings.smtp_secure === 1,
        auth: {
          user: settings.smtp_user,
          pass: settings.smtp_pass
        }
      });
    } else if (settings.provider === 'gmail' && settings.gmail_user && settings.gmail_app_password) {
      transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: settings.gmail_user,
          pass: settings.gmail_app_password
        }
      });
    } else {
      console.warn('[EMAIL] No active email provider configured — logging OTP');
      console.log(`[EMAIL] OTP for ${email}: ${otp}`);
      return { success: true, fallback: true };
    }

    const mailOptions = {
      from: `"ZYMI Support" <${settings.provider === 'gmail' ? settings.gmail_user : settings.smtp_user}>`,
      to: email,
      subject: 'ZYMI Verification Code',
      text: `Your ZYMI verification code is: ${otp}. It will expire in 5 minutes.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
          <h2 style="color: #3b82f6; text-align: center;">ZYMI Verification</h2>
          <p>Hello,</p>
          <p>Your verification code is:</p>
          <div style="font-size: 32px; font-weight: bold; text-align: center; padding: 20px; background: #f3f4f6; border-radius: 5px; letter-spacing: 5px;">
            ${otp}
          </div>
          <p>This code will expire in 5 minutes. If you did not request this code, please ignore this email.</p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="font-size: 12px; color: #888; text-align: center;">© 2026 ZYMI. All rights reserved.</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (err) {
    console.error('[EMAIL] Failed to send email, OTP will be logged:', err.message);
    console.log(`[EMAIL] OTP for ${email}: ${otp}`);
    return { success: true, fallback: true };
  }
};

export const testEmailConfig = async (testEmail) => {
  const otp = '123456';
  return sendOTPEmail(testEmail, otp);
};
