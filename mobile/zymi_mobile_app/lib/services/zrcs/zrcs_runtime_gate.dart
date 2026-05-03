import '../../core/runtime/realtime_safety_guard.dart';
import 'zrcs_config_model.dart';

class ZrcsRuntimeGate {
  final ZrcsConfigModel config;

  ZrcsRuntimeGate(this.config);

  bool canRequestAd() {
    if (!config.adsEnabled) return false;
    if (!RealtimeSafetyGuard.isSafeForAds) return false;
    return true;
  }
}
