# BUG-0001: Server health endpoint returns 500 when database connection pool is exhausted

**Reported:** 2026-06-02  
**Reported By:** Engineering Team  
**Severity:** P1 (High)  
**Status:** New

## Description
When the PostgreSQL connection pool is exhausted, the `/health/db` endpoint crashes
with an unhandled exception instead of returning a 503 status with a meaningful error message.

## Steps to Reproduce
1. Configure server with a small PostgreSQL connection pool (e.g., max 5 connections)
2. Open 10 concurrent connections to the database
3. Call `GET /health/db`
4. Observe 500 Internal Server Error instead of 503

## Expected Behavior
The health endpoint should return `{"status":"unhealthy","error":"Connection pool exhausted"}`
with a 503 status code.

## Actual Behavior
Returns HTTP 500 with no response body, crashing the health check monitoring.

## Environment
- **Server:** ZYMI Server v1.0.0
- **Database:** PostgreSQL 15
- **Node.js:** 20.x
- **OS:** Ubuntu 24.04

## Logs
```
[ERROR] TypeError: Cannot read properties of undefined (reading 'connected')
    at testConnection (/app/src/routes/healthRoutes.js:28)
```

## Notes
The `testConnection()` function in `healthRoutes.js` does not handle pool exhaustion
gracefully. Add a try-catch or check pool status before querying.
