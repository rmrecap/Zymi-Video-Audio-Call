# PHASE 37 — Real Server Core Flow Smoke Test Report

**Date:** 2026-06-02  
**Status:** PLAN WITH PARTIAL EXECUTION (requires database-backed server for most tests)

---

## Test Environment

| Detail | Value |
|--------|-------|
| Server | Local Node.js on port 5000 |
| Database | ❌ Not available (SQLite not compiled, PostgreSQL not configured) |
| API Base | `http://localhost:5000` |
| Browser | N/A (API-level testing) |
| Tool | curl.exe |

---

## Test Results

### TC-001: User Registration

| Field | Detail |
|-------|--------|
| **Test ID** | TC-001 |
| **Test Account** | smokeuser1, smoketest@example.com |
| **Steps** | `POST /api/register` with `{username, email, password, displayName}` |
| **Expected Result** | 201 Created, user object returned with JWT token |
| **Actual Result** | ❌ FAIL — Server returns 500 (database unavailable) |
| **Screenshot/Log** | `[DB] No database — registration failed` |

### TC-002: Email OTP Verification

| Field | Detail |
|-------|--------|
| **Test ID** | TC-002 |
| **Test Account** | smokeuser1 |
| **Steps** | Request OTP, then verify OTP |
| **Expected Result** | 200 OK, email verified |
| **Actual Result** | ❌ FAIL — Requires registration first (TC-001 blocked) |
| **Screenshot/Log** | Blocked by TC-001 |

### TC-003: Login

| Field | Detail |
|-------|--------|
| **Test ID** | TC-003 |
| **Test Account** | smokeuser1 |
| **Steps** | `POST /api/login` with credentials |
| **Expected Result** | 200 OK, JWT token returned |
| **Actual Result** | ❌ FAIL — Requires database (user lookup fails) |
| **Screenshot/Log** | DB unavailable |

### TC-004: Profile Update

| Field | Detail |
|-------|--------|
| **Test ID** | TC-004 |
| **Test Account** | smokeuser1 |
| **Steps** | `PATCH /api/profile/me` with updated display name |
| **Expected Result** | 200 OK, profile updated |
| **Actual Result** | ❌ FAIL — Requires auth + database |
| **Screenshot/Log** | Blocked by TC-001/TC-003 |

### TC-005: Private Message Send

| Field | Detail |
|-------|--------|
| **Test ID** | TC-005 |
| **Test Account** | smokeuser1, smokeuser2 |
| **Steps** | Socket.io emit `send_message` to another user |
| **Expected Result** | Message delivered, stored in DB |
| **Actual Result** | ❌ FAIL — Requires two registered users + DB |
| **Screenshot/Log** | Blocked by TC-001 |

### TC-006: Message Delivered Status

| Field | Detail |
|-------|--------|
| **Test ID** | TC-006 |
| **Steps** | Check message has `delivered: true` on recipient's receipt |
| **Expected Result** | Delivered status updated |
| **Actual Result** | ❌ FAIL — Blocked by TC-005 |

### TC-007: Message Seen Status

| Field | Detail |
|-------|--------|
| **Test ID** | TC-007 |
| **Steps** | Open conversation, mark messages as read |
| **Expected Result** | `seen: true` updated for sender |
| **Actual Result** | ❌ FAIL — Blocked by TC-005 |

### TC-008: Typing Indicator

| Field | Detail |
|-------|--------|
| **Test ID** | TC-008 |
| **Steps** | Socket.io emit `typing` event |
| **Expected Result** | Recipient receives `typing` event |
| **Actual Result** | ❌ FAIL — Requires socket connection with auth |
| **Screenshot/Log** | Blocked by TC-001/TC-003 |

### TC-009: Offline Message Sync

| Field | Detail |
|-------|--------|
| **Test ID** | TC-009 |
| **Steps** | Send message while recipient offline, then recipient logs in |
| **Expected Result** | Messages synced on login |
| **Actual Result** | ❌ FAIL — Requires two registered users + DB |
| **Screenshot/Log** | Blocked by TC-001 |

### TC-010: 1:1 Voice Call

| Field | Detail |
|-------|--------|
| **Test ID** | TC-010 |
| **Steps** | Initiate WebRTC voice call between two users |
| **Expected Result** | Call connects, audio flows |
| **Actual Result** | ❌ FAIL — Requires two authenticated socket connections |
| **Screenshot/Log** | Blocked by TC-001/TC-003 |

### TC-011: 1:1 Video Call

| Field | Detail |
|-------|--------|
| **Test ID** | TC-011 |
| **Steps** | Initiate WebRTC video call between two users |
| **Expected Result** | Call connects, video flows |
| **Actual Result** | ❌ FAIL — Blocked by TC-010 |
| **Screenshot/Log** | Blocked by TC-001/TC-003 |

### TC-012: Group Creation

| Field | Detail |
|-------|--------|
| **Test ID** | TC-012 |
| **Steps** | Create group with 3+ members |
| **Expected Result** | Group created, members added |
| **Actual Result** | ❌ FAIL — Requires auth + DB |
| **Screenshot/Log** | Blocked by TC-001 |

### TC-013: Group Message

