# ZYMI Apple App Store Readiness Checklist

**Document Type:** Launch Readiness Checklist

**Last Updated:** June 1, 2026

---

## 1. Developer Account

- [ ] **Apple Developer Program enrollment** completed — $99/year.
- [ ] **Legal agreements** accepted (Apple Developer Program License Agreement).
- [ ] **Tax and banking information** set up in App Store Connect.
- [ ] **Team** configured with appropriate roles (Admin, Developer, etc.).

---

## 2. App Signing & Provisioning

### 2.1 Certificates
- [ ] **Distribution certificate** created in Apple Developer Center.
- [ ] **Development certificates** created for team members.
- [ ] **Push notification certificate** (if using APNs — note: ZYMI does NOT use APNs; uses WebSocket instead. Ensure no push notification entitlement is accidentally enabled).

### 2.2 Identifiers
- [ ] **Bundle ID** registered (e.g., `com.zimi.app`).
- [ ] **App Groups** configured if needed (e.g., for shared storage with extensions).

### 2.3 Provisioning Profiles
- [ ] **App Store provisioning profile** created and downloaded.
- [ ] **Development provisioning profiles** created for testing.

---

## 3. App Store Connect Setup

### 3.1 App Record
- [ ] **App name**: ZYMI
- [ ] **Bundle ID**: Selected from registered identifiers.
- [ ] **SKU**: `ZYMI_1_0_0` (or similar).
- [ ] **Primary language**: English (or appropriate).
- [ ] **Privacy Policy URL**: `https://<domain>/privacy`

### 3.2 Pricing & Availability
- [ ] **Price**: Free.
- [ ] **Availability**: All territories (or restricted list if controlled launch).
- [ ] **In-app purchases**: Set up if applicable (donations, ad removal subscription).

### 3.3 App Information
- [ ] **Subtitle** (30 chars max): "Private Chat & Calling"
- [ ] **Category**: Social Networking (primary).
- [ ] **Secondary category**: Utilities (optional).
- [ ] **Content rights**: Declare that third-party content may appear.

### 3.4 Age Rating
- [ ] Rating questionnaire completed in App Store Connect.
- [ ] **Expected rating**: **17+** for:
  - Unrestricted web access / user-generated content.
  - Mature/suggestive themes (possible in user messages).
  - Unrestricted file sharing.
  - Location sharing (optional).

Rating justification: "ZYMI is a chat and calling application with user-generated content. Users can communicate freely, share files, and discover nearby users. Content is not pre-moderated."

---

## 4. App Description & Metadata

### 4.1 App Description (4000 chars max)

```
ZYMI is a privacy-first, self-hosted chat and calling application.

No Firebase. No FCM. No third-party communication services. Your conversations stay on servers you control.

KEY FEATURES:
• Private & Group Chat — Real-time messaging powered by WebSockets. Instant delivery. Typing indicators. Read receipts.
• Voice & Video Calls — WebRTC-based 1:1 and group calls. No third-party call services.
• File Sharing — Share images, videos, documents, and voice messages.
• Nearby Discovery — Optionally discover and connect with ZYMI users around you. Privacy-focused with fuzzed location data.
• Self-Hosted — Deploy on your own infrastructure. Full data sovereignty.
• Admin Panel (ZRCS) — Manage your community with user management, content moderation, and system monitoring.
• No E2EE Yet — Messages are stored server-side. End-to-end encryption is planned for a future update.
• Optional Ads — Server administrators can enable ads via their own ad server. No third-party ad networks, no tracking.

DESIGNED FOR PRIVACY:
• No third-party analytics.
• No data sold.
• No push notification services — all notifications delivered over your own WebSocket infrastructure.
• All communication encrypted in transit (TLS / WSS).

ZYMI — Real talk. Your server. Your rules.
```

### 4.2 Keywords (100 chars max)
```
zimi,chat,calling,private,self-hosted,messaging,voice,video,secure,privacy,communication,encrypted,socket,realtime
```

### 4.3 Promotional Text (170 chars max)
Experience real-time, privacy-first messaging and calling. Self-hosted. No tracking. Your conversations, your rules.

### 4.4 Support Information
- [ ] **Support URL**: `https://<domain>/support`
- [ ] **Marketing URL**: `https://<domain>` (or project page)
- [ ] **Support email**: [admin email — to be inserted]

---

## 5. Screenshots & Preview

### 5.1 Required Screenshots

