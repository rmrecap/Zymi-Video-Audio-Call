# PHASE 46 — CHAT STATE MACHINE

This document defines the message lifecycle and UI synchronization states for the Flutter chat implementation.

## 1. Message Lifecycle States

| State | Description | UI Feedback | Impact on Ads |
|:---|:---|:---|:---|
| `idle` | Viewing chat, not interacting with input. | Default | **ALLOWED** |
| `loadingHistory`| Fetching messages from REST API. | Shimmer/Loading | **ALLOWED** |
| `sending` | Emitting `private-message` via socket. | Grayed/Clock Icon | **BLOCKED** (if typing/focused) |
| `sent` | Received `message-sent` ack from server. | Single Tick | **ALLOWED** (if focus lost) |
| `failed` | No ack received or socket offline. | Red Warning Icon | **ALLOWED** |
| `retrying` | Re-emitting previously failed `tempId`.| Spinner | **BLOCKED** (if typing) |
| `receiving` | Processing `new-message` from socket. | Slide-in Animation | **ALLOWED** |
| `typing` | Emitting `typing` event frequently. | Peer: "User is typing..." | **BLOCKED** |

## 2. Interaction Safety Rules
1. **Composer Focus**: As long as the `TextField` has focus, `isComposerFocused = true`. Ads are blocked even if not actively typing.
2. **Typing Throttle**: `typing` event should be sent every 2-3 seconds while user is actively entering text. `stop-typing` sent after 3 seconds of inactivity.
3. **Screen Exit**: Disposing the chat screen must call `runtimeStateBinder.setComposerFocused(false)` to restore ad availability.

## 3. Local Cache Synchronization
- **tempId Match**: When `new-message` or `message-sent` arrives, the app must match the `tempId` to replace the local optimistic message with the final server-generated `id`.
- **Duplicate Prevention**: If `new-message` is received before `message-sent` (rare but possible), the `tempId` must be used to deduplicate.
