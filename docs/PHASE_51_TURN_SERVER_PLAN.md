# PHASE 51 — TURN SERVER CONFIGURATION PLAN

## 1. Why TURN is Required
WebRTC relies on STUN (Session Traversal Utilities for NAT) to find public IP addresses. However, on highly restrictive networks (e.g., corporate firewalls, strict cellular NATs, symmetrical NATs), STUN fails to establish a direct P2P connection. In these scenarios, a TURN (Traversal Using Relays around NAT) server is required to proxy the media streams. Without TURN, 15-20% of calls will inexplicably fail on mobile networks.

## 2. Configuration Options
**Option A: Paid Hosted Service (Recommended for Prod)**
- Twilio Network Traversal (NTS), Metered (Twilio console).
- Xirsys or Metered.ca.
- Very reliable, low latency, global edge points.

**Option B: Self-Hosted Free Alternative**
- `coturn` (Open Source TURN server).
- Deploy via Docker on the same or separate VPS.
- Requires open UDP/TCP ports (3478, 5349) and a static IP.

## 3. Environment Config Strategy (.env)
The signaling server and API will pass down the ICE configuration via a new endpoint (`/api/webrtc/ice-servers`) to ensure credentials remain secure and can be rotated without app updates.

```env
# Node.js .env
TURN_ENABLED=true
TURN_URL=turn:turn.domain.com:3478
TURN_USERNAME=zymi_user
TURN_PASSWORD=super_secure_secret
```

## 4. Flutter Integration Fallback
Until the API is built, the Flutter client uses `ZymiWebRTCConfig` with Google's public STUN server. Once TURN is deployed, `IceServerConfigLoader` will merge the public STUN with the authenticated TURN servers.

## 5. Security Note
Never hardcode TURN credentials in the Flutter app source code (`zymi_webrtc_config.dart`). The `IceServerConfigLoader` must request them from the backend.
