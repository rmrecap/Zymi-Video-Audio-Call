# ZRCS Multi-Network Flutter Adapter Architecture Plan

This document defines the strategy for integrating multiple ad networks (AdMob, Meta Audience Network, AppLovin, Pangle, InMobi) into the ZYMI Flutter Mobile App safely, without bloating the app startup or violating policies.

## 1. Primary Network: AdMob via `google_mobile_ads`
- **Why AdMob First:** The `google_mobile_ads` package is officially supported by Google, highly stable in Flutter, and covers Banners, Interstitials, Rewarded, and Native ads natively in Dart.
- **Implementation Strategy:** AdMob will serve as the primary integrated SDK and the default fallback when other networks fail or are disabled by the server.

## 2. Meta Audience Network Requirements
- **Native SDKs Required:** Meta Audience Network requires the native Android (`com.facebook.android:audience-network-sdk`) and iOS (`FBAudienceNetwork`) SDKs.
- **Why it requires Mediation or Platform Channels:** There is no official, up-to-date Meta Audience Network plugin for Flutter. Implementing Meta directly requires custom `MethodChannel` and `PlatformView` wrappers, or leveraging AdMob Mediation.

## 3. The Adapter-Based Architecture
- **Why Adapter-Based?** Mixing Meta, AppLovin, Pangle, and InMobi directly into the app startup sequence will drastically increase boot time, memory usage, and risk of crashes.
- **Solution:** Implement an Adapter pattern (`AdNetworkAdapter` interface).
- **Runtime Rule:** The app must **only initialize the active network** retrieved from `GET /api/v1/ad-settings`. Inactive network SDKs must remain dormant and uninitialized to conserve battery and memory.

## 4. Policy & Runtime Constraints
- **Test Mode Mandatory:** `test_mode` from the API must strictly map to test IDs. Developers must not use live IDs during development.
- **Restricted UI States:** No ads are permitted to load or show during:
  - Active WebRTC Calls (ringing, connecting, connected, reconnecting)
  - Active Chat Typing (composer focused)
  - Active Camera/Microphone permission prompts

## 5. Meta Audience Network Safety Notes
### Android
- The Audience Network dependency goes in the app-level `build.gradle` only. Use `implementation`, not the old `compile` syntax.
- `AudienceNetworkAds.initialize(context)` must run **only** if `active_network == meta`.
- Enable hardware acceleration for video ads.
- Destroy `AdView` / `RewardedVideoAd` during lifecycle cleanup (`onDestroy`).
- Do not reload immediately after a no-fill error (implement backoff).
- Native ads must unregister the previous view before registering a new one.
- Clickable areas must be strictly controlled to avoid accidental clicks (policy violation).

### iOS
- Requires `FBAudienceNetwork` setup in `Podfile`.
- Rewarded/Native/Interstitial ads must validate `isAdValid` before showing.
- Do not deallocate the rewarded object before the reward callbacks complete.
- Use test mode aggressively during development.
