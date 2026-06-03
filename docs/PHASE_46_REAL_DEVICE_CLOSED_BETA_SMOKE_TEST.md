# PHASE 46 — Real Device Closed Beta Smoke Test

**Date:** 2026-06-02  
**Status:** PLAN (requires deployed beta environment and installed APK)

---

## 1. Test Devices

| Device ID | Device | Category | OS Version | Browser/App | Network | Status |
|-----------|--------|----------|------------|-------------|---------|--------|
| D-001 | Realme 6 | Android Low-end | Android 11 | ZYMI Mobile | WiFi / 4G | ⏳ PENDING |
| D-002 | Pixel 7 | Android Mid-range | Android 14 | ZYMI Mobile | WiFi / 5G | ⏳ PENDING |
| D-003 | Samsung Galaxy S23 | Android High-end | Android 14 | ZYMI Mobile | WiFi / 5G | ⏳ PENDING |
| D-004 | Desktop (Windows) | Desktop | Windows 11 | Chrome 125 | WiFi | ⏳ PENDING |
| D-005 | Desktop (Windows) | Desktop | Windows 11 | Firefox 127 | WiFi | ⏳ PENDING |
| D-006 | Desktop (Windows) | Desktop | Windows 11 | Edge 125 | WiFi | ⏳ PENDING |
| D-007 | MacBook | Desktop | macOS 14 | Chrome 125 | WiFi | ⏳ PENDING |
| D-008 | iPhone 13 | iOS | iOS 17 | Safari / TestFlight | WiFi / 5G | ⏳ PENDING (iOS build as available) |

---

## 2. Smoke Test Cases

### TC-001: Install App

| Field | Detail |
|-------|--------|
| Device | All |
| Steps | Download APK (Android) or open URL (Web) or TestFlight (iOS) |
| Expected | App installs and opens without error |
| Result | ⏳ PENDING |
| Bug ID | — |

### TC-002: Open App

| Field | Detail |
|-------|--------|
| Device | All |
| Steps | Tap app icon, observe splash screen |
| Expected | App opens, splash screen displays, no crash |
| Result | ⏳ PENDING |
| Bug ID | — |

### TC-003: Register

| Field | Detail |
|-------|--------|
| Device | All |
| Steps | Fill registration form with valid email, username, password, display name |
| Expected | Account created, OTP sent to email |
| Result | ⏳ PENDING |
| Bug ID | — |

### TC-004: OTP Verify

| Field | Detail |
|-------|--------|
| Device | All |
| Steps | Check email for OTP, enter OTP in app |
| Expected | Email verified, redirected to login or dashboard |
| Result | ⏳ PENDING |
| Bug ID | — |

### TC-005: Login

| Field | Detail |
|-------|--------|
| Device | All |
| Steps | Enter registered email/username and password |
| Expected | JWT token received, redirected to dashboard |
| Result | ⏳ PENDING |
| Bug ID | — |

### TC-006: Profile Update

| Field | Detail |
|-------|--------|
| Device | All |
| Steps | Navigate to profile, update display name and avatar |
| Expected | Changes saved and visible |
| Result | ⏳ PENDING |
| Bug ID | — |

### TC-007: Send Message

| Field | Detail |
|-------|--------|
| Device | At least 2 devices |
| Steps | Open conversation, type message, send |
| Expected | Message appears in chat |
| Result | ⏳ PENDING |
| Bug ID | — |

### TC-008: Delivered Status

| Field | Detail |
|-------|--------|
| Device | At least 2 devices |
| Steps | Send message from Device A, observe on Device B |
| Expected | Single checkmark or "Delivered" indicator appears |
| Result | ⏳ PENDING |
| Bug ID | — |

### TC-009: Seen Status

| Field | Detail |
|-------|--------|
| Device | At least 2 devices |
| Steps | Device B opens conversation, observe on Device A |
| Expected | Double checkmark or "Seen" indicator appears |
| Result | ⏳ PENDING |
| Bug ID | — |

### TC-010: Typing Indicator

| Field | Detail |
|-------|--------|
| Device | At least 2 devices |
| Steps | Device B starts typing in conversation |
| Expected | Device A sees "typing..." indicator |
| Result | ⏳ PENDING |
| Bug ID | — |

### TC-011: Upload Image

| Field | Detail |
|-------|--------|
| Device | All |
| Steps | Tap attachment/upload button, select image |
| Expected | Image uploads, thumbnail appears in chat |
| Result | ⏳ PENDING |
| Bug ID | — |

