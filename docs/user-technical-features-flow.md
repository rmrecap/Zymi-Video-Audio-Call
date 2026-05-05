# ZYMI User Technical Features Flow

This document provides a deep-dive technical breakdown of the core user journeys within the ZYMI ecosystem. It details the interaction between the Frontend (React/Flutter), the Node.js Backend, and the Database layer (PostgreSQL/Redis), including specific database queries and error-handling strategies.

---

### Step 01: Onboarding Journey — Registration & Profile Setup

**Goal:** Seamlessly and securely convert a visitor into an authenticated user with a verified and complete profile.

#### Process Overview
| Step | User Action (Frontend) | Backend Processing | Database Operation | Outcome & Error Handling |
| :--- | :--- | :--- | :--- | :--- |
| **1.1** | **Submit Registration**<br>User provides email/phone and password. | - Validate input fields<br>- Hash password using `bcryptjs`<br>- Generate a unique OTP for verification | `INSERT INTO users (email, password_hash, status) VALUES ($1, $2, 'pending') RETURNING id;` | **Success:** User account created with pending status.<br>**Error:** Email already exists → Return 409 Conflict. |
| **1.2** | **Verify OTP**<br>User enters the 6-digit code received via email/SMS. | - Decrypt and validate stored OTP<br>- Match with user input<br>- Check expiration (5 minutes) | `SELECT * FROM otp_tokens WHERE user_id = $1 AND token = $2 AND expires_at > NOW();` | **Success:** Account marked as verified and JWT issued.<br>**Error:** Invalid or expired OTP → Return 401 Unauthorized. |
| **1.3** | **Profile Setup**<br>User uploads avatar and sets display name. | - Process image (compression/resizing)<br>- Update profile metadata | `UPDATE users SET display_name = $1, avatar_url = $2 WHERE id = $3;` | **Success:** Profile activated; user redirected to dashboard.<br>**Error:** Upload failure → Preserve partial data and prompt retry. |

#### Summary
This onboarding flow ensures:
*   Strong security through password hashing and OTP verification.
*   Smooth user progression from registration to activation.
*   Resilient error handling to maintain a good user experience.

---

### Step 02: Nearby Discovery Journey — Geospatial Search

**Goal:** Discover peers based on physical proximity using PostGIS with strict privacy controls.

#### Process Overview
| Step | User Action (Frontend) | Backend Processing | Database Operation | Outcome & Error Handling |
| :--- | :--- | :--- | :--- | :--- |
| **2.1** | **Location Update**<br>App fetches GPS coordinates (`lat`, `lng`). | - Receive coordinates via REST<br>- Validate spatial data range | `UPDATE users SET last_location = ST_SetSRID(ST_MakePoint($1, $2), 4326) WHERE id = $3;` | **Success:** User's spatial point updated in DB.<br>**Error:** GPS denied → Show "Enable Location" UI. |
| **2.2** | **Query Nearby**<br>User opens "Nearby" tab; client sends GET request. | - Execute radius search using PostGIS<br>- Apply privacy fuzzing logic | `SELECT id, display_name, ST_Distance(last_location, ST_SetSRID(ST_MakePoint($1, $2), 4326)) AS distance FROM users WHERE ST_DWithin(last_location, ..., $3);` | **Success:** List of users within X km returned.<br>**Error:** Timeout → Return cached results or empty list. |
| **2.3** | **Render Results**<br>Map/List displays nearby users. | - Return fuzzed coordinates<br>- Ensure precise location never reaches client | N/A (Business Logic Layer) | **Success:** User sees peers without privacy breach.<br>**Error:** No users found → Suggest expanding radius. |

#### Summary
This discovery flow ensures:
*   High-performance spatial queries via PostGIS indexing.
*   Privacy-first design through coordinate fuzzing.
*   Real-time relevance of proximity data.

---

### Step 03: Messaging Journey — Socket.io Lifecycle

**Goal:** Ensure real-time, persistent delivery of messages across the platform.

#### Process Overview
| Step | User Action (Frontend) | Backend Processing | Database Operation | Outcome & Error Handling |
| :--- | :--- | :--- | :--- | :--- |
| **3.1** | **Send Message**<br>User A types and hits send in chat. | - Receive `private-message` via Socket<br>- Authenticate sender via JWT | `INSERT INTO messages (sender_id, receiver_id, content, status) VALUES ($1, $2, $3, 'sent') RETURNING id;` | **Success:** Message persisted with 'sent' status.<br>**Error:** Socket disconnected → Queue locally and retry. |
| **3.2** | **Routing**<br>Server identifies Recipient B's location. | - Lookup Recipient B in `userSocketRegistry`<br>- Determine if target is online | (Redis) `GET user:socket:B_ID` | **Success:** Active `socketId` found.<br>**Error:** User B Offline → Trigger Push Notification (FCM). |
| **3.3** | **Delivery & Ack**<br>Server emits message to User B. | - Emit event to target socket<br>- Listen for `received` acknowledgment | `UPDATE messages SET status = 'delivered', delivered_at = NOW() WHERE id = $1;` | **Success:** User A sees "Delivered" status (Double Tick).<br>**Error:** Ack timeout → Status remains 'sent'; retry on reconnect. |

#### Summary
This messaging flow ensures:
*   Guaranteed message persistence before delivery.
*   Low-latency routing via in-memory socket registry.
*   Robust delivery tracking with acknowledgment states.

---

### Step 04: WebRTC Calling Journey — Signaling & Handshake

**Goal:** Establish a secure, high-quality peer-to-peer media connection.

#### Process Overview
| Step | User Action (Frontend) | Backend Processing | Database Operation | Outcome & Error Handling |
| :--- | :--- | :--- | :--- | :--- |
| **4.1** | **Call Initiation**<br>User A clicks "Call"; local stream requested. | - Validate availability in `callState`<br>- Trigger signaling invite | `INSERT INTO call_history (caller_id, receiver_id, status) VALUES ($1, $2, 'initiated') RETURNING id;` | **Success:** Callee B receives `incoming-call` event.<br>**Error:** Callee Busy → Return "User Busy" signal. |
| **4.2** | **SDP/ICE Exchange**<br>Peers exchange Offer/Answer packets. | - Transparently relay signaling packets<br>- Maintain call state session | N/A (In-memory relay) | **Success:** WebRTC Peer Connection established.<br>**Error:** Peer disconnect → Emit `call-failed` and cleanup. |
| **4.3** | **Media & Logging**<br>Call becomes live; teardown on end. | - Monitor `end-call` event<br>- Calculate duration and cleanup | `UPDATE call_history SET status = 'completed', duration = $1, ended_at = NOW() WHERE id = $2;` | **Success:** Stream closed; log entry finalized.<br>**Error:** Abrupt drop → Detect `socket-disconnect`; log as "dropped". |

#### Summary
This calling flow ensures:
*   Secure negotiation via authenticated signaling.
*   Minimal server overhead through P2P media transport.
*   Detailed audit logging for call history and quality.

---

### 5. Technical Hard Locks (Systemic Error Handling)

*   **Socket Heartbeat:** If a client misses 3 heartbeats (30s), the server automatically triggers `user-offline` and clean-up for any active calls.
*   **Database Transactionality:** All messaging and call-logging operations use PostgreSQL transactions to ensure no data loss during high-concurrency spikes.
*   **PostGIS Performance:** Geospatial queries are limited to a max radius of 100km to prevent expensive table scans.
*   **JWT Expiry:** On token expiration, the Socket.io `authGuard` forcefully disconnects the client, prompting a re-authentication flow to maintain security.
