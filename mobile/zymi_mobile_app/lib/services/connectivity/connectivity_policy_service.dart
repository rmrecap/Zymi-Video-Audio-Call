import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import '../../core/config/app_config.dart';

class ConnectivityPolicyService {
  static const String _baseUrl = '${AppConfig.apiUrl}/api/connectivity';

  static Future<Map<String, dynamic>> fetchPolicy({String? country, String? token}) async {
    try {
      final url = Uri.parse('$_baseUrl/policy${country != null ? '?country=$country' : ''}');
      final response = await http.get(
        url,
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );

      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      }
    } catch (e) {
      debugPrint('Error fetching policy: $e');
    }
    
    // Default Policy
    return {
      'force_turn': 0,
      'auto_fix_enabled_default': 1,
      'max_direct_connect_seconds': 10,
    };
  }

  static Future<void> logEvent(Map<String, dynamic> eventData, String token) async {
    try {
      await http.post(
        Uri.parse('$_baseUrl/event'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
        body: jsonEncode(eventData),
      );
    } catch (e) {
      debugPrint('Error logging event: $e');
    }
  }

  static Future<void> reportRelayUsage({
    required String type,
    required String mode,
    int? bytes,
    int? seconds,
    String? sessionId,
    required String token,
  }) async {
    try {
      await http.post(
        Uri.parse('$_baseUrl/relay-usage'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
        body: jsonEncode({
          'connection_type': type,
          'relay_mode': mode,
          'bytes_estimated': bytes ?? 0,
          'duration_seconds': seconds ?? 0,
          'session_id': sessionId,
        }),
      );
    } catch (e) {
      debugPrint('Error reporting relay usage: $e');
    }
  }
}
