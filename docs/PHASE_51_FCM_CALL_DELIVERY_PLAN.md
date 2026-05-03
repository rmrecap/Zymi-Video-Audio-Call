# PHASE 51 — FCM CALL DELIVERY STRATEGY

## 1. Goal
Ensure incoming WebRTC calls ring on the receiver's device even if the Flutter app is running in the background, locked, or temporarily suspended by the OS (Android/iOS).

## 2. Constraints & Limitations
- We are using **Firebase Cloud Messaging (FCM)** as a free push notification service.
- We will rely exclusively on **Data Messages** (silent push) where possible to wake the app and trigger a local ringing UI.
- On modern OS versions (especially iOS and Android 12+), background execution is heavily restricted. If the app is fully terminated (force closed), data-only pushes might not reliably wake the app unless integrated with specialized VoIP frameworks (CallKeep/PushKit on iOS, ConnectionService on Android). For this free foundation, we will utilize high-priority data messages.

## 3. Call Scenarios

### A. Foreground Call
- **State:** App is open and active.
- **Flow:** The existing `socket.on('incoming-call')` triggers immediately. FCM is not strictly needed for this, but acts as a fallback if socket reconnect is delayed.

### B. Background Call
- **State:** App is minimized or screen is off, but process is alive.
- **Flow:** 
  1. Caller emits `call-user` via socket.
  2. Server checks if receiver's socket is connected. If offline or no ack within X ms, Server sends FCM Data Push.
  3. FCM wakes the background Flutter isolate.
  4. Flutter isolate processes the payload, triggers a local notification or full-screen intent (Android).
  5. User taps notification → App resumes → socket reconnects → caller resends offer or app requests active offer.

### C. Locked App Call
- **State:** Screen is off, device locked.
- **Flow:** On Android, we can use a Full-Screen Intent combined with `WAKE_LOCK` and `USE_FULL_SCREEN_INTENT` to draw the Incoming Call screen over the lock screen. On iOS, without PushKit, a standard high-priority notification will wake the screen.

### D. Terminated App Limitation
- If the user swipes the app away (Force Close), FCM data messages are generally ignored by iOS and severely delayed on some Android devices (OEM battery optimization). A standard notification payload can be used as a fallback to deliver a "Missed Call" or "Incoming Call" alert, but silent data processing is not guaranteed.

## 4. FCM Payload Structure
```json
{
  "to": "<push_token>",
  "priority": "high",
  "data": {
    "type": "incoming_call",
    "callerId": "user_xyz",
    "callerName": "John Doe",
    "callType": "video",
    "timestamp": 1714578000000
  }
}
```
*Note: We do NOT send the raw WebRTC SDP offer in the push payload because it is too large and might expire.*

## 5. Security & Verification
- **VERIFY REQUIRED:** Since we are using standard FCM and not paid VoIP PushKit/CallKeep, iOS background incoming call reliability depends heavily on Apple's APNs data push delivery times. Android 14 full-screen intent permissions (`USE_FULL_SCREEN_INTENT`) must be manually granted by the user if we target API 34+.
