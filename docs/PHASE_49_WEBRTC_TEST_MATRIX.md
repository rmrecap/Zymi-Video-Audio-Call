# PHASE 49 — WEBRTC TEST MATRIX

## 1. WebRTC Core Flow

| Test Case | Steps | Expected Result |
|---|---|---|
| Mobile to Web (Audio) | Mobile calls Web (Audio) | Web rings, accepts. Audio established. |
| Mobile to Web (Video) | Mobile calls Web (Video) | Web rings, accepts. Video + Audio established. |
| Web to Mobile (Audio) | Web calls Mobile (Audio) | Mobile Incoming Screen -> Accept -> Audio |
| Web to Mobile (Video) | Web calls Mobile (Video) | Mobile Incoming Screen -> Accept -> Video |
| Mute Mic | Toggle Mic button on Mobile | Remote Web side stops receiving audio |
| Toggle Camera | Toggle Camera button on Mobile | Remote Web side stops receiving video |
| End from Mobile | Press End Call on Mobile | Web returns to idle; Mobile returns to idle |
| End from Web | Press End Call on Web | Mobile returns to idle; UI cleans up |
| Reject Call | Mobile receives call -> Reject | Web shows "Call Rejected", Mobile returns to idle |
| ICE Queueing | Fast Accept before ICE ready | ICE queued until Remote Description set, then flushed |

## 2. Ad Gate Protection Test

| Test Case | Steps | Ad Gate Status |
|---|---|---|
| Outgoing Ringing | Mobile calls Web | BLOCKED (`isConnectingCall = true`) |
| Incoming Ringing | Web calls Mobile | BLOCKED (`isConnectingCall = true`) |
| Connected | Call accepted | BLOCKED (`isInCall = true`) |
| Ended (Grace Period) | Press End Call | BLOCKED (for 10 seconds post-call) |
| Post-Grace | Wait 10s after end | ALLOWED |
