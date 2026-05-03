import 'dart:convert';
import 'package:http/http.dart' as http;
import '../../core/config/app_config.dart';
import '../../core/local_db/local_media_database.dart';

class MediaIndexService {
  static const String _baseUrl = '${AppConfig.apiUrl}/api/media';

  static Future<Map<String, dynamic>> indexMediaOnServer(Map<String, dynamic> metadata, String token) async {
    final response = await http.post(
      Uri.parse('$_baseUrl/index'),
      headers: {
        'Authorization': 'Bearer $token',
        'Content-Type': 'application/json',
      },
      body: jsonEncode(metadata),
    );

    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    }
    throw Exception('Failed to index media on server: ${response.body}');
  }

  static Future<void> updateStatusOnServer(String fileId, String status, String token, {String? receiverPathHash}) async {
    final response = await http.post(
      Uri.parse('$_baseUrl/$fileId/status'),
      headers: {
        'Authorization': 'Bearer $token',
        'Content-Type': 'application/json',
      },
      body: jsonEncode({
        'status': status,
        if (receiverPathHash != null) 'receiver_path_hash': receiverPathHash,
      }),
    );

    if (response.statusCode != 200) {
      throw Exception('Failed to update status on server');
    }
    
    // Also update locally
    await LocalMediaDatabase.updateStatus(fileId, status);
  }

  static Future<String> createTransferSession(Map<String, dynamic> sessionData, String token) async {
    final response = await http.post(
      Uri.parse('$_baseUrl/session/start'),
      headers: {
        'Authorization': 'Bearer $token',
        'Content-Type': 'application/json',
      },
      body: jsonEncode(sessionData),
    );

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      return data['sessionId'];
    }
    throw Exception('Failed to create transfer session');
  }

  static Future<void> updateSessionProgress(String sessionId, int transferredChunks, String token) async {
    await http.post(
      Uri.parse('$_baseUrl/session/$sessionId/progress'),
      headers: {
        'Authorization': 'Bearer $token',
        'Content-Type': 'application/json',
      },
      body: jsonEncode({'transferred_chunks': transferredChunks}),
    );
  }

  static Future<void> completeSession(String sessionId, String token) async {
    await http.post(
      Uri.parse('$_baseUrl/session/$sessionId/complete'),
      headers: {
        'Authorization': 'Bearer $token',
      },
    );
  }
}
