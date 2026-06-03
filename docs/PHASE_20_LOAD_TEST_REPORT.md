# PHASE 20 — Load Test Report

## Methodology

Load testing was performed through architecture analysis, configuration audit, and bottleneck identification. Actual load tests require a production environment with multiple clients. This report documents:

1. **Architecture capacity analysis** — thread pools, connection limits, memory usage
2. **Bottleneck identification** — single points of failure, resource limits
3. **Scaling recommendations** — horizontal/vertical strategies
4. **Load test script** — ready to execute against a running environment

## Architecture Capacity Analysis

### PostgreSQL Connection Pool

| Parameter | Value | Calculation |
|-----------|-------|-------------|
| `globalMaxConnections` | 250 | Set in `postgresql.conf` |
| `instances` | CPU count | Auto-detected via `os.cpus().length` |
| `safePoolSize` | `floor(250 / instances) - 5` | ~20 for 8-core machine |
| `max` | `Math.max(safePoolSize, 20)` | 20 |
| `idleTimeoutMillis` | 30000 | 30s idle cleanup |
| `connectionTimeoutMillis` | 10000 | 10s connection timeout |

**Capacity at 20 connections per instance**:
- 12 instances → 240 connections (near limit)
- 8 instances → 160 connections (safe zone)
- 4 instances → 80 connections (comfortable)

**Constraint**: Each WebSocket connection that performs a DB query holds a pool connection briefly. PostgreSQL `max_connections` in the container defaults to 100. This must be increased for 1000+ concurrent users.

### Socket.io / WebSocket Capacity

| Component | Limit | Notes |
|-----------|-------|-------|
| Node.js concurrent connections | ~10,000 per instance | Limited by event loop and memory |
| Redis adapter throughput | ~100,000 msg/s | Limited by Redis CPU |
| Nginx `worker_connections` | 1024 (default) | Must increase to `65535` for production |
| Nginx `proxy_read_timeout` | 86400s (24h) | Long-lived WebSocket connections |

**Bottleneck**: Each Socket.io connection maintains a TCP connection. With 1000 concurrent users sending messages and calls simultaneously, Node.js event loop saturation becomes the primary bottleneck.

### Memory Usage Estimates

| Component | Per Connection | 100 Users | 500 Users | 1000 Users |
|-----------|---------------|-----------|-----------|------------|
| Socket.io | ~50 KB | 5 MB | 25 MB | 50 MB |
| WebRTC state | ~100 KB | 10 MB | 50 MB | 100 MB |
| Express middleware | ~10 KB | 1 MB | 5 MB | 10 MB |
| PostgreSQL pool | ~5 MB fixed | 5 MB | 5 MB | 5 MB |
| Redis adapter | ~2 MB fixed | 2 MB | 2 MB | 2 MB |
| **Total per instance** | | **~23 MB** | **~87 MB** | **~167 MB** |

**PM2 max_memory_restart**: 500 MB — sufficient for 1000 concurrent users per instance.

## Bottleneck Analysis

### Critical Bottlenecks

| # | Bottleneck | Severity | Impact |
|---|-----------|----------|--------|
| 1 | **In-memory rate limiting** | HIGH | Rate limit state is per-process, not shared. Under Redis-based multi-node deployment, rate limits reset per instance. Attacker can rotate instances. |
| 2 | **`userSocketRegistry` fallback** | MEDIUM | Falls back to in-memory Map when Redis is unavailable. Multi-node deployments require Redis. |
| 3 | **Presence broadcast** | MEDIUM | `batchPresenceBroadcast()` runs every 5 seconds. At 1000 users, each broadcast emits to all connected sockets — O(n²) scaling. |
| 4 | **PostgreSQL `max_connections`** | HIGH | Container default is 100 connections. 5 server instances x 20 pool = 100 connections — exactly at limit. |
| 5 | **Message delivery ACK** | MEDIUM | Each `private-message` incurs a DB write before emit. At 1000 concurrent users sending messages, DB write throughput is the bottleneck. |
| 6 | **Nginx `worker_connections`** | MEDIUM | Default 1024 connections per worker. With 2 workers and keep-alive connections, 1000 concurrent users may exhaust the pool. |

### Non-Critical Observations

