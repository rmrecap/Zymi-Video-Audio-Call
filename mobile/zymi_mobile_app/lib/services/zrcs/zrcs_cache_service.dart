import 'package:shared_preferences/shared_preferences.dart';

class ZrcsCacheService {
  static const String _cacheKey = 'zrcs_ad_config_cache';
  static const String _timestampKey = 'zrcs_ad_config_timestamp';
  static const int _ttlMs = 4 * 60 * 60 * 1000; // 4 hours

  static Future<void> cacheConfig(String jsonString) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_cacheKey, jsonString);
    await prefs.setInt(_timestampKey, DateTime.now().millisecondsSinceEpoch);
  }

  static Future<String?> getCachedConfig() async {
    final prefs = await SharedPreferences.getInstance();
    final jsonString = prefs.getString(_cacheKey);
    final timestamp = prefs.getInt(_timestampKey);

    if (jsonString != null && timestamp != null) {
      final now = DateTime.now().millisecondsSinceEpoch;
      if (now - timestamp < _ttlMs) {
        return jsonString;
      }
    }
    return null;
  }
}
