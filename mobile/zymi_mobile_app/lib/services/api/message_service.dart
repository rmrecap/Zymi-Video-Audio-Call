import 'dart:convert';
import 'package:http/http.dart' as http;
import '../../core/config/app_config.dart';
import 'encryption_service.dart';

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
      final messages = json.decode(response.body) as List;
      for (final msg in messages) {
        if (msg is Map<String, dynamic> && msg['is_encrypted'] == true) {
          final decrypted = EncryptionService.decrypt(msg['content'] ?? '');
          if (decrypted != null) msg['content'] = decrypted;
        }
      }
      return messages;
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

  static Future<Map<String, dynamic>> editMessage(int messageId, String newContent, String token) async {
    final response = await http.put(
      Uri.parse('$_baseUrl/$messageId/edit'),
      headers: {
        'Authorization': 'Bearer $token',
        'Content-Type': 'application/json',
      },
      body: jsonEncode({'content': newContent}),
    );
    return json.decode(response.body);
  }

  static Future<bool> deleteMessage(int messageId, String token) async {
    final response = await http.post(
      Uri.parse('$_baseUrl/delete'),
      headers: {
        'Authorization': 'Bearer $token',
        'Content-Type': 'application/json',
      },
      body: jsonEncode({'messageId': messageId}),
    );
    return response.statusCode == 200;
  }
}
