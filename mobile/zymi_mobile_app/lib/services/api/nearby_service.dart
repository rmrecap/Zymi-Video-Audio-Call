import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:flutter/foundation.dart';
import '../../core/config/app_config.dart';
import 'auth_service.dart';

class NearbyService {
  final AuthService _authService = AuthService();

  Future<List<Map<String, dynamic>>> getNearbyUsers(double lat, double lng, {double radius = 10.0}) async {
    final token = await _authService.getToken();
    if (token == null) return [];

    try {
      final response = await http.get(
        Uri.parse('${AppConfig.apiUrl}/api/nearby/users?lat=$lat&lng=$lng'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );

      if (response.statusCode == 200) {
        final List<dynamic> data = jsonDecode(response.body);
        return data.map((e) => Map<String, dynamic>.from(e)).toList();
      }
    } catch (e) {
      debugPrint('Error fetching nearby users: $e');
    }
    return [];
  }
}
