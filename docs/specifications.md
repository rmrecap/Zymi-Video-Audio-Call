# ZYMI Ecosystem — Dual-Isolate Architecture Specification

**Version:** 2.0.0 (Post-Heartbeat-Synchronized Architecture)
**Status:** Production Active
**Authored:** 2026-05-19

---

## 1. Overview

The ZYMI system operates a **Dual-Isolate Model** to ensure reliable call signaling and background persistence. The architecture separates concerns across two runtime layers:

| Layer | Isolate | Socket Type | Lifetime | Primary Responsibility |
|---|---|---|---|---|
| Main | Flutter UI Isolate | `UI` | Volatile (app lifecycle) | Media negotiation, chat, rendering |
| Daemon | Background Isolate | `BACKGROUND` | Persistent (OS Service) | Incoming-call signaling, heartbeat, missed-call buffer |

---

## 2. The BACKGROUND Socket — System Daemon Class

> **IMPORTANT FOR CONTRIBUTORS:** The `BACKGROUND` socket is NOT standard UI code.
> It must never be treated as a regular WebSocket connection tied to screen state.

### 2.1 Definition

The `BACKGROUND` socket is a **System Daemon** that:
- Runs in a dedicated OS-managed isolate via `flutter_background_service`
- Survives app minimization, screen lock, and OS memory pressure
- Is managed by an Android `ForegroundService` with `WAKE_LOCK` and `phoneCall` type
- Self-heals on network transitions (WiFi ↔ Cellular) via `connectivity_plus`
- Sends a `heartbeat_ping` every **25 seconds** matching the server's `pingInterval`
- Receives the `incoming-call` event and triggers native hardware (ringtone, vibration)

### 2.2 Socket Auth Handshake

Both socket types authenticate via the same JWT token, but declare their purpose in the `auth` object:

```javascript
// UI Socket (Main Isolate)
{ auth: { token: '<JWT>', type: 'UI' } }

// BACKGROUND Socket (Daemon)
{ auth: { token: '<JWT>', type: 'BACKGROUND' } }
```

The server middleware (`socketAuthGuard.js`) extracts `type` and attaches it to `socket.socketType`. The `UserSocketRegistry` stores both in a Redis Hash keyed by `userId`.

---

## 3. Server: Redis Socket Registry

**File:** `server/src/socket/userSocketRegistry.js`

```
Redis Hash Key:  "user_sockets:<userId>"
Fields:          { "UI": "<socketId>", "BACKGROUND": "<socketId>" }
TTL:             24 hours (auto-renewed on reconnect)
```

### Priority Routing Logic

| Event | Target Socket | Reason |
|---|---|---|
| `incoming-call` | `BACKGROUND` first, `UI` fallback | Device must wake from sleep |
| WebRTC offer/answer | `UI` first, `BACKGROUND` fallback | Low-latency media path |
| `heartbeat-ack` | Either | Keep-alive acknowledgment |

### Lifecycle Operations

| Operation | Method | Effect |
|---|---|---|
| Connect | `registry.register(userId, socketId, type)` | `hSet` field in Redis Hash |
| Disconnect | `registry.remove(userId, type)` | `hDel` + auto-delete key if empty |
| Logout | `registry.purgeUser(userId)` | Atomic `DEL` of entire key |

---

## 4. Android Native Requirements

### 4.1 Permissions (`AndroidManifest.xml`)

```xml
<uses-permission android:name="android.permission.WAKE_LOCK" />
<uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
<uses-permission android:name="android.permission.FOREGROUND_SERVICE_PHONE_CALL" />
<uses-permission android:name="android.permission.FOREGROUND_SERVICE_CONNECTED_DEVICE" />
<uses-permission android:name="android.permission.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS" />
```

### 4.2 WakeLock Service (`CallWakeLockService.java`)

