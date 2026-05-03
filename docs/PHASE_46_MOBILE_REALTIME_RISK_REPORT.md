# PHASE 46 — MOBILE REALTIME RISK REPORT

This report identifies critical architectural risks when bridging the Flutter client to the existing ZYMI real-time infrastructure.

## 1. Identified Risks

| Risk Type | Description | Mitigation Strategy |
|:---|:---|:---|
| **Event Name Mismatch** | Using `incomingCall` (CamelCase) instead of `incoming-call` (kebab-case) will result in silent failure (no error, just no response). | Use `ZymiSocketEvents` constants exclusively. |
| **ID Type Mismatch**| Sending `to: 123` (int) instead of `to: "123"` (String). Server Map lookup will fail. | Enforce `String` normalization in `ZymiSocketPayloads`. |
| **Duplicate Listeners**| Re-registering socket listeners on every screen build leads to memory leaks and duplicate UI updates. | Manage socket listeners in a central Singleton service with explicit cleanup. |
| **Stale Peer Connection**| Failing to dispose `RTCPeerConnection` on `call-ended` leads to zombie media tracks and blocked Ads. | Strict State Machine transition to `ended` must call `dispose()`. |
| **Camera Lock** | On some Android devices, failing to close the camera after a call prevents other apps (and future ad renders) from accessing it. | Force close camera tracks in `ended` transition. |
| **Background Lifecycle**| Android/iOS will kill socket connections in the background. Incoming calls won't be received without Push Notifications (FCM/APNs). | **CRITICAL LIMITATION**: Phase 46 assumes foreground operation. FCM integration required in future phases. |
| **Ad Interruption** | Ad loading while a call offer is received may cause UI jitter or resource competition. | AppRuntimeState must block ad *loading* requests immediately upon `isRinging`. |
| **Reconnect Desync** | After a socket reconnect, the user might be "online" in the server Map but "offline" in the local UI state. | Re-emit `join` on every `reconnect` event and re-fetch presence. |

## 2. ZRCS Integrity Note
The mobile app must never attempt to bypass the `canShowAds` check. Any "Shadow Ad Display" during an active call is a violation of the ZYMI safety policy and may lead to peer connection drops due to resource exhaustion on low-end devices.

## 3. WebRTC Negotiation Lock
Flutter client must exactly mirror the React negotiation flow:
1. `call-user` (Offer) -> `incoming-call`
2. `make-answer` (Answer) -> `call-answer`
3. Multiple `ice-candidate` relays.
4. One side emits `end-call` -> Peer receives `call-ended`.
