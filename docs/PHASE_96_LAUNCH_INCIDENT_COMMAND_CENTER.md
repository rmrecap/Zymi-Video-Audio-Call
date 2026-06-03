# PHASE 96 — Launch Incident Command Center

**Date:** 2026-06-02  
**Status:** ✅ ACTIVATED  

---

## 1. Incident Roles

| Role | Owner | Responsibilities | Backup |
|------|-------|-----------------|--------|
| **Incident Commander (IC)** | Infrastructure Lead | Overall incident response coordination, Go/No-Go decisions, escalation management | DevOps |
| **Backend Owner** | Backend Lead | Server code, Socket.io, message delivery, WebRTC signaling | Senior Dev |
| **Infrastructure Owner** | DevOps | Docker, PostgreSQL, Redis, Nginx, Coturn, monitoring | IC |
| **Mobile Owner** | Mobile Lead | Android APK, Flutter issues, mobile-specific bugs | Backend Owner |
| **Support Owner** | Support Lead | User tickets, abuse reports, communication with users | IC |
| **Communications Owner** | Product Lead | Public status updates, user announcements, escalation messaging | Support Owner |

---

## 2. Incident Severity Levels

| Severity | Label | Definition | Response Time | Example |
|----------|-------|------------|---------------|---------|
| **SEV0** | 🔴 Critical | Total outage, data loss, security breach | 15 min | All users cannot access app, database deleted, credentials leaked |
| **SEV1** | 🟠 High | Core feature broken (login, chat, calls) | 30 min | Cannot login, messages not delivered, calls not connecting |
| **SEV2** | 🟡 Medium | Degraded performance, non-critical feature broken | 2 hours | Slow message delivery, profile update failing, upload failing |
| **SEV3** | 🔵 Low | Minor issue, cosmetic, enhancement request | 24 hours | UI alignment, typo in copy, feature request |

---

## 3. Escalation Path

### SEV0 — Critical

```
User reports outage
  → Support Owner confirms (5 min)
  → IC notified (5 min)
  → IC declares SEV0 (5 min)
  → All owners assemble in incident channel
  → Decision: rollback, restore, or fix forward
  → Communications Owner sends user notification
  → Resolution target: < 1 hour
  → Post-mortem required
```

### SEV1 — High

```
User reports issue
  → Support Owner triages (10 min)
  → Relevant owner assigned (10 min)
  → Owner investigates (30 min)
  → IC informed
  → Fix deployed or workaround provided
  → Resolution target: < 4 hours
  → Post-mortem recommended
```

### SEV2 — Medium

```
User reports issue
  → Support Owner triages (30 min)
  → Owner assigned (1 hour)
  → Fix in next deployment cycle
  → Resolution target: < 48 hours
```

### SEV3 — Low

```
User reports issue
  → Logged in tracker
  → Scheduled for next release
  → Resolution target: < 2 weeks
```

---

## 4. Response Times

| Severity | First Response | Investigation | Resolution | Status |
|----------|---------------|---------------|------------|--------|
| SEV0 | 5 min | 15 min | 60 min | ✅ DOCUMENTED |
| SEV1 | 15 min | 30 min | 4 hours | ✅ DOCUMENTED |
| SEV2 | 30 min | 2 hours | 48 hours | ✅ DOCUMENTED |
| SEV3 | 2 hours | 1 day | 2 weeks | ✅ DOCUMENTED |

---

## 5. Rollback Triggers

| Condition | Severity | Action | Owner |
|-----------|----------|--------|-------|
| Server CPU > 85% for 10 min | SEV2 | Scale up or throttle registration | IC |
| Message delivery < 99% for 10 min | SEV1 | Investigate queue, rollback if needed | Backend |
| Call success < 95% for 10 min | SEV1 | Investigate TURN/Coturn | Backend |
| Error rate > 1% for 10 min | SEV1 | Investigate, rollback if not immediately fixable | Backend |
| Any SEV0 condition | SEV0 | **Immediate rollback** | IC |
| Data loss detected | SEV0 | **Immediate rollback + restore from backup** | IC |

