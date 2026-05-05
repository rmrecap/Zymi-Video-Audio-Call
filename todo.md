# ZYMI — Master Development Checklist

> **Single source of truth** for all development phases.
> Tasks are strictly sequential — each phase depends on the completion of preceding phases.
> Aligned with [architecture-master.md](docs/architecture-master.md).

---

## Phase 0: Cleanup & Sanitization

*Goal: Eliminate all legacy artifacts, enforce consistent naming, and establish a clean workspace.*

- [x] **0.1** Rename all internal references from legacy names ("Ovyo", etc.) to "ZYMI" across codebase and docs.
- [x] **0.2** Remove obsolete/duplicate documentation files and consolidate into master docs.
- [x] **0.3** Purge stale SQLite database files (`ovyo.db`, `zymi.db` in `server/src/`) from active use.
- [x] **0.4** Standardize file naming conventions across `client/`, `server/`, `mobile/`, and `docs/`.
- [x] **0.5** Consolidate scattered doc fragments into master files (`architecture-master.md`, `zrcs-master.md`, `socket-master.md`, `webrtc-master.md`, `postgres-master.md`).
- [x] **0.6** Establish `.gitignore` rules for `node_modules/`, `.env`, build artifacts, and IDE files.
- [ ] **0.7** Audit and remove dead code paths, unused imports, and orphaned components in `client/src/` and `server/src/`.
- [ ] **0.8** Verify all environment variable templates (`.env.example`, `.env.production.example`) are current and complete.

---

## Phase 1: Architecture Planning & Structural Lock

*Goal: Define and lock the system architecture, directory structure, and integration contracts.*
*Prerequisite: Phase 0 complete.*

- [x] **1.1** Finalize the three-surface architecture diagram (React Web, Flutter Mobile, ZRCS Admin Panel → Node.js backend).
- [x] **1.2** Document the Socket.io / WebRTC responsibility split and co-existence model.
- [x] **1.3** Define and freeze the Socket.io event contract (see `zymi_socket_event_names.dart` and `chatSocket.js`).
- [x] **1.4** Document the call lifecycle: Socket.io signaling → WebRTC negotiation → media stream → teardown.
- [x] **1.5** Lock the client directory structures for `client/src/` and `mobile/zymi_mobile_app/lib/`.
- [x] **1.6** Lock the backend module structure (`server/src/modules/`, `server/src/routes/`, `server/src/socket/`).
- [x] **1.7** Establish Hard Lock invariants (frozen events, frozen WebRTC flow, no external auth, no external redirects, additive-only development).
- [x] **1.8** Define the REST API surface and route groupings (Auth, Users, Messages, Calls, Nearby, Profile, OTP, TURN, Admin, Health).
- [ ] **1.9** Create a formal API versioning strategy (e.g., `/api/v1/` prefix for mobile-facing endpoints).
- [ ] **1.10** Document error response contract (standard error shapes across all endpoints).

---

## Phase 2: Database Design & Migration

*Goal: Establish a production-grade PostgreSQL schema with proper indexing, migrations, and data integrity.*
*Prerequisite: Phase 1 architectural decisions locked.*

- [x] **2.1** Design the core PostgreSQL schema: `users`, `messages`, `call_history`, `blocked_users`, `message_reports`.
- [x] **2.2** Design auth & security tables: `otp_tokens`, `email_settings`, `auth_audit_logs`.
- [x] **2.3** Design gamification tables: `user_points`, `badges`, `user_badges`.
- [x] **2.4** Design admin tables: `admin_audit_logs`, `metrics`.
- [x] **2.5** Design ZRCS ad-control tables: `ad_global_settings`, `ad_network_configs`, `ad_placements`, `ad_country_rules`, `ad_version_rules`, `ad_config_audit_logs`.
- [x] **2.6** Write initial migration SQL (`server/migrations/postgres/001_initial_schema.sql`).
- [x] **2.7** Build SQLite → PostgreSQL data migration script (`server/scripts/migrate-sqlite-to-postgres.js`).
- [x] **2.8** Add `phone_normalized` column and index on `users` for internal phone lookup.
- [ ] **2.9** Run and verify full data migration with row-count validation across all tables.
- [ ] **2.10** Add PostGIS / `earthdistance` extension and spatial index on `users` for Nearby queries.
- [ ] **2.11** Implement automated migration versioning system (sequential numbered migrations).
- [ ] **2.12** Set up automated `pg_dump` backup schedule via cron (daily at 02:00).
- [ ] **2.13** Test and document the emergency restore procedure end-to-end.

