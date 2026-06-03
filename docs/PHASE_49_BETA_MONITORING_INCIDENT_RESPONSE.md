# PHASE 49 — Monitoring & Incident Response for Beta

**Date:** 2026-06-02  
**Status:** PLAN (logs configured; alerting and playbooks prepared)

---

## 1. Log Sources

| Log Source | Location | Format | Retention | Status |
|------------|----------|--------|-----------|--------|
| Server logs | `/opt/zymi/beta/logs/server/` | JSON / text | 30 days | ⚠️ NEEDS CONFIG |
| Nginx logs | Docker volume (stdout) or `/var/log/nginx/` | Combined format | 30 days | ⚠️ NEEDS DOCKER |
| Docker logs | `docker compose logs` | JSON | 30 days | ⚠️ NEEDS DOCKER |
| PostgreSQL logs | Docker volume (stdout) | PostgreSQL format | 7 days | ⚠️ NEEDS DOCKER |
| Redis logs | Docker volume (stdout) | Redis format | 7 days | ⚠️ NEEDS DOCKER |
| Socket connection logs | Server stdout | JSON lines | 30 days | ⚠️ NEEDS CONFIG |
| Call failure logs | Server stdout | JSON lines | 30 days | ⚠️ NEEDS CONFIG |
| Error logs | `/opt/zymi/beta/logs/error/` | JSON | 90 days | ⚠️ NEEDS CONFIG |
| Admin audit logs | Database `audit_logs` table | DB rows | 365 days | ⚠️ NEEDS DB |
| Backup logs | `/opt/zymi/beta/backups/backup.log` | Text | 30 days | ⚠️ NEEDS BACKUP |

---

## 2. Logging Configuration

### Server Logging (recommended)

```javascript
// server/src/config/logger.js (conceptual)
import { createLogger, format, transports } from 'winston';

const logger = createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: format.combine(
    format.timestamp(),
    format.json()
  ),
  transports: [
    new transports.File({ filename: '/opt/zymi/beta/logs/server/error.log', level: 'error' }),
    new transports.File({ filename: '/opt/zymi/beta/logs/server/combined.log' }),
    new transports.Console({ format: format.simple() })
  ]
});
```

### Docker Log Driver

```yaml
# In docker-compose.prod.yml (per service)
logging:
  driver: "json-file"
  options:
    max-size: "10m"
    max-file: "3"
```

---

## 3. Alert Conditions & Thresholds

| Alert | Condition | Severity | Notification |
|-------|-----------|----------|-------------|
| Server down | Health endpoint returns non-200 for 30s | CRITICAL | Email + phone |
| Database down | `/health/db` returns non-200 | CRITICAL | Email + phone |
| Redis down | `/health/redis` returns non-200 | HIGH | Email |
| High CPU | CPU > 80% for 5 minutes | HIGH | Email |
| High RAM | RAM > 85% for 5 minutes | HIGH | Email |
| High disk usage | Disk > 85% | HIGH | Email |
| High failed login count | > 10 failed logins/minute | MEDIUM | Email |
| High socket disconnect rate | > 20 disconnects/minute | MEDIUM | Email |
| High call failure rate | > 15% call failures over 5 min | HIGH | Email + phone |
| Upload failure spike | > 5 upload failures/minute | MEDIUM | Email |
| SSL expiry | SSL cert expires in < 30 days | HIGH | Email |
| Backup failure | Backup script exits non-zero | HIGH | Email |

---

## 4. Alert Channels

| Channel | Purpose | Recipient |
|---------|---------|-----------|
| Email | All alerts | [admin-email-placeholder@zymi.app] |
| SMS (if configured) | CRITICAL alerts only | [admin-phone-placeholder] |
| In-app admin panel | All alerts (dashboard) | Admin users |

---

## 5. Incident Playbooks

### P-001: Server Down

| Step | Action | Responsible |
|------|--------|-------------|
| 1 | Check server health: `curl https://api.beta.zymi.app/health` | On-call engineer |
| 2 | Check Docker: `docker compose -f docker-compose.prod.yml ps` | On-call engineer |
| 3 | Check logs: `docker compose logs --tail=50 server` | On-call engineer |
| 4 | Restart server: `docker compose restart server` | On-call engineer |
| 5 | If persistent, check resource usage: `top`, `df -h` | On-call engineer |
| 6 | Escalate if root cause not found within 15 minutes | Engineering lead |

### P-002: Database Down

| Step | Action | Responsible |
|------|--------|-------------|
| 1 | Check DB health: `docker compose exec postgres pg_isready -U zymi_user` | On-call engineer |
| 2 | Check logs: `docker compose logs --tail=50 postgres` | On-call engineer |
| 3 | Restart DB: `docker compose restart postgres` | On-call engineer |
| 4 | If DB won't start, check volume integrity | On-call engineer |
| 5 | Restore from latest backup if data corruption | Engineering lead |
| 6 | Escalate if recovery takes > 30 minutes | Engineering lead |