| Device Size | Dimensions | Screenshots Required | Ready? |
|-------------|------------|---------------------|--------|
| 6.5-inch (iPhone 14 Pro Max, 15 Plus, etc.) | 1290×2796 px | 3–10 screenshots | ☐ |
| 5.5-inch (iPhone 8 Plus, etc.) | 1242×2208 px | 3–10 screenshots | ☐ |
| iPad (optional but recommended) | 2048×2732 px (12.9") | 3–10 screenshots | ☐ |

### 5.2 Screenshot Content

| Screenshot | Content |
|------------|---------|
| 1 | Chat list — showing recent conversations |
| 2 | Chat view — showing a conversation with messages |
| 3 | Voice/video call — showing in-call UI |
| 4 | Nearby discovery — map/list of nearby users |
| 5 | Profile & settings — account management screen |

### 5.3 Preview Video (Optional)
- [ ] **App Preview** created (15–30 seconds preferred, max 30 seconds).
- [ ] Resolution matches screenshot dimensions (6.5-inch or 5.5-inch).
- [ ] No voiceover required but helpful.
- [ ] Shows core flow: launch → chat → call.
- [ ] Uploaded to App Store Connect via the app record page.

---

## 6. Build Submission

### 6.1 Build Preparation
- [ ] **Release build** configured: `flutter build ios --release`
- [ ] **Version number**: `1.0.0`
- [ ] **Build number** incremented (e.g., `1`).
- [ ] **Minimum iOS version**: `14.0` or higher.
- [ ] **Info.plist** permissions with usage descriptions:
  - `NSCameraUsageDescription`: "ZYMI needs camera access for video calls and taking profile photos."
  - `NSMicrophoneUsageDescription`: "ZYMI needs microphone access for voice calls and voice messages."
  - `NSPhotoLibraryUsageDescription`: "ZYMI needs photo library access to share images."
  - `NSLocationWhenInUseUsageDescription`: "ZYMI needs location access to show nearby users (optional — you can disable this in settings)."
  - `NSLocationAlwaysAndWhenInUseUsageDescription`: (if enabling background location — avoid if possible.)

### 6.2 Build Upload
- [ ] **Archive** created in Xcode.
- [ ] **Build uploaded** via Xcode Organizer or Transporter.
- [ ] **Build processed** in App Store Connect (wait for processing to complete).
- [ ] **Export Compliance** declared:
  - ZYMI uses encryption (TLS/WSS for all communication).
  - Select **Yes** to "Does your app use encryption?"
  - Select **Yes** to exemption under Note 4 (general-purpose data communications).

### 6.3 TestFlight
- [ ] **TestFlight enabled** for the build.
- [ ] **Internal testers** added (up to 100).
- [ ] **External testers** added (requires Beta App Review).
- [ ] **Beta App Review** submitted (if using external testers).
- [ ] **TestFlight feedback** reviewed and addressed before production submission.

---

## 7. App Review Preparation

### 7.1 Review Guidelines Compliance
Apple Review Guidelines that may apply to ZYMI:

| Guideline | Requirement | Status |
|-----------|-------------|--------|
| **4.1 — Copycats** | App must be original, not a copy of another app. ZYMI's self-hosted, socket-first architecture is unique. | ⚠️ Emphasize self-hosted architecture in review notes. |
| **5.1.1 — Data Collection** | Must have privacy policy and obtain consent for data collection. Privacy policy covers all data types. | ✅ Covered |
| **5.1.2 — Data Use** | Data must not be used for purposes beyond what is stated. | ✅ Covered |
| **5.1.3 — Location** | Must provide clear opt-in and explanation for location use. | ✅ Covered (optional, permission requested at use time) |
| **5.1.4 — State of the Art** | Must use appropriate security measures. TLS/WSS, bcrypt passwords, parameterized queries. | ✅ Covered |
| **5.2.1 — Third-Party Content** | User-generated content must have filtering or reporting. In-app reporting implemented. | ✅ Covered |
| **5.6 — Developer Conduct** | No defamation, no impersonation. | ✅ Community Guidelines address this. |

### 7.2 Review Notes
Prepare a note for the App Review team:

```
ZYMI is a self-hosted, socket-first chat and calling application. It does not use Firebase, FCM, or any third-party communication services. All infrastructure is controlled by the server administrator.

Key points for review:
1. Location is OPTIONAL and only used with explicit user opt-in for the Nearby feature. Location data is fuzzed.
2. All communication is encrypted in transit (TLS 1.3 for API, WSS for WebSockets).
3. User-generated content is not pre-moderated, but in-app reporting is available.
4. The app does NOT use push notifications (APNs). All notifications are delivered via persistent WebSocket connection.
5. Data is stored on self-hosted PostgreSQL and Redis instances, not on third-party servers.
```

### 7.3 Pre-Submission Checklist
- [ ] **No placeholder text** in the app or store listing.
- [ ] **No test data** in screenshots.
- [ ] **No debug URLs** — all endpoints point to production.
- [ ] **No hardcoded developer credentials**.
- [ ] **All required Info.plist permissions** have usage descriptions.
- [ ] **Build has been tested** on physical iOS devices (not just simulator).
- [ ] **Build passes** on all supported iOS versions.
- [ ] **Crash-free session rate** > 99.5% in TestFlight.

---

## 8. Release Management

### 8.1 Versioning
- **Semantic versioning**: `MAJOR.MINOR.PATCH` (e.g., `1.0.0`).
- **Build numbers**: Incremental integer (e.g., `1`, `2`, `3`).

### 8.2 Release Types
| Type | Description |
|------|-------------|
| **Manual Release** | App goes live immediately after approval. |
| **Phased Release** | Gradual rollout over 7 days (recommended for first release). |
| **Custom Release** | App made available at a specific date/time. |

### 8.3 Rollout Plan
```
Day 1: Submit for review
Day 3-5: App approved (typical review time)
Day 5: Phased release begins (7-day gradual rollout)
Day 12: Full release active
Day 12+: Monitor reviews, crash reports, and server load
```

---

## 9. Post-Launch

- [ ] **Monitor reviews** daily for the first month.
- [ ] **Respond to user reviews** within 48 hours (developers can reply to reviews).
- [ ] **Track crash reports** via Xcode Organizer or third-party crash reporter.
- [ ] **Plan first update** (bug fixes, improvements) based on user feedback.
- [ ] **Update store listing** if features change significantly.

---

## 10. Common Pitfalls to Avoid

| Pitfall | Prevention |
|---------|------------|
| Missing privacy policy link | Set it BEFORE submitting the build. |
| Missing usage descriptions | All Info.plist permissions must have `NS*UsageDescription` strings. |
| Encryption export compliance | Declare encryption and claim exemption under Note 4. |
| In-app reporting not visible | Ensure report button is easily accessible in the UI. |
| Review team confused by self-hosted model | Add clear review notes explaining the architecture. |
| TestFlight build expires | Upload a new build if testing takes longer than 90 days. |

---

*This is a technical launch checklist, not a legal document. No legal review required.*
