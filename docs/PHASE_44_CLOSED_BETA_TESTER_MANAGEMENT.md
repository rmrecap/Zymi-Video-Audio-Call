# PHASE 44 — Closed Beta Tester Management System

**Date:** 2026-06-02  
**Status:** COMPLETE  
**Target:** 20–50 beta testers across 5 groups

---

## 1. Tester Groups

### Group A — Android Users

| Attribute | Detail |
|-----------|--------|
| Platform | Android (APK) |
| Device types | Low-end, mid-range, high-end |
| OS versions | Android 11+ |
| Test focus | Mobile core flows, calls, media |
| Target size | 8–15 testers |

### Group B — iPhone Users

| Attribute | Detail |
|-----------|--------|
| Platform | iOS (TestFlight or IPA) |
| Device types | iPhone SE, 13, 14, 15 |
| OS versions | iOS 16+ |
| Test focus | Mobile core flows, calls, media |
| Target size | 5–10 testers |

### Group C — Desktop Web Users

| Attribute | Detail |
|-----------|--------|
| Platform | Web (Chrome, Firefox, Edge) |
| Device types | Desktop / Laptop |
| OS versions | Windows 10+, macOS 12+, Linux |
| Test focus | Admin panel, dashboard, chat |
| Target size | 5–10 testers |

### Group D — Call Quality Testers

| Attribute | Detail |
|-----------|--------|
| Platform | Android + Web |
| Device types | All |
| OS versions | All |
| Test focus | Voice/video quality, network switching, TURN fallback |
| Target size | 5–8 testers |

### Group E — Admin/Moderation Testers

| Attribute | Detail |
|-----------|--------|
| Platform | Web (desktop) |
| Device types | Desktop / Laptop |
| OS versions | Windows 10+, macOS 12+ |
| Test focus | Admin panel, user management, reports, bans |
| Target size | 2–4 testers |

---

## 2. Tester Onboarding Table

| Tester ID | Platform | Device | OS Version | Network | Assigned Test Cases | Account Status | Feedback Status |
|-----------|----------|--------|------------|---------|---------------------|----------------|-----------------|
| TA-001 | Android | Realme 6 | Android 11 | WiFi/4G | TC-001 to TC-010 | Invited | Pending |
| TA-002 | Android | Pixel 7 | Android 14 | WiFi/5G | TC-001 to TC-010 | Invited | Pending |
| TA-003 | Android | Samsung A52 | Android 13 | WiFi/4G | TC-001 to TC-015 | Invited | Pending |
| TA-004 | Android | OnePlus 9 | Android 13 | WiFi/5G | TC-001 to TC-015 | Invited | Pending |
| TA-005 | Android | Xiaomi 12 | Android 12 | WiFi/4G | TC-001 to TC-020 | Invited | Pending |
| TB-001 | iPhone | iPhone 13 | iOS 17 | WiFi/5G | TC-001 to TC-010 | Invited | Pending |
| TB-002 | iPhone | iPhone 14 Pro | iOS 18 | WiFi/5G | TC-001 to TC-015 | Invited | Pending |
| TB-003 | iPhone | iPhone SE (3rd) | iOS 17 | WiFi/4G | TC-001 to TC-010 | Invited | Pending |
| TC-001 | Web | Desktop Chrome | Windows 11 | WiFi | TC-001 to TC-010 | Invited | Pending |
| TC-002 | Web | Desktop Firefox | macOS 14 | WiFi | TC-001 to TC-015 | Invited | Pending |
| TC-003 | Web | Desktop Edge | Windows 11 | WiFi | TC-001 to TC-020 | Invited | Pending |
| TD-001 | Android | Realme 6 | Android 11 | WiFi/4G | Call quality (CQ-01 to 10) | Invited | Pending |
| TD-002 | Android | Pixel 7 | Android 14 | WiFi/5G | Call quality (CQ-01 to 10) | Invited | Pending |
| TD-003 | Web | Desktop Chrome | Windows 11 | WiFi | Call quality (CQ-01 to 10) | Invited | Pending |
| TE-001 | Web | Desktop Chrome | Windows 11 | WiFi | Admin (AD-01 to 10) | Invited | Pending |
| TE-002 | Web | Desktop Firefox | macOS 14 | WiFi | Admin (AD-01 to 10) | Invited | Pending |

**Note:** Expand to 20–50 testers as recruitment progresses. Above is the initial seed group.

---

## 3. Beta Invite Message Template

**File:** `docs/BETA_TESTER_INVITE_MESSAGE.md` (companion document)

The invite message template is created in a separate file for direct copy-paste use.

---

## 4. Beta Rules

**File:** `docs/BETA_TESTER_RULES.md` (companion document)

Rules are created in a separate file for tester acknowledgment.

---

## 5. Tester Feedback Form

**File:** `docs/BETA_TESTER_FEEDBACK_FORM.md` (companion document)

The feedback form is created in a separate file for distribution.

---

## 6. Tester Lifecycle

```
Onboarding:
  1. Recruitment → 2. Send invite → 3. Tester accepts rules →
  4. Create account → 5. Assign group → 6. Provide APK/URL →
  7. Onboarding complete

Active Testing:
  8. Execute assigned test cases → 9. File bugs → 10. Submit feedback weekly

Offboarding:
  11. Submit final feedback → 12. Data cleanup request →
  13. Account deactivation → 14. Offboarding complete
```

---

## 7. Communication Channels

| Channel | Purpose | Access |
|---------|---------|--------|
| Email | Invite, critical updates, support | All testers |
| In-app chat | General discussion, peer support | Beta group chat |
| Bug tracker | Bug filing (via form → internal tracker) | Redirected via form |
| Feedback form | Weekly structured feedback | All testers |

---

## 8. Tester Capacity Planning

| Group | Min | Max | Current | Status |
|-------|-----|-----|---------|--------|
| A (Android) | 8 | 15 | 5 | Recruiting |
| B (iPhone) | 5 | 10 | 3 | Recruiting |
| C (Desktop) | 5 | 10 | 3 | Recruiting |
| D (Call quality) | 5 | 8 | 3 | Recruiting |
| E (Admin) | 2 | 4 | 2 | Recruiting |
| **Total** | **25** | **47** | **16** | **Recruiting** |
