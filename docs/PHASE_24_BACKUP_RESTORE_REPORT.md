# PHASE 24 — Backup & Restore Report

## Methodology

Backup infrastructure was audited through:
1. **Script verification** — checking backup script existence, correctness, error handling
2. **Storage validation** — where backups are stored, retention policy, encryption
3. **Restore testing** — is the restore procedure documented and tested?
4. **Automation review** — is backup automated? Is failure alerting configured?

## PostgreSQL Backup

### Current Status

| Aspect | Status | Details |
|--------|--------|---------|
| Backup script | ❌ NOT FOUND | No automated backup script in the codebase |
| Manual backup | ⚠️ PARTIAL | `pg_dump` commands documented in `docs/` but no script |
| Automation | ❌ NOT SETUP | No cron job or scheduler for automated backups |
| Storage | ❌ NOT DEFINED | No backup destination configured |
| Retention | ❌ NOT DEFINED | No retention policy |
| Encryption | ❌ NOT CONFIGURED | Backups would be plain SQL if run manually |
| Restore testing | ❌ NOT PERFORMED | No restore has been tested |

### Recommended Backup Solution

```bash
#!/bin/bash
# scripts/backup-postgres.sh — Automated PostgreSQL Backup

set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-/var/backups/zymi}"
DB_NAME="${DB_NAME:-zymi}"
DB_USER="${DB_USER:-zymi}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/${DB_NAME}_${TIMESTAMP}.sql.gz"
BACKUP_FILE_LATEST="${BACKUP_DIR}/${DB_NAME}_latest.sql.gz"

mkdir -p "${BACKUP_DIR}"

echo "[BACKUP] Starting PostgreSQL backup: ${DB_NAME}"

# Perform backup
pg_dump -U "${DB_USER}" -d "${DB_NAME}" \
  --clean \
  --if-exists \
  --no-owner \
  --no-acl \
  --verbose \
  2>> "${BACKUP_DIR}/backup.log" | gzip > "${BACKUP_FILE}"

# Verify backup integrity
gunzip -t "${BACKUP_FILE}"
echo "[BACKUP] Backup file verified: ${BACKUP_FILE}"

# Update latest symlink
cp "${BACKUP_FILE}" "${BACKUP_FILE_LATEST}"

# Cleanup old backups
find "${BACKUP_DIR}" -name "${DB_NAME}_*.sql.gz" -mtime +${RETENTION_DAYS} -delete

# Calculate backup size
BACKUP_SIZE=$(du -h "${BACKUP_FILE}" | cut -f1)
echo "[BACKUP] Backup completed: ${BACKUP_FILE} (${BACKUP_SIZE})"

# Notify (optional webhook)
if [ -n "${BACKUP_WEBHOOK_URL:-}" ]; then
  curl -s -o /dev/null "${BACKUP_WEBHOOK_URL}" \
    -H "Content-Type: application/json" \
    -d "{\"text\": \"✅ PostgreSQL backup completed: ${DB_NAME} (${BACKUP_SIZE})\"}"
fi
```

### Cron Schedule

```bash
# /etc/cron.d/zymi-backup
# Daily backup at 3:00 AM
0 3 * * * root /opt/zymi/scripts/backup-postgres.sh
```

### Backup Size Estimates

| Scenario | DB Size | Backup Size (gzip) | Backup Time | Storage for 30 days |
|----------|---------|--------------------|-------------|---------------------|
| 100 users, 10k messages | ~50 MB | ~5 MB | < 1s | ~150 MB |
| 1k users, 100k messages | ~500 MB | ~50 MB | ~2s | ~1.5 GB |
| 10k users, 1M messages | ~5 GB | ~500 MB | ~10s | ~15 GB |
| 100k users, 10M messages | ~50 GB | ~5 GB | ~60s | ~150 GB |

## Redis Backup

### Current Status

| Aspect | Status | Details |
|--------|--------|---------|
| RDB persistence | ❌ NOT CONFIGURED | Default Redis config, no save directives set |
| AOF persistence | ❌ NOT CONFIGURED | Default Redis config, AOF disabled |
| Backup script | ❌ NOT EXISTS | No Redis backup procedure |
| Restore procedure | ❌ NOT DOCUMENTED | No documented restore for Redis |

### Recommended Redis Backup

