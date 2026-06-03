import { Router } from 'express';
import { requireAuth } from '../middleware/authMiddleware.js';
import { requestEmailOTP, verifyEmailOTP, requestPhoneVerificationLink, verifyPhoneOTP, verifyPhoneOTPInline, markTokenOpened, checkTokenStatus, getPendingVerifications } from '../services/otpService.js';
import { normalizePhone } from '../utils/phoneNormalizer.js';
import { updateProfileCompletion } from '../services/profileCompletionService.js';
import { logAudit } from '../services/auditService.js';

const router = Router();

router.post('/email/request', requireAuth, async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email required' });

  try {
    await requestEmailOTP(req.user.id, email);
    res.json({ success: true, message: 'OTP sent' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to send OTP' });
  }
});

router.post('/email/verify', requireAuth, async (req, res) => {
  const { otp } = req.body;
  if (!otp) return res.status(400).json({ error: 'OTP required' });

  try {
    const result = await verifyEmailOTP(req.user.id, otp);
    if (result.success) {
      await updateProfileCompletion(req.user.id);
      res.json({ success: true });
    } else {
      res.status(400).json({ error: result.error });
    }
  } catch (err) {
    res.status(500).json({ error: 'Verification failed' });
  }
});

router.post('/phone/request-link', requireAuth, async (req, res) => {
  const { phone, countryCode, countryName, phoneCountryIso } = req.body;
  if (!phone || !countryCode) return res.status(400).json({ error: 'Phone and country code required' });

  const normalized = normalizePhone(phone);
  if (!normalized) return res.status(400).json({ error: 'Invalid phone number' });

  try {
    const { token, otp, expiresAt } = await requestPhoneVerificationLink(req.user.id, {
      phoneNormalized: normalized,
      countryCode,
      countryName,
      phoneCountryIso
    });

    const link = `${req.protocol}://${req.get('host')}/verify/phone/${token}`;
    
    // Check if inline display is allowed
    const displayOtpAllowed = process.env.SELF_HOSTED_PHONE_OTP_DISPLAY === 'true';
    
    // Mask phone for auditing
    const maskedPhone = normalized.replace(/(\+\d{3})\d+(\d{2})/, '$1*****$2');
    await logAudit(req.user.id, 'phone_otp_link_requested', req.user.id, `Phone link requested for ${maskedPhone}`);

    res.json({ 
      success: true, 
      link, 
      expiresAt,
      displayOtpAllowed,
      otpPreview: displayOtpAllowed ? otp : null
    });
  } catch (err) {
    console.error('[OTP] Error:', err);
    res.status(500).json({ error: 'Failed to generate link' });
  }
});

router.post('/phone/verify-inline', requireAuth, async (req, res) => {
  const { otp } = req.body;
  if (!otp) return res.status(400).json({ error: 'OTP required' });

  try {
    const result = await verifyPhoneOTPInline(req.user.id, otp);
    if (result.success) {
      await updateProfileCompletion(req.user.id);
      res.json({ success: true });
    } else {
      res.status(400).json({ error: result.error });
    }
  } catch (err) {
    res.status(500).json({ error: 'Verification failed' });
  }
});

router.get('/phone/verify/:token', async (req, res) => {
  const { token } = req.params;
  try {
    const status = await checkTokenStatus(token);

    if (!status || status.is_used || new Date(status.expires_at) < new Date()) {
      return res.status(400).send('<h1>Invalid or expired link</h1>');
    }

    if (status.is_opened) {
      return res.status(400).send('<h1>Link already opened</h1>');
    }

    await markTokenOpened(token);

    // Serve a simple HTML page for OTP entry
    res.send(`
      <html>
        <head>
          <title>ZYMI Phone Verification</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: sans-serif; background: #0f172a; color: white; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
            .card { background: #1e293b; padding: 2rem; border-radius: 1rem; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); text-align: center; max-width: 400px; width: 90%; }
            h1 { color: #3b82f6; margin-bottom: 1.5rem; }
            input { background: #334155; border: 1px solid #475569; color: white; padding: 0.75rem; border-radius: 0.5rem; width: 100%; box-sizing: border-box; margin-bottom: 1rem; text-align: center; font-size: 1.5rem; letter-spacing: 0.5rem; }
            button { background: #3b82f6; color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 0.5rem; font-weight: bold; cursor: pointer; width: 100%; }
            button:hover { background: #2563eb; }
            .error { color: #ef4444; margin-top: 1rem; display: none; }
            .success { color: #10b981; margin-top: 1rem; display: none; }
          </style>
        </head>
        <body>
          <div class="card">
            <h1>Verify Phone</h1>
            <p>Enter the OTP you received (if any, this is a self-hosted simulation for Phase 54).</p>
            <input type="text" id="otp" maxlength="6" placeholder="000000">
            <button onclick="verify()">Verify</button>
            <div id="error" class="error"></div>
            <div id="success" class="success">Verification successful! You can return to the app.</div>
          </div>
          <script>
            async function verify() {
              const otp = document.getElementById('otp').value;
              const errorDiv = document.getElementById('error');
              const successDiv = document.getElementById('success');
              errorDiv.style.display = 'none';
              
              const res = await fetch('/api/otp/phone/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token: '${token}', otp })
              });
              const data = await res.json();
              if (data.success) {
                successDiv.style.display = 'block';
                document.querySelector('button').disabled = true;
                document.getElementById('otp').disabled = true;
              } else {
                errorDiv.innerText = data.error;
                errorDiv.style.display = 'block';
              }
            }
          </script>
        </body>
      </html>
    `);
  } catch (err) {
    res.status(500).send('<h1>Internal Server Error</h1>');
  }
});

router.get('/pending', requireAuth, async (req, res) => {
  try {
    const verifications = await getPendingVerifications(req.user.id);
    res.json({ verifications });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch pending verifications' });
  }
});

router.post('/phone/verify', async (req, res) => {
  const { token, otp } = req.body;
  if (!token || !otp) return res.status(400).json({ error: 'Token and OTP required' });

  try {
    const result = await verifyPhoneOTP(token, otp);
    if (result.success) {
      const status = await checkTokenStatus(token);
      await updateProfileCompletion(status.user_id);
      res.json({ success: true });
    } else {
      res.status(400).json({ error: result.error });
    }
  } catch (err) {
    res.status(500).json({ error: 'Verification failed' });
  }
});

export default router;