---

## 6. Emergency Commands Quick Reference

```bash
# ============================================================
# EMERGENCY COMMANDS — LAUNCH INCIDENT COMMAND CENTER
# ============================================================

# 1. RESTART SERVER (quick recovery)
docker compose -f docker-compose.prod.yml restart server-a server-b

# 2. ROLLBACK RELEASE
git checkout v1.0.0-production
docker compose -f docker-compose.prod.yml up -d --build

# 3. RESTORE DATABASE (from latest backup)
docker cp /opt/zymi/backups/$(ls -t /opt/zymi/backups/ | head -1) qibo-postgres-prod:/tmp/latest.dump
docker exec qibo-postgres-prod pg_restore -U zymi_user -d zymi_db --clean --if-exists /tmp/latest.dump

# 4. BLOCK ABUSIVE USER (admin API)
curl -X POST https://api.yourdomain.com/api/admin/ban \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"userId": <id>, "reason": "Abuse — emergency ban"}'

# 5. PAUSE REGISTRATION (feature flag)
curl -X POST https://api.yourdomain.com/api/admin/features/update \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"feature": "registration_enabled", "enabled": false}'

# 6. CHECK ALL CONTAINERS
docker compose -f docker-compose.prod.yml ps

# 7. CHECK RESOURCES
docker stats --no-stream

# 8. CHECK LOGS
docker compose -f docker-compose.prod.yml logs --tail=100 server-a
docker compose -f docker-compose.prod.yml logs --tail=100 server-b
docker compose -f docker-compose.prod.yml logs --tail=50 nginx
docker compose -f docker-compose.prod.yml logs --tail=50 postgres
```

---

## 7. User Communication Templates

### SEV0 — Total Outage

```
Subject: [ZYMI] Service interruption

We are currently experiencing a critical service interruption.
Our team has been notified and is actively working on resolution.

Expected resolution: within 60 minutes.

We apologize for the inconvenience.

— ZYMI Operations Team
```

### SEV1 — Core Feature Degraded

```
Subject: [ZYMI] Degraded service

Some ZYMI features may be temporarily unavailable or slow.
We have identified the issue and are working on a fix.

Expected resolution: within 4 hours.

Thank you for your patience.

— ZYMI Operations Team
```

### All Clear

```
Subject: [ZYMI] Service restored

The issue has been resolved and all services are operating normally.

If you continue to experience problems, please contact support.

Thank you for your patience.

— ZYMI Operations Team
```

---

## 8. Incident Channel

| Platform | Channel | Purpose |
|----------|---------|---------|
| Internal chat | `#zymi-incidents` | Real-time incident coordination |
| Internal chat | `#zymi-ops` | Daily operations |
| User comms | Email | User notifications |
| User comms | In-app banner | Critical outage notification |

---

## 9. Post-Incident Process

| Step | Owner | Timeline |
|------|-------|----------|
| Incident declared | IC | T+0 |
| Fix deployed | Relevant owner | Per SLA |
| All-clear sent | Comms | T+ resolution |
| Post-mortem scheduled | IC | Within 48 hours |
| Root cause analysis | All owners | Within 72 hours |
| Action items tracked | IC | Within 1 week |

---

## 10. Final Result

```
╔══════════════════════════════════════════════════════════════╗
║        PHASE 96 — LAUNCH INCIDENT COMMAND CENTER            ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║   Roles defined:   6 (IC, Backend, Infra, Mobile,           ║
║                      Support, Comms)                        ║
║   Severity levels: 4 (SEV0–SEV3)                            ║
║   Escalation path: Documented per severity                  ║
║   Response times:  5 min–2 hours depending on severity      ║
║   Rollback triggers: 6 conditions defined                   ║
║   Emergency commands: 8 quick-reference commands            ║
║   Comms templates: 3 templates (outage, degraded, all-clear)║
║   Post-incident: Process documented                         ║
║                                                              ║
║   RESULT: ✅ PASS — Incident command center activated        ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
```
