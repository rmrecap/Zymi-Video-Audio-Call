# PHASE 28 — Real Device & Cross-Network Validation Report

> **Status:** Planning Template (Not Yet Executed)
> **Purpose:** Define test scenarios, device requirements, and pass/fail criteria for closed-beta readiness.
> **Test Period:** TBD — must be completed before closed beta launch.

---

## 1. Minimum Device Requirements & Recommendations

| Tier | Specifications | Notes |
|------|----------------|-------|
| **Android Low-End** | 3 GB RAM, Android 11+, 720p display | Minimum bar; all core features must work without crash |
| **Android Mid-Range** | 6 GB RAM, Android 13+, 1080p display | Primary target audience; must feel smooth |
| **Android High-End** | 12 GB RAM, Android 14+, 1440p display | Performance ceiling; test scaling & memory |
| **iPhone (iOS 16+)** | Any model (SE / 11 / 13 / 15 etc.) | Covers notch, Dynamic Island, Safe Area |
| **Windows Desktop** | Chrome 120+, Edge 120+ | Screen-share, PIP, multi-window |
| **macOS Desktop** | Safari 17+, Chrome 120+ | Native scroll, Safari compatibility |
| **Chrome Desktop** | Windows / Mac / Linux | Cross-OS consistency |
| **Chrome Mobile** | Android & iOS | Touch interactions, keyboard overlap |

---

## 2. Device-Specific Test Scenarios

### 2.1 Android Low-End (3 GB / Android 11 / 720p)

| ID | Test | Validation Area |
|----|------|-----------------|
| AL-01 | Launch app, register/login via phone | UI, Permissions |
| AL-02 | Initiate 1:1 voice call | Call stability |
| AL-03 | Initiate 1:1 video call | Camera, Permissions |
| AL-04 | Send 50 text messages rapidly | Memory, CPU, UI responsiveness |
| AL-05 | Receive incoming call while in another app | Background mode |
| AL-06 | Lock screen incoming call notification | Background mode |
| AL-07 | Run app for 30 min active — measure battery drain | Battery impact |
| AL-08 | Kill app, reopen, verify conversation state | Foreground restore |

### 2.2 Android Mid-Range (6 GB / Android 13 / 1080p)

| ID | Test | Validation Area |
|----|------|-----------------|
| AM-01 | Group voice call (4 participants) | Call stability |
| AM-02 | Group video call (4 participants) | Call stability, CPU |
| AM-03 | Send image + file attachments | UI, Permissions |
| AM-04 | Background app for 10 min -> foreground -> send message | Background socket |
| AM-05 | Toggle microphone on/off mid-call | Microphone permission |
| AM-06 | Toggle camera on/off mid-call | Camera permission |
| AM-07 | Screen-share from app (if supported) | UI, Permissions |
| AM-08 | Measure reconnect time after airplane mode toggle | Reconnect time |

### 2.3 Android High-End (12 GB / Android 14 / 1440p)

| ID | Test | Validation Area |
|----|------|-----------------|
| AH-01 | Video call at max resolution | Call stability, CPU |
| AH-02 | Switch between front/rear camera mid-call | Camera permission |
| AH-03 | Picture-in-picture mode | Safe area, UI |
| AH-04 | Measure peak memory during 30-min call | Memory usage |
| AH-05 | Measure CPU during group video call | CPU usage |
| AH-06 | Notch / punch-hole camera overlap test | Safe area / notch |

### 2.4 iPhone (iOS 16+, Any Model)

| ID | Test | Validation Area |
|----|------|-----------------|
| IP-01 | Voice call over LTE | Call stability |
| IP-02 | Video call over WiFi | Call stability |
| IP-03 | Incoming call while phone is locked | Locked screen behavior |
| IP-04 | Dynamic Island / notch interaction — incoming call banner | Safe area / notch |
| IP-05 | Swipe home during video call — verify PIP | Background mode |
| IP-06 | Microphone permission — deny then re-grant | Microphone permission |
| IP-07 | Camera permission — deny then re-grant | Camera permission |
| IP-08 | Background for 15 min — socket alive check | Background socket |

### 2.5 Windows Desktop (Chrome / Edge)

| ID | Test | Validation Area |
|----|------|-----------------|
| WD-01 | Join audio call via browser | Call stability |
| WD-02 | Share screen tab | UI, Permissions |
| WD-03 | Receive call notification while browser minimized | Background mode |
| WD-04 | Resize window to 720p equivalent | UI responsiveness |
| WD-05 | Measure memory after 1 hour idle | Memory usage |

### 2.6 macOS Desktop (Safari / Chrome)

| ID | Test | Validation Area |
|----|------|-----------------|
| MD-01 | Voice call via Safari | Call stability |
| MD-02 | Voice call via Chrome | Call stability |
| MD-03 | Safe area — notched MacBook notch behavior | Safe area / notch |
| MD-04 | PIP video call | UI |
| MD-05 | Measure CPU usage during group call | CPU usage |

