# PHASE 48 — WEBRTC PREFLIGHT LOCK

## 1. What Is Allowed
- ✅ Camera permission check (without opening stream)
- ✅ Microphone permission check (without opening stream)
- ✅ Preflight state machine transitions
- ✅ UI showing readiness status
- ✅ Ad gate blocking during preflight (`isConnectingCall = true`)

## 2. What Is BLOCKED
- ❌ `call-user` socket emission
- ❌ `make-answer` socket emission
- ❌ `ice-candidate` socket emission
- ❌ `RTCPeerConnection` creation
- ❌ `getUserMedia()` / media stream opening
- ❌ Any SDP offer/answer generation

## 3. Enforcement Mechanism
- `ZymiCallEventGuard.isBlocked()` — returns true for all 6 call events.
- `ZymiSocketClient.emitSafe()` — checks guard before every emit.
- Preflight screen does NOT import any WebRTC packages.

## 4. Next Phase Requirements (Phase 49)
To unlock WebRTC:
1. Add `flutter_webrtc` dependency
2. Remove `end-call` and `reject-call` from the blocked list
3. Implement `RTCPeerConnection` lifecycle manager
4. Wire `call-user` → `incoming-call` → `make-answer` → `call-answer` flow
5. Bind ICE candidate relay
6. Bind media tracks to runtime state (camera/mic flags)
