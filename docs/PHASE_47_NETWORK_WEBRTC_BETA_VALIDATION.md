# PHASE 47 — Network & WebRTC Beta Validation

**Date:** 2026-06-02  
**Status:** PLAN (requires deployed beta environment with TURN server)

---

## 1. Network Condition Tests

### TC-NW-01: WiFi to WiFi Call

| Field | Detail |
|-------|--------|
| Description | Both caller and recipient on same WiFi network |
| Steps | Initiate voice call between two devices on same WiFi |
| Expected | Call connects within 5 seconds, audio clear |
| Result | ⏳ PENDING |
| Bug ID | — |

### TC-NW-02: Mobile Data to WiFi Call

| Field | Detail |
|-------|--------|
| Description | Caller on 4G/5G, recipient on WiFi |
| Steps | Initiate call from mobile data device to WiFi device |
| Expected | Call connects, audio quality acceptable |
| Result | ⏳ PENDING |
| Bug ID | — |

### TC-NW-03: WiFi to Mobile Data Call

| Field | Detail |
|-------|--------|
| Description | Caller on WiFi, recipient on 4G/5G |
| Steps | Initiate call from WiFi device to mobile data device |
| Expected | Call connects, audio quality acceptable |
| Result | ⏳ PENDING |
| Bug ID | — |

### TC-NW-04: Mobile Data to Mobile Data Call

| Field | Detail |
|-------|--------|
| Description | Both on 4G/5G different networks |
| Steps | Initiate call between two devices on different mobile networks |
| Expected | Call connects (likely via TURN relay), audio quality acceptable |
| Result | ⏳ PENDING |
| Bug ID | — |

### TC-NW-05: WiFi to Mobile Data Handover (During Call)

| Field | Detail |
|-------|--------|
| Description | Caller switches from WiFi to mobile data during active call |
| Steps | While on call, disable WiFi on caller device, forcing mobile data |
| Expected | Call continues with brief audio interruption (< 3s), then resumes |
| Result | ⏳ PENDING |
| Bug ID | — |

### TC-NW-06: Mobile Data to WiFi Handover (During Call)

| Field | Detail |
|-------|--------|
| Description | Caller switches from mobile data to WiFi during active call |
| Steps | While on call, enable WiFi on caller device, forcing network switch |
| Expected | Call continues with brief audio interruption (< 3s), then resumes |
| Result | ⏳ PENDING |
| Bug ID | — |

### TC-NW-07: Low Bandwidth Call

| Field | Detail |
|-------|--------|
| Description | Simulate low bandwidth (throttle to 500 Kbps) |
| Steps | Use network throttling tool, initiate call |
| Expected | Call connects with reduced quality, does not drop |
| Result | ⏳ PENDING |
| Bug ID | — |

### TC-NW-08: App Background During Incoming Call

| Field | Detail |
|-------|--------|
| Description | App is in background when incoming call arrives |
| Steps | Put Device B in background, initiate call from Device A |
| Expected | Device B receives system notification, can answer |
| Result | ⏳ PENDING |
| Bug ID | — |

### TC-NW-09: Screen Locked Incoming Call Behavior

| Field | Detail |
|-------|--------|
| Description | Device screen is locked when incoming call arrives |
| Steps | Lock Device B screen, initiate call from Device A |
| Expected | Device B shows incoming call on lock screen |
| Result | ⏳ PENDING |
| Bug ID | — |

### TC-NW-10: Group Call with 3 Users

| Field | Detail |
|-------|--------|
| Description | Group voice/video call with 3 participants |
| Steps | Create group, initiate call, all 3 join |
| Expected | All participants connected, audio flows |
| Result | ⏳ PENDING |
| Bug ID | — |

### TC-NW-11: Group Call with 5 Users (if supported)

| Field | Detail |
|-------|--------|
| Description | Group voice/video call with 5 participants |
| Steps | Create group, initiate call, all 5 join |
| Expected | All participants connected, audio/video quality acceptable |
| Result | ⏳ PENDING |
| Bug ID | — |

