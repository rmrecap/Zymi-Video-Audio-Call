import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../../core/config/app_config.dart';

class ProfileService {
  static const String _baseUrl = '${AppConfig.apiUrl}/api';

  Future<Map<String, dynamic>> updateProfile(String userId, Map<String, dynamic> data) async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('zymi_token');

    final response = await http.put(
      Uri.parse('$_baseUrl/profile/$userId'),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $token',
      },
      body: jsonEncode(data),
    );
    return jsonDecode(response.body);
  }

  Future<Map<String, dynamic>> getSettings(String userId) async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('zymi_token');

    final response = await http.get(
      Uri.parse('$_baseUrl/settings/$userId'),
      headers: {'Authorization': 'Bearer $token'},
    );
    return jsonDecode(response.body);
  }

  Future<Map<String, dynamic>> updateSettings(String userId, Map<String, dynamic> data) async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('zymi_token');

    final response = await http.put(
      Uri.parse('$_baseUrl/settings/$userId'),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $token',
      },
      body: jsonEncode(data),
    );
    return jsonDecode(response.body);
  }
}
