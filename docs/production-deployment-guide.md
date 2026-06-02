# ZYMI Production Deployment Guide

## Prerequisites

- Docker & Docker Compose v2+
- Domain name with DNS pointing to your VPS
- Ports 80, 443, and 5000 (internal) open
- PostgreSQL 15+ or Docker PostGIS image
- Redis 7+
- Node.js 20+ (for local dev)
- Coturn TURN/STUN server (for NAT traversal)

## Quick Start (Docker)

```bash
# 1. Clone the repository
git clone <repo-url> && cd qibo

# 2. Configure environment
cp .env.example .env
# Edit .env with your production values

# 3. Generate SSL certificates (Let's Encrypt)
sudo certbot certonly --standalone -d your-domain.com

# 4. Start the stack
docker compose -f docker-compose.prod.yml up -d

# 5. Verify health
curl https://your-domain.com/health
```

## Environment Variables

Required variables in `.env`:

| Variable | Description | Example |
|----------|-------------|---------|
| `POSTGRES_USER` | PostgreSQL user | `zymi_user` |
| `POSTGRES_PASSWORD` | PostgreSQL password | `64-char-random` |
| `POSTGRES_DB` | Database name | `zymi_db` |
| `REDIS_PASSWORD` | Redis password | `64-char-random` |
| `JWT_SECRET` | JWT signing secret (64+ chars) | `openssl rand -hex 64` |
| `CLIENT_ORIGIN` | Frontend domain | `https://app.your-domain.com` |
| `SUPER_ADMIN_PASSWORD` | Initial admin password | `secure-password` |
| `SERVER_NAME` | Nginx server name | `your-domain.com` |

## Manual Deployment (without Docker)

```bash
# Server
cd server
npm install
cp .env.production.example .env
# Edit .env
npm start

# Client
cd client
npm install
cp .env.production.example .env
# Edit .env
npm run build
# Serve dist/ via nginx
```

## Nginx Configuration

The nginx config at `nginx/zymi_production.conf` handles:
- HTTPS termination with SSL
- WebSocket WSS upgrade for Socket.io
- Static file serving for React client
- API proxy to Node.js backend
- Security headers (HSTS, CSP, X-Frame-Options)

## PM2 Process Management

```bash
# Install PM2 globally
npm install -g pm2

# Start with PM2 (fallback if not using Docker)
pm2 start ecosystem.config.js --env production

# Monitor
pm2 monit
pm2 logs
```

## Database Backup

Automated backup via cron (add to crontab):
```bash
0 2 * * * pg_dump -U zymi_user -d zymi_db > /backups/zymi_$(date +\%Y\%m\%d).sql
```

## Monitoring

- Health endpoint: `GET /health`
- Admin dashboard: `/exclusivesecure`
- Metrics: `GET /api/admin/stats`

## Scaling

For multi-node:
1. Set `REDIS_URL` in all server instances
2. Redis adapter handles Socket.io pub/sub
3. PostgreSQL connection pooling scales with `max` config
4. Nginx load balances with `upstream` block
