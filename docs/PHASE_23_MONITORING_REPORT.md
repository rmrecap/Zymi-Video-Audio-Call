# PHASE 23 — Monitoring Report

## Methodology

Monitoring infrastructure was audited through codebase analysis, configuration review, and tool evaluation. This report covers:

1. **Current monitoring** — what is being tracked today
2. **Logging infrastructure** — structured vs unstructured, log levels, rotation
3. **Metrics** — what should be measured vs what is measured
4. **Alerting** — current alerting capabilities vs requirements
5. **Dashboard recommendations** — Grafana dashboards for production

## Current Monitoring State

### What We Track Today

| Metric | Source | Method | Retention | Persistence |
|--------|--------|--------|-----------|-------------|
| Server uptime | `/health` endpoint | Manual curl only | None | In-memory |
| DB connectivity | `/health/db` | Manual curl only | None | In-memory (live check) |
| Redis connectivity | `/health/redis` | Manual curl only | None | In-memory (live check) |
| Connected clients | `/health/realtime` | Manual curl only | None | In-memory (live count) |
| Socket.io rooms | `/health/realtime` | Manual curl only | None | In-memory |
| PM2 process status | PM2 dashboard | `pm2 monit` / `pm2 list` | Until restart | PM2 internal |
| REST API errors | Express logs | `console.error` in catch blocks | Until rotation | Log files |
| Server start/stop | `console.log` | Manual inspection | Until rotation | Log files |

### What We DON'T Track (Critical Gaps)

| Metric | Why Important | How to Implement |
|--------|---------------|------------------|
| Request rate (RPS) | Capacity planning | Prometheus counter middleware |
| Response latency (p50/p95/p99) | Performance regression | Prometheus histogram middleware |
| Error rate (%) | Service health | Prometheus counter + error ratio |
| DB query latency | Database performance | pg client metrics |
| DB connection pool usage | Connection exhaustion | Pool stats middleware |
| Redis memory usage | Memory leaks | Redis INFO command |
| CPU/memory per container | Resource exhaustion | cAdvisor or Docker stats |
| Disk usage | Disk full prevention | Node.js `df` wrapper |
| SSL certificate expiry | Outage prevention | certbot status monitor |
| Active users (DAU/WAU) | Business metrics | Analytics pipeline |

## Logging Infrastructure

### Current State

```javascript
// Current logging pattern (unstructured)
console.log(`[SOCKET] User ${userId} connected (${connectedClients} total)`);
console.error('[AUTH] Token verification failed:', err.message);
console.warn('[RATE_LIMIT] Rate limit exceeded for IP:', ip);
```

**Problems**:
1. **Unstructured** — no JSON format, no log levels (info/warn/error/fatal)
2. **No correlation IDs** — cannot trace a single request across services
3. **No log shipping** — logs stay on the server, no centralized aggregation
4. **No log rotation** — PM2 logs grow unbounded, will fill disk
5. **No log parsing** — cannot search or filter logs programmatically

### Recommended Logging Structure

```javascript
// Structured logging (recommended)
const logger = {
  info: (message, meta = {}) => {
    console.log(JSON.stringify({
      level: 'info',
      timestamp: new Date().toISOString(),
      message,
      ...meta,
    }));
  },
  error: (message, meta = {}) => {
    console.error(JSON.stringify({
      level: 'error',
      timestamp: new Date().toISOString(),
      message,
      ...meta,
    }));
  },
  warn: (message, meta = {}) => {
    console.warn(JSON.stringify({
      level: 'warn',
      timestamp: new Date().toISOString(),
      message,
      ...meta,
    }));
  },
};
```

### Key Metrics from Codebase Audit

| Endpoint | Avg Latency (Estimated) | Error Rate (Estimated) | Volume (Estimated) |
|----------|-------------------------|------------------------|--------------------|
| `POST /api/login` | ~200ms (bcrypt) | ~5% (bad credentials) | High |
| `POST /api/register` | ~250ms (bcrypt + DB) | ~3% (validation errors) | Medium |
| `GET /api/users` | ~20ms | ~1% (auth failures) | Medium |
| `GET /api/conversations` | ~30ms (DB join) | ~2% (auth failures) | High |
| `POST /api/messages` | ~15ms (DB write) | ~1% | Very High |
| Socket.io `private-message` | ~10ms (in-memory) | ~0.5% (disconnect) | Very High |
| Socket.io `call:offer` | ~5ms (relay) | ~1% (user offline) | Low |
| `POST /api/upload` | ~500ms (file write) | ~2% (size/type) | Low |

## Prometheus Metrics Integration

### Recommended Metrics (using `prom-client`)

```javascript
// metrics.js - Prometheus metrics setup
import client from 'prom-client';

const collectDefaultMetrics = client.collectDefaultMetrics;
collectDefaultMetrics({ timeout: 5000 });

export const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'route', 'status'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
});

export const httpRequestTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total HTTP requests',
  labelNames: ['method', 'route', 'status'],
});

export const wsConnectionsGauge = new client.Gauge({
  name: 'ws_connections_current',
  help: 'Current WebSocket connections',
});

export const wsMessagesTotal = new client.Counter({
  name: 'ws_messages_total',
  help: 'Total WebSocket messages',
  labelNames: ['event'],
});

export const dbQueryDuration = new client.Histogram({
  name: 'db_query_duration_seconds',
  help: 'Database query duration in seconds',
  labelNames: ['query', 'operation'],
  buckets: [0.001, 0.01, 0.05, 0.1, 0.5, 1],
});

export const dbPoolSize = new client.Gauge({
  name: 'db_pool_size',
  help: 'Database connection pool size',
  labelNames: ['state'], // total, idle, active
});
```

