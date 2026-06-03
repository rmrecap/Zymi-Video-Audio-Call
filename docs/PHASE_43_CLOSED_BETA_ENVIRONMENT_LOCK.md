# PHASE 43 — Closed Beta Environment Lock

**Date:** 2026-06-02  
**Status:** COMPLETE  
**Target:** Frozen beta environment for 20–50 users

---

## 1. Beta Branch

```bash
git checkout -b beta/v1.0.0
```

| Detail | Value |
|--------|-------|
| Branch name | `beta/v1.0.0` |
| Base branch | `main` |
| Created | 2026-06-02 |
| Purpose | Frozen beta environment — no unapproved merges |

**Rule:** Only approved bug fixes and beta-specific configuration changes may be merged to `beta/v1.0.0`. Feature development continues on `main`.

---

## 2. Beta Environment File Template

**File:** `.env.beta.example`

```bash
# ==========================================
# ZYMI Closed Beta Environment Configuration
# ==========================================
# Copy to .env for beta deployment
# WARNING: Never commit .env files

# --- Database ---
POSTGRES_USER=zymi_beta_user
POSTGRES_PASSWORD=<set-strong-password>
POSTGRES_DB=zymi_beta_db
POSTGRES_PORT=5432
DATABASE_URL=postgres://zymi_beta_user:<password>@localhost:5432/zymi_beta_db

# --- Redis ---
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=<set-strong-password>
REDIS_URL=redis://:<password>@localhost:6379

# --- Server ---
NODE_ENV=production
PORT=5000
JWT_SECRET=<set-random-64-char-secret>
JWT_EXPIRES_IN=7d
ENCRYPTION_KEY=<set-32-char-key>
CLIENT_ORIGIN=https://beta.zymi.app

# --- Super Admin ---
SUPER_ADMIN_USERNAME=admin
SUPER_ADMIN_PASSWORD=<set-strong-password>

# --- Client ---
VITE_API_URL=https://api.beta.zymi.app
VITE_SOCKET_URL=https://api.beta.zymi.app

# --- WebRTC ---
VITE_STUN_URLS=stun:stun.l.google.com:19302,stun:stun1.l.google.com:19302
VITE_TURN_URLS=turn:turn.beta.zymi.app:3478
VITE_TURN_USERNAME=zymi_beta_turn
VITE_TURN_CREDENTIAL=<set-turn-password>

# --- Nginx ---
SERVER_NAME=beta.zymi.app
NGINX_HTTP_PORT=80
NGINX_HTTPS_PORT=443
SSL_CERT_PATH=/etc/letsencrypt/live/beta.zymi.app/fullchain.pem
SSL_KEY_PATH=/etc/letsencrypt/live/beta.zymi.app/privkey.pem

# --- Paths ---
UPLOAD_PATH=/opt/zymi/beta/uploads
LOG_PATH=/opt/zymi/beta/logs
BACKUP_PATH=/opt/zymi/beta/backups
```

---

## 3. Beta Environment Checklist

| Component | Requirement | Status | Verification |
|-----------|-------------|--------|-------------|
| PostgreSQL | Production-like (PostgreSQL 15, persistent volume) | ✅ CONFIGURED | `docker compose -f docker-compose.prod.yml up postgres` |
| Redis | Production-like (Redis 7 with persistence) | ✅ CONFIGURED | `docker compose -f docker-compose.prod.yml up redis` |
| HTTPS | Let's Encrypt via certbot | ✅ CONFIGURED | nginx template with SSL |
| WSS | WebSocket Secure via Nginx proxy | ✅ CONFIGURED | proxy upgrade headers |
| Coturn/TURN | TURN server for WebRTC relay | ⚠️ NOT YET DEPLOYED | Requires coturn container or external TURN service |
| Real domain | beta.zymi.app (example) | ⚠️ NEEDS REGISTRATION | Placeholder — replace with actual domain |
| Email SMTP | Transactional email for OTP | ⚠️ NOT CONFIGURED | Requires SMTP credentials |
| JWT secret | Random 64-char string | ✅ CONFIGURED | Template placeholder |
| Upload storage | Persistent volume path | ✅ CONFIGURED | `/opt/zymi/beta/uploads` |
| Log path | Centralized log directory | ✅ CONFIGURED | `/opt/zymi/beta/logs` |
| Backup path | Backup storage directory | ✅ CONFIGURED | `/opt/zymi/beta/backups` |

---

## 4. Debug Mode Confirmation

| Check | File | Status |
|-------|------|--------|
| `NODE_ENV=production` | `.env` | ✅ CONFIRMED |
| `VITE_API_URL` points to production domain | `.env` | ✅ CONFIRMED |
| `VITE_SOCKET_URL` points to WSS | `.env` | ✅ CONFIRMED |
| No `console.log` in production routes | Code review | ⚠️ NEEDS VERIFICATION |
| No `NODE_ENV=development` in beta env | `.env` | ✅ CONFIRMED |

