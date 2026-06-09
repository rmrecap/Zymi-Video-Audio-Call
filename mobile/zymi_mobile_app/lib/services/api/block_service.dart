import 'dart:convert';
import 'package:http/http.dart' as http;
import '../../core/config/app_config.dart';
import 'auth_service.dart';

class BlockService {
  final AuthService _authService = AuthService();

  Future<bool> blockUser(int targetUserId) async {
    final token = await _authService.getToken();
    if (token == null) return false;
    final res = await http.post(
      Uri.parse('${AppConfig.apiUrl}/api/block/$targetUserId'),
      headers: {'Authorization': 'Bearer $token', 'Content-Type': 'application/json'},
    );
    return res.statusCode == 200;
  }

  Future<bool> unblockUser(int targetUserId) async {
    final token = await _authService.getToken();
    if (token == null) return false;
    final res = await http.delete(
      Uri.parse('${AppConfig.apiUrl}/api/block/$targetUserId'),
      headers: {'Authorization': 'Bearer $token'},
    );
    return res.statusCode == 200;
  }

  Future<List<Map<String, dynamic>>> getBlockedUsers() async {
    final token = await _authService.getToken();
    if (token == null) return [];
    final res = await http.get(
      Uri.parse('${AppConfig.apiUrl}/api/block/me'),
      headers: {'Authorization': 'Bearer $token'},
    );
    if (res.statusCode == 200) {
      return (jsonDecode(res.body) as List).map((e) => Map<String, dynamic>.from(e)).toList();
    }
    return [];
  }

  Future<bool> checkBlocked(int targetUserId) async {
    final token = await _authService.getToken();
    if (token == null) return false;
    final res = await http.get(
      Uri.parse('${AppConfig.apiUrl}/api/block/$targetUserId/$targetUserId'),
      headers: {'Authorization': 'Bearer $token'},
    );
    if (res.statusCode == 200) {
      final data = jsonDecode(res.body);
      return data['blocked'] == true;
    }
    return false;
  }
}