### Prometheus Endpoint

```javascript
// Add to server/index.js
import client from 'prom-client';

app.get('/metrics', async (req, res) => {
  res.set('Content-Type', client.register.contentType);
  res.end(await client.register.metrics());
});
```

## Recommended Alerts

### Critical Alerts (P0)

| Alert | Condition | Response | Method |
|-------|-----------|----------|--------|
| Server down | `/health` returns non-200 for 1 min | Page on-call engineer | UptimeRobot/Pingdom |
| Error rate spike | 5xx rate > 5% for 5 min | Investigate logs | Prometheus AlertManager |
| High DB latency | p95 > 1s for 5 min | Check DB connections, slow queries | Prometheus AlertManager |
| Disk space < 10% | Usage > 90% | Clean up, add capacity | Node exporter + AlertManager |
| Redis down | `/health/redis` fails for 2 min | Restart Redis container | Prometheus AlertManager |

### Warning Alerts (P1)

| Alert | Condition | Response |
|-------|-----------|----------|
| High connection count | > 500 WebSocket connections | Check for DDoS or legitimate growth |
| High memory usage | > 400MB per server instance | Check for memory leak |
| SSL expiry < 30 days | Cert expires in < 30 days | Renew certificate |
| Backup failure | pg_dump exit code != 0 | Investigate backup script |
| Rate limiting spike | > 50% of requests rate limited | Check for brute force attack |

## Grafana Dashboard Layout

### Dashboard: ZYMI Production Overview

**Row 1: Service Health**
- Server uptime (stat)
- DB connectivity (stat, green/red)
- Redis connectivity (stat, green/red)
- SSL days to expiry (stat)

**Row 2: Request Metrics**
- HTTP requests per second (graph, by route)
- HTTP latency p50/p95/p99 (graph)
- HTTP error rate (graph, 5xx vs 4xx)
- Active WebSocket connections (graph)

**Row 3: Database**
- DB query latency (graph)
- DB connection pool usage (graph, total vs active)
- Slow queries counter (graph)
- Database size (stat)

**Row 4: System Resources**
- CPU usage per container (graph)
- Memory usage per container (graph)
- Disk usage (gauge, per volume)
- Network I/O (graph)

**Row 5: Business Metrics**
- Active users (graph, hourly)
- Messages sent (graph, hourly)
- Calls initiated (graph, hourly)
- New registrations (graph, daily)

## Tool Comparison

| Tool | Purpose | Cost | Complexity | Recommendation |
|------|---------|------|------------|---------------|
| Prometheus + Grafana | Metrics, dashboards, alerting | Free | Medium | ✅ Primary choice |
| Loki | Log aggregation | Free | Medium | ✅ For centralized logging |
| UptimeRobot | External uptime monitoring | Free tier (50 monitors) | Low | ✅ External health checks |
| Sentry | Error tracking | Free tier (5k events/mo) | Low | ✅ Error monitoring |
| DataDog | Full observability | Paid ($15/host/mo) | Low | Future upgrade option |
| New Relic | Full observability | Paid ($0.25/hr) | Low | Future upgrade option |

## Implementation Roadmap

### Phase 1 (Week 1 — Pre-Launch)

| Task | Effort | Dependencies |
|------|--------|-------------|
| Add `prom-client` dependency | 1 hr | None |
| Create `server/src/monitoring/metrics.js` | 4 hrs | None |
| Add `/metrics` endpoint to Express | 1 hr | metrics.js |
| Add HTTP request duration/error middleware | 2 hrs | metrics.js |
| Add WebSocket connection/message metrics | 2 hrs | metrics.js |
| Set up Prometheus + Grafana in docker-compose | 2 hrs | Docker compose |

### Phase 2 (Week 2)

| Task | Effort | Dependencies |
|------|--------|-------------|
| Add structured JSON logging | 4 hrs | None |
| Set up Loki + Promtail for log shipping | 2 hrs | Logging change |
| Create Grafana dashboards | 4 hrs | Prometheus data |
| Configure AlertManager rules | 2 hrs | Prometheus setup |
| Set up UptimeRobot monitors | 1 hr | Public endpoints |

### Phase 3 (Week 3)

| Task | Effort | Dependencies |
|------|--------|-------------|
| Add Sentry error tracking | 2 hrs | Sentry account |
| Add DB query latency metrics | 2 hrs | metrics.js |
| Add custom business metrics (DAU, messages) | 4 hrs | metrics.js |
| Configure alert notifications (Slack/Email) | 1 hr | AlertManager |
| Test all alerts trigger correctly | 2 hrs | Phase 2 complete |

## Production Readiness Score: **3.5/10**

| Category | Score | Reasoning |
|----------|-------|-----------|
| Current monitoring | 3/10 | Health endpoints exist but are not polled, no metrics |
| Logging | 4/10 | Unstructured console.log, no aggregation, no rotation |
| Metrics | 2/10 | Nothing measured beyond basic health |
| Alerting | 0/10 | Zero alerting configured |
| Dashboards | 1/10 | None |
| **Overall** | **3.5/10** | **Monitoring is the weakest area. No alerting = blind to failures.** |

**Immediate Action**: Add Prometheus + Grafana + structured logging before production launch. Without monitoring, you fly blind. Two weeks of focused effort brings this from 3.5 to 8/10.
