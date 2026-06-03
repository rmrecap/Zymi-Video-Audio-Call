# Phase 29 — Production Server Dry Run Report

> **STATUS:** ⚠️ DRY RUN TEMPLATE — NOT YET EXECUTED
>
> This document is a **template/plan** for the production server dry run. No production server has been provisioned or tested. Every row below is incomplete until the checklist is executed against a real server.

---

## 1. DNS & Networking

| # | Category | Item | Verification Command / Procedure | Expected Result | Actual Result | Pass/Fail | Notes / Screenshots |
|---|----------|------|----------------------------------|----------------|---------------|-----------|---------------------|
| 1.1 | DNS & Networking | Domain DNS A record resolves to server IP | `nslookup app.zymi.com` or `dig +short app.zymi.com` | Returns server IPv4 address | | | |
| 1.2 | DNS & Networking | Domain DNS AAAA record (IPv6) resolves | `nslookup -type=AAAA app.zymi.com` or `dig +short AAAA app.zymi.com` | Returns server IPv6 address or NXDOMAIN if not configured | | | |
| 1.3 | DNS & Networking | Reverse DNS (PTR record) | `nslookup <server-ip>` | PTR hostname matches `app.zymi.com` | | | |
| 1.4 | DNS & Networking | Port 80 (HTTP) reachable from external | `nc -zv <server-ip> 80` from external host, or `curl -I http://app.zymi.com` | TCP connected, HTTP response received | | | |
| 1.5 | DNS & Networking | Port 443 (HTTPS) reachable from external | `nc -zv <server-ip> 443` from external host, or `curl -I https://app.zymi.com` | TCP connected, HTTPS response received | | | |
| 1.6 | DNS & Networking | Port 3478 (TURN/STUN) reachable | `nc -zv <server-ip> 3478` from external host | TCP connected | | | |
| 1.7 | DNS & Networking | All other ports closed (5432, 6379, 5000 internal only) | `nmap -p 5432,6379,5000 <server-ip>` from external host | All filtered / closed | | | |

---

## 2. SSL/TLS

