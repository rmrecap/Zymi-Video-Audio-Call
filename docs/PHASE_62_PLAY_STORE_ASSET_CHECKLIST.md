# Phase 62: Play Store Asset Checklist

## Store Listing Assets

| Item | Status | Priority |
|------|--------|----------|
| Application ID change (`com.example` → production) | NOT DONE | CRITICAL |
| Production AdMob ID | NOT DONE | CRITICAL |
| Privacy policy URL | NOT DONE | CRITICAL |
| Data safety form | NOT DONE | CRITICAL |
| Content rating (IARC) | NOT DONE | CRITICAL |
| Release signing (keystore) | NOT DONE | CRITICAL |
| Server deployed publicly | NOT DONE | CRITICAL |
| Custom app icon (512x512) | NOT DONE | HIGH |
| Adaptive icon layers | NOT DONE | HIGH |
| Feature graphic (1024x500) | NOT DONE | HIGH |
| Phone screenshots (min 2) | NOT DONE | HIGH |
| Test account for reviewer | NOT DONE | HIGH |
| Short description (80 chars) | NOT DONE | MEDIUM |
| Full description (4000 chars) | NOT DONE | MEDIUM |
| Branded splash screen | NOT DONE | MEDIUM |

## Critical Blockers Before Submission
1. Change `applicationId` from `com.example.zymi_mobile_app` to production ID
2. Replace test AdMob ID with production ID
3. Host privacy policy at public URL
4. Generate release keystore and configure signing
5. Deploy server to publicly accessible host
6. Build signed AAB (requires 5+ GB disk space)

## Permissions to Declare
- CAMERA: Video calling
- RECORD_AUDIO: Voice/video calling
- INTERNET: Server communication
- BLUETOOTH: Audio device switching
- MODIFY_AUDIO_SETTINGS: Call audio routing

## Ads Declaration
- App contains ads (Google AdMob)
- Ads never shown during active calls
