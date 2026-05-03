import '../zrcs/zrcs_config_model.dart';
import 'admob_adapter.dart';
import 'meta_adapter_stub.dart';

class AdRuntimeController {
  final ZrcsConfigModel config;
  
  AdRuntimeController(this.config);

  Future<void> initialize() async {
    if (!config.adsEnabled) return;
    
    if (config.activeNetwork == 'admob') {
      await AdMobAdapter().initialize(config);
    } else if (config.activeNetwork == 'meta') {
      await MetaAdapterStub().initialize(config);
    }
  }
}
