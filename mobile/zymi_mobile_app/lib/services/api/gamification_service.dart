import 'dart:convert';
import 'package:http/http.dart' as http;
import '../../core/config/app_config.dart';
import 'auth_service.dart';

class GamificationService {
  final AuthService _authService = AuthService();

  Future<Map<String, dynamic>> getPoints() async {
    final token = await _authService.getToken();
    if (token == null) return {};
    final res = await http.get(
      Uri.parse('${AppConfig.apiUrl}/api/gamification/points'),
      headers: {'Authorization': 'Bearer $token'},
    );
    if (res.statusCode == 200) return jsonDecode(res.body);
    return {};
  }

  Future<List<Map<String, dynamic>>> getBadges() async {
    final token = await _authService.getToken();
    if (token == null) return [];
    final res = await http.get(
      Uri.parse('${AppConfig.apiUrl}/api/gamification/badges'),
      headers: {'Authorization': 'Bearer $token'},
    );
    if (res.statusCode == 200) {
      return (jsonDecode(res.body) as List).map((e) => Map<String, dynamic>.from(e)).toList();
    }
    return [];
  }

  Future<List<Map<String, dynamic>>> getAchievements() async {
    final token = await _authService.getToken();
    if (token == null) return [];
    final res = await http.get(
      Uri.parse('${AppConfig.apiUrl}/api/gamification/achievements'),
      headers: {'Authorization': 'Bearer $token'},
    );
    if (res.statusCode == 200) {
      return (jsonDecode(res.body) as List).map((e) => Map<String, dynamic>.from(e)).toList();
    }
    return [];
  }

  Future<List<Map<String, dynamic>>> getLeaderboard() async {
    final token = await _authService.getToken();
    if (token == null) return [];
    final res = await http.get(
      Uri.parse('${AppConfig.apiUrl}/api/gamification/leaderboard'),
      headers: {'Authorization': 'Bearer $token'},
    );
    if (res.statusCode == 200) {
      return (jsonDecode(res.body) as List).map((e) => Map<String, dynamic>.from(e)).toList();
    }
    return [];
  }
}
