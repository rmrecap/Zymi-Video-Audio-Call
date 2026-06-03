# PHASE 58 — Linux VPS Fallback Deployment Plan

**Date:** 2026-06-02  
**Status:** ACTIVE PLAN  
**Reason:** Windows RDP (AWS EC2) cannot run Linux containers — see PHASE 57

---

## 1. VPS Specifications

| Tier | vCPU | RAM | Storage | Monthly Est. | Suitable For |
|------|------|-----|---------|-------------|-------------|
| **Minimum** | 2 vCPU | 4 GB | 60 GB SSD | ~$12-24 | Development / Light testing |
| **Recommended** | 4 vCPU | 8 GB | 100 GB SSD | ~$24-48 | Full closed beta (20-50 users) |
| **Production-ready** | 4-8 vCPU | 16 GB | 160 GB SSD + backup volume | ~$48-120 | Public launch |

### Recommended Providers

| Provider | Plan | Price (est.) | Notes |
|----------|------|-------------|-------|
| **Hetzner** | CX32 (4 vCPU, 8 GB, 160 GB) | ~$10-15/mo | Best price/performance |
| **DigitalOcean** | 4 vCPU / 8 GB / 160 GB | ~$48/mo | Good UI/API |
| **Linode** | 4 vCPU / 8 GB / 160 GB | ~$48/mo | Reliable |
| **Vultr** | 4 vCPU / 8 GB / 160 GB | ~$48/mo | Global locations |
| **AWS EC2** | t3.medium (2 vCPU, 4 GB) | ~$30/mo | Free tier may apply |

---

## 2. OS Selection

| OS | Version | Docker Support | Recommendation |
|----|---------|---------------|----------------|
| **Ubuntu** | **24.04 LTS** | ✅ Excellent | **✅ RECOMMENDED** |
| Ubuntu | 22.04 LTS | ✅ Excellent | Also good |
| Debian | 12 | ✅ Good | Stable but older packages |
| Rocky Linux | 9 | ⚠️ Requires manual setup | If RHEL-compatible needed |

---

## 3. Deployment Commands

### 3.1 Initial Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install prerequisites
sudo apt install -y ca-certificates curl gnupg ufw git

# Install Docker
curl -fsSL https://get.docker.com | sh

# Add user to docker group
sudo usermod -aG docker $USER

# Log out and back in, or run:
newgrp docker

# Verify Docker
docker --version
docker compose version
```

### 3.2 Configure Firewall

```bash
# Enable UFW
sudo ufw --force enable

# Allow SSH (change port if needed)
sudo ufw allow OpenSSH

# Allow HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Allow TURN/STUN (Coturn)
sudo ufw allow 3478/tcp
sudo ufw allow 3478/udp

# Allow TURN relay ports
sudo ufw allow 49152:65535/udp

# Default deny incoming
sudo ufw default deny incoming

# Check status
sudo ufw status verbose
```

### 3.3 Clone and Deploy ZYMI

```bash
# Clone repository
git clone <repo-url> /opt/zymi
cd /opt/zymi

# Configure environment
cp .env.beta.example .env
# EDIT .env with real secrets:
# - POSTGRES_PASSWORD
# - REDIS_PASSWORD
# - JWT_SECRET (64+ chars)
# - ENCRYPTION_KEY (32 chars)
# - SUPER_ADMIN_PASSWORD
# - CLIENT_ORIGIN (real domain)
# - VITE_API_URL
# - VITE_SOCKET_URL
# - VITE_TURN_URLS
# - VITE_TURN_CREDENTIAL
# - SERVER_NAME

# Validate compose file
docker compose -f docker-compose.prod.yml config

# Build and start
docker compose -f docker-compose.prod.yml up -d --build

# Check containers
docker compose ps

# Check logs
docker compose logs --tail=100
```

### 3.4 Configure SSL (Let's Encrypt)

```bash
# Install certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d your-domain.com -d api.your-domain.com

# Verify auto-renewal
sudo certbot renew --dry-run
sudo systemctl status certbot.timer
```

### 3.5 Verify Deployment

```bash
# Health checks
curl https://your-domain.com/health
curl https://your-domain.com/health/db
curl https://your-domain.com/health/redis
curl https://your-domain.com/health/realtime

# PostgreSQL check
docker exec qibo-postgres-prod pg_isready -U zymi_user -d zymi_db

# Redis check
docker exec qibo-redis-prod redis-cli ping

# Create admin user (if seed not run)
docker exec -it qibo-server-prod node src/db/seedAdmin.js
```

### 3.6 Create Backup

```bash
# Create backup directory
sudo mkdir -p /opt/zymi/backups
sudo chown -R $(whoami):$(whoami) /opt/zymi/backups