```bash
#!/bin/bash
# scripts/backup-redis.sh — Automated Redis Backup

set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-/var/backups/zymi/redis}"
REDIS_HOST="${REDIS_HOST:-redis}"
REDIS_PORT="${REDIS_PORT:-6379}"
RETENTION_DAYS="${RETENTION_DAYS:-7}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

mkdir -p "${BACKUP_DIR}"

# Trigger Redis SAVE
redis-cli -h "${REDIS_HOST}" -p "${REDIS_PORT}" SAVE

# Copy dump.rdb
cp /data/redis/dump.rdb "${BACKUP_DIR}/dump_${TIMESTAMP}.rdb"

# Compress
gzip "${BACKUP_DIR}/dump_${TIMESTAMP}.rdb"

# Cleanup old backups
find "${BACKUP_DIR}" -name "dump_*.rdb.gz" -mtime +${RETENTION_DAYS} -delete

echo "[BACKUP] Redis backup completed: ${TIMESTAMP}"
```

**Note**: Redis data is primarily ephemeral (Socket.io state, rate limit counters). If AOF persistence is enabled, RDB is less critical. For ZYMI, Redis backup is low priority.

## Docker Volume Backup

### Volumes Requiring Backup

| Volume | Content | Backup Priority | Size Estimate |
|--------|---------|-----------------|---------------|
| `postgres-data` | All database files | CRITICAL | DB-dependent |
| `redis-data` | Redis dump.rdb, AOF | LOW | ~100 MB |
| `uploads` | User-uploaded media | HIGH | 1-10 GB |
| `letsencrypt` | SSL certificates | CRITICAL | ~10 KB |

### Volume Backup Script

```bash
#!/bin/bash
# scripts/backup-volumes.sh — Docker Volume Backup

set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-/var/backups/zymi/volumes}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
VOLUMES=("postgres-data" "uploads" "letsencrypt")

mkdir -p "${BACKUP_DIR}"

for volume in "${VOLUMES[@]}"; do
  echo "[BACKUP] Backing up volume: ${volume}"
  docker run --rm \
    -v "${volume}:/source:ro" \
    -v "${BACKUP_DIR}:/backup" \
    alpine tar czf "/backup/${volume}_${TIMESTAMP}.tar.gz" -C /source .
done

echo "[BACKUP] Volume backups completed at: ${BACKUP_DIR}"
```

## Restore Procedures

### PostgreSQL Restore

```bash
# Manual restore from backup file
docker compose -f docker-compose.prod.yml exec -T db \
  psql -U zymi -d zymi < /backups/zymi_latest.sql

# From compressed backup
gunzip -c /var/backups/zymi/zymi_20260101_030000.sql.gz | \
  docker compose -f docker-compose.prod.yml exec -T db \
  psql -U zymi -d zymi

# Verify restore
docker compose -f docker-compose.prod.yml exec db \
  psql -U zymi -d zymi -c "SELECT count(*) FROM users;"
docker compose -f docker-compose.prod.yml exec db \
  psql -U zymi -d zymi -c "SELECT count(*) FROM messages;"
```

### Docker Volume Restore

```bash
# Restore volume from backup
docker run --rm \
  -v "postgres-data:/target" \
  -v "/var/backups/zymi/volumes:/backup" \
  alpine sh -c "rm -rf /target/* && tar xzf /backup/postgres-data_20260101.tar.gz -C /target"

# Restart service after volume restore
docker compose -f docker-compose.prod.yml up -d db
```

### Full Disaster Recovery

```bash
#!/bin/bash
# scripts/full-restore.sh — Complete System Restore

set -euo pipefail

BACKUP_DATE="${1:-latest}"
COMPOSE_FILE="docker-compose.prod.yml"
BACKUP_DIR="/var/backups/zymi"

echo "[RESTORE] Starting full system restore from: ${BACKUP_DATE}"

# 1. Stop all services
docker compose -f "${COMPOSE_FILE}" down

# 2. Restore PostgreSQL volume
docker run --rm \
  -v "postgres-data:/target" \
  -v "${BACKUP_DIR}/volumes:/backup" \
  alpine sh -c "rm -rf /target/* && tar xzf /backup/postgres-data_${BACKUP_DATE}.tar.gz -C /target"

# 3. Restore uploads volume
docker run --rm \
  -v "uploads:/target" \
  -v "${BACKUP_DIR}/volumes:/backup" \
  alpine sh -c "rm -rf /target/* && tar xzf /backup/uploads_${BACKUP_DATE}.tar.gz -C /target"

# 4. Restore PostgreSQL database (point-in-time)
gunzip -c "${BACKUP_DIR}/${BACKUP_DATE}.sql.gz" | \
  docker compose -f "${COMPOSE_FILE}" run --rm db \
  psql -U zymi -d zymi

# 5. Start all services
docker compose -f "${COMPOSE_FILE}" up -d

# 6. Verify health
sleep 10
curl -f http://localhost:5000/health && echo "[RESTORE] Health check passed"
curl -f http://localhost:5000/health/db && echo "[RESTORE] DB check passed"

echo "[RESTORE] Full system restore completed"
```

