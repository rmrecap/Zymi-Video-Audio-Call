# PHASE 47 — SOCKET EVENT REGRESSION CHECKLIST

## 1. Event Integrity Status

| Event Name | Status | Verified (Initial) |
|---|---|---|
| `join` | **UNCHANGED** | YES |
| `private-message` | **UNCHANGED** | YES |
| `receive_message` | **UNCHANGED** | YES |
| `new-message` | **UNCHANGED** | YES |
| `message-sent` | **UNCHANGED** | YES |
| `typing` | **UNCHANGED** | YES |
| `user-typing` | **UNCHANGED** | YES |
| `user-online` | **UNCHANGED** | YES |
| `user-offline` | **UNCHANGED** | YES |

## 2. Safety Guards
- [x] **call-user**: BLOCKED (ZymiCallEventGuard)
- [x] **make-answer**: BLOCKED (ZymiCallEventGuard)
- [x] **ice-candidate**: BLOCKED (ZymiCallEventGuard)
- [x] **WebRTC**: Untouched
- [x] **React Client**: Untouched
- [x] **Server Core**: Untouched