---

## Phase 3: Authentication & Security Baseline

*Goal: Harden the auth system and establish secure session management.*
*Prerequisite: Phase 2 database ready.*

- [x] **3.1** Implement JWT-based authentication (login, register, logout).
- [x] **3.2** Implement bcryptjs password hashing with proper salt rounds.
- [x] **3.3** Implement self-hosted OTP verification (AES-256-CBC encrypted, 5-minute expiry).
- [x] **3.4** Implement `socketAuthGuard.js` — JWT validation on every Socket.io connection.
- [x] **3.5** Implement phone number normalization and internal-only lookup API (`POST /api/users/lookup-phone`).
- [x] **3.6** Add in-memory rate limiting on phone lookup to prevent enumeration.
- [ ] **3.7** Implement JWT refresh token rotation for long-lived sessions.
- [ ] **3.8** Add brute-force protection on login endpoint (account lockout after N failures).
- [ ] **3.9** Implement password reset flow with OTP verification.
- [ ] **3.10** Audit all endpoints to ensure no private metadata (email, IP, raw tokens) leaks to clients.

---

## Phase 4: Core Features — Real-Time Chat

*Goal: Build a production-stable real-time messaging system with full delivery guarantees.*
*Prerequisite: Phase 3 auth and Phase 2 database complete.*

### 4A: Socket.io Baseline
- [x] **4A.1** Establish Socket.io server with JWT auth handshake.
- [x] **4A.2** Implement `private-message` event for 1-on-1 chat.
- [x] **4A.3** Implement `typing-start` / `typing-stop` indicators.
- [x] **4A.4** Implement `userSocketRegistry.js` — in-memory `userId → socketId` mapping.
- [ ] **4A.5** Implement reliable multi-tab presence synchronization (room-based socket grouping).
- [ ] **4A.6** Implement custom rich user statuses ("Available", "Busy", "In a call").
- [ ] **4A.7** Optimize online/offline state broadcasting across connected clients.

### 4B: Message Delivery & Status
- [x] **4B.1** Implement message persistence to PostgreSQL on send.
- [x] **4B.2** Implement message status workflow: `pending → sent → delivered → seen | failed`.
- [ ] **4B.3** Implement `message-delivered` acknowledgment when recipient receives message.
- [ ] **4B.4** Implement `message-seen` read receipts with bulk-mark-as-read.
- [ ] **4B.5** Implement offline message queuing for reliable delivery when recipient reconnects.
- [ ] **4B.6** Implement message retry mechanism with exponential backoff for failed sends.

### 4C: Media & Advanced Chat
- [ ] **4C.1** Implement file/media attachment uploads with progress indicators.
- [ ] **4C.2** Implement client-side image compression before upload.
- [ ] **4C.3** Implement end-to-end encryption (E2EE) for private 1-on-1 messaging.
- [ ] **4C.4** Design and build group chat architecture (create group, add/remove members, group messaging).
- [ ] **4C.5** Implement unread message badges and real-time message previews in the sidebar.

---

## Phase 5: Core Features — Voice & Video Calling

*Goal: Build reliable 1-on-1 and group calling with NAT traversal and bandwidth adaptation.*
*Prerequisite: Phase 4A socket baseline must be stable.*

### 5A: 1-on-1 Calls
- [x] **5A.1** Implement WebRTC signaling via Socket.io (`call-user`, `incoming-call`, `call-answer`, `call-reject`).
- [x] **5A.2** Implement SDP Offer/Answer exchange through the signaling channel.
- [x] **5A.3** Implement ICE candidate relay via Socket.io (`ice-candidate` event).
- [x] **5A.4** Implement call state machine (`callState.js`) with proper lifecycle management.
- [x] **5A.5** Implement `end-call` / `call-ended` synchronization with automatic cleanup on tab closure.
- [ ] **5A.6** Finalize Coturn (STUN/TURN) production deployment for high NAT traversal success.
- [ ] **5A.7** Implement bandwidth adaptation and connection fallback for poor network conditions.
- [ ] **5A.8** Add call duration tracking and call history persistence to PostgreSQL.

### 5B: Group Calls
- [ ] **5B.1** Enhance WebRTC signaling to support multi-peer connections (mesh or SFU evaluation).
- [ ] **5B.2** Implement group call UI with multiple video tiles and participant management.
- [ ] **5B.3** Implement group call state synchronization across all participants.

