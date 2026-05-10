import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';

class CallQualityReporter {
  static const String _apiBaseUrl = '${String.fromEnvironment('API_URL', defaultValue: 'http://localhost:5001')}/api/webrtc';

  static Future<void> reportCallQuality({
    required String callId,
    required String callerId,
    required String receiverId,
    required String state,
    String? failureReason,
    String? iceState,
    int? durationMs,
  }) async {
    try {
      final response = await http.post(
        Uri.parse('$_apiBaseUrl/logs'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'callId': callId,
          'callerId': callerId,
          'receiverId': receiverId,
          'state': state,
          'failureReason': failureReason,
          'iceState': iceState,
          'duration': durationMs,
        }),
      );

      if (response.statusCode == 200 || response.statusCode == 201) {
        debugPrint('[CALL_QUALITY] Report submitted successfully.');
      } else {
        debugPrint('[CALL_QUALITY] Failed to submit report: ${response.statusCode}');
      }
    } catch (e) {
      debugPrint('[CALL_QUALITY] Error submitting report: $e');
    }
  }
}
