# ZYMI Google Play Store Readiness Checklist

**Document Type:** Launch Readiness Checklist

**Last Updated:** June 1, 2026

---

## 1. Developer Account

- [ ] **Google Play Developer Account created** — $25 one-time fee.
- [ ] **Account details verified** — Tax information, payment profile.
- [ ] **Developer name and email** configured in Play Console.
- [ ] **Developer website** set (pointing to ZYMI project page or GitHub).
- [ ] **Privacy Policy URL** uploaded (see `PRIVACY_POLICY_DRAFT.md`).

---

## 2. App Signing

- [ ] **App signing by Google Play** enabled (recommended).
- [ ] **Upload key** generated (keystore file backed up securely — NOT in the repository).
- [ ] **Upload key certificate** fingerprint (SHA-1) registered with Firebase and any third-party services (if applicable).
- [ ] If using your own signing key: **app signing key** backed up.

---

## 3. App Content

### 3.1 Content Rating
- [ ] **Rating questionnaire completed** in Play Console.
- [ ] **Expected rating**: **Mature 17+** (for user-generated content, chat features, uncensored communication).
- [ ] Rating justification prepared: "ZYMI is a chat and calling app with user-generated content. Users can send messages, share files, and communicate freely. Content is not pre-moderated."

### 3.2 Target Audience
- [ ] **Age restriction**: 16+ (set in app content settings).
- [ ] **Family policy** compliance declared (not designed for children under 16).

### 3.3 Ads
- [ ] If ads are enabled: **Ads declaration** completed (Google AdMob or custom ad server).
- [ ] If NO ads: **No ads** declared accurately.

---

## 4. Privacy & Data Safety

### 4.1 Privacy Policy
- [ ] **Privacy Policy URL** live and accessible at: `https://<domain>/privacy`
- [ ] Policy covers all data types listed in `PRIVACY_POLICY_DRAFT.md`.
- [ ] Policy is compliant with Google Play's requirements.

### 4.2 Data Safety Section
Complete the Data Safety form in Play Console:

| Data Type | Collected? | Shared? | Purpose |
|-----------|-----------|---------|---------|
| Email address | Yes | No | Account management |
| Username | Yes | No | Account identification |
| User ID | Yes | No | Account management |
| Messages | Yes | No | Core service functionality |
| Photos | Yes (uploads) | No | File sharing |
| Videos | Yes (uploads) | No | File sharing |
| Audio files | Yes (uploads) | No | Voice messages |
| Call metadata | Yes | No | Service functionality |
| Approximate location | Optional (Nearby) | No | Nearby discovery |
| Device ID | Yes | No | Session management |
| IP address | Yes | No | Network connectivity, abuse prevention |
| App interactions | Yes (anonymized) | No | Service improvement |

- [ ] **Data encryption in transit** declared (TLS/WSS).
- [ ] **Data deletion** mechanism described (in-app account deletion).
- [ ] **Data Safety section** completed and saved.

---

## 5. Store Listing

### 5.1 App Details
- [ ] **App name**: ZYMI
- [ ] **Short description** (80 characters max): "Private, self-hosted chat & calling app. No tracking. No third-party services. Real talk."
- [ ] **Full description** (4000 characters max):

```
ZYMI is a privacy-first, self-hosted chat and calling application. No Firebase. No FCM. No third-party communication services. Your conversations stay on servers you control.

Key Features:
• Private & Group Chat — Real-time messaging with socket.io.
• Voice & Video Calls — WebRTC-based 1:1 and group calls.
• File Sharing — Share images, videos, documents, and audio.
• Nearby Discovery — Find and connect with ZYMI users nearby (opt-in, privacy-fuzzed).
• Self-Hosted — Full control of your data. No external dependencies.
• Admin Panel (ZRCS) — Manage users, moderate content, monitor system health.
• Optional Ads — Server-administrator controlled, no third-party ad networks.
• No E2EE Yet — Messages are stored server-side (E2EE coming in a future update).
```

- [ ] **Categories**: Social (primary).
- [ ] **Tags**: Communication, Messaging, Privacy (up to 5 tags).

### 5.2 Graphic Assets

| Asset | Size | Format | Ready? |
|-------|------|--------|--------|
| App icon | 512×512 px | 32-bit PNG (no alpha) | ☐ |
| Feature graphic | 1024×500 px | PNG/JPG | ☐ |
| Phone screenshot (1) | 1080×1920 px or 1080×2340 px | PNG | ☐ |
| Phone screenshot (2) | Same as above | PNG | ☐ |
| Phone screenshot (3) | Same as above | PNG | ☐ |
| Phone screenshot (4) | Same as above | PNG | ☐ (optional) |
| Phone screenshot (5) | Same as above | PNG | ☐ (optional) |
| Tablet screenshot (1) | 1280×800 px or 1920×1200 px | PNG | ☐ (optional) |
| Tablet screenshot (2) | Same as above | PNG | ☐ (optional) |

