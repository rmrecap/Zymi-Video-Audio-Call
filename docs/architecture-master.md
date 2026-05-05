# ZYMI Architecture Master Document

> **Single source of truth** for the ZYMI Real-Time Communication Ecosystem.
> Aligned with the [Sequential Development Roadmap](../todo.md) and [Features Flow](../features-flow.md).

---

## 1. System Overview

ZYMI is a premium, high-concurrency real-time communication platform. It spans three client surfaces backed by a horizontally scalable, unified backend ecosystem.

```text
┌─────────────────┐   ┌──────────────────┐   ┌─────────────────────┐
│  React (Vite)   │   │  Flutter (Dart)  │   │  ZRCS Admin Panel   │
│  Web Client     │   │  Mobile App      │   │  (React Module)     │
└────────┬────────┘   └────────┬─────────┘   └──────────┬──────────┘
         │  HTTPS / WSS        │  HTTPS / WSS           │  HTTPS
         └─────────┬───────────┴────────────────────────┘
                   ▼
         ┌─────────────────────┐
         │  Nginx Reverse      │ (TLS Termination, Load Balancing,
         │  Proxy              │  WSS Upgrade, Static Assets)
         └─────────┬───────────┘
                   ▼
     ┌─────────────┴──────────────┐
     │                            │
┌────▼─────────────┐        ┌─────▼────────────┐
│ Node.js Node A   │        │ Node.js Node B   │ (Express + Socket.io)
└────┬───────────┬─┘        └─┬────────────┬───┘
     │           │            │            │
     │     ┌─────▼────────────▼─────┐      │
     │     │      Redis Cluster     │      │ (Pub/Sub + Socket Registry)
     │     └────────────────────────┘      │
     │                                     │
     │     ┌────────────────────────┐      │
     └────►│  PostgreSQL (Primary)  │◄─────┘ (Persistent Data + PostGIS)
           └────────────────────────┘

           ┌────────────────────────┐
           │     Coturn Server      │ (STUN/TURN for WebRTC NAT Traversal)
           └────────────────────────┘
```

---

## 2. Technology Stack & Service Roles

Each component in the ZYMI ecosystem serves a strictly defined role to ensure modularity and scalability.

| Layer | Technology | Specific Role & Integration |
|---|---|---|
| **Web Frontend** | React 18 + Vite | Serves the main SPA. Vite provides fast HMR during dev and optimized rollup builds for production. Communicates via REST (Axios) and WebSocket (Socket.io-client). |
| **Mobile Client** | Flutter 3 + Dart | Compiles to native Android/iOS. Uses `socket_io_client` for real-time and `flutter_webrtc` for native media streams. Shares the exact same backend endpoints and socket event contract as the Web Client. |
| **Admin Panel** | React (ZRCS) | Isolated module for system governance, user moderation, analytics, and remote ad-control management. Uses strict role-based JWT auth. |
| **API / Real-time** | Node.js + Express | Serves RESTful APIs and hosts the Socket.io server. Handles business logic, JWT validation, and geospatial queries. Designed to run as stateless, horizontally scalable instances. |
| **Database** | PostgreSQL | Persistent source of truth. Handles complex relational data (users, chat history, call logs) and utilizes PostGIS / `earthdistance` extensions for highly optimized "Nearby" radius queries. |
| **State & Pub/Sub** | Redis 7 | Resolves the multi-node concurrency problem. Acts as the Socket.io adapter (routing messages between nodes) and stores the high-speed `userSocketRegistry`. |
| **Reverse Proxy** | Nginx | The frontline gateway. Handles SSL/TLS termination, routes `/api` to Node.js, upgrades `Connection: Upgrade` headers for WebSockets (`wss://`), and serves static Vite assets. |
| **NAT Traversal** | Coturn | Essential for WebRTC. Provides STUN for clients to discover their public IPs, and TURN to act as a media relay when strict firewalls/symmetric NATs block direct P2P connections. |

---

## 3. High-Concurrency Real-Time Messaging

ZYMI is engineered to handle high-concurrency messaging without dropping events, even across multiple server nodes.

### 3.1 The Multi-Node Problem
When User A is connected to **Node A**, and User B is connected to **Node B**, Node A cannot directly access User B's socket to send a message.

### 3.2 The Redis Solution
1. **Socket.io Redis Adapter:** All Socket.io instances use the Redis adapter. When Node A wants to emit an event to User B's specific room, it publishes the event to Redis. Redis immediately broadcasts it to Node B, which pushes it to User B.
2. **User Socket Registry (`userSocketRegistry.js`):** We map `userId → socketId` dynamically.
   * On connection, `userId: X` is stored in Redis mapped to their active `socketId`.
   * When sending a private message, the system looks up the destination `socketId` in Redis and emits the event.
