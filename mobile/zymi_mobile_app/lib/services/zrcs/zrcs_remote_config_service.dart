import 'dart:convert';
import 'package:http/http.dart' as http;
import '../../core/config/app_config.dart';
import 'zrcs_config_model.dart';
import 'zrcs_cache_service.dart';

class ZrcsRemoteConfigService {
  Future<ZrcsConfigModel> fetchConfig() async {
    try {
      final response = await http
          .get(Uri.parse('${AppConfig.apiUrl}/api/v1/ad-settings'))
          .timeout(const Duration(seconds: 5));
      if (response.statusCode == 200) {
        final json = jsonDecode(response.body);
        final config = ZrcsConfigModel.fromJson(json);
        await ZrcsCacheService.cacheConfig(response.body);
        return config;
      }
    } catch (e) {
      // API fetch failed — will attempt cache fallback
    }

    final cached = await ZrcsCacheService.getCachedConfig();
    if (cached != null) {
      return ZrcsConfigModel.fromJson(jsonDecode(cached));
    }

    return ZrcsConfigModel.safeDefault();
  }
}