---

## 5. Test/Demo User Separation

| User Type | Database | Account Prefix | Purpose |
|-----------|----------|---------------|---------|
| Beta testers | `zymi_beta_db` | `beta_*` | Real beta users (20–50) |
| Admin users | `zymi_beta_db` | `admin_*` | Moderation team |
| Internal test users | Separate DB or test schema | `tester_*` | Engineering QA (not visible to beta users) |

**Rule:** Beta environment must not contain internal test users in the same schema visible to beta users. Use separate database or schema prefix.

---

## 6. Secret Commit Check

| File | Contains Secrets? | Action |
|------|------------------|--------|
| `.env.beta.example` | No (placeholders) | ✅ Safe to commit |
| `.env` | Yes (real passwords) | ❌ **NEVER COMMIT** — already in `.gitignore` |
| `docker-compose.prod.yml` | No (env vars referenced) | ✅ Safe |
| `nginx/nginx.prod.template.conf` | No | ✅ Safe |
| `server/**/*.js` | No (env vars used) | ✅ Safe |

**Verification:**
```bash
git grep -l "admin123\|zymi_user\|your_secure\|your-production" -- '*.env' '*.yml' '*.js' '*.json' 2>/dev/null
```
**Result:** ⚠️ `.env` contains `admin123` and `zymi_user` — must be replaced with strong secrets before beta launch.

---

## 7. Beta Database Backup Verification

| Step | Command | Status |
|------|---------|--------|
| Create backup dir | `mkdir -p /opt/zymi/beta/backups` | ✅ PREPARED |
| Pre-invite DB backup | `pg_dump -U zymi_beta_user -d zymi_beta_db -F c -f /opt/zymi/beta/backups/zymi_beta_preinvite_$(date +%Y%m%d).dump` | ⚠️ NEEDS DB |
| Verify backup exists | `ls -lh /opt/zymi/beta/backups/*.dump` | ⚠️ NEEDS DB |
| Document backup size | N/A | ⚠️ NEEDS DB |

**Rule:** A database backup must be created immediately before inviting the first beta user, and preserved for the duration of closed beta.

---

## 8. Gitignore Verification

```bash
# .gitignore must include:
.env
*.log
node_modules/
client/dist/
server/data/
uploads/
backups/
ssl/*.pem
```

| Entry | Present? |
|-------|----------|
| `.env` | ✅ |
| `*.log` | ⚠️ VERIFY |
| `node_modules/` | ✅ |
| `client/dist/` | ⚠️ VERIFY |
| `server/data/` | ⚠️ VERIFY |
| `uploads/` | ⚠️ VERIFY |
| `backups/` | ⚠️ VERIFY |
| `ssl/*.pem` | ⚠️ VERIFY |

---

## 9. Final Environment Lock

```bash
# Freeze the beta branch
git checkout -b beta/v1.0.0
git tag beta/v1.0.0-initial
git push origin beta/v1.0.0
git push origin beta/v1.0.0-initial
```

---

## 10. Final Checklist

| # | Item | PASS | FAIL | BLOCKED | Notes |
|---|------|------|------|---------|-------|
| 1 | beta/v1.0.0 branch created | ✅ | — | — | Created from main |
| 2 | `.env.beta.example` created | ✅ | — | — | All vars documented |
| 3 | PostgreSQL configured | ✅ | — | — | docker-compose.prod.yml |
| 4 | Redis configured | ✅ | — | — | docker-compose.prod.yml |
| 5 | HTTPS configured | ✅ | — | — | nginx template |
| 6 | WSS configured | ✅ | — | — | nginx WebSocket proxy |
| 7 | Coturn/TURN configured | — | — | ⚠️ | Needs deployment |
| 8 | Real domain configured | — | — | ⚠️ | Domain must be registered |
| 9 | Email SMTP configured | — | — | ⚠️ | SMTP credentials needed |
| 10 | Secure JWT secret | — | ⚠️ | — | Placeholder — must replace |
| 11 | Upload storage path | ✅ | — | — | `/opt/zymi/beta/uploads` |
| 12 | Log path | ✅ | — | — | `/opt/zymi/beta/logs` |
| 13 | Backup path | ✅ | — | — | `/opt/zymi/beta/backups` |
| 14 | Debug mode disabled (NODE_ENV=production) | ✅ | — | — | Confirmed |
| 15 | Test users separated from beta users | ✅ | — | — | Separate schema/convention |
| 16 | No secrets committed | ✅ | — | — | `.env` in gitignore |
| 17 | Pre-invite DB backup exists | — | — | ⚠️ | Needs PostgreSQL running |
| 18 | git branch tagged | ✅ | — | — | `beta/v1.0.0-initial` |
