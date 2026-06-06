import 'dart:convert';
import 'package:http/http.dart' as http;
import '../../core/config/app_config.dart';
import 'auth_service.dart';

class FriendService {
  final AuthService _authService = AuthService();

  Future<Map<String, dynamic>> sendRequest(int addresseeId) async {
    final token = await _authService.getToken();
    final res = await http.post(
      Uri.parse('${AppConfig.apiUrl}/api/friends/request'),
      headers: {'Authorization': 'Bearer $token', 'Content-Type': 'application/json'},
      body: jsonEncode({'addresseeId': addresseeId}),
    );
    return jsonDecode(res.body);
  }

  Future<Map<String, dynamic>> respond(int requesterId, String action) async {
    final token = await _authService.getToken();
    final res = await http.post(
      Uri.parse('${AppConfig.apiUrl}/api/friends/respond'),
      headers: {'Authorization': 'Bearer $token', 'Content-Type': 'application/json'},
      body: jsonEncode({'requesterId': requesterId, 'action': action}),
    );
    return jsonDecode(res.body);
  }

  Future<List<Map<String, dynamic>>> getFriends() async {
    final token = await _authService.getToken();
    final res = await http.get(
      Uri.parse('${AppConfig.apiUrl}/api/friends/list'),
      headers: {'Authorization': 'Bearer $token'},
    );
    if (res.statusCode == 200) {
      return (jsonDecode(res.body) as List).map((e) => Map<String, dynamic>.from(e)).toList();
    }
    return [];
  }

  Future<List<Map<String, dynamic>>> getPendingRequests() async {
    final token = await _authService.getToken();
    final res = await http.get(
      Uri.parse('${AppConfig.apiUrl}/api/friends/requests'),
      headers: {'Authorization': 'Bearer $token'},
    );
    if (res.statusCode == 200) {
      return (jsonDecode(res.body) as List).map((e) => Map<String, dynamic>.from(e)).toList();
    }
    return [];
  }

  Future<String> checkStatus(int peerId) async {
    final token = await _authService.getToken();
    final res = await http.get(
      Uri.parse('${AppConfig.apiUrl}/api/friends/check/$peerId'),
      headers: {'Authorization': 'Bearer $token'},
    );
    if (res.statusCode == 200) {
      final data = jsonDecode(res.body);
      return data['status'] ?? 'none';
    }
    return 'none';
  }

  Future<bool> removeFriend(int friendId) async {
    final token = await _authService.getToken();
    final res = await http.post(
      Uri.parse('${AppConfig.apiUrl}/api/friends/remove'),
      headers: {'Authorization': 'Bearer $token', 'Content-Type': 'application/json'},
      body: jsonEncode({'friendId': friendId}),
    );
    return res.statusCode == 200;
  }
}
