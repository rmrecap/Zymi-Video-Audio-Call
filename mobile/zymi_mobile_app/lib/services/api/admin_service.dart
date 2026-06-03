import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../../core/config/app_config.dart';

class AdminService {
  static const String _baseUrl = '${AppConfig.apiUrl}/api/admin';

  Future<String?> _getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('zymi_token');
  }

  Future<Map<String, dynamic>> getStats() async {
    final token = await _getToken();
    final response = await http.get(
      Uri.parse('$_baseUrl/stats'),
      headers: {'Authorization': 'Bearer $token'},
    );
    return jsonDecode(response.body);
  }

  Future<List<dynamic>> getUsers({String? search, bool? includeBanned}) async {
    final token = await _getToken();
    final params = <String, String>{};
    if (search != null) params['search'] = search;
    if (includeBanned == true) params['includeBanned'] = 'true';
    final uri = Uri.parse('$_baseUrl/users').replace(queryParameters: params.isNotEmpty ? params : null);
    final response = await http.get(uri, headers: {'Authorization': 'Bearer $token'});
    return jsonDecode(response.body) as List<dynamic>;
  }

  Future<Map<String, dynamic>> banUser(int userId, {String? reason}) async {
    final token = await _getToken();
    final response = await http.post(
      Uri.parse('$_baseUrl/ban'),
      headers: {'Content-Type': 'application/json', 'Authorization': 'Bearer $token'},
      body: jsonEncode({'userId': userId, 'reason': reason ?? ''}),
    );
    return jsonDecode(response.body);
  }

  Future<Map<String, dynamic>> unbanUser(int userId) async {
    final token = await _getToken();
    final response = await http.post(
      Uri.parse('$_baseUrl/unban'),
      headers: {'Content-Type': 'application/json', 'Authorization': 'Bearer $token'},
      body: jsonEncode({'userId': userId}),
    );
    return jsonDecode(response.body);
  }

  Future<Map<String, dynamic>> updateRole(int userId, String newRole) async {
    final token = await _getToken();
    final response = await http.post(
      Uri.parse('$_baseUrl/role'),
      headers: {'Content-Type': 'application/json', 'Authorization': 'Bearer $token'},
      body: jsonEncode({'userId': userId, 'newRole': newRole}),
    );
    return jsonDecode(response.body);
  }

  Future<List<dynamic>> getAuditLogs({int limit = 50}) async {
    final token = await _getToken();
    final response = await http.get(
      Uri.parse('$_baseUrl/audit?limit=$limit'),
      headers: {'Authorization': 'Bearer $token'},
    );
    return jsonDecode(response.body) as List<dynamic>;
  }

  Future<Map<String, dynamic>> getMessageHealth() async {
    final token = await _getToken();
    final response = await http.get(
      Uri.parse('$_baseUrl/message-health'),
      headers: {'Authorization': 'Bearer $token'},
    );
    return jsonDecode(response.body);
  }

  Future<Map<String, dynamic>> getCallHealth() async {
    final token = await _getToken();
    final response = await http.get(
      Uri.parse('$_baseUrl/call-health'),
      headers: {'Authorization': 'Bearer $token'},
    );
    return jsonDecode(response.body);
  }
}
