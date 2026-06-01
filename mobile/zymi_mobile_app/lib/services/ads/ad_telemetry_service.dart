import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../../core/config/app_config.dart';

class AdTelemetryService {
  static const String _storageKey = 'ad_telemetry_events';

  static Future<void> logEvent(String adId, String action) async {
    final prefs = await SharedPreferences.getInstance();
    final eventsStr = prefs.getStringList(_storageKey) ?? [];
    
    eventsStr.add(jsonEncode({
      'ad_id': adId,
      'action': action,
      'ts': DateTime.now().millisecondsSinceEpoch
    }));

    await prefs.setStringList(_storageKey, eventsStr);

    if (eventsStr.length >= 10) {
      await flush();
    }
  }

  static Future<void> flush() async {
    final prefs = await SharedPreferences.getInstance();
    final eventsStr = prefs.getStringList(_storageKey);
    if (eventsStr == null || eventsStr.isEmpty) return;

    final events = eventsStr.map((e) => jsonDecode(e) as Map<String, dynamic>).toList();
    
    // Clear storage first to prevent duplicate submissions if network is slow
    await prefs.remove(_storageKey);

    try {
      final response = await http.post(
        Uri.parse('${AppConfig.apiUrl}/api/v1/ads/telemetry/bulk'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'events': events}),
      );
      
      if (response.statusCode != 200) {
        // If server error, restore to storage
        final currentStr = prefs.getStringList(_storageKey) ?? [];
        currentStr.addAll(eventsStr);
        await prefs.setStringList(_storageKey, currentStr);
      }
    } catch (e) {
      // Restore on failure
      final currentStr = prefs.getStringList(_storageKey) ?? [];
      currentStr.addAll(eventsStr);
      await prefs.setStringList(_storageKey, currentStr);
    }
  }
}
