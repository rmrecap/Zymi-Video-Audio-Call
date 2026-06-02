# ZYMI Flutter Mobile Features — Architecture & Remaining Work

## Current State

The Flutter app has 119 Dart files across 13 feature directories and 9 service directories. Core features implemented:

- Auth (login, register, forgot password)
- Socket.io connection with JWT auth + reconnect
- Chat UI (conversation list, chat screen, message bubbles)
- Call signaling (incoming call, live call, WebRTC)
- Media attachments (AttachmentHub)
- Notifications center
- Profile and settings
- Nearby screen (basic)
- Verification (email OTP, phone OTP)
- Ad/ZRCS integration
- Background socket service
- Phone action guard
- Diagnostics screens

## Item 8B.4 — Offline Message Queue (Mobile)

### Architecture
```
MessageSocketService
  → offline_message_queue.dart
    → Stores failed sends in SQLite local DB (local_media_database.dart)
    → Retry on socket reconnect
    → Exponential backoff: 1s, 2s, 4s, 8s, max 30s
```

The queue is already partially implemented in `offline_message_queue.dart`. Needs:
- SQLite persistence for queued messages (use existing `local_media_database.dart`)
- Socket `reconnect` event triggers flush
- UI banner via `offline_sync_banner.dart` (widget exists)

## Item 8B.5 — Push Notifications (Socket-First)

**Constraint**: No Firebase/FCM. Socket-first only.

### Architecture
```
BackgroundSocketService (persistent WebSocket daemon)
  → Receives events while app is backgrounded
  → Flutter local_notifications plugin renders notification
  → User taps notification → navigates to conversation/incoming call
```

- BACKGROUND socket type keeps connection alive
- `flutter_background_service` package runs daemon
- `flutter_local_notifications` shows notification
- No FCM/APNs dependency — purely socket-based

## Item 8C.6 — Background Call Handling

### Architecture
```
BackgroundSocketService receives INCOMING_CALL
  → CallSignalingService processes offer
  → Local notification shown with Accept/Reject actions
  → User taps Accept → app foregrounds → LiveCallScreen
  → User taps Reject → emits REJECT_CALL via socket
```

## Item 8C.7 — Push Notifications for Calls (Socket-First)

Same as 8B.5. The BACKGROUND socket wakes the device and shows call notification with action buttons.

## Item 8D.1 — Nearby Discovery (Flutter)

The `nearby_screen.dart` already exists. Needs:
- Integration with nearby API (`nearby_service.dart` exists)
- Map view (flutter_map or google_maps_flutter)
- List view (already scaffolded)
- Location permission handling

## Item 8D.2 — Phone Action Guard

Already implemented in `phone_action_guard.dart`:
- Intercepts `tel:` and `sms:` URI schemes
- Routes to ZYMI internal chat or PhoneLookupService
- No external SMS/WhatsApp/browser redirects

## Item 8D.3 — ZRCS Mobile Runtime Adapter

Already implemented in:
- `zrcs_remote_config_service.dart` — fetches ad config, 4h cache
- `zrcs_cache_service.dart` — local cache
- `zrcs_runtime_gate.dart` — runtime policy evaluation

## Item 8D.4 — AdPlacementGuard

Already implemented in:
- `ad_runtime_controller.dart` — checks `AppRuntimeState.isInCall` and `AdBlocking` flags
- `ad_blocked_notice.dart` — shows blocked state
- `safe_banner_ad.dart` / `safe_native_placeholder.dart` — safe widgets

## Dependencies Added

```yaml
dependencies:
  flutter_local_notifications: ^17.0.0  # local notifications (no FCM)
  flutter_background_service: ^5.0.0    # background socket daemon
  flutter_map: ^7.0.0                   # map for nearby (optional)
```

## Verification

```bash
flutter analyze
flutter build apk --debug
```
