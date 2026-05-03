import 'package:google_mobile_ads/google_mobile_ads.dart';
import '../../core/runtime/app_runtime_state.dart';

class InterstitialAdManager {
  InterstitialAd? _interstitialAd;
  bool _isLoaded = false;
  DateTime? _lastShownTime;

  // AdMob test interstitial ID only
  static const String _testInterstitialId = 'ca-app-pub-3940256099942544/1033173712';

  // Minimum interval between interstitials (seconds)
  static const int _minIntervalSeconds = 1800;

  void loadAd() {
    InterstitialAd.load(
      adUnitId: _testInterstitialId,
      request: const AdRequest(),
      adLoadCallback: InterstitialAdLoadCallback(
        onAdLoaded: (ad) {
          _interstitialAd = ad;
          _isLoaded = true;
          _interstitialAd!.fullScreenContentCallback = FullScreenContentCallback(
            onAdDismissedFullScreenContent: (ad) {
              ad.dispose();
              _interstitialAd = null;
              _isLoaded = false;
            },
            onAdFailedToShowFullScreenContent: (ad, error) {
              ad.dispose();
              _interstitialAd = null;
              _isLoaded = false;
            },
          );
        },
        onAdFailedToLoad: (error) {
          _isLoaded = false;
        },
      ),
    );
  }

  bool canShow() {
    if (!_isLoaded || _interstitialAd == null) return false;
    if (!appRuntimeState.canShowAds) return false;

    // Enforce minimum interval
    if (_lastShownTime != null) {
      final elapsed = DateTime.now().difference(_lastShownTime!).inSeconds;
      if (elapsed < _minIntervalSeconds) return false;
    }

    return true;
  }

  String getBlockReason() {
    if (!_isLoaded) return 'Ad not loaded';
    if (!appRuntimeState.canShowAds) return 'Runtime state blocked';
    if (_lastShownTime != null) {
      final elapsed = DateTime.now().difference(_lastShownTime!).inSeconds;
      if (elapsed < _minIntervalSeconds) {
        return 'Cooldown: ${_minIntervalSeconds - elapsed}s remaining';
      }
    }
    return 'Ready';
  }

  void showAd() {
    if (!canShow()) return;
    _lastShownTime = DateTime.now();
    _interstitialAd!.show();
  }

  void dispose() {
    _interstitialAd?.dispose();
    _interstitialAd = null;
    _isLoaded = false;
  }
}
