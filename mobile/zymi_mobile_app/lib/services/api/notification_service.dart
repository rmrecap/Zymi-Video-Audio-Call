import 'dart:convert';
import 'package:http/http.dart' as http;
import '../../core/config/app_config.dart';

class NotificationService {
  static const String _baseUrl = '${AppConfig.apiUrl}/api/notifications';

  static Future<List<dynamic>> fetchNotifications(String token) async {
    final response = await http.get(
      Uri.parse(_baseUrl),
      headers: {
        'Authorization': 'Bearer $token',
      },
    );

    if (response.statusCode == 200) {
      return json.decode(response.body);
    }
    throw Exception('Failed to load notifications');
  }

  static Future<void> markRead(int notificationId, String token) async {
    await http.post(
      Uri.parse('$_baseUrl/$notificationId/read'),
      headers: {
        'Authorization': 'Bearer $token',
      },
    );
  }

  static Future<void> markAllRead(String token) async {
    await http.post(
      Uri.parse('$_baseUrl/read-all'),
      headers: {
        'Authorization': 'Bearer $token',
      },
    );
  }
}
