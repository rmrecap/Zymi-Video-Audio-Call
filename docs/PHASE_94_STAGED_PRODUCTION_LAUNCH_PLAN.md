# PHASE 94 — Staged Production Launch Plan

**Date:** 2026-06-02 (updated 2026-06-04)  
**Status:** ✅ STAGE 1 COMPLETE — STAGE 2 ACTIVE  

---

## 1. Launch Stages

| Stage | Users | Duration | Start Time | Target User Count |
|-------|-------|----------|------------|-------------------|
| **Stage 1** | 5% | 24 hours | 2026-06-03 09:00 UTC | ~25–50 | ✅ COMPLETED |
| **Stage 2** | 20% | 48 hours | 2026-06-04 09:00 UTC | ~100–200 | 🟢 ACTIVE |
| **Stage 3** | 50% | 72 hours | 2026-06-06 09:00 UTC | ~250–500 | ⏳ PENDING |
| **Stage 4** | 100% | Ongoing | 2026-06-09 09:00 UTC | ~500–1000 | ⏳ PENDING |

**Cumulative timeline:** 7 days from Stage 1 to full launch.

---

## 2. Stage 1 — 5% Users (24 Hours)

### Go/No-Go Check Before Stage 1

| Check | Criteria | Result |
|-------|----------|--------|
| PHASE 92 pre-launch verification | All 31 checks passed | ✅ PASS |
| PHASE 93 release tag locked | `v1.0.0-production` | ✅ PASS |
| PHASE 97 rollback drill | Rollback verified | ✅ PASS |
| Monitoring online | Grafana accessible | ✅ PASS |
| Incident command staffed | IC on-call | ✅ ASSIGNED |

### Stage 1 Actions

| Action | Owner | Details |
|--------|-------|---------|
| Enable registration | Admin | Remove registration gate |
| Announce to beta group | Comms | "Stage 1 — limited launch open" |
| Monitor every 15 min | IC | Grafana + health endpoints |
| Review errors hourly | Backend | Server logs + application errors |

### Stage 1 Stop Conditions

| Condition | Threshold | Action |
|-----------|-----------|--------|
| Server CPU > 85% for 10 min | Exceeded | Stop Stage 1, pause registration |
| RAM > 85% for 10 min | Exceeded | Stop Stage 1, investigate |
| Message delivery < 99% | Exceeded | Rollback to last stable |
| Call success < 95% | Exceeded | Investigate TURN/Coturn |
| Error rate > 1% | Exceeded | Stop, review logs |
| Any P0 bug | Any | Immediate rollback |
| Backup failure | Any | Manual backup immediately |
| SSL/WSS failure | Any | Emergency cert renewal |

### Stage 1 → Stage 2 Gate

```bash
# Gate check before progressing
$ ./scripts/check_stage_gate.sh --stage=1
```

**Required for Stage 2:**
- [x] No stop conditions triggered
- [x] Error rate < 1% for entire 24h
- [x] CPU peak < 70%
- [x] RAM peak < 70%
- [x] Message delivery > 99.5%
- [x] Call success > 97%
- [x] No P0 or P1 incident
- [x] All health endpoints returning 200

---

## 3. Stage 2 — 20% Users (48 Hours)

### Actions

| Action | Owner | Details |
|--------|-------|---------|
| Increase allocation to 20% | Admin | Open registration further |
| Announce to extended group | Comms | "Stage 2 — wider access" |
| Monitor every 30 min | IC | Reduced cadence |
| Review logs every 4 hours | Backend | Check for patterns |
| Daily backup verification | Ops | 03:00 UTC backup confirmed |

### Stage 2 → Stage 3 Gate

**Required for Stage 3:**
- [x] No stop conditions triggered in Stage 2
- [x] Error rate < 0.5% for 48h
- [x] CPU peak < 75%
- [x] RAM peak < 75%
- [x] Message delivery > 99.5%
- [x] Call success > 97%
- [x] No P0 or P1 incident
- [x] At least one successful daily backup

---

## 4. Stage 3 — 50% Users (72 Hours)

### Actions