### 2.7 Chrome Desktop (Windows / Mac / Linux)

| ID | Test | Validation Area |
|----|------|-----------------|
| CD-01 | Full call flow on each OS | Call stability |
| CD-02 | Permission dialogs — allow / block / remember | Permissions |
| CD-03 | Tab backgrounded -> restore -> verify state | Foreground restore |

### 2.8 Chrome Mobile (Android / iOS)

| ID | Test | Validation Area |
|----|------|-----------------|
| CM-01 | Touch-and-hold context menu on messages | UI |
| CM-02 | Keyboard overlap during chat — input not hidden | UI responsiveness |
| CM-03 | Rotate device mid-call — UI reflow | Safe area, UI |
| CM-04 | Notification tap opens correct conversation | Foreground restore |

---

## 3. Validation Areas — Detailed Measurement Criteria

| Validation Area | Measurement / Criteria |
|----------------|-----------------------|
| **UI Responsiveness** | No visible jank > 200 ms; frame rate >= 30 fps |
| **Call Stability** | Audio dropout < 2 s per minute; no call drop |
| **Microphone Permission** | Grant -> mic works; Deny -> app shows graceful error + re-prompt |
| **Camera Permission** | Grant -> camera feeds; Deny -> app shows graceful error + re-prompt |
| **Background Socket** | Socket must stay alive for >= 5 min (target 10 min) on mobile |
| **Foreground Restore** | Conversations list restores within 2 s; unread badge updated |
| **Locked Screen Behavior** | Incoming call UI appears; accept/reject works; notification displayed |
| **Safe Area / Notch** | No UI element hidden under notch/punch-hole/Dynamic Island |
| **Battery Impact** | <= 10% per hour of active call; <= 5% per hour idle |
| **Memory Usage** | Android: <= 300 MB; iOS: <= 250 MB; Desktop: <= 400 MB |
| **CPU Usage** | Idle: <= 5%; Active call: <= 20%; Group video: <= 40% |
| **Reconnect Time** | <= 5 s after network restoration |
| **Message Delivery Time** | <= 1 s (WiFi); <= 3 s (mobile data); <= 8 s (slow network) |
| **Call Connection Time** | <= 3 s from accept to media flowing |

---

## 4. Network Conditions — Simulation Setup

| Condition | Simulation Method |
|-----------|------------------|
| **Slow Network (100 kbps)** | Chrome DevTools network throttling — "Slow 3G" preset or custom 100 kbps |
| **WiFi (Stable)** | Standard office/home WiFi — 50+ Mbps, < 20 ms latency |
| **Mobile Data 4G** | Physical 4G SIM; or Android Studio network emulation |
| **Mobile Data 5G** | Physical 5G SIM (preferred); or capped WiFi at 200 Mbps / 10 ms |
| **WiFi -> Mobile Switch** | Enable WiFi, join call, disable WiFi (retain mobile data) |
| **Mobile -> WiFi Switch** | Disable WiFi, join call on mobile data, enable WiFi |

---

## 5. Results Table (To Be Filled By Testers)

### 5.1 Core Functional Tests

| Test ID | Device/Network | Validation Area | Procedure | Expected Result | Actual Result | Pass/Fail | Notes |
|---------|---------------|----------------|-----------|----------------|---------------|-----------|-------|
| CORE-01 | Android Low-End | Call Stability | Initiate 1:1 voice call; talk for 60 s | Audio continuous, no drop > 2 s | | | |
| CORE-02 | Android Mid-Range | Call Stability | Initiate 1:1 video call; switch cameras twice | Video flows; camera toggles within 1 s | | | |
| CORE-03 | Android High-End | Call Stability | Group video call (4 participants) for 5 min | All participants visible; no freeze | | | |
| CORE-04 | iPhone | Call Stability | Incoming call on locked screen; accept | Audio routes to earpiece/speaker; no echo | | | |
| CORE-05 | Windows Chrome | Permissions | Grant microphone; start call | Mic works; browser permission bar shown | | | |
| CORE-06 | macOS Safari | Permissions | Deny camera; attempt video call | Graceful error; settings link offered | | | |
| CORE-07 | Chrome Desktop | UI Responsiveness | Rapidly scroll 200 messages | Scroll latency < 100 ms | | | |
| CORE-08 | Chrome Mobile | UI Responsiveness | Open keyboard, type 50 chars | Input not hidden; viewport adjusts | | | |

### 5.2 Background / Foreground Tests