3. **Room-Based Presence:** To handle multiple tabs/devices for the same user, the user is added to a Socket.io room named after their `userId`. Messages sent to this room hit all active devices simultaneously.

---

## 4. Feature Data Flows

*(For detailed step-by-step logic, refer to [features-flow.md](../features-flow.md))*

### 4.1 Registration & Auth
* **Flow:** Client → Express REST → bcryptjs → PostgreSQL → JWT.
* **Security:** Passwords never logged; tokens securely stored; OTP ensures identity verification.

### 4.2 "Nearby" Geospatial Discovery
* **Flow:** Client (lat/lng) → Express REST → Postgres (`earthdistance`) → Location Fuzzing → Client.
* **Optimization:** PostgreSQL indexes spatial data to make radius lookups `O(log N)` rather than scanning the whole table.

### 4.3 Chat & Message Status
* **Flow:** Client → Socket.io (WSS) → Node.js → Redis Adapter (if needed) → Peer Client.
* **State Machine:** `pending` (client UI) → `sent` (saved in DB) → `delivered` (socket ack from recipient) → `seen` (user opened chat).

### 4.4 WebRTC Calling
* **Signaling (Socket.io):** `call-user` → `incoming-call` → `call-answer` → SDP Exchange → ICE Candidates.
* **Media Transport (WebRTC):** Direct UDP stream between peers. If direct connection fails (due to NAT), Coturn steps in as a TCP/UDP relay.

---

## 5. Socket.io and WebRTC Co-Existence

Socket.io and WebRTC serve fundamentally different roles but are tightly coupled during call flows:

```text
┌────────────────────────────────────────────────────────────┐
│                    Socket.io (Always On)                    │
│  Transport: WebSocket (upgrades from HTTP long-polling)    │
│  Purpose: Handshake, Chat, Presence, Call Signaling (SDP)  │
└────────────────────────────────────────────────────────────┘
                              ▼ (Bootstraps)
┌────────────────────────────────────────────────────────────┐
│                   WebRTC (On Demand)                        │
│  Transport: UDP (SRTP media) / TCP fallback via TURN       │
│  Purpose: Peer-to-Peer Audio and Video streams             │
└────────────────────────────────────────────────────────────┘
```
**Key principle:** Socket.io is the permanent control channel. WebRTC is the temporary media channel. Socket.io bootstraps every WebRTC session and cleans up after it.

---

## 6. Client Integration Architecture

### 6.1 React Web Client (`client/`)
* **Context:** `AuthContext` holds JWT; `SocketContext` manages the singleton Socket.io connection.
* **Routing:** React Router DOM.
* **Media:** Native browser `navigator.mediaDevices.getUserMedia`.

### 6.2 Flutter Mobile App (`mobile/zymi_mobile_app/`)
* **State:** Providers / GetX / BLoC for state management.
* **Sockets:** `socket_io_client` customized via `ZymiSocketClient`.
* **Media:** `flutter_webrtc` plugin bridges native Android/iOS WebRTC APIs to Dart.

### 6.3 Shared Contract
Both clients **must** use identical Socket.io event names. The contract is defined in `zymi_socket_event_names.dart` and `socket-master.md`.

---

## 7. Security Model & Deployment

* **Authentication:** JWT tokens via HTTP headers and Socket.io `auth` payloads.
* **Rate Limiting:** `express-rate-limit` prevents brute-force API attacks. Socket event throttlers prevent socket spam.
* **Privacy:** Phone numbers are strictly internal. Locations are fuzzed.
* **Deployment:** Docker Compose manages `nginx`, `server`, `postgres`, `redis`, and `coturn` containers. PM2 serves as a node process manager fallback.

---

## 8. Hard Locks & Invariants

These rules are inviolable across all development phases:

1. **Socket event names are frozen.** Any rename requires synchronized updates across Web, Mobile, and Backend layers.
2. **WebRTC flow is frozen.** The Offer → Answer → ICE candidate exchange structure must not be modified.
3. **No external auth providers.** All auth, OTP, and verification logic is self-hosted (No Firebase Auth).
4. **No external redirects.** Phone lookups and all user actions stay strictly within the ZYMI ecosystem.
5. **No breaking mobile changes.** Every backend change must preserve the Flutter socket contract.
6. **Additive-only development.** New features extend via modules and services. Core flows are never rewritten.
