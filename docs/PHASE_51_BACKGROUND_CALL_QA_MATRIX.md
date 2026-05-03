# PHASE 51 — BACKGROUND CALL QA MATRIX

## 1. Goal
Ensure incoming calls can reliably alert the user under various application lifecycle states, utilizing the newly integrated Firebase Cloud Messaging strategy alongside the realtime socket.

## 2. Test Environments

| State | Definition | Expected Behavior |
|---|---|---|
| **Foreground** | App is open on screen | Socket triggers `incoming-call` instantly. FCM arrives but is silently handled/ignored to prevent double-ringing. |
| **Background** | App minimized (swiped home) | FCM Data Message wakes isolate → Notification fired → User taps → App resumes → Socket connects → Navigates to Call UI. |
| **Locked** | Screen is off, app in background | FCM Data Message wakes device → Full-Screen Intent (Android) displays UI over lock screen, or high-priority heads-up notification rings. |
| **Terminated** | App force-closed from recent apps | On iOS: PushKit/VoIP push required (paid tier). Standard FCM might fail. On Android: Standard FCM push shown as missed call or static alert depending on OEM restrictions. |
| **Poor Network** | Edge/3G or high latency | If socket `join` or `incoming-call` drops, server falls back to FCM push. TURN config resolves ICE candidate failures. |

## 3. Ad Gate Conflict QA
- **Incoming Call vs Ad Loaded:** If Ad is displaying and an incoming call arrives, `isConnectingCall` flips to true, destroying/hiding the active ad overlay immediately.
- **Post-Call Grace:** Call ends → 10-second grace period starts. Attempting to load Interstitial during this period must return `BLOCKED`.

## 4. Execution Requirement
These matrices must be run on physical iOS and Android devices, as emulators do not accurately replicate deep-sleep doze modes, lock-screen intents, or background execution restrictions.