# Create initial backup
docker exec qibo-postgres-prod pg_dump -U zymi_user -d zymi_db -F c -f /tmp/zymi_initial_$(date +%Y%m%d).dump
docker cp qibo-postgres-prod:/tmp/zymi_initial_*.dump /opt/zymi/backups/

# Verify backup
ls -lh /opt/zymi/backups/
```

---

## 4. Docker Compose Services (docker-compose.prod.yml)

| Service | Image/Base | Port (internal) | Healthcheck |
|---------|-----------|-----------------|-------------|
| postgres | postgres:15-alpine | 5432 | pg_isready |
| redis | redis:7-alpine | 6379 | redis-cli ping |
| server | Dockerfile (node:alpine) | 5000 | wget /health |
| client | Dockerfile (node:alpine) | — | Build-only |
| nginx | nginx:alpine | 80, 443 | — |

---

## 5. .env Production Values Required

| Variable | Example Value | Source |
|----------|--------------|--------|
| POSTGRES_PASSWORD | `<random-32-char>` | Generate |
| REDIS_PASSWORD | `<random-32-char>` | Generate |
| JWT_SECRET | `<random-64-char>` | Generate |
| ENCRYPTION_KEY | `<random-32-char>` | Generate |
| SUPER_ADMIN_PASSWORD | `<random-16-char>` | Generate |
| CLIENT_ORIGIN | `https://beta.zymi.app` | Domain |
| VITE_API_URL | `https://api.beta.zymi.app` | Domain |
| VITE_SOCKET_URL | `https://api.beta.zymi.app` | Domain |
| SERVER_NAME | `beta.zymi.app` | Domain |

---

## 6. Post-Deployment Checklist

| # | Task | Command | Status |
|---|------|---------|--------|
| 1 | SSH to VPS | `ssh user@<vps-ip>` | ⏳ |
| 2 | System update | `sudo apt update && sudo apt upgrade -y` | ⏳ |
| 3 | Install Docker | `curl -fsSL https://get.docker.com \| sh` | ⏳ |
| 4 | Clone repo | `git clone <repo> /opt/zymi` | ⏳ |
| 5 | Configure .env | `cp .env.beta.example .env` + edit | ⏳ |
| 6 | Validate compose | `docker compose -f docker-compose.prod.yml config` | ⏳ |
| 7 | Build and start | `docker compose -f docker-compose.prod.yml up -d --build` | ⏳ |
| 8 | Verify containers | `docker compose ps` | ⏳ |
| 9 | Verify health | `curl localhost/health` | ⏳ |
| 10 | Configure DNS | Point domain to VPS IP | ⏳ |
| 11 | Issue SSL | `certbot --nginx` | ⏳ |
| 12 | Verify HTTPS | `curl -I https://domain.com` | ⏳ |
| 13 | Create backup | `pg_dump` | ⏳ |
| 14 | Create admin user | Seed script | ⏳ |
| 15 | Run smoke tests | PHASE 46 | ⏳ |

---

## 7. Monitoring Commands (After Deployment)

```bash
# Container health
docker compose ps

# Resource usage
docker stats --no-stream

# Logs
docker compose logs --tail=50 server
docker compose logs --tail=50 postgres
docker compose logs --tail=50 redis
docker compose logs --tail=50 nginx

# Disk usage
df -h

# Docker disk usage
docker system df
```

---

## 8. Expected Timeline

| Step | Duration | Cumulative |
|------|----------|------------|
| Provision VPS | 5 min | 5 min |
| Initial setup + Docker | 15 min | 20 min |
| Clone + configure .env | 10 min | 30 min |
| Docker build + start | 15 min | 45 min |
| DNS + SSL | 30 min | 1 hr 15 min |
| Verification | 15 min | 1 hr 30 min |
| Backup | 10 min | 1 hr 40 min |
| Admin user setup | 5 min | 1 hr 45 min |

**Total estimated time: ~2 hours**

---

## 9. Cost Estimate

| Item | Monthly Cost (est.) |
|------|--------------------|
| Linux VPS (4 vCPU, 8 GB, 100 GB SSD) | ~$24-48 |
| Domain name (.app or .com) | ~$12-15/yr (~$1/mo) |
| SMTP service (SendGrid, Mailgun, etc.) | ~$0-15/mo (free tier available) |
| TURN server (Coturn on same VPS) | Included in VPS cost |
| **Total estimated monthly** | **~$25-64/mo** |
