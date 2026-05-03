import 'package:google_mobile_ads/google_mobile_ads.dart';
import '../zrcs/zrcs_config_model.dart';

class AdMobAdapter {
  Future<void> initialize(ZrcsConfigModel config) async {
    await MobileAds.instance.initialize();
  }
  
  // Stubs for banner, interstitial, rewarded
  void loadBanner() {}
  void loadInterstitial() {}
  void showInterstitial() {}
  void loadRewarded() {}
  void showRewarded() {}
}