### P-003: Redis Down

| Step | Action | Responsible |
|------|--------|-------------|
| 1 | Check Redis health: `docker compose exec redis redis-cli ping` | On-call engineer |
| 2 | Restart Redis: `docker compose restart redis` | On-call engineer |
| 3 | No persistent data loss (Redis is cache/adapter) | — |
| 4 | Escalate if persistence issues | Engineering lead |

### P-004: SSL Certificate Expired

| Step | Action | Responsible |
|------|--------|-------------|
| 1 | Check cert: `openssl s_client -connect beta.zymi.app:443` | On-call engineer |
| 2 | Run renewal: `docker compose exec nginx certbot renew` | On-call engineer |
| 3 | Reload Nginx: `docker compose exec nginx nginx -s reload` | On-call engineer |
| 4 | Verify HTTPS: `curl -I https://beta.zymi.app` | On-call engineer |
| 5 | If auto-renewal failed, check certbot logs | On-call engineer |

### P-005: High Call Failure Rate

| Step | Action | Responsible |
|------|--------|-------------|
| 1 | Check TURN server: `docker compose logs --tail=20 coturn` (if deployed) | On-call engineer |
| 2 | Check WebRTC logs in server logs | On-call engineer |
| 3 | Check server resource usage | On-call engineer |
| 4 | Temporarily limit concurrent calls if overloaded | Engineering lead |
| 5 | Investigate ICE/STUN/TURN connectivity | Engineering lead |

### P-006: Abuse Report Emergency

| Step | Action | Responsible |
|------|--------|-------------|
| 1 | Review the report in admin panel | Admin moderator |
| 2 | If illegal content: immediately block the offending user | Admin moderator |
| 3 | Preserve evidence (screenshots, logs) | Admin moderator |
| 4 | If required by law, notify authorities | Legal team |
| 5 | Document action taken | Admin moderator |

### P-007: User Data Deletion Request

| Step | Action | Responsible |
|------|--------|-------------|
| 1 | Verify identity of requester | Admin moderator |
| 2 | Execute data deletion: admin panel → user management → delete | Admin moderator |
| 3 | Confirm all user data removed from DB | Admin moderator |
| 4 | If backups contain the data, re-backup after deletion cycle | Engineering lead |
| 5 | Confirm deletion to user within 30 days (legal requirement) | Admin moderator |

### P-008: Admin Account Compromise

| Step | Action | Responsible |
|------|--------|-------------|
| 1 | Immediately disable the compromised admin account | Engineering lead |
| 2 | Revoke all active JWTs for that account | Engineering lead |
| 3 | Review audit logs for malicious actions | Engineering lead |
| 4 | Notify affected users if data was exposed | Engineering lead |
| 5 | Create new admin account for legitimate admin | Engineering lead |
| 6 | Investigate how account was compromised | Security lead |

---

## 6. Monitoring Tools (Recommended)

| Tool | Purpose | Setup Status |
|------|---------|-------------|
| Docker healthchecks | Container health (built-in) | ✅ CONFIGURED in docker-compose.prod.yml |
| `/health` endpoints | Server health | ✅ ACTIVE |
| Uptime Kuma or similar | External uptime monitoring | ⚠️ NEEDS SETUP |
| Prometheus + Grafana | Metrics dashboard | ⚠️ NEEDS SETUP |
| Sentry or similar | Error tracking | ⚠️ NEEDS SETUP |
| cron job for backup | Backup verification | ⚠️ NEEDS SETUP |

---

## 7. Monitoring Implementation Status

| Requirement | Status | Notes |
|-------------|--------|-------|
| Server logs | ⚠️ PLAN | Winston logger needs integration |
| Nginx logs | ⚠️ PLAN | Will be available via Docker |
| Docker logs | ⚠️ BLOCKED | Requires Docker engine |
| PostgreSQL logs | ⚠️ PLAN | Available via Docker |
| Redis logs | ⚠️ PLAN | Available via Docker |
| Socket connection logs | ⚠️ PLAN | Needs structured logging |
| Call failure logs | ⚠️ PLAN | Needs structured logging |
| Error logs | ⚠️ PLAN | Needs error logging middleware |
| Admin audit logs | ⚠️ PLAN | Needs audit trail implementation |
| Backup logs | ⚠️ PLAN | Shown in backup_zymi.sh script |

**Overall Status:** ⚠️ PLAN IN PLACE — Implementation requires deployed infrastructure.