| Field | Detail |
|-------|--------|
| **Test ID** | TC-013 |
| **Steps** | Send message in group |
| **Expected Result** | All members receive message |
| **Actual Result** | ❌ FAIL — Blocked by TC-012 |
| **Screenshot/Log** | Blocked by TC-001 |

### TC-014: Group Call

| Field | Detail |
|-------|--------|
| **Test ID** | TC-014 |
| **Steps** | Initiate group call |
| **Expected Result** | All members can join call |
| **Actual Result** | ❌ FAIL — Blocked by TC-010/TC-012 |
| **Screenshot/Log** | Blocked by TC-001 |

### TC-015: Media Upload

| Field | Detail |
|-------|--------|
| **Test ID** | TC-015 |
| **Steps** | Upload image file via `/api/upload/avatar` |
| **Expected Result** | 200 OK, file stored, URL returned |
| **Actual Result** | ❌ FAIL — Requires auth (returns 401) |
| **Screenshot/Log** | `curl /api/upload/avatar` → 401 Unauthorized |

### TC-016: Nearby Discovery

| Field | Detail |
|-------|--------|
| **Test ID** | TC-016 |
| **Steps** | Query nearby users via `/api/nearby` |
| **Expected Result** | List of nearby users returned |
| **Actual Result** | ❌ FAIL — Requires auth + DB |
| **Screenshot/Log** | Blocked by TC-001 |

### TC-017: Block User

| Field | Detail |
|-------|--------|
| **Test ID** | TC-017 |
| **Steps** | POST `/api/block/:userId` |
| **Expected Result** | User blocked |
| **Actual Result** | ❌ FAIL — Requires auth + DB |
| **Screenshot/Log** | Blocked by TC-001 |

### TC-018: Report User

| Field | Detail |
|-------|--------|
| **Test ID** | TC-018 |
| **Steps** | POST `/api/report/:userId` |
| **Expected Result** | Report submitted |
| **Actual Result** | ❌ FAIL — Requires auth + DB |
| **Screenshot/Log** | Blocked by TC-001 |

### TC-019: Admin Login

| Field | Detail |
|-------|--------|
| **Test ID** | TC-019 |
| **Test Account** | admin |
| **Steps** | `POST /api/admin/login` with admin credentials |
| **Expected Result** | 200 OK, admin JWT returned |
| **Actual Result** | ❌ FAIL — Requires database (admin lookup fails) |
| **Screenshot/Log** | DB unavailable, seed skipped |

### TC-020: Admin Ban/Unban

| Field | Detail |
|-------|--------|
| **Test ID** | TC-020 |
| **Steps** | POST `/api/admin/ban` and `/api/admin/unban` |
| **Expected Result** | User banned/unbanned |
| **Actual Result** | ❌ FAIL — Requires admin auth + DB |
| **Screenshot/Log** | Blocked by TC-019 |

### TC-021: Logout

| Field | Detail |
|-------|--------|
| **Test ID** | TC-021 |
| **Steps** | Invalidate JWT, disconnect socket |
| **Expected Result** | User logged out, socket disconnected |
| **Actual Result** | ❌ FAIL — Requires authenticated session first |
| **Screenshot/Log** | Blocked by TC-001/TC-003 |

---

## Summary

| Category | Total | Pass | Fail | Blocked |
|----------|-------|------|------|---------|
| Registration | 1 | 0 | 1 | 0 |
| OTP Verification | 1 | 0 | 0 | 1 |
| Login | 1 | 0 | 0 | 1 |
| Profile | 1 | 0 | 0 | 1 |
| Messaging | 4 | 0 | 0 | 4 |
| Typing | 1 | 0 | 0 | 1 |
| Calls | 2 | 0 | 0 | 2 |
| Groups | 3 | 0 | 0 | 3 |
| Media | 1 | 0 | 1 | 0 |
| Nearby | 1 | 0 | 0 | 1 |
| Block/Report | 2 | 0 | 0 | 2 |
| Admin | 2 | 0 | 0 | 2 |
| Logout | 1 | 0 | 0 | 1 |
| **Total** | **21** | **0** | **2** | **19** |

---

## Root Cause Analysis

All 21 tests fail or are blocked by one root cause:

> **No database (PostgreSQL or SQLite) available on the local host.**

The server starts and listens on port 5000, and the `/health` endpoint responds correctly. However:

1. `better-sqlite3` native addon could not be compiled for Node.js v24 on Windows (no prebuilt binary available)
2. PostgreSQL is not installed on this machine
3. Docker engine is unavailable (no hardware virtualization)

---

## Next Steps (When DB is Available)

```bash
# 1. Register user
curl -X POST http://localhost:5000/api/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser1","email":"test1@example.com","password":"Test123!","displayName":"Test User 1"}'

# 2. Login
curl -X POST http://localhost:5000/api/login \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser1","password":"Test123!"}'

# 3. Use JWT for subsequent requests
TOKEN="<jwt-from-login>"
curl http://localhost:5000/api/profile/me \
  -H "Authorization: Bearer $TOKEN"
```

**Overall: ❌ ALL TESTS FAIL OR BLOCKED** — Full smoke test requires a running database backend. The server application layer is confirmed running, but all data-dependent flows cannot be verified without PostgreSQL or SQLite.