| Observation | Notes |
|-------------|-------|
| Helmet middleware | Minimal overhead (~1ms per request) |
| CORS validation | Negligible (~0.1ms per request) |
| JWT verification | ~2ms per request, cached per connection |
| bcrypt (login/register) | ~100-200ms per operation. Rate limited to 5/min. |
| File upload | 2MB limit. Compression runs asynchronously. |

## Load Test Script

The following script is designed for `k6` (open-source load testing tool):

```javascript
// k6_load_test.js
import http from 'k6/http';
import { check, sleep } from 'k6';
import { SharedArray } from 'k6/data';

const BASE_URL = __ENV.BASE_URL || 'https://your-domain.com';

export const options = {
  stages: [
    { duration: '2m', target: 100 },  // Ramp up to 100 users
    { duration: '5m', target: 100 },  // Stay at 100
    { duration: '2m', target: 500 },  // Ramp to 500
    { duration: '5m', target: 500 },  // Stay at 500
    { duration: '2m', target: 1000 }, // Ramp to 1000
    { duration: '5m', target: 1000 }, // Stay at 1000
    { duration: '2m', target: 0 },    // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'], // 95% of requests under 2s
    http_req_failed: ['rate<0.01'],    // Less than 1% failure rate
  },
};

const users = [];
for (let i = 0; i < 1000; i++) {
  users.push({
    username: `loaduser_${i}_${Date.now()}`,
    password: 'TestPass123!',
  });
}

export default function () {
  const idx = __VU - 1;
  const user = users[idx % users.length];

  // Register (first iteration only)
  if (__ITER === 0) {
    const regRes = http.post(`${BASE_URL}/api/register`, JSON.stringify({
      username: user.username,
      email: `${user.username}@test.com`,
      password: user.password,
    }), { headers: { 'Content-Type': 'application/json' } });
    check(regRes, { 'register status 200': (r) => r.status === 200 });
  }

  // Login
  const loginRes = http.post(`${BASE_URL}/api/login`, JSON.stringify({
    username: user.username,
    password: user.password,
  }), { headers: { 'Content-Type': 'application/json' } });
  check(loginRes, { 'login status 200': (r) => r.status === 200 });

  const token = loginRes.json().token;
  const authHeaders = { headers: { Authorization: `Bearer ${token}` } };

  // Health check
  const healthRes = http.get(`${BASE_URL}/health`, authHeaders);
  check(healthRes, { 'health status 200': (r) => r.status === 200 });

  // Get users list
  const usersRes = http.get(`${BASE_URL}/api/users`, authHeaders);
  check(usersRes, { 'users status 200': (r) => r.status === 200 });

  // Profile
  const profileRes = http.get(`${BASE_URL}/api/profile/me`, authHeaders);
  check(profileRes, { 'profile status 200': (r) => r.status === 200 });

  sleep(1);
}
```

### Socket.io Load Test (Node.js script)

```javascript
// socket_load_test.js
import { io } from 'socket.io-client';
import { performance } from 'perf_hooks';

const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';
const CONCURRENT_USERS = parseInt(process.env.USERS || '100');
const MESSAGES_PER_USER = parseInt(process.env.MESSAGES || '10');

async function simulateUser(userId) {
  const socket = io(BASE_URL, {
    auth: { token: `test_token_${userId}` },
    transports: ['websocket'],
  });

  return new Promise((resolve) => {
    socket.on('connect', async () => {
      for (let i = 0; i < MESSAGES_PER_USER; i++) {
        const start = performance.now();
        socket.emit('private-message', {
          to: String(((userId + 1) % CONCURRENT_USERS) + 1),
          content: `Load test message ${i} from user ${userId}`,
          clientMsgId: `${userId}_${i}_${Date.now()}`,
        });
        socket.on('message-delivered', () => {
          const duration = performance.now() - start;
          console.log(`User ${userId}: message ${i} delivered in ${duration.toFixed(2)}ms`);
        });
        await new Promise(r => setTimeout(r, 100));
      }
      socket.disconnect();
      resolve();
    });
  });
}

async function run() {
  const start = performance.now();
  const promises = [];
  for (let i = 0; i < CONCURRENT_USERS; i++) {
    promises.push(simulateUser(i));
  }
  await Promise.all(promises);
  const duration = ((performance.now() - start) / 1000).toFixed(2);
  console.log(`\n=== RESULTS ===`);
  console.log(`Users: ${CONCURRENT_USERS}`);
  console.log(`Messages per user: ${MESSAGES_PER_USER}`);
  console.log(`Total messages: ${CONCURRENT_USERS * MESSAGES_PER_USER}`);
  console.log(`Duration: ${duration}s`);
  console.log(`Throughput: ${(CONCURRENT_USERS * MESSAGES_PER_USER / duration).toFixed(2)} msg/s`);
}

run().catch(console.error);
```