---

## Phase 6: Geospatial "Nearby" Features

*Goal: Enable location-based peer discovery with privacy safeguards.*
*Prerequisite: Phase 2 (PostGIS setup) and Phase 4A (socket baseline).*

- [ ] **6.1** Set up PostGIS indexing on `users` table for geospatial queries.
- [ ] **6.2** Implement server-side geospatial querying logic with radius-based search.
- [ ] **6.3** Implement location fuzzing/masking — precise coordinates never reach the client.
- [ ] **6.4** Build Nearby discovery UI (map view + list view) in React web client.
- [ ] **6.5** Implement proximity-based notifications for newly nearby users.

---

## Phase 7: Admin Panel & Governance (ZRCS)

*Goal: Build a comprehensive admin dashboard for user management, moderation, analytics, and ad control.*
*Prerequisite: Phase 3 (Auth) and Phase 4A (Socket baseline).*

### 7A: Admin Dashboard Core
- [x] **7A.1** Build the ZRCS Admin Dashboard shell with glassmorphism dark UI.
- [x] **7A.2** Implement admin authentication with role-based access (`requireAdmin` middleware).
- [x] **7A.3** Implement the User Management panel (list, search, ban/restrict, view details).
- [x] **7A.4** Implement Audit Logs viewer (admin actions, auth events).
- [x] **7A.5** Implement system metrics dashboard (active users, message volume, call stats).
- [x] **7A.6** Implement Structure Lock panel for architectural governance enforcement.

### 7B: Content Moderation
- [x] **7B.1** Implement message reporting flow (user-facing report dialog → backend queue).
- [ ] **7B.2** Build admin review queue for reported messages with approve/dismiss/ban actions.
- [ ] **7B.3** Implement admin ban/restrict workflows with Socket.io `banned` notification.

### 7C: Ad Control System (ZRCS)
- [x] **7C.1** Implement `GET /api/v1/ad-settings` public endpoint for mobile app config fetch.
- [x] **7C.2** Implement admin CRUD endpoints for global settings, network configs, placements.
- [x] **7C.3** Implement the Ad Control Center UI (`AdControlCenter.jsx`) with sections for Global, Networks, Placements, Geo, and Versioning.
- [x] **7C.4** Implement master kill-switch logic and audit logging for all config changes.
- [x] **7C.5** Lock the ZRCS API contract (v1.0) — response shape, safe defaults, frequency caps.
- [ ] **7C.6** Implement geo-fencing rules (country-level ad disable/override).
- [ ] **7C.7** Implement app-version targeting rules for ad policy enforcement.

### 7D: Advanced Governance
- [ ] **7D.1** Implement gamification engine — server-side point/badge calculation and admin controls.
- [ ] **7D.2** Implement Project Brain dashboard for AI-assisted risk analysis.
- [ ] **7D.3** Implement QA Gate panel for release readiness verification.
- [ ] **7D.4** Implement Reports panel with data export (hardened against SQL injection).

---

## Phase 8: Flutter Mobile Integration

*Goal: Port the full ZYMI experience to Flutter, reusing the backend unchanged.*
*Prerequisite: Phases 4–5 (Chat + Calls) must be production-stable on web.*

### 8A: Foundation
- [x] **8A.1** Set up Flutter project structure with Cyber Premium design tokens.
- [x] **8A.2** Implement `AuthService` with JWT token persistence via `secure_storage`.
- [x] **8A.3** Implement `ZymiSocketClient` — Socket.io connection with JWT auth header.
- [x] **8A.4** Implement `ZymiPresenceService` for online/offline tracking.
- [x] **8A.5** Implement `ZymiReconnectGuard` for automatic reconnection logic.

### 8B: Chat
- [x] **8B.1** Implement `ZymiChatSocketService` for `private-message` send/receive.
- [x] **8B.2** Build native chat UI screens (ConversationList, ChatScreen, MessageBubble).
- [x] **8B.3** Implement `AttachmentHub` for media sharing in chat.
- [ ] **8B.4** Implement offline message queue and retry logic on mobile.
- [ ] **8B.5** Implement push notification delivery for incoming messages (socket-first).