- Acquires `PARTIAL_WAKE_LOCK | ACQUIRE_CAUSES_WAKEUP` on `incoming-call`
- Auto-releases after **30 seconds** (ring timeout fail-safe)
- Must be explicitly released on call-answered or call-ignored events
- **Validation:** `adb shell dumpsys power | grep "ZYMI:CallWakeLock"`

---

## 5. Cross-Isolate Handshake Bridge

When the UI resumes (`AppLifecycleState.resumed`), the lifecycle handler sends `transfer_to_ui` to the daemon. The daemon then:

1. Reads `pending_missed_caller` from `SharedPreferences`
2. Invokes `sync_ui_state` with the missed call data
3. Clears the `pending_missed_caller` key

This ensures no calls are missed during the brief window between app resume and full socket handover.

---

## 6. Daemon State Machine

```
Idle ──[incoming-call]──► Ringing ──[answered]──► Connected
                              │
                              ├──[hangup]──► Idle
                              │
                              └──[timeout 30s]──► Missed ──► Idle
```

On `Missed`, the daemon writes to `SharedPreferences` for the Handshake Bridge to flush.

---

## 7. Developer Commandments

> These rules are **non-negotiable**. Violating them will introduce regressions that are extremely difficult to debug under OS-level constraints.

### Commandment I — Never Kill the Background Isolate
The `BackgroundSocketService` must remain running at all times while the user is logged in. Never call `FlutterBackgroundService().stopSelf()` from the UI isolate. Only the daemon may stop itself via the `stopService` event (triggered on logout).

### Commandment II — Always Use the Shared Buffer for Cross-Isolate State
Any event that occurs in the Background Isolate that the UI Isolate must act on **must** flow through `SharedPreferences`. Do not attempt direct Dart-to-Dart isolate communication for call signaling. The Handshake Bridge (`transfer_to_ui` → `sync_ui_state`) is the canonical path.

**SharedPreferences Keys (Reserved):**

| Key | Type | Written By | Read By | Cleared By |
|---|---|---|---|---|
| `pending_missed_caller` | String | Background Isolate | UI Isolate | UI on consume |
| `pending_call_timestamp` | Int (ms) | Background Isolate | UI Isolate | UI on consume |

### Commandment III — Never Remove `type` from Socket Auth
The `auth.type` field (`'UI'` or `'BACKGROUND'`) is the sole mechanism by which the Redis registry differentiates sockets. Removing it causes the "Registry Overwrite" bug: a new UI connection will overwrite the BACKGROUND socket entry, making the device un-wakeable.

### Commandment IV — Always Use `purgeUser()` on Logout
`registry.remove(userId, type)` only removes a single socket type. On logout, both `UI` and `BACKGROUND` entries must be cleared. Only `registry.purgeUser(userId)` performs this atomically via `DEL` on the entire Redis hash key.

### Commandment V — Heartbeat Event is `heartbeat_ping`
The background isolate emits `heartbeat_ping` (not `heartbeat`). The server handler in `callSocket.js` acknowledges via `heartbeat-ack`. Changing this event name breaks the keep-alive loop and causes server-side socket timeout after `pingTimeout` (60 seconds).

---

## 8. Shared Buffer Contract

The `SharedPreferences` buffer is the **only** approved inter-isolate communication mechanism for call state. It acts as a durable event queue that survives isolate crashes and OS kills.

```
Background Isolate                    UI Isolate
      │                                    │
      │── [incoming-call received] ──────► │
      │   write: pending_missed_caller      │
      │   write: pending_call_timestamp     │
      │                                    │
      │   ... UI resumes ...               │
      │                                    │
      │◄── [transfer_to_ui event] ─────── │
      │   read: pending_missed_caller       │
      │   invoke: sync_ui_state             │
      │   clear: pending_missed_caller      │
      │   clear: pending_call_timestamp     │
      │                                    │
```

**Staleness Guard:** The UI isolate must check `pending_call_timestamp`. If the timestamp is more than **90 seconds** old, discard the event (the user has already missed the call window and the caller has likely given up).
