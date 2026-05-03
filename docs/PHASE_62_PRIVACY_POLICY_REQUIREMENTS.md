# Phase 62: Privacy Policy Requirements

## Why a Privacy Policy is Required
Google Play Store requires all apps that handle user data, request sensitive permissions (Camera, Microphone), or display ads to provide a publicly accessible privacy policy URL.

ZYMI is a real-time communication app with WebRTC calls, P2P media transfer, and AdMob integration — a privacy policy is **mandatory**.

---

## Required Disclosures

### 1. Data Collection
- **Account Data**: Username, email address, hashed password (bcrypt, 12 rounds)
- **Profile Data**: Avatar, country code, phone number (normalized, for internal lookup only)
- **Message Metadata**: Sender ID, receiver ID, timestamps, delivery status
- **Call Metadata**: Call type, duration, connection mode (direct/relay)
- **Relay Usage Metadata**: Bandwidth bytes, duration seconds, session IDs (for cost governance)
- **Device Info**: Minimal — no IMEI, device ID, or hardware fingerprinting

### 2. Data NOT Collected
- **Message Content on Server**: Messages are delivered in real-time via Socket.io. The server stores message records but content is for delivery only.
- **Media Files**: Media files (images, videos, voice) are transferred exclusively via WebRTC DataChannel (P2P). The server stores ONLY metadata (file name, size, type, checksum). **No media files are stored on the server.**
- **Firebase/FCM Data**: The app does NOT use Firebase Cloud Messaging or any Firebase services.
- **External Communication**: The app does NOT redirect to WhatsApp, SMS gateways, or external messaging services.

### 3. Communication Architecture
- **Real-time Messaging**: Socket.io WebSocket connection to self-hosted server
- **Voice/Video Calls**: WebRTC peer-to-peer with STUN/TURN ICE servers
- **Media Transfer**: WebRTC DataChannel (peer-to-peer, no server storage)
- **TURN Relay**: Self-hosted Coturn server used as connectivity fallback only; relayed traffic is not inspected or stored

### 4. Advertising
- **AdMob**: Google Mobile Ads SDK is integrated for banner/interstitial ads
- **Ad Personalization**: Subject to Google's ad policies
- **Ad-Free Zones**: Ads are NEVER displayed during active voice/video calls (hard-locked policy)
- **AdMob App ID**: Currently using test ID; production ID required before launch

### 5. Permissions Justification
| Permission | Purpose |
|-----------|---------|
| INTERNET | Server communication, WebRTC, ads |
| CAMERA | Video calls |
| RECORD_AUDIO | Voice/video calls |
| MODIFY_AUDIO_SETTINGS | Call audio routing |
| BLUETOOTH | Audio device switching during calls |
| WAKE_LOCK | Keep connection alive during calls |
| ACCESS_NETWORK_STATE | Network connectivity detection |

### 6. Data Retention
- **Messages**: Retained until user deletes account
- **Call History**: Retained until user deletes account
- **Media Metadata**: Retained as index records; actual files exist only on user devices
- **Audit Logs**: Admin-only, retained for security compliance

### 7. Data Deletion / Account Deletion
- Users can request account deletion
- Upon deletion: all messages, call history, media metadata, and profile data are permanently removed
- Contact method for deletion requests must be provided (email or in-app)

### 8. Third-Party Services
- **Google AdMob**: For advertising ([Google Privacy Policy](https://policies.google.com/privacy))
- **Self-hosted TURN/Coturn**: No third-party TURN providers
- **No Firebase, FCM, or analytics SDKs**

### 9. Children's Privacy
- ZYMI is not directed at children under 13
- No content moderation for COPPA compliance is currently implemented
- Content rating should be set accordingly in Play Store

### 10. Security Measures
- Passwords hashed with bcrypt (12 rounds)
- JWT tokens with configurable expiration
- HTTPS/SSL for all server communication
- Sensitive credentials encrypted at rest using ENCRYPTION_KEY
- Rate limiting on authentication endpoints

---

## Privacy Policy Hosting
The privacy policy must be hosted at a publicly accessible URL. Options:
1. **GitHub Pages**: Free, reliable — create a `privacy-policy.html` in a public repo
2. **Project Website**: If ZYMI has a website, host it there
3. **Google Sites**: Free alternative

The URL must be provided in:
- Google Play Console → App content → Privacy policy
- AndroidManifest.xml (optional but recommended)
- App settings/about screen

---

## Play Store Data Safety Form
Google Play requires a Data Safety section. Based on ZYMI's architecture:

| Question | Answer |
|----------|--------|
| Does your app collect user data? | Yes |
| Is data encrypted in transit? | Yes (HTTPS/WSS) |
| Can users request data deletion? | Yes |
| Does your app share data with third parties? | Yes (AdMob for ads) |
| Data types collected | Name, email, messages, call logs |
| Data types shared | Advertising ID (via AdMob only) |
