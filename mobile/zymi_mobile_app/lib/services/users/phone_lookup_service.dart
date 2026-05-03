import 'dart:convert';
import 'package:http/http.dart' as http;
import '../../core/utils/phone_normalizer.dart';
import '../realtime/zymi_socket_config.dart';

class PhoneLookupResult {
  final bool found;
  final String? userId;
  final String? username;
  final String? avatar;
  final String? message;

  PhoneLookupResult({
    required this.found,
    this.userId,
    this.username,
    this.avatar,
    this.message,
  });
}

class PhoneLookupService {
  static const String _endpoint = '/api/users/lookup-phone';

  static Future<PhoneLookupResult> lookup(String phone) async {
    final normalized = PhoneNormalizer.normalize(phone);
    if (normalized == null) {
      return PhoneLookupResult(found: false, message: 'ভুল ফোন নম্বর');
    }

    try {
      final response = await http.post(
        Uri.parse('${ZymiSocketConfig.baseUrl}$_endpoint'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'phone': normalized}),
      ).timeout(const Duration(seconds: 10));

      final data = jsonDecode(response.body);

      if (response.statusCode == 200 && data['found'] == true) {
        final userData = data['user'];
        return PhoneLookupResult(
          found: true,
          userId: userData['id'],
          username: userData['username'],
          avatar: userData['avatar'],
        );
      } else {
        return PhoneLookupResult(
          found: false,
          message: data['message'] ?? 'এই নম্বরটি ZYMI-তে নিবন্ধিত নেই',
        );
      }
    } catch (e) {
      return PhoneLookupResult(
        found: false,
        message: 'সার্ভার কানেকশন এরর। অনুগ্রহ করে নেটওয়ার্ক চেক করুন।',
      );
    }
  }
}