| # | Category | Item | Verification Command / Procedure | Expected Result | Actual Result | Pass/Fail | Notes / Screenshots |
|---|----------|------|----------------------------------|----------------|---------------|-----------|---------------------|
| 2.1 | SSL/TLS | HTTPS certificate issued (Let's Encrypt) | `openssl s_client -connect app.zymi.com:443 -servername app.zymi.com </dev/null 2>/dev/null \| openssl x509 -noout -issuer -subject -dates` | Issuer = Let's Encrypt, certificate dates valid | | | |
| 2.2 | SSL/TLS | Certificate valid for >30 days | `openssl x509 -in /etc/letsencrypt/live/app.zymi.com/fullchain.pem -noout -enddate` | Expiry > 30 days from today | | | |
| 2.3 | SSL/TLS | TLS 1.3 only enabled | `nmap --script ssl-enum-ciphers -p 443 app.zymi.com` | TLS 1.3 offered, TLS 1.2 / earlier disabled | | | |
| 2.4 | SSL/TLS | HSTS header present | `curl -sI https://app.zymi.com \| grep -i strict-transport-security` | `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload` | | | |
| 2.5 | SSL/TLS | OCSP stapling working | `openssl s_client -connect app.zymi.com:443 -servername app.zymi.com -tlsextdebug -status 2>/dev/null \| grep -A 5 "OCSP response"` | `OCSP Response Status: successful` | | | |
| 2.6 | SSL/TLS | Certificate chain complete (no missing intermediate) | `openssl s_client -connect app.zymi.com:443 -servername app.zymi.com -showcerts 2>/dev/null \| grep "s:"` | Full chain presented (server → intermediate → root) | | | |

---

## 3. Nginx

| # | Category | Item | Verification Command / Procedure | Expected Result | Actual Result | Pass/Fail | Notes / Screenshots |
|---|----------|------|----------------------------------|----------------|---------------|-----------|---------------------|
| 3.1 | Nginx | Reverse proxy to server container | `curl -sI https://app.zymi.com/api/health` | 200 OK, proxied from container (no nginx error) | | | |
| 3.2 | Nginx | WebSocket upgrade (WSS) working | Use wscat or browser DevTools to connect `wss://app.zymi.com` | 101 Switching Protocols, frames exchanged | | | |
| 3.3 | Nginx | Static asset serving | `curl -sI https://app.zymi.com/assets/app.js \| head -n 1` | 200 OK, `Content-Type: application/javascript` | | | |
| 3.4 | Nginx | Gzip compression enabled | `curl -sH "Accept-Encoding: gzip" -o /dev/null -w "%{size_download}" https://app.zymi.com/` | Compressed size < uncompressed; `Content-Encoding: gzip` in response | | | |
| 3.5 | Nginx | Rate limiting configured | Send 100+ rapid requests; check `curl -s -o /dev/null -w "%{http_code}"` | 429 Too Many Requests after threshold exceeded | | | |
| 3.6 | Nginx | Security headers present | `curl -sI https://app.zymi.com \| grep -iE "content-security-policy|x-frame-options|x-content-type-options|x-xss-protection|referrer-policy"` | All required headers present | | | |
| 3.7 | Nginx | HTTP → HTTPS redirect working | `curl -sI http://app.zymi.com \| grep -i location` | 301 Moved Permanently → `https://app.zymi.com` | | | |
| 3.8 | Nginx | 404/502 error pages configured | `curl -s http://app.zymi.com/nonexistent-page` | Custom branded error page, not nginx default | | | |

---

## 4. Docker Production Stack

| # | Category | Item | Verification Command / Procedure | Expected Result | Actual Result | Pass/Fail | Notes / Screenshots |
|---|----------|------|----------------------------------|----------------|---------------|-----------|---------------------|
| 4.1 | Docker | `docker compose -f docker-compose.prod.yml config` validates | `docker compose -f docker-compose.prod.yml config` | Exits 0, valid YAML output | | | |
| 4.2 | Docker | All containers start without error | `docker compose -f docker-compose.prod.yml up -d` | All containers exit 0, no crash loops visible | | | |
| 4.3 | Docker | All containers show "healthy" status | `docker compose -f docker-compose.prod.yml ps` | All services show `healthy` or `running (healthy)` | | | |
| 4.4 | Docker | No port conflicts between containers | `docker compose -f docker-compose.prod.yml port <service> <internal_port>` | Each service binds to its expected port; no `port already allocated` errors | | | |
| 4.5 | Docker | Volume mounts accessible | `docker exec <container> ls -la <mount-path>` | Expected files/directories present and readable | | | |
| 4.6 | Docker | Non-root user enforcement | `docker exec <container> whoami` | All containers run as non-root (e.g. `node`, `app`, `nobody`) | | | |
| 4.7 | Docker | Container restart policy verified | `docker compose -f docker-compose.prod.yml ps --format "table {{.Name}}\t{{.RestartPolicy}}"` | All set to `always`, `unless-stopped`, or `on-failure` | | | |

---

## 5. PostgreSQL

| # | Category | Item | Verification Command / Procedure | Expected Result | Actual Result | Pass/Fail | Notes / Screenshots |
|---|----------|------|----------------------------------|----------------|---------------|-----------|---------------------|
| 5.1 | PostgreSQL | Database accessible | `docker exec <db-container> pg_isready -U <user>` | `server accepting connections` | | | |
| 5.2 | PostgreSQL | Migrations applied | `docker exec <app-container> npx prisma migrate status` (or equivalent) | All migrations applied; no pending migrations | | | |
| 5.3 | PostgreSQL | Connection pool working | Check application logs for pool metrics; `SELECT count(*) FROM pg_stat_activity WHERE state = 'active'` | Pool connections established, queries succeed | | | |
| 5.4 | PostgreSQL | `max_connections` set correctly | `docker exec <db-container> psql -U <user> -c "SHOW max_connections;"` | Value matches docker-compose/env config (e.g. 100) | | | |
| 5.5 | PostgreSQL | Health endpoint /health/db returns 200 | `curl -s -o /dev/null -w "%{http_code}" https://app.zymi.com/health/db` | `200` | | | |
| 5.6 | PostgreSQL | WAL archiving configured (if applicable) | `docker exec <db-container> psql -U <user> -c "SHOW archive_mode;"` | `on` (or `off` if archiving is not used) | | | |

---

## 6. Redis

| # | Category | Item | Verification Command / Procedure | Expected Result | Actual Result | Pass/Fail | Notes / Screenshots |
|---|----------|------|----------------------------------|----------------|---------------|-----------|---------------------|
| 6.1 | Redis | Redis accessible | `docker exec <redis-container> redis-cli ping` | `PONG` | | | |
| 6.2 | Redis | Pub/sub working (Socket.io adapter) | Publish to a test channel from one client, subscribe from another | Message is delivered to all subscribers | | | |
| 6.3 | Redis | AOF persistence configured | `docker exec <redis-container> redis-cli CONFIG GET appendonly` | `appendonly yes` | | | |
| 6.4 | Redis | Memory limit set | `docker exec <redis-container> redis-cli CONFIG GET maxmemory` | Returns value matching docker-compose config (e.g. `512mb`) | | | |
| 6.5 | Redis | Health endpoint /health/redis returns 200 | `curl -s -o /dev/null -w "%{http_code}" https://app.zymi.com/health/redis` | `200` | | | |
| 6.6 | Redis | Key eviction policy set | `docker exec <redis-container> redis-cli CONFIG GET maxmemory-policy` | `allkeys-lru` or appropriate policy for Socket.io | | | |

---

## 7. Coturn TURN/STUN

| # | Category | Item | Verification Command / Procedure | Expected Result | Actual Result | Pass/Fail | Notes / Screenshots |
|---|----------|------|----------------------------------|----------------|---------------|-----------|---------------------|
| 7.1 | Coturn | STUN binding works (external IP detected) | `turnutils_uclient -v -t -z <server-ip>` or WebRTC trickle ICE test | External IP address returned in STUN response | | | |
| 7.2 | Coturn | TURN relay works (media relays through server) | `turnutils_uclient -v -t -T -y -u <user> -w <pass> <server-ip>` | Allocation successful, relay starts | | | |
| 7.3 | Coturn | Authentication works (long-term credential) | Connection with wrong credentials is rejected | `401 Unauthorized` for invalid credentials; `Allocation success` for valid ones | | | |
| 7.4 | Coturn | Port 3478 open | `nc -zv <server-ip> 3478` | TCP/UDP connected | | | |
| 7.5 | Coturn | Port range 49152-65535 open for relay | `nmap -p 49152-65535 <server-ip>` (sample check) | Range reachable (may need selective scan) | | | |

---

## 8. Health Endpoints

| # | Category | Item | Verification Command / Procedure | Expected Result | Actual Result | Pass/Fail | Notes / Screenshots |
|---|----------|------|----------------------------------|----------------|---------------|-----------|---------------------|
| 8.1 | Health | GET /health → 200, status: "ok" | `curl -s https://app.zymi.com/health` | `{"status":"ok"}` | | | |
| 8.2 | Health | GET /health/db → 200, connected: true | `curl -s https://app.zymi.com/health/db` | `{"connected":true}` or `{"status":"ok","database":"connected"}` | | | |
| 8.3 | Health | GET /health/redis → 200, connected: true | `curl -s https://app.zymi.com/health/redis` | `{"connected":true}` or `{"status":"ok","redis":"connected"}` | | | |
| 8.4 | Health | GET /health/realtime → 200, connectedClients >= 0 | `curl -s https://app.zymi.com/health/realtime` | `{"connectedClients":0}` or valid count | | | |
| 8.5 | Health | GET /api/health/auth → 200 | `curl -s -o /dev/null -w "%{http_code}" https://app.zymi.com/api/health/auth` | `200` | | | |
| 8.6 | Health | GET /api/health/otp → 200 | `curl -s -o /dev/null -w "%{http_code}" https://app.zymi.com/api/health/otp` | `200` | | | |
| 8.7 | Health | GET /api/health/email → 200 | `curl -s -o /dev/null -w "%{http_code}" https://app.zymi.com/api/health/email` | `200` | | | |

---

## 9. Operations

| # | Category | Item | Verification Command / Procedure | Expected Result | Actual Result | Pass/Fail | Notes / Screenshots |
|---|----------|------|----------------------------------|----------------|---------------|-----------|---------------------|
| 9.1 | Operations | Log rotation configured (PM2 and Docker) | `cat /etc/logrotate.d/docker-containers` (or pm2 config) | Logrotate config present with weekly/daily rotation | | | |
| 9.2 | Operations | Backup volume mounted and writable | `docker exec <app-container> touch /backup/test.txt` | File created, no permission errors | | | |
| 9.3 | Operations | Backup pg_dump works | `docker exec <db-container> pg_dump -U <user> -d <db> -f /backup/dump.sql` | SQL dump file created, no errors | | | |
| 9.4 | Operations | Restore from backup tested | Restore dump into fresh test database, run migrations check | Data intact, no data loss | | | |
| 9.5 | Operations | Firewall rules applied | `iptables -L -n` (or `ufw status`) on host | Only ports 80, 443, 3478 open to 0.0.0.0/0; all others restricted | | | |
| 9.6 | Operations | Environment variables set correctly | `docker exec <app-container> env \| grep -E "DATABASE_URL|REDIS_URL|JWT_SECRET|NODE_ENV"` | All required vars present, `NODE_ENV=production` | | | |
| 9.7 | Operations | Secrets not hardcoded in docker-compose | `grep -E "(password|secret|key)\s*:" docker-compose.prod.yml` | No secrets in plain text; `${VAR}` or Docker secrets used | | | |
| 9.8 | Operations | Database migration reversible | Run `prisma migrate down` (or equivalent) on a non-prod DB | Migration rolls back cleanly; data integrity preserved | | | |

---

## 10. Resilience

| # | Category | Item | Verification Command / Procedure | Expected Result | Actual Result | Pass/Fail | Notes / Screenshots |
|---|----------|------|----------------------------------|----------------|---------------|-----------|---------------------|
| 10.1 | Resilience | Zero-downtime restart works (SIGINT handling) | Send `docker kill -s SIGINT <app-container>` while load test running | Graceful shutdown; new container starts; zero 5xx responses | | | |
| 10.2 | Resilience | Nginx reload works (no dropped connections) | `nginx -s reload` while serving traffic | Config reloads; no connections dropped; 0% error rate | | | |
| 10.3 | Resilience | SSL renewal simulation | `certbot renew --dry-run` | `Dry run: SUCCESS` | | | |
| 10.4 | Resilience | Server reboot recovery | `shutdown -r now` on production server | All containers auto-start; services healthy within 60s | | | |
| 10.5 | Resilience | Process crash recovery (Docker restart policy) | `docker kill <app-container>` and observe | Container restarted automatically by Docker daemon < 5s | | | |

---

## Verdict

| Metric | Result |
|--------|--------|
| **Execution Status** | ❌ NOT EXECUTED — This is a dry run template |
| **Total Items** | 56 |
| **Passed** | 0 |
| **Failed** | 0 |
| **Not Tested** | 56 |
| **Score** | **0 / 56 (0%)** |
| **Go/No-Go** | **NO-GO** — No production server has been provisioned or tested. This document is a plan, not an executed report. |

This dry run **template** documents all 56 verification items across 10 categories that must pass before declaring the ZYMI production server ready. No tests have been executed; no production server has been deployed.

### Recommended Order of Execution

1. **DNS & Networking (section 1)** — Confirm the server is reachable before anything else.
2. **SSL/TLS (section 2)** — Certificates must be valid for HTTPS tests.
3. **Nginx (section 3)** — Reverse proxy and security headers gate all application traffic.
4. **Docker Production Stack (section 4)** — Ensure all containers build and start cleanly.
5. **PostgreSQL (section 5)** — Database is the core dependency for most endpoints.
6. **Redis (section 6)** — Required for Socket.io pub/sub and session caching.
7. **Coturn TURN/STUN (section 7)** — Media relay for WebRTC calls.
8. **Health Endpoints (section 8)** — Rapid smoke test of all API surfaces.
9. **Operations (section 9)** — Backups, logging, security hardening.
10. **Resilience (section 10)** — Final reliability verification before go-live.

After all items pass (56/56), the verdict should be updated to **GO** and the score to **100%**.
