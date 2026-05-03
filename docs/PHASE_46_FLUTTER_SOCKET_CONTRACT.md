# PHASE 46 — FLUTTER SOCKET CONTRACT

This document defines the strictly locked socket events and payload shapes for the ZYMI mobile integration. Any deviation from these types will break real-time synchronization between the Flutter client and the existing Node.js/React infrastructure.

## 1. Core Connection Events

| Event Name | Direction | Description | Payload Shape |
|:---|:---|:---|:---|
| `join` | Client -> Server | Registers the user's socket session. | `userId: String` |
| `banned` | Server -> Client | Notifies user of account suspension. | `{ reason: String }` |
| `user-online`| Server -> Client | Broadcasts user presence. | `{ userId: String }` |
| `user-offline`| Server -> Client | Broadcasts user departure. | `{ userId: String }` |

## 2. Chat System Events

| Event Name | Direction | Description | Payload Shape |
|:---|:---|:---|:---|
| `private-message` | Client -> Server | Sends a new message. | `{ to: String, from: String, content: String, tempId: String, message_type: String, ...mediaFields }` |
| `new-message` | Server -> Client | Real-time message delivery. | `{ id: Number, sender_id: String, receiver_id: String, content: String, timestamp: String, ... }` |
| `typing` | Client -> Server | Notifies peer of typing. | `{ to: String, from: String }` |
| `stop-typing` | Client -> Server | Notifies peer to stop indicator. | `{ to: String, from: String }` |
| `user-typing` | Server -> Client | Receives peer typing status. | `{ from: String }` |
| `user-stop-typing`| Server -> Client | Receives peer stop indicator. | `{ from: String }` |

## 3. WebRTC / Call Events

| Event Name | Direction | Description | Payload Shape |
|:---|:---|:---|:---|
| `call-user` | Client -> Server | Initiates a call offer. | `{ to: String, from: String, offer: Object, type: "audio"\|"video" }` |
| `incoming-call`| Server -> Client | Receives a call offer. | `{ from: String, offer: Object, type: "audio"\|"video" }` |
| `make-answer` | Client -> Server | Accepts call with SDP answer. | `{ to: String, answer: Object }` |
| `call-answer` | Server -> Client | Receives the peer answer. | `{ answer: Object }` |
| `ice-candidate`| Bi-directional | Relays ICE candidates. | `{ to: String, candidate: Object }` |
| `end-call` | Client -> Server | Terminate active session. | `{ to: String, from: String }` |
| `call-ended` | Server -> Client | Notifies peer of termination. | `{ from: String }` |
| `reject-call` | Client -> Server | Declines incoming offer. | `{ to: String, from: String }` |
| `call-rejected`| Server -> Client | Notifies peer of rejection. | `{ from: String }` |

## 4. Strict Type Rules
1. **User IDs**: Must always be handled as `String` in payloads, even if represented as `Number` in the backend database. Socket Map lookups in `server/index.js` rely on String normalization.
2. **SDP / ICE**: Payloads for `offer`, `answer`, and `candidate` must be passed as raw JSON Objects. Flutter's `flutter_webrtc` objects must be serialized to `Map<String, dynamic>` before sending.
3. **Temp IDs**: `tempId` must be a unique String (e.g., UUID or Timestamp) to prevent duplicate messages in the local cache.

## 5. Failure Risks
- **ID Type Mismatch**: If Flutter sends an `int` for `userId`, the server's `userSockets.get(to)` will return `undefined`, causing "User Offline" errors.
- **Payload Shape Change**: Adding top-level keys not handled by `chatSocket.js` or `callSocket.js` will cause `Null` property access errors on the server.
