# ZRCS Mobile Runtime Pseudocode

This document outlines the required implementation logic for the Flutter/Android client integrating the ZRCS Mobile Runtime.

## 1. Initialization & Fetch
```dart
void onAppSplashStarts() async {
  // 1. Fetch remote settings
  try {
    var response = await api.get('/api/v1/ad-settings');
    if (response.statusCode == 200) {
      AdConfig config = parse(response.body);
      
      // 2. Cache config for 4 hours
      cache.save('ad_config', config, ttl: Duration(hours: 4));
      
      // 3. Initialize ONLY the active network SDK
      if (config.ads_enabled) {
        initAdNetworkSDK(config.active_network, config.networks[config.active_network]);
      }
    } else {
      throw Exception('Fetch failed');
    }
  } catch (e) {
    // 4. If fail -> fallback to cache
    var cachedConfig = cache.get('ad_config');
    if (cachedConfig != null) {
      if (cachedConfig.ads_enabled) {
        initAdNetworkSDK(cachedConfig.active_network, cachedConfig.networks[cachedConfig.active_network]);
      }
    } else {
      // If fail and no cache -> ads disabled
      disableAllAds();
    }
  }
}

void initAdNetworkSDK(String networkKey, NetworkSettings settings) {
  // DO NOT initialize inactive SDKs to save memory/battery
  switch(networkKey) {
    case 'admob':
      AdMob.initialize(appId: settings.app_id);
      break;
    case 'meta':
      MetaAudienceNetwork.initialize(appId: settings.app_id);
      break;
    // ...
  }
}
```

## 2. Ad Display Restrictions
```dart
bool canShowAd(String placement) {
  // 1. No ads during live communication
  if (CallManager.call_state == CallState.ringing || 
      CallManager.call_state == CallState.connecting || 
      CallManager.call_state == CallState.connected || 
      CallManager.call_state == CallState.reconnecting) {
    return false;
  }
  
  // 2. No ads when composer focused or typing
  if (Keyboard.isVisible || ChatComposer.isFocused) {
    return false;
  }
  
  // 3. Native ads only in chat list / call history
  if (placement == 'chat_list_native' && CurrentRoute != '/chat_list') {
    return false;
  }
  
  return true;
}
```

## 3. Call-End Interstitial
```dart
void onCallEnded() async {
  // Wait for cleanupCall to complete BEFORE showing ad
  await CallManager.cleanupCall();
  
  if (canShowAd('call_end_interstitial')) {
    AdManager.showInterstitial();
  }
}
```

## 4. User Initiated Rewarded Ads
```dart
void onUserRequestsFeatureUnlock() {
  // Rewarded ads MUST be user-initiated
  showDialog(
    title: 'Unlock Feature',
    content: 'Watch a short video to unlock this feature?',
    onConfirm: () => AdManager.showRewardedAd(),
  );
}
```

## 5. Test Devices
```dart
void configureTestMode(bool isTestMode) {
  if (isTestMode) {
    // Test device registration required
    AdManager.registerTestDevice(DeviceInfo.deviceId);
  }
}
```