### TC-012: Voice Call

| Field | Detail |
|-------|--------|
| Device | At least 2 devices (same network) |
| Steps | Initiate voice call from Device A to Device B |
| Expected | Both devices ring, call connects, audio flows |
| Result | ⏳ PENDING |
| Bug ID | — |

### TC-013: Video Call

| Field | Detail |
|-------|--------|
| Device | At least 2 devices (same network) |
| Steps | Initiate video call from Device A to Device B |
| Expected | Both devices ring, call connects, video flows |
| Result | ⏳ PENDING |
| Bug ID | — |

### TC-014: Group Chat

| Field | Detail |
|-------|--------|
| Device | At least 3 devices |
| Steps | Create group, add members, send message |
| Expected | All members see message in group |
| Result | ⏳ PENDING |
| Bug ID | — |

### TC-015: Group Call

| Field | Detail |
|-------|--------|
| Device | At least 3 devices |
| Steps | Initiate group call from group chat |
| Expected | All members can join and communicate |
| Result | ⏳ PENDING |
| Bug ID | — |

### TC-016: Nearby Discovery

| Field | Detail |
|-------|--------|
| Device | At least 2 devices with location enabled |
| Steps | Enable location, open nearby users |
| Expected | Other nearby users visible |
| Result | ⏳ PENDING |
| Bug ID | — |

### TC-017: Block User

| Field | Detail |
|-------|--------|
| Device | At least 2 devices |
| Steps | Device A blocks Device B |
| Expected | Device B cannot message Device A |
| Result | ⏳ PENDING |
| Bug ID | — |

### TC-018: Report User

| Field | Detail |
|-------|--------|
| Device | At least 2 devices |
| Steps | Device A reports Device B's message |
| Expected | Report submitted, admin can view |
| Result | ⏳ PENDING |
| Bug ID | — |

### TC-019: Logout

| Field | Detail |
|-------|--------|
| Device | All |
| Steps | Navigate to settings, tap logout |
| Expected | Session cleared, redirected to login page |
| Result | ⏳ PENDING |
| Bug ID | — |

### TC-020: Re-login

| Field | Detail |
|-------|--------|
| Device | All |
| Steps | Enter credentials again |
| Expected | Login successful, previous data preserved |
| Result | ⏳ PENDING |
| Bug ID | — |

---

## 3. Results Matrix

| Test ID | Test Name | D-001 (Realme 6) | D-002 (Pixel 7) | D-003 (S23) | D-004 (Win Chrome) | D-005 (Win FF) | D-006 (Win Edge) | D-007 (Mac Chrome) | D-008 (iPhone) |
|---------|-----------|-----------------|-----------------|-------------|-------------------|----------------|-----------------|-------------------|----------------|
| TC-001 | Install | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ |
| TC-002 | Open | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ |
| TC-003 | Register | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ |
| TC-004 | OTP Verify | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ |
| TC-005 | Login | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ |
| TC-006 | Profile | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ |
| TC-007 | Send Message | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ |
| TC-008 | Delivered | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ |
| TC-009 | Seen | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ |
| TC-010 | Typing | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ |
| TC-011 | Upload | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ |
| TC-012 | Voice Call | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ |
| TC-013 | Video Call | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ |
| TC-014 | Group Chat | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ |
| TC-015 | Group Call | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ |
| TC-016 | Nearby | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ |
| TC-017 | Block | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ |
| TC-018 | Report | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ |
| TC-019 | Logout | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ |
| TC-020 | Re-login | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ |

---

## 4. Summary

| Metric | Count |
|--------|-------|
| Total test cases | 20 |
| Total device slots | 8 |
| Total test executions | 160 |
| PASSED | 0 |
| FAILED | 0 |
| PENDING | 160 |
| Blocked by env | 160 |

---

## 5. Blockers

| Blocker | Impact |
|---------|--------|
| No deployed beta environment with PostgreSQL + Redis | All tests require working backend |
| No APK built and installed on real device | Mobile tests cannot execute |
| No iOS build configured | iPhone tests blocked |
| No real domain with HTTPS/WSS | Web tests require HTTPS for camera/mic access |

---

## 6. Prerequisites Before Execution

```bash
# 1. Deploy backend on VPS with Docker stack
# 2. Configure domain and HTTPS
# 3. Build APK: cd mobile/zymi_mobile_app && flutter build apk --debug
# 4. Install APK on 3+ Android devices
# 5. Deploy web build to production domain
# 6. Execute all 20 test cases per device
# 7. Update this document with results
```
