import 'app_runtime_state.dart';

class RealtimeSafetyGuard {
  static bool get isSafeForAds {
    return appRuntimeState.canShowAds;
  }
}
