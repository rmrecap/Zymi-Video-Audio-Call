import 'package:flutter/foundation.dart';
import 'package:google_mobile_ads/google_mobile_ads.dart';
import '../../core/runtime/app_runtime_state.dart';

class RewardedAdManager {
  RewardedAd? _rewardedAd;
  bool _isLoaded = false;

  // AdMob test rewarded ID only
  static const String _testRewardedId = 'ca-app-pub-3940256099942544/5224354917';

  void loadAd() {
    RewardedAd.load(
      adUnitId: _testRewardedId,
      request: const AdRequest(),
      rewardedAdLoadCallback: RewardedAdLoadCallback(
        onAdLoaded: (ad) {
          _rewardedAd = ad;
          _isLoaded = true;
          _rewardedAd!.fullScreenContentCallback = FullScreenContentCallback(
            onAdDismissedFullScreenContent: (ad) {
              ad.dispose();
              _rewardedAd = null;
              _isLoaded = false;
            },
            onAdFailedToShowFullScreenContent: (ad, error) {
              ad.dispose();
              _rewardedAd = null;
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
    if (!_isLoaded || _rewardedAd == null) return false;
    if (!appRuntimeState.canShowAds) return false;
    return true;
  }

  /// Show rewarded ad. [onReward] is called only when user earns the reward.
  void showAd({required VoidCallback onReward}) {
    if (!canShow()) return;
    _rewardedAd!.show(
      onUserEarnedReward: (ad, reward) {
        // Reward only fires here — safe
        onReward();
      },
    );
  }

  void dispose() {
    _rewardedAd?.dispose();
    _rewardedAd = null;
    _isLoaded = false;
  }
}
