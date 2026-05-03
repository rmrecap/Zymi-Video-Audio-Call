# PHASE 52 — PLAY STORE PRIVACY & COMPLIANCE CHECKLIST (Updated)

Before submitting the Flutter APK to the Google Play Store or Apple App Store, the following compliance standards must be addressed due to the inclusion of WebRTC and AdMob. **No Firebase/FCM is used.**

## 1. App Store Requirements (Apple)
- **`NSCameraUsageDescription`:** ZYMI requires camera access to place video calls.
- **`NSMicrophoneUsageDescription`:** ZYMI requires microphone access to place audio and video calls.
- **App Tracking Transparency (ATT):** Required for AdMob. You must show the ATT prompt before loading any ads.

## 2. Play Store Requirements (Google)
- **Data Safety Form:**
  - **Data Collected:** Audio (Microphone), Video (Camera), Identifiers (Device ID for AdMob).
  - **Purpose:** App Functionality, Communications, Advertising.
  - **Data Encryption:** All WebRTC streams are end-to-end encrypted via DTLS/SRTP. Signaling data is TLS encrypted over WSS.
- **Permissions Declaration:**
  - `CAMERA`, `RECORD_AUDIO`.
  - Provide a clear in-app disclosure *before* requesting these permissions.

## 3. GDPR / CCPA (AdMob)
- **AdMob UMP SDK:** Must implement Google's User Messaging Platform (UMP) to gather EU consent before initializing AdMob.
- **Call Quality Logging:** IP addresses must not be logged directly. ICE failure logs should only contain randomized session IDs or anonymous error codes.

## 4. No Firebase Policy
- This project does NOT use Firebase, FCM, or any third-party push notification provider.
- All real-time signaling is handled via the self-hosted Socket.io + WebRTC architecture.
