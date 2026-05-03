# PHASE 47 — SOCKET LIVE BRIDGE QA

## 1. Test Matrix

| Test Case | Step | Expected Result |
|---|---|---|
| Socket Connect | Open Diagnostic Screen -> Connect | Status changes to CONNECTED |
| Identity Normalizer | Trigger Join | Debug log shows String "user_mobile" |
| Presence Online | Open Chat on Web (user_web) | Mobile Online list shows "user_web" |
| Presence Offline | Close Chat on Web | Mobile Online list removes "user_web" |
| Chat Send | Send message from Mobile | Web receives message instantly |
| Chat Receive | Send message from Web | Mobile list updates instantly |
| Typing Indicator | Start typing on Mobile | Web shows "User is typing..." |
| Ad Block Check | Focus Chat Input | Diagnostic screen shows Ad Gate: BLOCKED |

## 2. Rollback Instructions
- If socket connection crashes the app: Remove `socket_io_client` from `pubspec.yaml`.
- If server load spikes: Reduce `reconnectionAttempts` in `zymi_socket_config.dart`.
- If IDs fail: Verify `ZymiIdentityNormalizer.normalize` returns a String.
