import 'dart:convert';
import 'package:http/http.dart' as http;
import '../../core/config/app_config.dart';

class MessageService {
  static const String _baseUrl = '${AppConfig.apiUrl}/api/messages';

  static Future<List<dynamic>> fetchConversations(String token) async {
    final response = await http.get(
      Uri.parse('$_baseUrl/conversations'),
      headers: {
        'Authorization': 'Bearer $token',
      },
    );

    if (response.statusCode == 200) {
      return json.decode(response.body);
    }
    throw Exception('Failed to load conversations');
  }

  static Future<List<dynamic>> fetchConversationMessages(String peerId, String token, {int limit = 50, int offset = 0}) async {
    final response = await http.get(
      Uri.parse('$_baseUrl/conversations/$peerId?limit=$limit&offset=$offset'),
      headers: {
        'Authorization': 'Bearer $token',
      },
    );

    if (response.statusCode == 200) {
      return json.decode(response.body);
    }
    throw Exception('Failed to load messages');
  }

  static Future<void> markAsRead(int messageId, String token) async {
    await http.post(
      Uri.parse('$_baseUrl/$messageId/read'),
      headers: {
        'Authorization': 'Bearer $token',
      },
    );
  }

  static Future<void> markConversationRead(String conversationId, String token) async {
    await http.post(
      Uri.parse('$_baseUrl/conversations/$conversationId/read-all'),
      headers: {
        'Authorization': 'Bearer $token',
      },
    );
  }

  static Future<Map<String, dynamic>> fetchMessageHealth(String token) async {
    final response = await http.get(
      Uri.parse('$_baseUrl/health/messages'),
      headers: {
        'Authorization': 'Bearer $token',
      },
    );

    if (response.statusCode == 200) {
      return json.decode(response.body);
    }
    throw Exception('Failed to load message health');
  }
}
