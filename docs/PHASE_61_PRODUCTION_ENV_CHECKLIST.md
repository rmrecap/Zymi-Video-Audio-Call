# Phase 61: Production Environment Checklist

This checklist ensures that the ZYMI production environment is correctly configured and secured before deployment.

## 1. Environment Variables (.env)
- [ ] `NODE_ENV` set to `production`.
- [ ] `JWT_SECRET` generated (64 chars hex).
- [ ] `ENCRYPTION_KEY` generated (32 chars).
- [ ] `DATABASE_URL` configured (PostgreSQL recommended).
- [ ] `REDIS_URL` configured (if using Socket.io scaling).
- [ ] `CLIENT_ORIGIN` matches production domain.
- [ ] `SMTP_PASS` encrypted or securely stored.
- [ ] `ADMIN_TURN_TEST_PASS` configured.

## 2. Infrastructure & Networking
- [ ] **Nginx**: SSL certificates configured (Certbot/Let's Encrypt).
- [ ] **Nginx**: WebSocket upgrade headers (`Upgrade`, `Connection`) verified.
- [ ] **Docker**: `docker-compose.prod.yml` ready with volume persistence.
- [ ] **Coturn**: Public IP reachable on ports 3478 (UDP/TCP) and 5349 (TLS).
- [ ] **Firewall**: All required ports (80, 443, 3478, 5349, 49160-49200) open.

## 3. Security Hardening
- [ ] **Rate Limiting**: Nginx or Express rate limiting active for `/api/auth` and `/api/otp`.
- [ ] **Helmet**: Security headers enabled in `index.js`.
- [ ] **CORS**: Restricted to `CLIENT_ORIGIN`.
- [ ] **Logging**: Sensitive data (OTP, Tokens, PII) masked in all logs.

## 4. Persistence & Backups
- [ ] **Database**: Automated daily backups configured for PostgreSQL/SQLite.
- [ ] **Media**: Metadata only stored; P2P transfer confirmed.
- [ ] **Volumes**: Docker volume mounts verified for persistent data.

## 5. Monitoring
- [ ] **Project Brain**: Accessible to super-admins only.
- [ ] **Health Checks**: `/health` endpoint monitored by external uptime service.
- [ ] **Risk Detection**: Automated alerts for infrastructure anomalies active.
