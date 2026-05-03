# PHASE 48 — CHAT STABILITY QA

## 1. Two-Device Test Matrix

| Test | Steps | Expected |
|---|---|---|
| Send from Mobile | Type + Send on Flutter | Message appears on Web instantly |
| Receive on Mobile | Send from Web | Message appears on Flutter with slide-in |
| Typing Indicator | Start typing on Mobile | Web shows "typing..." within 2s |
| Stop Typing | Stop typing for 1.5s | Web removes "typing..." indicator |
| Message Status | Send from Mobile | Status: sending → sent → delivered |
| Retry Failed | Disconnect, send, reconnect | Queued messages auto-send |
| History Load | Open chat with existing messages | Cached + server messages merged |
| Deduplication | Same message from `new-message` and `receive_message` | Single entry only |

## 2. Offline Test Matrix

| Test | Steps | Expected |
|---|---|---|
| Offline Send | Disconnect WiFi, send message | Message queued locally |
| Reconnect Flush | Restore WiFi | Queued messages auto-sent |
| No Duplicate | Send offline + reconnect | Message sent exactly once |

## 3. Typing Throttle Test

| Input Pattern | Expected Typing Events |
|---|---|
| Fast continuous typing for 5s | Max 2-3 `typing` emits |
| Stop for 1.5s | 1 `stop-typing` emit |
| Send button pressed | Immediate `stop-typing` |

## 4. Duplicate Listener Test

| Action | Expected |
|---|---|
| Navigate to chat, back, chat again | No duplicate `receive_message` listeners |
| Reconnect 3 times | `join` emitted once per reconnect, listeners stable |