---

## 2. Performance Measurements

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| Call connection time (1:1) | < 5 seconds | Start → ring time |
| Call connection time (group 3) | < 8 seconds | Start → all connected |
| Call connection time (group 5) | < 12 seconds | Start → all connected |
| Audio quality (WiFi) | MOS > 4.0 | Subjective (1-5 scale) |
| Audio quality (4G/5G) | MOS > 3.5 | Subjective (1-5 scale) |
| Video quality (WiFi) | 720p+ stable | Subjective observation |
| Video quality (4G/5G) | 480p+ stable | Subjective observation |
| Call disconnect rate | < 5% | Disconnects / total calls |
| Network handover interruption | < 3 seconds | Timer during switch |
| TURN usage rate | Measured | Server-side TURN allocation logs |

---

## 3. TURN Server Validation

| Test | Expected | Result |
|------|----------|--------|
| STUN binding | Returns public IP and port | ⏳ PENDING |
| TURN allocation | Allocates relay port | ⏳ PENDING |
| TURN relay (WiFi→WiFi) | Uses relay only if P2P fails | ⏳ PENDING |
| TURN relay (4G→4G) | Uses relay (P2P blocked by NAT) | ⏳ PENDING |
| TURN credentials | Valid for session duration | ⏳ PENDING |
| TURN failure fallback | Call drops gracefully if TURN unavailable | ⏳ PENDING |

---

## 4. ICE Connection Analysis

| Scenario | Expected ICE Type | Result |
|----------|------------------|--------|
| Same WiFi network | host (P2P) | ⏳ PENDING |
| Different WiFi networks | srflx (STUN) or relay (TURN) | ⏳ PENDING |
| Mobile data to WiFi | srflx or relay | ⏳ PENDING |
| Mobile data to mobile data | relay (TURN) | ⏳ PENDING |
| Symmetric NAT | relay (TURN) | ⏳ PENDING |

---

## 5. Results Summary

| Test ID | Description | Result | Connection Time | Audio Quality | Video Quality | Disconnect | TURN Used |
|---------|-------------|--------|----------------|--------------|--------------|------------|-----------|
| TC-NW-01 | WiFi → WiFi | ⏳ | — | — | — | — | — |
| TC-NW-02 | Mobile → WiFi | ⏳ | — | — | — | — | — |
| TC-NW-03 | WiFi → Mobile | ⏳ | — | — | — | — | — |
| TC-NW-04 | Mobile → Mobile | ⏳ | — | — | — | — | — |
| TC-NW-05 | WiFi → Mobile switch | ⏳ | — | — | — | — | — |
| TC-NW-06 | Mobile → WiFi switch | ⏳ | — | — | — | — | — |
| TC-NW-07 | Low bandwidth | ⏳ | — | — | — | — | — |
| TC-NW-08 | Background incoming | ⏳ | — | — | — | — | — |
| TC-NW-09 | Screen locked | ⏳ | — | — | — | — | — |
| TC-NW-10 | Group call (3) | ⏳ | — | — | — | — | — |
| TC-NW-11 | Group call (5) | ⏳ | — | — | — | — | — |

---

## 6. Failure Analysis

| Failure Reason | Count | Notes |
|----------------|-------|-------|
| — | 0 | No tests executed yet |

---

## 7. Requirements

| Requirement | Status |
|-------------|--------|
| Two+ Android devices with ZYMI installed | ⏳ NEEDS APK BUILD |
| One+ web browser on desktop | ⏳ NEEDS DEPLOYMENT |
| WiFi network | ✅ Available |
| Mobile data (4G/5G) with different carriers | ⏳ NEEDS SIM CARDS |
| TURN server (Coturn) deployed | ⏳ NEEDS SETUP |
| Network throttling tool (Clumsy, NetLimiter, or similar) | ⏳ NEEDS SETUP |

> **Note:** Do not claim WebRTC is ready without real network tests.
