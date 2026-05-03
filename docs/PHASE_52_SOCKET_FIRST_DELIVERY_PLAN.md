# PHASE 52 — SOCKET-FIRST DELIVERY PLAN

## 1. Goal
ZYMI operates entirely without Firebase/FCM or any third-party push notification providers. All real-time signaling, including incoming call ringing and messaging, occurs exclusively through the self-hosted WebSockets (Socket.io) architecture deployed on our VPS.

## 2. Background Limitation Rule
By removing FCM, ZYMI adheres strictly to a foreground/connected background lifecycle:
- **Foreground:** If the app is open, calls and messages are delivered instantaneously via `incoming-call` and `receive_message`.
- **Background (Active):** If the app is swiped to the background but the OS has not suspended the process, the socket remains alive, and calls will ring.
- **Deep Sleep / Terminated:** If Android/iOS terminates the app for memory, or forces the network socket to sleep, the user **will not receive** incoming calls until they manually re-open the app.

## 3. Deployment Plan (VPS + Load Balancer)
- The signaling server will be deployed on a VPS (e.g., Ubuntu/Nginx).
- **Load Balancing:** Nginx will be configured as a reverse proxy mapping port 80/443 to the Node.js application (port 5000).
- **Sticky Sessions:** Socket.io requires `ip_hash` (sticky sessions) if multiple Node.js workers/PM2 instances are used.

## 4. Why This Approach?
This ensures 100% data sovereignty. No metadata (Call IDs, User IDs, Connection Timestamps) is shared with Google/Firebase servers.
