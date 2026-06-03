# PHASE 34 — Domain, SSL, HTTPS, and WSS Validation Report

**Date:** 2026-06-02  
**Status:** PLAN ONLY (requires VPS deployment with public IP and domain)

---

## 1. Domain DNS Configuration

### Required DNS Records

| Record Type | Name | Value | Purpose |
|-------------|------|-------|---------|
| A | @ (root) | `<VPS_IP>` | Main domain → Nginx |
| A | api | `<VPS_IP>` | API subdomain → Nginx |
| A | admin | `<VPS_IP>` | Admin panel subdomain |
| A | turn | `<VPS_IP>` | TURN server subdomain (optional) |
| AAAA | @ | `<VPS_IPv6>` | IPv6 support (optional) |

### DNS Propagation Verification Commands
```bash
# Verify A record resolves
nslookup your-domain.com
dig +short your-domain.com

# Verify subdomains
nslookup api.your-domain.com
nslookup admin.your-domain.com
```

---

## 2. SSL Configuration (Let's Encrypt)

### Certificate Issuance
```bash
# Install certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d your-domain.com -d api.your-domain.com

# Verify certificate
sudo certbot certificates
```

### Auto-Renewal Setup
```bash
# Test renewal
sudo certbot renew --dry-run

# Certbot auto-renewal is installed as a systemd timer by default:
sudo systemctl status certbot.timer
# Output: ● certbot.timer - Run certbot twice daily
```

### Nginx SSL Configuration (from nginx.prod.template.conf)
```
ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
ssl_protocols TLSv1.3;
ssl_prefer_server_ciphers on;
```

### HTTPS Redirect
All HTTP (port 80) traffic is redirected to HTTPS:
```
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}
```

### HSTS Header
```
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
```

---

## 3. WSS (WebSocket Secure) Validation

### Socket.io Connection Over WSS

The Nginx configuration proxies `/socket.io` with upgrade headers:
```
location /socket.io {
    proxy_pass http://server:5000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_read_timeout 86400;
    proxy_buffering off;
    proxy_request_buffering off;
}
```

### WebRTC Signaling Over WSS
WebRTC signaling uses the same Socket.io WSS connection. The `pingTimeout: 60000` and `pingInterval: 25000` in the server config keep long-lived connections alive.

### CORS Configuration
```javascript
const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin) || /^https:\/\/your-domain\.com$/.test(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
};
```

---

## 4. Verification Commands (To Run After Deployment)

### HTTPS Verification
```bash
curl -I https://your-domain.com
# Expected: HTTP/2 200, Strict-Transport-Security header present

curl https://api.your-domain.com/health
# Expected: {"status":"ok","timestamp":"...","uptime":...,"service":"zymi-server"}

curl https://api.your-domain.com/health/db
# Expected: {"status":"healthy","provider":"postgresql","latency":"...","message":"PostgreSQL connected"}

curl https://api.your-domain.com/health/redis
# Expected: {"status":"healthy","adapter":"socket.io-redis","message":"Redis adapter connected"}
```

### SSL Certificate Validation
```bash
openssl s_client -connect your-domain.com:443 -servername your-domain.com
# Expected: Certificate chain valid, issued by Let's Encrypt
```

### WSS Validation
```bash
# Using wscat (install: npm install -g wscat)
wscat -c wss://your-domain.com/socket.io/?EIO=4&transport=websocket
# Expected: 0{"sid":"...","upgrades":["websocket"],"pingInterval":25000,"pingTimeout":60000}
```

---

## 5. Verification Results

| Test | Command | Expected | Actual | Status |
|------|---------|----------|--------|--------|
| HTTPS accessible | `curl -I https://your-domain.com` | 200 + HSTS | ⏳ NEEDS VPS | ❌ NOT TESTED |
| Health endpoint | `curl /health` | 200 + status:ok | ⏳ NEEDS VPS | ❌ NOT TESTED |
| DB health | `curl /health/db` | 200 + healthy | ⏳ NEEDS VPS | ❌ NOT TESTED |
| Redis health | `curl /health/redis` | 200 + healthy | ⏳ NEEDS VPS | ❌ NOT TESTED |
| SSL renewal | `certbot renew --dry-run` | Dry run: SUCCESS | ⏳ NEEDS VPS | ❌ NOT TESTED |
| WSS connection | `wscat` to wss:// | 0{"sid":"..."} | ⏳ NEEDS VPS | ❌ NOT TESTED |
| Mixed content check | Browser DevTools | No mixed content warnings | ⏳ NEEDS VPS | ❌ NOT TESTED |
| Nginx reload | `nginx -s reload` | Reload successful | ⏳ NEEDS VPS | ❌ NOT TESTED |

---

## 6. Verification Summary

| Check | Status |
|-------|--------|
| HTTPS works | ❌ NEEDS VPS DEPLOYMENT |
| WSS works | ❌ NEEDS VPS DEPLOYMENT |
| SSL renewal path exists | ✅ Configured via certbot systemd timer |
| No mixed content issue | ❌ NEEDS VPS DEPLOYMENT |
| Nginx reload works | ❌ NEEDS VPS DEPLOYMENT |

**Status:** All domain/SSL/WSS items require a deployed VPS with a public IP and registered domain to complete. The configuration templates (Nginx, SSL, Docker Compose) are ready and validated.
