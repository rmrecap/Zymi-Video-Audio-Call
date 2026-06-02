# ZYMI Play Store Readiness Checklist

## App Permissions

| Permission | Required | Justification |
|------------|----------|---------------|
| `INTERNET` | Yes | Socket.io, API, WebRTC |
| `CAMERA` | Yes | Video calls, photo upload |
| `RECORD_AUDIO` | Yes | Voice calls, voice messages |
| `ACCESS_FINE_LOCATION` | Optional | Nearby discovery (user opt-in) |
| `ACCESS_COARSE_LOCATION` | Optional | Nearby discovery (approximate only) |
| `READ_EXTERNAL_STORAGE` | Legacy (Android 12-) | File upload (non-scoped) |
| `READ_MEDIA_IMAGES` | Android 13+ | Photo picker |
| `READ_MEDIA_VIDEO` | Android 13+ | Video picker |
| `POST_NOTIFICATIONS` | Android 13+ | Incoming message/call notifications |
| `FOREGROUND_SERVICE` | Yes | Background socket daemon |
| `SYSTEM_ALERT_WINDOW` | Optional | Incoming call overlay |
| `BLUETOOTH` | Optional | Bluetooth headset for calls |
| `ACCESS_NETWORK_STATE` | Yes | Network status detection |
| `VIBRATE` | Yes | Incoming call vibration |
| `WAKE_LOCK` | Yes | Keep screen on during calls |

## Privacy Policy Requirements

### Data Collected
- **Username** — Required for account creation
- **Email** — Required for account recovery and verification
- **Phone number** — Optional, for phone lookup feature
- **Profile photo** — Optional, user-uploaded
- **Location** — Optional, only with explicit opt-in for Nearby
- **Messages** — Stored server-side for delivery
- **Call logs** — Duration, type, participant IDs
- **IP address** — Connection logging
- **Device info** — Socket type, app version (ZRCS)

### Data Sharing
- No third-party data sharing
- No ads SDK that collects personal data
- No analytics SDK
- No crash reporting SDK

### Data Retention
- Messages: retained until deleted by user
- Accounts: retained until deletion request
- Call logs: 90 days
- Audit logs: 1 year

### Required Disclosures
1. Account deletion method (in-app settings)
2. Data encryption status (TLS in transit, DB at rest)
3. Third-party services: None (no Firebase, no FCM, no AdMob - only configurable)
4. Children's privacy: Not intended for users under 13

## App Signing

```bash
# Generate upload key
keytool -genkey -v -keystore zymi-upload.keystore \
  -alias zymi-key -keyalg RSA -keysize 2048 \
  -validity 10000

# Build release AAB
flutter build appbar --release

# Or use Play App Signing (recommended)
# Upload zymi-upload.keystore public key to Google Play Console
```

## Store Assets

### Required
- App icon: 512×512px (adaptive icon: 1024×1024px)
- Feature graphic: 1024×500px
- Screenshots: 2-8 screenshots per device type (phone, tablet)
  - Chat list screen
  - Conversation screen
  - Incoming call screen
  - Live call screen
  - Profile/settings screen
  - Nearby discovery screen

### Optional
- Promo video (30s-2min)
- Tablet screenshots (7-10 inch)

## Content Rating

Submit content rating questionnaire:
- **Category**: Communication
- **Violence**: None
- **Sexual content**: None (user-generated content filter required)
- **Drugs/Alcohol**: None
- **User Interactions**: Yes (messaging, calls) — requires content moderation
- **Location sharing**: Yes (opt-in)

## Pre-Launch Checklist

- [ ] Privacy policy hosted at `https://your-domain.com/privacy`
- [ ] Terms of service hosted at `https://your-domain.com/terms`
- [ ] Content moderation report flow works
- [ ] User blocking works
- [ ] Account deletion works (GDPR compliance)
- [ ] Test accounts provided for review
- [ ] App works on Android 8.0+ (API 26+)
- [ ] App works offline gracefully
- [ ] No crashes on rotation
- [ ] No crashes on background/foreground switch
- [ ] No unusual battery drain
- [ ] No unusual data usage
- [ ] Accessibility labels on all interactive elements

## Production Environment

- [ ] PostgreSQL with backups configured
- [ ] Redis for session management
- [ ] SSL/TLS on all endpoints
- [ ] Rate limiting enabled
- [ ] Audit logging enabled
- [ ] Admin panel accessible
- [ ] Monitoring alerts configured
- [ ] Rollback plan documented
