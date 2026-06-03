# PHASE 97 — Coturn Verification (Local Build Environment)

**Date:** 2026-06-03  
**Status:** ⚠️ NOT RUNNING LOCALLY — Config Verified from Source

---

## Local Status

```
TURN server:   NOT RUNNING (Docker engine offline)
coturn binary: NOT INSTALLED on Windows
```

---

## Docker Compose Configuration (Production)

From `docker-compose.prod.yml`:

```yaml
coturn:
  image: coturn/coturn:4.6
  network_mode: host
  volumes:
    - /opt/zymi/coturn/turnserver.conf:/etc/coturn/turnserver.conf
  deploy:
    resources:
      limits:
        memory: 256M
```

### Key Settings

| Parameter | Value | Source |
|-----------|-------|--------|
| Image | coturn/coturn:4.6 | docker-compose.prod.yml |
| Network Mode | host | Required for UDP/TCP relay |
| Config Volume | `/opt/zymi/coturn/turnserver.conf` | Bind mount |
| Memory Limit | 256M | docker-compose.prod.yml |

---

## TURN Server Configuration (from documentation)

Referenced in `docs/PHASE_70_COTURN_PRODUCTION_DEPLOYMENT_REPORT.md`:

| Setting | Value |
|---------|-------|
| Listening Port | 3478 (TCP + UDP) |
| TLS Port | 5349 |
| Relay Port Range | 49152-65535 |
| Realm | `zymi.yourdomain.com` |
| Fingerprint | Enabled |
| DTLS | Enabled |
| TURN Auth | HMAC-based (long-term credentials) |

---

## Application TURN Integration

### Client-Side
- **File:** `client/src/components/connectivity/TurnServerManager.jsx`
- Configuration uses `your-domain.com` placeholder
- TURN credentials fetched from server API at login

### Server-Side
- **File:** `server/src/services/turnConfigService.js`
- Dynamically builds STUN/TURN URLs from database config
- **File:** `server/src/services/turnHealthCheckService.js`
- Health check connects to `server.host` from database

### Environment Variables (from `.env`)
```
VITE_TURN_URL=your-turn-server.com:3478
VITE_TURN_CREDENTIAL=zymi_turn_password
```

---

## Verification Commands (Cannot Run Locally)

| Test | Purpose | Status |
|------|---------|--------|
| UDP Relay | `nc -u <turn-server> 3478` | ❌ No live TURN |
| TCP Relay | `nc <turn-server> 3478` | ❌ No live TURN |
| TLS Relay | `openssl s_client -connect <turn-server>:5349` | ❌ No openssl |
| Cross Network | WebRTC test with different IPs | ❌ No live TURN |

---

## Result

```
╔══════════════════════════════════════════════════════════════╗
║           PHASE 97 — COTURN VERIFICATION                     ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║   TURN server:   NOT RUNNING LOCALLY                        ║
║   coturn image:  coturn/coturn:4.6                           ║
║                                                              ║
║   Config files:  ✅ docker-compose.prod.yml verified         ║
║   Client code:   ✅ TurnServerManager.jsx verified           ║
║   Server code:   ✅ turnConfigService.js verified            ║
║   Server code:   ✅ turnHealthCheckService.js verified       ║
║   Ports:         3478 (UDP/TCP), 5349 (TLS)                 ║
║   Relay ports:   49152-65535                                 ║
║                                                              ║
║   RESULT: ⚠️ No live Coturn — config verified from source    ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
```