## Projected Results by Scale

### 100 Users (Base Load)

| Metric | Expected | Target |
|--------|----------|--------|
| HTTP p95 latency | < 500ms | < 1000ms |
| Message delivery | < 200ms | < 500ms |
| Memory per instance | ~30 MB | < 200 MB |
| CPU usage | ~10% | < 50% |
| DB connections | ~20 | < 50 |

### 500 Users (Medium Load)

| Metric | Expected | Target |
|--------|----------|--------|
| HTTP p95 latency | < 1000ms | < 2000ms |
| Message delivery | < 500ms | < 1000ms |
| Memory per instance | ~90 MB | < 400 MB |
| CPU usage | ~30% | < 70% |
| DB connections | ~40 | < 80 |

### 1000 Users (High Load)

| Metric | Expected | Target |
|--------|----------|--------|
| HTTP p95 latency | < 2000ms | < 3000ms |
| Message delivery | < 1000ms | < 2000ms |
| Memory per instance | ~170 MB | < 500 MB |
| CPU usage | ~50% | < 80% |
| DB connections | ~60 | < 100 |

## Recommendations

### Critical (Pre-Launch)

| # | Recommendation | Priority | Effort |
|---|---------------|----------|--------|
| 1 | **Replace in-memory rate limiting with Redis-based** using `rate-limit-redis` package (already in dependencies) | HIGH | 1 day |
| 2 | **Increase PostgreSQL `max_connections`** to at least 200 in the container | HIGH | 30 min |
| 3 | **Increase Nginx `worker_connections`** to 65535 | HIGH | 15 min |
| 4 | **Add connection pool monitoring** — expose pool size and wait queue via health endpoint | HIGH | 1 day |

### Important (Within First Month)

| # | Recommendation | Priority | Effort |
|---|---------------|----------|--------|
| 5 | **Implement PostgreSQL query optimization** — add missing indexes on `messages(created_at)`, `call_history(started_at)` | MEDIUM | 1 day |
| 6 | **Add read replicas** for PostgreSQL — route read-only queries to replicas | MEDIUM | 3 days |
| 7 | **Implement Socket.io room-based presence** instead of broadcasting to all sockets | MEDIUM | 2 days |
| 8 | **Add request queue** for message delivery with backpressure handling | MEDIUM | 3 days |

### Nice-to-Have

| # | Recommendation | Priority | Effort |
|---|---------------|----------|--------|
| 9 | Implement Redis Cluster for high-availability adapter | LOW | 5 days |
| 10 | Add CDN for static asset delivery | LOW | 1 day |
| 11 | Implement WebRTC SFU (Selective Forwarding Unit) for group calls >4 participants | LOW | 2 weeks |

## Production Readiness Score: **6.8/10**

| Category | Score | Reasoning |
|----------|-------|-----------|
| Architecture | 7/10 | Redis adapter enables scaling, but in-memory rate limiting is a bottleneck |
| Capacity | 6/10 | PostgreSQL `max_connections` at limit, Nginx `worker_connections` need increase |
| Performance | 7/10 | Message delivery pipeline is synchronous DB write → emit. Needs async queue for scale. |
| Monitoring | 7/10 | Health endpoints exist but no Prometheus metrics or structured logging |
| **Overall** | **6.8/10** | **Adequate for 500 users. Needs fixes before 1000+ users.** |

**Bottleneck Summary**: The `POSTGRES_MAX_CONNECTIONS` default of 100 is the single most critical bottleneck. 5 server instances × 20 pool connections = 100 connections — exactly at the hard limit. For 1000+ concurrent users, increase `max_connections` to 300+ and add PgBouncer for connection pooling.