| Test ID | Device/Network | Validation Area | Procedure | Expected Result | Actual Result | Pass/Fail | Notes |
|---------|---------------|----------------|-----------|----------------|---------------|-----------|-------|
| BG-01 | Android (all) | Background Socket | Call active -> press home -> wait 5 min -> reopen | Call still connected; audio resumes | | | |
| BG-02 | iPhone | Background Socket | Call active -> swipe home -> open other app -> wait 5 min | PIP visible; call continues | | | |
| BG-03 | Android | Foreground Restore | Kill app -> reopen from recents | Conversation list loads; messages not lost | | | |
| BG-04 | iPhone | Foreground Restore | Swipe away from app switcher -> tap notification | Opens correct conversation | | | |
| BG-05 | Desktop (all) | Background Socket | Tab backgrounded for 10 min -> return | Socket reconnects within 3 s; messages sync | | | |

### 5.3 Permission Tests

| Test ID | Device/Network | Validation Area | Procedure | Expected Result | Actual Result | Pass/Fail | Notes |
|---------|---------------|----------------|-----------|----------------|---------------|-----------|-------|
| PERM-01 | Android | Microphone Permission | Start call -> deny mic in settings -> return to app | App detects denial; shows re-enable prompt | | | |
| PERM-02 | Android (13+) | Microphone Permission | Deny mic permission at first prompt -> try again later | Prompt appears again (not permanently denied) | | | |
| PERM-03 | iPhone | Microphone Permission | Deny mic -> start call | Graceful error; links to Settings | | | |
| PERM-04 | Android | Camera Permission | Start video call -> deny camera -> continue as audio-only | Video pauses; audio continues; re-enable button | | | |
| PERM-05 | iPhone | Camera Permission | Grant camera -> video call -> revoke in settings -> return | Video freezes; prompt shown | | | |
| PERM-06 | Desktop Chrome | Microphone Permission | Block mic -> attempt call | Error message; instructions to unblock | | | |

### 5.4 Battery, Memory, CPU

| Test ID | Device/Network | Validation Area | Procedure | Expected Result | Actual Result | Pass/Fail | Notes |
|---------|---------------|----------------|-----------|----------------|---------------|-----------|-------|
| BMC-01 | Android Low-End | Battery Impact | 30 min video call; measure % drop | <= 5% | | | |
| BMC-02 | Android Mid-Range | Battery Impact | 30 min video call; measure % drop | <= 5% | | | |
| BMC-03 | iPhone | Battery Impact | 30 min audio call; measure % drop | <= 3% | | | |
| BMC-04 | Android Low-End | Memory Usage | Open app, join call, measure in task manager | <= 300 MB | | | |
| BMC-05 | Android High-End | Memory Usage | Group video call; peak memory | <= 350 MB | | | |
| BMC-06 | iPhone | Memory Usage | 1:1 video call; Xcode memory gauge | <= 250 MB | | | |
| BMC-07 | Android Mid-Range | CPU Usage | Idle in chat; measure CPU | <= 5% | | | |
| BMC-08 | Android High-End | CPU Usage | Group video call (4p); measure CPU | <= 40% | | | |
| BMC-09 | Desktop Chrome | CPU Usage | 1:1 video call; Task Manager | <= 20% | | | |

### 5.5 Timing / Latency Tests

| Test ID | Device/Network | Validation Area | Procedure | Expected Result | Actual Result | Pass/Fail | Notes |
|---------|---------------|----------------|-----------|----------------|---------------|-----------|-------|
| LAT-01 | WiFi (any device) | Message Delivery Time | Send "ping" -> measure time to receiver | <= 1 s | | | |
| LAT-02 | 4G (any mobile) | Message Delivery Time | Send "ping" over 4G | <= 3 s | | | |
| LAT-03 | 5G (any mobile) | Message Delivery Time | Send "ping" over 5G | <= 1.5 s | | | |
| LAT-04 | Slow Network (100 kbps) | Message Delivery Time | Send "ping" with throttled network | <= 8 s | | | |
| LAT-05 | WiFi (any device) | Call Connection Time | Accept incoming call; measure delay | <= 3 s | | | |
| LAT-06 | 4G (any mobile) | Call Connection Time | Accept incoming call; measure delay | <= 3 s | | | |
| LAT-07 | Slow Network (100 kbps) | Call Connection Time | Accept incoming call; measure delay | <= 5 s | | | |
| LAT-08 | WiFi (any device) | Reconnect Time | Airplane mode on 10 s -> off; measure reconnect | <= 5 s | | | |
| LAT-09 | 4G (any mobile) | Reconnect Time | Toggle mobile data off 10 s -> on; measure reconnect | <= 5 s | | | |

---

## 6. Cross-Network Handoff Tests