**Screenshot content suggestions:**
- Chat list view (phone)
- Chat conversation (phone)
- Voice/video call screen (phone)
- Nearby discovery screen (phone)
- Admin panel overview (tablet — if applicable)

### 5.3 Promotional Content
- [ ] **Promo video** (optional): YouTube link to app preview (max 2:30).
- [ ] **Feature graphic** designed with ZYMI branding.

---

## 6. App Bundle/APK

- [ ] **App built in release mode**: `flutter build appbundle` (Android).
- [ ] **Version name** set: `1.0.0` (or appropriate).
- [ ] **Version code** incremented for each release.
- [ ] **Min SDK** set to `24` (Android 7.0) or higher.
- [ ] **Target SDK** set to `34` (Android 14) or latest.
- [ ] **App bundle** signed with upload key.
- [ ] **ProGuard/R8 rules** configured (if using obfuscation).
- [ ] **AndroidManifest.xml** permissions verified:
  - `INTERNET` — Required.
  - `CAMERA` — For video calls and photo upload.
  - `RECORD_AUDIO` — For voice calls and voice messages.
  - `ACCESS_FINE_LOCATION` / `ACCESS_COARSE_LOCATION` — Optional, for Nearby.
  - `POST_NOTIFICATIONS` — Android 13+.
  - `FOREGROUND_SERVICE` — For background socket connection.
  - `READ_MEDIA_IMAGES` / `READ_MEDIA_VIDEO` — Android 13+ for file picker.

---

## 7. Pre-Launch Tests

- [ ] **Internal test track** set up (at least 1 tester).
- [ ] **Closed testing track** — required for new Play Console accounts:
  - At least 20 testers for at least 14 days.
  - Testers must have opted in via Google Groups or similar.
- [ ] **Pre-launch report** reviewed (automated testing by Google):
  - No crashes.
  - No ANRs (Application Not Responding).
  - No performance warnings.
- [ ] **Open testing track** (optional, recommended).
- [ ] **Production track** locked until all testing passes.

---

## 8. Pricing & Distribution

- [ ] **Pricing**: Free (no cost to download).
- [ ] **In-app purchases**: Declare if applicable (e.g., donations, subscription to remove ads).
- [ ] **Countries/regions**: Select all countries (or restricted list).
- [ ] **Controlled distribution**: If restricted launch, select specific countries.
- [ ] **Self-reported content**: "Mature 17+" confirmed.

---

## 9. Roll-Out Plan

| Stage | Rollout % | Duration | Criteria to Advance |
|-------|-----------|----------|---------------------|
| **Closed Alpha** | Invite-only | 2 weeks | No P0/P1 bugs from alpha testers |
| **Closed Beta** | Invite-only | 2 weeks | No P0/P1 bugs from beta testers |
| **Open Beta** | 100% of opt-in | 1 week | Crash rate < 0.1%, no P0 bugs |
| **Production Staged** | 20% | 3 days | Crash rate stable, no negative reviews spike |
| **Production Staged** | 50% | 3 days | Same as above |
| **Production Full** | 100% | — | Monitor for first week |

---

## 10. Pre-Submission Checklist

- [ ] **App is tested on physical devices** (not just emulators).
- [ ] **All strings localized** (if supporting multiple languages).
- [ ] **No debug logs** in release build.
- [ ] **No hardcoded server URLs** (use config files).
- [ ] **No test accounts** left in the database.
- [ ] **Crash reporting** configured (in-house or opt-in analytics).
- [ ] **App content rating** submitted.
- [ ] **Data Safety form** fully completed.
- [ ] **Store listing** complete with all required assets.
- [ ] **Privacy Policy** URL is live.
- [ ] **Support email** configured in Play Console.
- [ ] **Release notes** written for initial version:
  > "Initial release of ZYMI — private, self-hosted chat and calling. Features: private/group chat, voice/video calls, file sharing, nearby discovery, and admin panel (ZRCS)."

---

## 11. Post-Launch Tasks

- [ ] Monitor crash reports daily for the first 2 weeks.
- [ ] Respond to user reviews within 48 hours.
- [ ] Track Data Safety section for any changes needed.
- [ ] Plan update cycle for feature additions and bug fixes.

---

*This is a technical launch checklist, not a legal document. No legal review required.*
