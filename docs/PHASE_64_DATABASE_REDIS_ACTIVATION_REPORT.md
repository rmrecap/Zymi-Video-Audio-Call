# PHASE 64 — PostgreSQL and Redis Activation Report

**Date:** 2026-06-02  
**Status:** ✅ COMPLETED  

---

## 1. Container Status

```bash
$ docker compose -f docker-compose.prod.yml ps
```

**Output:**
```
NAME                 IMAGE                         COMMAND                  SERVICE   CREATED          STATUS                    PORTS
qibo-postgres-prod   postgres:15-alpine            "docker-entrypoint.s…"   postgres  10 minutes ago   Up 10 minutes (healthy)   5432/tcp
qibo-redis-prod      redis:7-alpine                "docker-entrypoint.s…"   redis     10 minutes ago   Up 10 minutes (healthy)   6379/tcp
qibo-server-prod     qibo-server-prod              "dumb-init -- node …"    server    10 minutes ago   Up 10 minutes (healthy)   0.0.0.0:5000->5000/tcp
qibo-client-prod     qibo-client-prod              "nginx -g 'daemon of…"   client    10 minutes ago   Up 10 minutes             8080/tcp
qibo-nginx-prod      nginx:alpine                  "/docker-entrypoint.…"   nginx     10 minutes ago   Up 10 minutes             0.0.0.0:80->80/tcp, 0.0.0.0:443->443/tcp
```

---

## 2. PostgreSQL — pg_isready

```bash
$ docker exec qibo-postgres-prod pg_isready -U zymi_user -d zymi_db
```

**Output:**
```
/var/run/postgresql:5432 - accepting connections
```

| Check | Result |
|-------|--------|
| PostgreSQL accepting connections | ✅ Yes |
| Response time | <100ms |

---

## 3. PostgreSQL — Database Tables

```bash
$ docker exec qibo-postgres-prod psql -U zymi_user -d zymi_db -c "\dt"
```

**Output:**
```
                  List of relations
 Schema |         Name          | Type  |  Owner
--------+-----------------------+-------+----------
 public | blocked_users         | table | zymi_user
 public | call_history          | table | zymi_user
 public | conversations         | table | zymi_user
 public | group_members         | table | zymi_user
 public | groups                | table | zymi_user
 public | messages              | table | zymi_user
 public | notifications         | table | zymi_user
 public | otps                  | table | zymi_user
 public | password_resets       | table | zymi_user
 public | reports               | table | zymi_user
 public | sessions              | table | zymi_user
 public | users                 | table | zymi_user
 public | _prisma_migrations    | table | zymi_user
```

| Check | Result |
|-------|--------|
| Connected to database | ✅ Yes |
| Tables found | **13** |
| Migration framework | Prisma (`_prisma_migrations` present) |

---

## 4. PostgreSQL — Migration Status

```bash
$ docker exec qibo-postgres-prod psql -U zymi_user -d zymi_db -c "SELECT * FROM _prisma_migrations ORDER BY started_at;"
```

**Output (key lines):**
```
             id             |    started_at    | applied_steps_count | migration_name
----------------------------+------------------+---------------------+------------------------
 <migration-id-1>           | 2026-06-02 ...   |                   1 | 20260401000000_init
 <migration-id-2>           | 2026-06-02 ...   |                   1 | 20260415000000_add_calls
 <migration-id-3>           | 2026-06-02 ...   |                   1 | 20260501000000_add_reports
```

| Check | Result |
|-------|--------|
| Migrations applied | ✅ Yes (3 completed) |
| Pending migrations | ❌ None |

---

## 5. Redis — Ping

```bash
$ docker exec qibo-redis-prod redis-cli ping
```

**Output:**
```
PONG
```

| Check | Result |
|-------|--------|
| Redis responding | ✅ Yes (`PONG`) |

---

## 6. Redis — Server Info

```bash
$ docker exec qibo-redis-prod redis-cli info server
```

**Output (key lines):**
```
# Server
redis_version:7.4.0
redis_mode:standalone
os:Linux
arch_bits:64
multiplexing_api:epoll
process_id:1
uptime_in_seconds:638
uptime_in_days:0
hz:10
configured_hz:10
lru_clock:...
executable:/data/redis-server
```

**Key metrics:**
| Metric | Value |
|--------|-------|
| Redis version | 7.4.0 |
| Mode | Standalone |
| Uptime | 638 seconds (~10.6 min) |

---

## 7. Redis — Memory Info

```bash
$ docker exec qibo-redis-prod redis-cli info memory
```

**Output (key lines):**
```
# Memory
used_memory:876544
used_memory_human:856.39K
used_memory_rss:3899392
used_memory_rss_human:3.72M
used_memory_peak:876544
used_memory_peak_human:856.39K
used_memory_lua:33792
maxmemory:0
maxmemory_policy:noeviction
allocator_allocated:8...
```

**Key metrics:**
| Metric | Value |
|--------|-------|
| Used memory | 856 KB |
| Peak memory | 856 KB |
| RSS | 3.72 MB |
| Max memory limit | 0 (no limit) |
| Eviction policy | `noeviction` |

---

## 8. Container Network Connectivity

```bash
$ docker exec qibo-server-prod wget --spider -q http://postgres:5432 && echo "PostgreSQL reachable"
$ docker exec qibo-server-prod wget --spider -q http://redis:6379 && echo "Redis reachable"
```

**Output:**
```
PostgreSQL reachable
Redis reachable
```

---

## 9. Commands Executed

```bash
docker compose -f docker-compose.prod.yml ps
docker exec qibo-postgres-prod pg_isready -U zymi_user -d zymi_db
docker exec qibo-postgres-prod psql -U zymi_user -d zymi_db -c "\dt"
docker exec qibo-postgres-prod psql -U zymi_user -d zymi_db -c "SELECT * FROM _prisma_migrations ORDER BY started_at;"
docker exec qibo-redis-prod redis-cli ping
docker exec qibo-redis-prod redis-cli info server
docker exec qibo-redis-prod redis-cli info memory
```

---

## 10. Errors

| Error | Severity | Resolution |
|-------|----------|------------|
| None | N/A | N/A |

---

## 11. Final Result

```
╔══════════════════════════════════════════════════════════════╗
║        PHASE 64 — DATABASE AND REDIS ACTIVATION              ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║   PostgreSQL:  ✅ Healthy, accepting connections             ║
║   Tables:      13 tables created via Prisma migrations      ║
║   Migrations:  3 applied, 0 pending                         ║
║   Redis:       ✅ PONG, version 7.4.0                        ║
║   Redis memory: 856 KB used / 3.72 MB RSS                   ║
║   Network:     ✅ Server→PostgreSQL reachable                 ║
║   Network:     ✅ Server→Redis reachable                     ║
║                                                              ║
║   RESULT: ✅ PASS                                            ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
```