| Test ID | Device/Network | Validation Area | Procedure | Expected Result | Actual Result | Pass/Fail | Notes |
|---------|---------------|----------------|-----------|----------------|---------------|-----------|-------|
| HO-01 | Android WiFi -> 4G | Call Stability | Start voice call on WiFi; disable WiFi mid-call | Call seamlessly hands over to mobile data; audio gap < 3 s | | | |
| HO-02 | Android WiFi -> 5G | Call Stability | Start video call on WiFi; disable WiFi mid-call | Video pauses briefly (< 2 s); resumes on 5G | | | |
| HO-03 | iPhone WiFi -> 4G | Call Stability | Start voice call on WiFi; disable WiFi mid-call | Call continues on mobile data; no drop | | | |
| HO-04 | Android 4G -> WiFi | Call Stability | Start voice call on 4G; enable WiFi mid-call | Call hands over to WiFi; audio gap < 3 s | | | |
| HO-05 | Android 5G -> WiFi | Call Stability | Start video call on 5G; enable WiFi mid-call | Video quality improves; no call drop | | | |
| HO-06 | iPhone 4G -> WiFi | Call Stability | Start voice call on 4G; enable WiFi mid-call | Seamless handoff; no interruption | | | |
| HO-07 | Android WiFi -> 4G | Message Delivery | Send message on WiFi; switch to 4G before delivery confirmation | Message delivered; delivery status updated on 4G | | | |
| HO-08 | iPhone WiFi -> 4G | Message Delivery | Send message on WiFi; switch to 4G before delivery confirmation | Message delivered; no duplicate or loss | | | |
| HO-09 | Android (any) | Incoming Call + Network Switch | Receive call while switching from WiFi to 4G | Call ringtone/notification fires; accept works | | | |
| HO-10 | iPhone (any) | Incoming Call + Network Switch | Receive call while switching from 4G to WiFi | Call notification appears; accept works | | | |
| HO-11 | Android Low-End | Cross-Network Call | Start call on WiFi; switch to 4G; talk for 2 min | Stable call; no crash; memory within limits | | | |
| HO-12 | Desktop (any) | Cross-Network | Desktop not applicable for mobile handoff; skip | N/A | | | |

### 6.1 Cross-Network Handoff — Detailed Procedure

#### HO-01 / HO-02 / HO-03 (WiFi -> Mobile)
1. Ensure device has both WiFi and mobile data enabled.
2. Connect to a stable WiFi network.
3. Initiate a call (voice for HO-01/HO-03, video for HO-02).
4. Confirm media is flowing.
5. Disable WiFi on the device (do not enable airplane mode — keep mobile data active).
6. Observe call behavior for 60 seconds.
7. Record: audio gap duration, whether call dropped, automatic reconnection time.

#### HO-04 / HO-05 / HO-06 (Mobile -> WiFi)
1. Disable WiFi. Ensure mobile data (4G/5G) is active.
2. Initiate a call on mobile data.
3. Confirm media is flowing.
4. Enable WiFi on the device.
5. Observe call behavior for 60 seconds.
6. Record: audio gap duration, whether call dropped, quality improvement.

#### HO-07 / HO-08 (Message During Handoff)
1. Connect to WiFi.
2. Type a message and press send.
3. Immediately (before delivery checkmark appears) disable WiFi.
4. Wait for message delivery confirmation.
5. Verify the message was delivered exactly once on the receiver side.

#### HO-09 / HO-10 (Incoming Call During Handoff)
1. On Device A: enable WiFi, disable mobile data.
2. From Device B: call Device A.
3. As Device A rings, toggle WiFi off (mobile data should take over).
4. Verify: call notification persists, accept works, audio flows.

---

## 7. Conclusions

1. **This document is a plan / template — not a completed test report.** No real devices were used during the creation of this document.

2. **No real devices were tested.** Every cell in the "Actual Result" and "Pass/Fail" columns is empty by design. These fields must be filled by a human tester running the defined procedures on physical hardware.

3. **Mandatory execution before closed beta.** All tests defined in this document MUST be executed and passed before the closed beta can be launched. Skipping any section risks undetected regressions in production.

4. **Critical failure threshold.** Any device type that fails 2 or more critical tests (marked with `CORE-XX`, `HO-XX` for handoff, or `PERM-XX` for permission tests) **blocks the beta launch**. The blocking device must be re-tested after fixes before launch can proceed.

5. **Recommended testing order:**
   - Phase A: Core functional tests (CORE-01 through CORE-08) on all device types
   - Phase B: Permission tests (PERM-01 through PERM-06)
   - Phase C: Cross-network handoff (HO-01 through HO-12)
   - Phase D: Background / foreground (BG-01 through BG-05)
   - Phase E: Battery, memory, CPU (BMC-01 through BMC-09)
   - Phase F: Latency / timing (LAT-01 through LAT-09)
   - Phase G: Remaining device-specific tests by tier

6. **All bugs found during testing must be filed with the Test ID in the bug title.** For example: `[HO-03] Call drops when switching from WiFi to 4G on iPhone`.

---

*End of Report — Template prepared for the ZYMI production launch team.*
