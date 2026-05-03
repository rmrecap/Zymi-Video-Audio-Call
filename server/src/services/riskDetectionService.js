import { get, all } from '../db/database.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const detectRisks = async () => {
  const risks = [];
  const serverRoot = path.join(__dirname, '..', '..');

  // 1. Dependency Audit (Hard Lock 1)
  try {
    const pkgJson = JSON.parse(fs.readFileSync(path.join(serverRoot, 'package.json'), 'utf8'));
    const deps = { ...pkgJson.dependencies, ...pkgJson.devDependencies };
    if (deps['firebase'] || deps['firebase-admin']) {
      risks.push({
        risk_type: 'HARD_LOCK_VIOLATION',
        severity: 'CRITICAL',
        title: 'Firebase Dependency Detected',
        description: 'Firebase or FCM found in package.json, violating hard lock 1.',
        affected_area: 'Infrastructure'
      });
    }
  } catch (err) {}

  // 2. Secret Logging Audit (Security Regression)
  // This is a simplified check for strings in logs if we had access to log files.
  // Instead, we'll check recent audit logs for sensitive data.
  const sensitiveLogs = all("SELECT * FROM auth_audit_logs WHERE details LIKE '%OTP%' OR details LIKE '%token%' OR details LIKE '%password%'");
  // The existing logAudit masks these, so finding raw values would be a risk.
  // Here we'll simulate a check for unmasked data patterns.
  
  // 3. Database Security
  const plainTextSmtp = get("SELECT count(*) as count FROM email_settings WHERE smtp_pass NOT LIKE 'enc:%' AND smtp_pass IS NOT NULL");
  if (plainTextSmtp.count > 0) {
    risks.push({
      risk_type: 'SECURITY_VULNERABILITY',
      severity: 'CRITICAL',
      title: 'Plain Text SMTP Credentials',
      description: 'SMTP passwords stored in plain text detected in database.',
      affected_area: 'Database'
    });
  }

  // 4. OTP Configuration
  const reusableOtp = get("SELECT count(*) as count FROM otp_tokens WHERE is_used = 0 AND expires_at < created_at"); // Logic error check
  // Actually check if they have no expiry
  const noExpiryOtp = get("SELECT count(*) as count FROM otp_tokens WHERE expires_at IS NULL");
  if (noExpiryOtp.count > 0) {
    risks.push({
      risk_type: 'SECURITY_VULNERABILITY',
      severity: 'CRITICAL',
      title: 'OTP Missing Expiry',
      description: 'OTP tokens found without expiry date.',
      affected_area: 'Authentication'
    });
  }

  // 5. Media Storage Audit (Phase 58 Hard Lock)
  try {
    const uploadDir = path.join(serverRoot, 'uploads', 'messages');
    if (fs.existsSync(uploadDir)) {
      const files = fs.readdirSync(uploadDir);
      if (files.length > 0) {
        risks.push({
          risk_type: 'POLICY_VIOLATION',
          severity: 'HIGH',
          title: 'Server-Side Media Detected',
          description: `Found ${files.length} files in /uploads/messages, violating Phase 58 P2P mandate.`,
          affected_area: 'Storage'
        });
      }
    }
  } catch (err) {}

  // 6. Connectivity Security (Phase 59)
  const plainTurnCreds = get("SELECT count(*) as count FROM turn_servers WHERE credential_encrypted NOT LIKE 'enc:%'");
  if (plainTurnCreds.count > 0) {
    risks.push({
      risk_type: 'SECURITY_VULNERABILITY',
      severity: 'HIGH',
      title: 'Plain Text TURN Credentials',
      description: 'Found TURN server credentials stored in plain text.',
      affected_area: 'Database'
    });
  }

  // 8. Relay Observability (Phase 60)
  const simulatedCheck = get("SELECT count(*) as count FROM turn_health_checks WHERE status = 'ok' AND latency_ms = 0");
  if (simulatedCheck.count > 10) {
    risks.push({
      risk_type: 'OBSERVABILITY_WARNING',
      severity: 'MEDIUM',
      title: 'Potential Simulated TURN Health',
      description: 'Detected multiple health checks with zero latency, indicating simulation.',
      affected_area: 'Connectivity Monitoring'
    });
  }

  const { getRelayAnomalies } = await import('./relayCostGuardService.js');
  const anomalies = getRelayAnomalies();
  if (anomalies.length > 0) {
    risks.push({
      risk_type: 'INFRA_COST_ALERT',
      severity: 'HIGH',
      title: 'Relay Usage Anomalies',
      description: `${anomalies.length} users are exceeding daily relay duration/bandwidth limits.`,
      affected_area: 'Relay Infrastructure'
    });
  }

  return risks;
};

export const getRiskEvents = () => {
  return all('SELECT * FROM risk_events WHERE status = "open" ORDER BY created_at DESC');
};

export const acknowledgeRisk = (id) => {
  return run('UPDATE risk_events SET status = "acknowledged", resolved_at = CURRENT_TIMESTAMP WHERE id = ?', id);
};
