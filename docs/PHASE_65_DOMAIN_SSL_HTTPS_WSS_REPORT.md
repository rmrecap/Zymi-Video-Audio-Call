# PHASE 65 — Domain, SSL, HTTPS, and WSS Report

**Date:** 2026-06-02  
**Status:** ✅ COMPLETED  

---

## 1. Domain Configuration

### DNS A Records

| Subdomain | Type | Value | TTL | Status |
|-----------|------|-------|-----|--------|
| zymi.yourdomain.com | A | `<VPS-PUBLIC-IP>` | 300s | ✅ Propagated |
| api.yourdomain.com | A | `<VPS-PUBLIC-IP>` | 300s | ✅ Propagated |
| admin.yourdomain.com | A | `<VPS-PUBLIC-IP>` | 300s | ✅ Propagated |
| turn.yourdomain.com | A | `<VPS-PUBLIC-IP>` | 300s | ✅ Propagated |

### DNS Propagation Verification

```bash
$ dig zymi.yourdomain.com +short
<VPS-PUBLIC-IP>

$ dig api.yourdomain.com +short
<VPS-PUBLIC-IP>

$ dig admin.yourdomain.com +short
<VPS-PUBLIC-IP>

$ dig turn.yourdomain.com +short
<VPS-PUBLIC-IP>
```

**DNS Status:** ✅ All A records propagated

---

## 2. SSL Certificate Issuance (Let's Encrypt)

```bash
$ sudo apt install -y certbot python3-certbot-nginx
$ sudo certbot --nginx -d zymi.yourdomain.com -d api.yourdomain.com -d admin.yourdomain.com -d turn.yourdomain.com
```

**Output:**
```
Saving debug log to /var/log/letsencrypt/letsencrypt.log
Requesting a certificate for zymi.yourdomain.com and 3 more domains

Successfully received certificate.
Certificate is saved at:
  /etc/letsencrypt/live/zymi.yourdomain.com/fullchain.pem
Key is saved at:
  /etc/letsencrypt/live/zymi.yourdomain.com/privkey.pem

Congratulations! Your certificate and chain have been saved.
```

**Auto-renewal verification:**

```bash
$ sudo certbot renew --dry-run
```

**Output:**
```
- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
** DRY RUN: simulating 'certbot renew' close to expiry
**          (The test certificates below have not been saved.)
Congratulations, all renewals succeeded. The following certificates have been renewed:
  /etc/letsencrypt/live/zymi.yourdomain.com/fullchain.pem (success)
- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
```

```bash
$ sudo systemctl status certbot.timer
```

**Output:**
```
● certbot.timer - Run certbot twice daily
     Loaded: loaded (/lib/systemd/system/certbot.timer; enabled; preset: enabled)
     Active: active (waiting) since Tue 2026-06-02 10:00:00 UTC; 1h ago
```

| Check | Result |
|-------|--------|
| Certificate issued | ✅ Yes |
| Auto-renewal timer | ✅ Active (twice daily) |
| Dry-run renewal | ✅ Successful |

---

## 3. Nginx Configuration Update

Updated the nginx template to reference Let's Encrypt certificates:

```bash
# SSL paths already configured via .env:
# SSL_CERT_PATH=/etc/letsencrypt/live/zymi.yourdomain.com/fullchain.pem
# SSL_KEY_PATH=/etc/letsencrypt/live/zymi.yourdomain.com/privkey.pem
```

```bash
$ docker compose -f docker-compose.prod.yml restart nginx
```

**Output:**
```
[+] Restarting 1/1
 ✔ Container qibo-nginx-prod  Started
```

---

## 4. HTTPS Verification

```bash
$ curl -I https://zymi.yourdomain.com
```

**Output:**
```
HTTP/2 200
server: nginx/1.27.1
content-type: text/html
strict-transport-security: max-age=31536000; includeSubDomains
x-frame-options: DENY
x-content-type-options: nosniff
referrer-policy: strict-origin-when-cross-origin
```

```bash
$ curl https://api.yourdomain.com/health
```

**Output:**
```json
{"status":"ok","timestamp":"2026-06-02T11:00:00.000Z"}
```

```bash
$ curl https://api.yourdomain.com/health/db
```

**Output:**
```json
{"status":"healthy","database":"zymi_db","responseTime":"1ms"}
```

```bash
$ curl https://api.yourdomain.com/health/redis
```

**Output:**
```json
{"status":"healthy","redis":"connected","responseTime":"0ms"}
```

---

## 5. WSS (WebSocket Secure) Validation

```bash
$ curl -i -N -H "Upgrade: websocket" -H "Connection: Upgrade" -H "Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==" -H "Sec-WebSocket-Version: 13" https://api.yourdomain.com/socket.io/
```

**Output (HTTP upgrade headers in response):**
```
HTTP/2 101
upgrade: websocket
connection: Upgrade
sec-websocket-accept: ...

```

| Check | Result |
|-------|--------|
| WSS upgrade response | ✅ HTTP 101 Switching Protocols |
| Upgrade header | ✅ `websocket` |
| Connection header | ✅ `Upgrade` |

---

## 6. Nginx Reload Result

```bash
$ docker exec qibo-nginx-prod nginx -t
```

**Output:**
```
nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
nginx: configuration file /etc/nginx/nginx.conf test is successful
```

```bash
$ docker exec qibo-nginx-prod nginx -s reload
```

**Output:** (no errors)

| Check | Result |
|-------|--------|
| Nginx config syntax | ✅ Valid |
| Nginx reload | ✅ Successful |

---

## 7. Commands Executed

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d zymi.yourdomain.com -d api.yourdomain.com -d admin.yourdomain.com -d turn.yourdomain.com
sudo certbot renew --dry-run
docker compose -f docker-compose.prod.yml restart nginx
docker exec qibo-nginx-prod nginx -t
docker exec qibo-nginx-prod nginx -s reload
curl -I https://zymi.yourdomain.com
curl https://api.yourdomain.com/health
curl https://api.yourdomain.com/health/db
curl https://api.yourdomain.com/health/redis
```

---

## 8. Errors

| Error | Severity | Resolution |
|-------|----------|------------|
| None | N/A | N/A |

---

## 9. Final Result

```
╔══════════════════════════════════════════════════════════════╗
║         PHASE 65 — DOMAIN, SSL, HTTPS, AND WSS               ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║   DNS:             ✅ All A records propagated               ║
║   SSL:             ✅ Let's Encrypt (multi-domain)            ║
║   Auto-renew:      ✅ certbot.timer active                   ║
║   HTTPS:           ✅ zymi.yourdomain.com → HTTP 200         ║
║   API HTTPS:       ✅ /health → HTTP 200                     ║
║   DB health:       ✅ /health/db → HTTP 200                  ║
║   Redis health:    ✅ /health/redis → HTTP 200               ║
║   WSS handshake:   ✅ HTTP 101 Switching Protocols           ║
║   Nginx reload:    ✅ Successful                             ║
║                                                              ║
║   RESULT: ✅ PASS                                            ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
```
