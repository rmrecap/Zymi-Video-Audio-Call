import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import '../../../services/realtime/zymi_socket_config.dart';

class ChatHistoryService {
  /// Fetches message history from the backend REST API.
  /// Backend route: GET /api/messages/:userId/:otherId
  /// VERIFY REQUIRED: Confirm authentication token header is needed.
  static Future<List<Map<String, dynamic>>> fetchHistory(String userId, String otherId, {String? token}) async {
    try {
      final url = Uri.parse('${ZymiSocketConfig.baseUrl}/api/messages/$userId/$otherId');
      final headers = <String, String>{
        'Content-Type': 'application/json',
      };
      if (token != null) {
        headers['Authorization'] = 'Bearer $token';
      }

      final response = await http.get(url, headers: headers);
      if (response.statusCode == 200) {
        final List<dynamic> body = jsonDecode(response.body);
        return body.cast<Map<String, dynamic>>();
      } else {
        debugPrint('[CHAT_HISTORY] Failed: ${response.statusCode}');
        return [];
      }
    } catch (e) {
      debugPrint('[CHAT_HISTORY] Error: $e');
      return [];
    }
  }
}
