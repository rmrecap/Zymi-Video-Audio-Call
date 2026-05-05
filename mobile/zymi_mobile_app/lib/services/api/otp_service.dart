import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../../core/config/app_config.dart';

class OtpService {
  static const String _baseUrl = '${AppConfig.apiUrl}/api/otp';

  Future<Map<String, dynamic>> requestEmailOtp(String email) async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('zymi_token');
    
    final response = await http.post(
      Uri.parse('$_baseUrl/email/request'),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $token',
      },
      body: jsonEncode({'email': email}),
    );
    return jsonDecode(response.body);
  }

  Future<Map<String, dynamic>> verifyEmailOtp(String otp) async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('zymi_token');
    
    final response = await http.post(
      Uri.parse('$_baseUrl/email/verify'),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $token',
      },
      body: jsonEncode({'otp': otp}),
    );
    return jsonDecode(response.body);
  }

  Future<Map<String, dynamic>> requestPhoneLink({
    required String phone,
    required String countryCode,
    required String countryName,
    required String phoneCountryIso,
  }) async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('zymi_token');
    
    final response = await http.post(
      Uri.parse('$_baseUrl/phone/request-link'),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $token',
      },
      body: jsonEncode({
        'phone': phone,
        'countryCode': countryCode,
        'countryName': countryName,
        'phoneCountryIso': phoneCountryIso,
      }),
    );
    return jsonDecode(response.body);
  }

  Future<Map<String, dynamic>> verifyPhoneOtpInline(String otp) async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('zymi_token');
    
    final response = await http.post(
      Uri.parse('$_baseUrl/phone/verify-inline'),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $token',
      },
      body: jsonEncode({'otp': otp}),
    );
    return jsonDecode(response.body);
  }
}
