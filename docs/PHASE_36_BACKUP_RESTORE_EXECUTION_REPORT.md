# PHASE 36 — Backup and Restore Execution Report

**Date:** 2026-06-02  
**Status:** PLAN WITH PROCEDURES (requires PostgreSQL instance to execute)

---

## 1. PostgreSQL Backup via pg_dump

### 1.1 Create Backup Directory
```bash
sudo mkdir -p /opt/zymi/backups
sudo chown deploy:deploy /opt/zymi/backups
```

### 1.2 Backup Command (Docker-based)
```bash
docker exec qibo-postgres-prod pg_dump -U zymi_user -d zymi_db -F c -f /tmp/zymi_backup_$(date +%Y%m%d_%H%M%S).dump
docker cp qibo-postgres-prod:/tmp/zymi_backup_*.dump /opt/zymi/backups/
```

### 1.3 Backup Command (Direct PostgreSQL)
```bash
pg_dump -U zymi_user -h localhost -p 5433 -d zymi_db -F c -f /opt/zymi/backups/zymi_backup_$(date +%Y%m%d_%H%M%S).dump
```

### 1.4 Verify Backup File
```bash
ls -lh /opt/zymi/backups/
# Expected: File exists, size > 0 bytes
```

---

## 2. Backup Verification Script

```bash
#!/bin/bash
# backup_zymi.sh — ZYMI PostgreSQL Backup Script

BACKUP_DIR="/opt/zymi/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/zymi_$TIMESTAMP.dump"
LOG_FILE="$BACKUP_DIR/backup.log"
DB_USER="${POSTGRES_USER:-zymi_user}"
DB_NAME="${POSTGRES_DB:-zymi_db}"
RETENTION_DAYS=7

mkdir -p "$BACKUP_DIR"

# Perform backup
echo "[$(date)] Starting backup..." >> "$LOG_FILE"
pg_dump -U "$DB_USER" -d "$DB_NAME" -F c -f "$BACKUP_FILE"

if [ $? -eq 0 ]; then
    BACKUP_SIZE=$(stat -c%s "$BACKUP_FILE")
    echo "[$(date)] Backup completed: $BACKUP_FILE ($BACKUP_SIZE bytes)" >> "$LOG_FILE"
    
    # Clean up backups older than retention period
    find "$BACKUP_DIR" -name "zymi_*.dump" -mtime +$RETENTION_DAYS -delete
    echo "[$(date)] Cleaned up backups older than $RETENTION_DAYS days" >> "$LOG_FILE"
else
    echo "[$(date)] BACKUP FAILED!" >> "$LOG_FILE"
    exit 1
fi
```

---

## 3. Restore Verification

### 3.1 Create Test Database
```bash
createdb -U zymi_user -h localhost -p 5433 zymi_restore_test
```

### 3.2 Restore Backup Into Test Database
```bash
pg_restore -U zymi_user -h localhost -p 5433 -d zymi_restore_test /opt/zymi/backups/zymi_latest.dump
```

### 3.3 Compare Table Counts
```sql
-- Source database
SELECT table_name, (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public') as total_tables
FROM information_schema.tables
WHERE table_schema = 'public';

-- Count rows per table
SELECT schemaname, tablename, n_live_tup
FROM pg_stat_user_tables
ORDER BY tablename;
```

### 3.4 Table Count Comparison Query
```sql
-- Compare row counts between source and restored database
SELECT 
    'source' as db, 
    count(*) as table_count,
    (SELECT SUM(n_live_tup) FROM pg_stat_user_tables) as total_rows
FROM information_schema.tables 
WHERE table_schema = 'public'

UNION ALL

SELECT 
    'restored' as db, 
    count(*) as table_count,
    (SELECT SUM(n_live_tup) FROM pg_stat_user_tables) as total_rows
FROM information_schema.tables 
WHERE table_schema = 'public';
```

---

## 4. Backup Schedule Recommendation

| Frequency | Type | Retention | When |
|-----------|------|-----------|------|
| Daily | Full database dump (custom format) | 7 days | 02:00 UTC |
| Weekly | Full database dump (custom format) | 30 days | Sunday 02:00 UTC |
| Monthly | Full database dump (custom format) | 12 months | 1st of month 02:00 UTC |
| Real-time | WAL archiving (if available) | 7 days | Continuous |

### Recommended Cron Jobs
```bash
# Daily backup — 2:00 AM
0 2 * * * /opt/zymi/scripts/backup_zymi.sh

# Weekly backup — Sunday 2:00 AM
0 2 * * 0 /opt/zymi/scripts/backup_zymi_weekly.sh

# Verify backup integrity — 3:00 AM daily
0 3 * * * /opt/zymi/scripts/verify_backup.sh
```

---

## 5. Execution Results

| Step | Command | Expected | Actual | Status |
|------|---------|----------|--------|--------|
| Create backup dir | `mkdir -p /opt/zymi/backups` | Directory created | ⏳ NEEDS VPS | ❌ NOT EXECUTED |
| Run pg_dump | `pg_dump -U zymi_user -d zymi_db` | Dump file created | ⏳ NEEDS POSTGRESQL | ❌ NOT EXECUTED |
| Verify backup exists | `ls -lh backup_file` | File > 0 bytes | ⏳ NEEDS POSTGRESQL | ❌ NOT EXECUTED |
| Create test DB | `createdb zymi_restore_test` | Database created | ⏳ NEEDS POSTGRESQL | ❌ NOT EXECUTED |
| Restore backup | `pg_restore ...` | Tables restored | ⏳ NEEDS POSTGRESQL | ❌ NOT EXECUTED |
| Compare counts | Table count query | Counts match | ⏳ NEEDS POSTGRESQL | ❌ NOT EXECUTED |

---

## 6. Commands Reference (For VPS Execution)

```bash
# Backup
docker exec qibo-postgres-prod pg_dump -U zymi_user -d zymi_db -F c -f /tmp/zymi_20260602.dump
docker cp qibo-postgres-prod:/tmp/zymi_20260602.dump /opt/zymi/backups/
ls -lh /opt/zymi/backups/zymi_20260602.dump

# Test Restore
docker exec -i qibo-postgres-prod psql -U zymi_user -c "CREATE DATABASE zymi_restore_test;"
docker exec -i qibo-postgres-prod pg_restore -U zymi_user -d zymi_restore_test < /tmp/zymi_20260602.dump

# Verify
docker exec -i qibo-postgres-prod psql -U zymi_user -d zymi_db -c "SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public';"
docker exec -i qibo-postgres-prod psql -U zymi_user -d zymi_restore_test -c "SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public';"
```

---

## 7. Blockers

| Blocker | Impact |
|---------|--------|
| No PostgreSQL instance available locally | Cannot execute pg_dump or restore |
| No Docker engine | Cannot run PostgreSQL container |
| pg_dump/pg_restore not installed on host | Cannot run commands natively |

**Status:** ⛔ BLOCKED — Requires a running PostgreSQL instance (via Docker on VPS or installed locally) to execute backup and restore procedures. All scripts and commands are prepared and documented.