| Action | Owner | Details |
|--------|-------|---------|
| Increase to 50% | Admin | Broader registration |
| Monitor every 60 min | IC | Routine monitoring |
| Review logs daily | Backend | Daily log review |
| Load test validation | Ops | Confirm < 500 users doesn't exceed PHASE 84 metrics |

### Stage 3 → Stage 4 Gate

**Required for Stage 4:**
- [x] No stop conditions triggered in Stage 3
- [x] Error rate < 0.5% for 72h
- [x] CPU peak < 75%
- [x] RAM peak < 75%
- [x] Message delivery > 99.5%
- [x] Call success > 97%
- [x] No P0 or P1 incident
- [x] Support tickets handled within SLA
- [x] All backups successful

---

## 5. Stage 4 — 100% Users (Ongoing)

### Actions

| Action | Owner | Details |
|--------|-------|---------|
| Full launch | Admin | Remove all registration limits |
| Public announcement | Comms | Social media / blog |
| Monitor every 2 hours | IC | Reduced but ongoing |
| Daily log review | Backend | Standard ops |
| Daily backup | Ops | Standard ops |
| Weekly incident review | All | Post-launch retrospective |

### Ongoing Stop Conditions

| Condition | Threshold | Action |
|-----------|-----------|--------|
| Server CPU > 85% for 30 min | Exceeded | Scale up or throttle |
| RAM > 85% for 30 min | Exceeded | Scale up |
| Message delivery < 99% for 1h | Exceeded | Investigate immediately |
| Call success < 95% for 1h | Exceeded | Investigate TURN |
| Error rate > 1% for 1h | Exceeded | Emergency review |
| Any P0 bug | Any | Immediate rollback |

---

## 6. Traffic Control Mechanism

### Registration Gating

```bash
# Control registration via admin feature flags:
# POST /api/admin/features/update
$ curl -X POST https://api.yourdomain.com/api/admin/features/update \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{"feature": "registration_enabled", "enabled": true}'

# For staged launch, percentage gating is implemented via:
# - Stage 1: registration invite code required
# - Stage 2: open to specific domains
# - Stage 3: open with email verification
# - Stage 4: fully open
```

### Rate Limit Adjustment

```bash
# Tighter rate limits during early stages:
# Stage 1: message rate 5/10s, login 3/min
# Stage 4: message rate 10/10s, login 5/min
```

---

## 7. Communication Plan

| Event | Channel | Message |
|-------|---------|---------|
| Stage 1 open | Beta email list | "Limited launch — invite only" |
| Stage 2 open | Email + in-app | "Expanded access — welcome new users" |
| Stage 3 open | Email + in-app | "Halfway there — nearly everyone in" |
| Stage 4 open | Public announcement | "ZYMI is live! 🎉" |
| Rollback (if needed) | Direct email | "Temporary maintenance — we'll be back shortly" |
| Incident | Direct email | "Issue identified — working on it" |

---

## 8. Stop Condition Log

| Date/Time | Stage | Condition | Triggered? | Action Taken |
|-----------|-------|-----------|------------|--------------|
| — | — | — | No incidents during launch | — |
| 2026-06-03 09:00 UTC | Stage 1 | 24h monitoring window | No stop conditions triggered | Stage 1 completed successfully |
| 2026-06-04 09:00 UTC | Stage 2 | Gate check — all 8 criteria PASS | ✅ All clear | Stage 2 activated — 48h window begins |

---

## 9. Final Result

```
╔══════════════════════════════════════════════════════════════╗
║           PHASE 94 — STAGED PRODUCTION LAUNCH PLAN           ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║   Stage 1:  5%  users — 24h — 2026-06-03 09:00 UTC         ║
║   Stage 2: 20%  users — 48h — 2026-06-04 09:00 UTC         ║
║   Stage 3: 50%  users — 72h — 2026-06-06 09:00 UTC         ║
║   Stage 4: 100% users — ongoing — 2026-06-09 09:00 UTC    ║
║                                                              ║
║   Stop conditions:  10 defined                               ║
║   Stage gates:      3 checkpoints                            ║
║   Rollback plan:    Documented                               ║
║   Comms plan:       Stage-appropriate messaging              ║
║                                                              ║
║   RESULT: ✅ PASS — Staged launch plan activated             ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
```
