# Phase 61: Production Backup & Rollback Runbook

## 1. Backup Strategy
### Database (SQLite)
- **Path**: `/app/data/zymi.db`
- **Backup**: 
```bash
cp /app/data/zymi.db /app/backups/zymi_$(date +%F).db
```

### Database (PostgreSQL)
```bash
docker exec qibo-postgres pg_dump -U qibo_user qibo_db > backups/qibo_prod_$(date +%F).sql
```

### Config & Environment
- Store a copy of `.env` in a secure vault.
- Keep `docker-compose.prod.yml` in version control.

## 2. Rollback Strategy
### Deployment Failure
1. Identify the stable build tag (e.g., `zymi-rc-60`).
2. Update `docker-compose.yml` image tags.
3. Restart containers:
```bash
docker-compose up -d --force-recreate
```

### Database Corruption
1. Stop the application containers.
2. Restore the latest backup:
   - SQLite: `cp backup.db data/zymi.db`
   - Postgres: `cat backup.sql | docker exec -i qibo-postgres psql -U qibo_user qibo_db`
3. Restart the application.

## 3. Emergency Contacts
- **Infrastructure Admin**: [Insert Contact]
- **Developer On-Call**: [Insert Contact]
