import 'dart:convert';
import 'package:http/http.dart' as http;
import '../../core/config/app_config.dart';

class IceServerService {
  static const String _baseUrl = '${AppConfig.apiUrl}/api/turn';

  static Future<List<Map<String, dynamic>>> fetchIceServers({String? country, String? token}) async {
    try {
      final url = Uri.parse('$_baseUrl/ice-servers${country != null ? '?country=$country' : ''}');
      final response = await http.get(
        url,
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );

      if (response.statusCode == 200) {
        final List<dynamic> data = jsonDecode(response.body);
        return data.cast<Map<String, dynamic>>();
      }
      return [{'urls': 'stun:stun.l.google.com:19302'}];
    } catch (e) {
      return [{'urls': 'stun:stun.l.google.com:19302'}];
    }
  }
}