### 8C: Calls
- [x] **8C.1** Implement `CallSignalingService` with Socket.io call event handling.
- [x] **8C.2** Implement `PeerConnectionService` using `flutter_webrtc`.
- [x] **8C.3** Build IncomingCallScreen and LiveCallScreen with premium UI.
- [x] **8C.4** Implement `CallController` state machine with proper lifecycle management.
- [x] **8C.5** Implement `ZymiCallEventGuard` for call signaling safety.
- [ ] **8C.6** Implement background call handling and call-keep integration.
- [ ] **8C.7** Implement push notification delivery for incoming calls (socket-first).

### 8D: Additional Features
- [ ] **8D.1** Port Nearby discovery UI to Flutter using the geospatial API from Phase 6.
- [ ] **8D.2** Implement Phone Action Guard — intercept phone clicks, route to internal ZYMI chat.
- [ ] **8D.3** Implement ZRCS Mobile Runtime Adapter (ad config fetch, 4h cache, placement guards).
- [ ] **8D.4** Implement `AdPlacementGuard` — block ads during calls, typing, and signaling.

---

## Phase 9: DevOps & Horizontal Scaling

*Goal: Prepare the infrastructure for multi-node production deployment.*
*Prerequisite: Phases 4–5 functionally complete.*

- [ ] **9.1** Enable Socket.io Redis adapter for multi-node event broadcasting (Pub/Sub).
- [ ] **9.2** Deploy Redis-backed `userSocketRegistry` for cross-node user routing.
- [ ] **9.3** Finalize `docker-compose.prod.yml` with non-root containers, health checks, and volume mounts.
- [ ] **9.4** Configure Nginx reverse proxy for HTTPS termination, WebSocket upgrade (`wss://`), and static asset serving.
- [ ] **9.5** Set up CI/CD pipeline for automated build, test, and deploy (server + client).
- [ ] **9.6** Implement structured logging and production observability (health endpoints, metrics export).
- [ ] **9.7** Configure PM2 process management as Docker fallback.

---

## Phase 10: Security Hardening

*Goal: Harden every layer of the stack before public exposure.*
*Prerequisite: Phase 7 (Admin) and Phase 9 (DevOps) in place.*

- [ ] **10.1** Deploy SSL/TLS certificates via Certbot; enforce HTTPS for `getUserMedia` and WSS for sockets.
- [ ] **10.2** Apply per-route and per-socket rate limiting to prevent spam and enumeration attacks.
- [ ] **10.3** Harden all admin data export and query endpoints against SQL injection.
- [ ] **10.4** Implement CORS policy enforcement across all API surfaces.
- [ ] **10.5** Audit all `req.body` / `req.params` inputs for validation and sanitization.
- [ ] **10.6** Conduct full-stack penetration testing across API, Socket.io, and WebRTC layers.
- [ ] **10.7** Implement Content Security Policy (CSP) headers for the web client.

---

## Phase 11: Production Launch

*Goal: Deploy, verify, and go live.*
*Prerequisite: ALL previous phases verified and pass QA gates.*

- [ ] **11.1** Deploy the full ZYMI stack to the production VPS environment.
- [ ] **11.2** Run the Coturn TURN/STUN validation against the production VPS.
- [ ] **11.3** Execute the full-system regression QA matrix on production infrastructure.
- [ ] **11.4** Build signed AAB, prepare store assets, and submit to Google Play.
- [ ] **11.5** Execute production smoke test across web + mobile (two-device call, cross-platform chat).
- [ ] **11.6** Remove feature flags, enable public registration, and monitor observability dashboards.
- [ ] **11.7** Activate automated backup verification and rollback drill on production.

---

## Progress Summary

| Phase | Name | Total | Done | Remaining |
|-------|------|-------|------|-----------|
| 0 | Cleanup & Sanitization | 8 | 6 | 2 |
| 1 | Architecture Planning | 10 | 8 | 2 |
| 2 | Database Design | 13 | 8 | 5 |
| 3 | Authentication & Security | 10 | 6 | 4 |
| 4 | Core — Chat | 18 | 6 | 12 |
| 5 | Core — Calling | 11 | 5 | 6 |
| 6 | Nearby Features | 5 | 0 | 5 |
| 7 | Admin Panel (ZRCS) | 17 | 11 | 6 |
| 8 | Flutter Mobile | 17 | 11 | 6 |
| 9 | DevOps & Scaling | 7 | 0 | 7 |
| 10 | Security Hardening | 7 | 0 | 7 |
| 11 | Production Launch | 7 | 0 | 7 |
| **Total** | | **130** | **61** | **69** |

