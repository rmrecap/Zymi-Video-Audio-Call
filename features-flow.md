# ZYMI Features Flow Diagram

This document illustrates the step-by-step logic of how a user progresses from initial registration to utilizing advanced features like "Nearby" discovery and "WebRTC Calls." It details the data flow between the Frontend (React/Flutter), Socket.io real-time layer, and the Node.js/PostgreSQL Backend.

---

## 1. Registration & Authentication Flow

**Goal:** Securely onboard a user and establish an authenticated session.

1.  **Frontend Action:** User fills out registration form (email, password, username) and submits.
2.  **API Call:** Frontend sends a `POST /api/auth/register` request containing the payload.
3.  **Backend Processing:**
    *   Validates input.
    *   Hashes password using `bcryptjs`.
    *   Inserts new user record into PostgreSQL `users` table.
    *   Generates an OTP (One-Time Password) for email verification.
    *   Stores encrypted OTP in `otp_tokens` table.
    *   Sends email with OTP.
4.  **Frontend Action:** User enters OTP on verification screen.
5.  **API Call:** Frontend sends `POST /api/otp/verify` with OTP.
6.  **Backend Processing:**
    *   Validates OTP against `otp_tokens` table.
    *   Updates user's `email_verified` status to true in `users` table.
    *   Generates a JSON Web Token (JWT) containing user ID and roles.
7.  **Response:** Returns JWT to the Frontend.
8.  **Frontend State:** Stores JWT securely (in-memory for Web, `secure_storage` for Mobile).

---

## 2. Real-time Connection & Presence Flow

**Goal:** Establish a persistent WebSocket connection for real-time events.

1.  **Frontend Action:** After successful login/registration, the client initializes the Socket.io connection.
2.  **Socket Handshake:** Client connects to the server (`wss://`) and includes the JWT in the `auth` payload.
3.  **Backend Processing (`socketAuthGuard.js`):**
    *   Intercepts the connection request.
    *   Validates the JWT signature.
    *   If invalid, connection is rejected.
    *   If valid, connection is accepted.
4.  **Socket Registration (`userSocketRegistry.js`):**
    *   Server maps the authenticated `userId` to the newly created `socketId` in memory (or Redis for multi-node).
    *   Server joins the socket to a private room based on `userId` for targeted message delivery.
5.  **Presence Broadcast:**
    *   Server emits a `user-online` event to all other connected clients (or specific friends/nearby users depending on privacy settings).
6.  **Frontend State:** Other clients update their UI to reflect the user's "Online" status.

---

## 3. "Nearby" Discovery Flow

**Goal:** Find other users in geographical proximity.

1.  **Frontend Action:** User navigates to the "Nearby" tab and grants location permissions.
2.  **Frontend Action:** Client retrieves current coordinates (latitude, longitude).
3.  **API Call:** Frontend sends a `GET /api/nearby?lat=...&lng=...&radius=10` request.
4.  **Backend Processing (`nearbyRoutes.js`):**
    *   Validates JWT middleware.
    *   Executes a PostGIS / `earthdistance` query against the PostgreSQL `users` table to find users within the specified radius.
    *   **Privacy Constraint:** Backend applies "location fuzzing" to the results, returning approximate coordinates or just distances, never exact locations.
5.  **Response:** Returns a list of nearby users (fuzzed locations, profile info).
6.  **Frontend State:** Renders users on a Map view or List view.

---

## 4. WebRTC Call Flow (Signaling via Socket.io)

**Goal:** Establish a peer-to-peer audio/video connection.

*Participants: Caller (A) and Callee (B).*

**Phase A: Call Initiation & Signaling**
1.  **Caller A (Frontend):** Clicks "Call" button on Callee B's profile.
2.  **Caller A (Frontend):** Requests media permissions (mic/camera) and creates a local `RTCPeerConnection`.
3.  **Caller A (Socket):** Emits `call-user` event to Server, payload: `{ calleeId: B_ID }`.
4.  **Server (Socket):**
    *   Looks up B's `socketId` in `userSocketRegistry`.
    *   Updates in-memory `callState` to indicate A is calling B.
    *   Emits `incoming-call` event to Callee B, payload: `{ callerId: A_ID, callerProfile }`.
5.  **Callee B (Frontend):** Shows ringing UI (IncomingCallModal).

**Phase B: Call Answer & Negotiation**
6.  **Callee B (Frontend):** Clicks "Accept".
7.  **Callee B (Socket):** Emits `call-answer` event to Server, payload: `{ callerId: A_ID, accepted: true }`.
8.  **Server (Socket):** Emits `call-answered` event to Caller A.
9.  **Caller A & Callee B (WebRTC):**
    *   **SDP Exchange:** Caller A creates an "Offer" (SDP) describing media capabilities.
    *   Caller A emits SDP via Socket.io to Callee B.
    *   Callee B receives Offer, sets remote description, creates an "Answer" (SDP).
    *   Callee B emits SDP via Socket.io to Caller A.
    *   Caller A receives Answer, sets remote description.
    *   **ICE Candidate Exchange:** Both peers gather ICE candidates (network paths) from STUN/TURN servers.
    *   Peers emit `ice-candidate` events to each other via Socket.io.
    *   Peers add received ICE candidates to their local `RTCPeerConnection`.

**Phase C: Media Connection**
10. **WebRTC:** The `RTCPeerConnection` on both sides successfully negotiates a direct peer-to-peer connection (or relays through TURN if NAT traversal fails).
11. **Frontend:** Audio/Video streams are attached to UI elements. Call is live.

**Phase D: Call Termination**
12. **Caller A (Frontend):** Clicks "End Call".
13. **Caller A (Socket):** Emits `end-call` event to Server.
14. **Caller A (Frontend):** Closes local `RTCPeerConnection` and releases media tracks.
15. **Server (Socket):**
    *   Emits `call-ended` to Callee B.
    *   Cleans up `callState` in memory.
    *   Logs call duration to PostgreSQL `call_history` table via an asynchronous task.
16. **Callee B (Frontend):** Receives `call-ended`, closes its `RTCPeerConnection`, releases media tracks, and updates UI.

---

## 5. Master Architecture Diagram Summary

```text
[Frontend (React/Flutter)]
       |  (REST - HTTPS)      | (WebSocket - WSS)      | (WebRTC - UDP/TCP)
       v                      v                        v
[Nginx Reverse Proxy] -----> [Node.js Backend]      [Peer Frontend]
                              |       |
                              v       v
                   [PostgreSQL]    [Redis (Optional)]
```
*   **REST (HTTPS):** Used for stateless operations (Auth, fetching profile data, querying "Nearby" users).
*   **WebSocket (WSS - Socket.io):** Used for persistent, real-time control (Presence, chat messages, WebRTC signaling).
*   **WebRTC:** Used strictly for peer-to-peer media transport once signaling is complete.
