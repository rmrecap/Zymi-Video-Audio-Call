# PHASE 39 — Internal Test User Setup Report

**Date:** 2026-06-02  
**Status:** PLAN (user creation scripts prepared; requires database to execute)

---

## 1. Test Users

### User A — Basic Flow Tester

| Field | Value |
|-------|-------|
| Username | `tester_alpha` |
| Display Name | Tester Alpha |
| Email | `tester.alpha@zymi.internal` |
| Password | *(stored securely, not committed)* |
| Role | `user` |
| Purpose | Registration, login, profile, messaging |

### User B — Messaging Tester

| Field | Value |
|-------|-------|
| Username | `tester_beta` |
| Display Name | Tester Beta |
| Email | `tester.beta@zymi.internal` |
| Password | *(stored securely, not committed)* |
| Role | `user` |
| Purpose | Private messaging, group chat, typing indicators |

### User C — Call Tester

| Field | Value |
|-------|-------|
| Username | `tester_gamma` |
| Display Name | Tester Gamma |
| Email | `tester.gamma@zymi.internal` |
| Password | *(stored securely, not committed)* |
| Role | `user` |
| Purpose | Voice/video calls, media upload |

### User D — Content Tester

| Field | Value |
|-------|-------|
| Username | `tester_delta` |
| Display Name | Tester Delta |
| Email | `tester.delta@zymi.internal` |
| Password | *(stored securely, not committed)* |
| Role | `user` |
| Purpose | Nearby discovery, block/report, media sharing |

### Admin User — Moderation Tester

| Field | Value |
|-------|-------|
| Username | `admin_internal` |
| Display Name | Admin Internal |
| Email | `admin.internal@zymi.internal` |
| Password | *(stored securely, not committed)* |
| Role | `admin` |
| Purpose | Admin login, user management, ban/unban, audit logs |

> **Note:** Passwords are managed via a secure password manager. Only usernames and role mappings are documented here. No credentials are committed to the repository.

---

## 2. Test Groups

### Group 1 — Small Group Chat

| Field | Value |
|-------|-------|
| Group Name | `internal-chat-alpha` |
| Members | tester_alpha, tester_beta, tester_gamma |
| Purpose | Group messaging, typing indicators, read receipts |

### Group 2 — Call Test Group

| Field | Value |
|-------|-------|
| Group Name | `internal-call-test` |
| Members | tester_alpha, tester_gamma, tester_delta |
| Purpose | Group voice/video call testing |

### Group 3 — Media Test Group

| Field | Value |
|-------|-------|
| Group Name | `internal-media-test` |
| Members | tester_alpha, tester_beta |
| Purpose | Media upload and sharing |

---

## 3. User Creation Script

```sql
-- users.sql — Create internal test users
-- Passwords are hashed with bcrypt before insertion

-- User A
INSERT INTO users (username, display_name, email, password_hash, role, status, created_at)
VALUES ('tester_alpha', 'Tester Alpha', 'tester.alpha@zymi.internal', '<bcrypt_hash>', 'user', 'active', NOW());

-- User B
INSERT INTO users (username, display_name, email, password_hash, role, status, created_at)
VALUES ('tester_beta', 'Tester Beta', 'tester.beta@zymi.internal', '<bcrypt_hash>', 'user', 'active', NOW());

-- User C
INSERT INTO users (username, display_name, email, password_hash, role, status, created_at)
VALUES ('tester_gamma', 'Tester Gamma', 'tester.gamma@zymi.internal', '<bcrypt_hash>', 'user', 'active', NOW());

-- User D
INSERT INTO users (username, display_name, email, password_hash, role, status, created_at)
VALUES ('tester_delta', 'Tester Delta', 'tester.delta@zymi.internal', '<bcrypt_hash>', 'user', 'active', NOW());

-- Admin User
INSERT INTO users (username, display_name, email, password_hash, role, status, created_at)
VALUES ('admin_internal', 'Admin Internal', 'admin.internal@zymi.internal', '<bcrypt_hash>', 'admin', 'active', NOW());
```

---

## 4. Group Creation Script

```sql
-- groups.sql — Create internal test groups

-- Group 1: Small Chat
INSERT INTO groups (name, description, created_by, created_at)
VALUES ('internal-chat-alpha', 'Internal test group for chat features', 
  (SELECT id FROM users WHERE username = 'tester_alpha'), NOW());

-- Add members
INSERT INTO group_members (group_id, user_id, role, joined_at)
SELECT g.id, u.id, 'member', NOW()
FROM groups g, users u
WHERE g.name = 'internal-chat-alpha' AND u.username IN ('tester_alpha', 'tester_beta', 'tester_gamma');

-- Group 2: Call Test
INSERT INTO groups (name, description, created_by, created_at)
VALUES ('internal-call-test', 'Internal test group for call features',
  (SELECT id FROM users WHERE username = 'tester_alpha'), NOW());

INSERT INTO group_members (group_id, user_id, role, joined_at)
SELECT g.id, u.id, 'member', NOW()
FROM groups g, users u
WHERE g.name = 'internal-call-test' AND u.username IN ('tester_alpha', 'tester_gamma', 'tester_delta');

-- Group 3: Media Test
INSERT INTO groups (name, description, created_by, created_at)
VALUES ('internal-media-test', 'Internal test group for media features',
  (SELECT id FROM users WHERE username = 'tester_alpha'), NOW());

INSERT INTO group_members (group_id, user_id, role, joined_at)
SELECT g.id, u.id, 'member', NOW()
FROM groups g, users u
WHERE g.name = 'internal-media-test' AND u.username IN ('tester_alpha', 'tester_beta');
```

---

## 5. Execution Status

| Step | Status | Notes |
|------|--------|-------|
| Create User A | ⏳ PENDING | Requires database |
| Create User B | ⏳ PENDING | Requires database |
| Create User C | ⏳ PENDING | Requires database |
| Create User D | ⏳ PENDING | Requires database |
| Create Admin User | ⏳ PENDING | Requires database |
| Create Group 1 | ⏳ PENDING | Requires users first |
| Create Group 2 | ⏳ PENDING | Requires users first |
| Create Group 3 | ⏳ PENDING | Requires users first |
| Secure credential storage | ✅ READY | Passwords in password manager |
| Document usernames/roles | ✅ COMPLETE | This document |

---

## 6. Role Mapping Summary

| Username | Role | Primary Test Area |
|----------|------|-------------------|
| tester_alpha | user | Core flows, group admin |
| tester_beta | user | Messaging, media |
| tester_gamma | user | Calls, group chat |
| tester_delta | user | Discovery, moderation |
| admin_internal | admin | Admin panel, moderation |

**Status:** ⏳ PENDING EXECUTION — User creation requires a running database. Credentials are prepared but not yet inserted.