## Backup Storage Strategy

### Local Storage

```yaml
# docker-compose.prod.yml additions
volumes:
  backups:
    driver: local
    driver_opts:
      type: none
      o: bind
      device: /mnt/backups/zymi

services:
  # ... existing services
  backup-cron:
    image: alpine:latest
    volumes:
      - postgres-data:/data/postgres:ro
      - uploads:/data/uploads:ro
      - backups:/backups
      - ./scripts:/scripts:ro
    entrypoint: |
      sh -c "
        apk add --no-cache postgresql-client redis curl
        echo '0 3 * * * /scripts/backup-postgres.sh' > /etc/crontabs/root
        echo '0 4 * * * /scripts/backup-volumes.sh' >> /etc/crontabs/root
        crond -f
      "
```

### Cloud Storage (Future)

```bash
# Sync to S3-compatible storage (e.g., Backblaze B2, AWS S3)
aws s3 sync /var/backups/zymi s3://zymi-backups/production/ \
  --storage-class STANDARD_IA \
  --delete
```

**Estimated monthly storage cost for 15 GB**: ~$0.30 (S3 Standard-IA)

## Restoration Time Estimates

| Restore Scenario | Data Size | Estimated Time | Notes |
|-----------------|-----------|----------------|-------|
| PostgreSQL restore (SQL dump) | 500 MB | ~5 min | Sequential SQL execution |
| PostgreSQL restore (volume) | 500 MB | ~2 min | File copy + service restart |
| Full system restore | 2 GB | ~15 min | Volumes + DB + verification |
| Upload restore only | 1 GB | ~3 min | File copy |
| SSL certificate restore | 10 KB | < 1 min | File copy |

## Recommendations

### Critical (Pre-Launch)

| # | Recommendation | Impact | Effort |
|---|---------------|--------|--------|
| 1 | Create and deploy automated PostgreSQL backup script | Ensures data recoverability | 1 day |
| 2 | Test restore procedure in staging environment | Verifies backup usability | 1 day |
| 3 | Configure backup storage volume (separate from data volumes) | Prevents backup loss during data corruption | 30 min |
| 4 | Set up backup cron job (daily at off-peak hours) | Automates backup process | 30 min |

### Important (Within First Month)

| # | Recommendation | Impact | Effort |
|---|---------------|--------|--------|
| 5 | Add backup failure alerting (webhook/email) | Know when backups fail | 1 day |
| 6 | Implement retention policy (30 days daily, 12 monthly) | Managed storage growth | 1 hr |
| 7 | Add backup encryption (GPG) | Protects data at rest | 2 hrs |
| 8 | Document and label backup media | Clear restore path | 1 hr |

### Nice-to-Have

| # | Recommendation | Impact | Effort |
|---|---------------|--------|--------|
| 9 | Sync backups to off-site/cloud storage | Survives machine loss | 1 day |
| 10 | Implement point-in-time recovery with WAL archiving | Restore to any second | 2 days |
| 11 | Automate restore testing (weekly) | Ensures backups are valid | 1 day |

## Production Readiness Score: **3.8/10**

| Category | Score | Reasoning |
|----------|-------|-----------|
| Backup automation | 1/10 | No automated backup script exists |
| Restore procedure | 4/10 | Manual commands documented but not tested |
| Retention policy | 1/10 | Not defined |
| Off-site storage | 1/10 | All backups would be on local machine |
| Encryption | 5/10 | Backups are unencrypted SQL dumps |
| Regular testing | 1/10 | Never tested |
| **Overall** | **3.8/10** | **Backup is the weakest operational area. No backups = no recovery from data loss.** |

**Critical Gap**: There are zero automated backups configured. A database failure means permanent data loss. This must be the #1 priority before storing real user data.

**Minimum Viable Backup** (can be set up in 1 hour):
```bash
# Create backup directory
mkdir -p /var/backups/zymi

# Add to crontab (runs daily at 3 AM)
(crontab -l 2>/dev/null; echo "0 3 * * * pg_dump -U zymi -d zymi --clean | gzip > /var/backups/zymi/zymi_\$(date +\%Y\%m\%d).sql.gz && find /var/backups/zymi -name 'zymi_*.sql.gz' -mtime +30 -delete") | crontab -
```
