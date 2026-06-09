import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../../../core/config/app_config.dart';
import '../../../core/theme/zymi_brand_colors.dart';
import '../../../services/api/auth_service.dart';

class ConnectivitySettingsScreen extends StatefulWidget {
  const ConnectivitySettingsScreen({super.key});

  @override
  State<ConnectivitySettingsScreen> createState() =>
      _ConnectivitySettingsScreenState();
}

class _ConnectivitySettingsScreenState
    extends State<ConnectivitySettingsScreen> {
  final AuthService _authService = AuthService();
  bool _autoFixEnabled = true;
  Map<String, dynamic>? _policy;

  @override
  void initState() {
    super.initState();
    _loadSettings();
    _fetchPolicy();
  }

  Future<void> _fetchPolicy() async {
    final token = await _authService.getToken();
    if (token == null) return;
    try {
      final res = await http.get(
        Uri.parse('${AppConfig.apiUrl}/api/connectivity/policy'),
        headers: {'Authorization': 'Bearer $token'},
      );
      if (res.statusCode == 200 && mounted) {
        setState(() => _policy = jsonDecode(res.body));
      }
    } catch (_) {}
  }

  Future<void> _loadSettings() async {
    final prefs = await SharedPreferences.getInstance();
    setState(() {
      _autoFixEnabled = prefs.getBool('auto_fix_connectivity') ?? true;
    });
  }

  Future<void> _toggleSetting(bool value) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool('auto_fix_connectivity', value);
    setState(() {
      _autoFixEnabled = value;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0f172a),
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        title: const Text('Connectivity Settings',
            style: TextStyle(color: Colors.white)),
        iconTheme: const IconThemeData(color: Colors.white),
      ),
      body: ListView(
        children: [
          _buildSectionHeader('Smart Recovery'),
          SwitchListTile(
            title: const Text('Auto-Fix Connectivity',
                style: TextStyle(color: Colors.white)),
            subtitle: const Text(
              'Automatically switch to relay mode if a direct connection fails.',
              style: TextStyle(color: Colors.white54, fontSize: 12),
            ),
            value: _autoFixEnabled,
            onChanged: _toggleSetting,
            activeThumbColor: ZymiColors.primary,
          ),
          const Padding(
            padding: EdgeInsets.all(16.0),
            child: Text(
              'Relay mode (TURN) ensures you stay connected in restrictive networks but may slightly increase latency.',
              style: TextStyle(color: Colors.white24, fontSize: 11),
            ),
          ),
          _buildSectionHeader('Connection Health'),
          ListTile(
            leading: const Icon(Icons.speed, color: ZymiColors.primary),
            title: const Text('Protocol Strategy',
                style: TextStyle(color: Colors.white)),
            subtitle: Text(
              _policy != null ? '${_policy!['strategy'] ?? 'STUN-First'}, ${_policy!['fallback'] ?? 'TURN-Fallback'}' : 'Loading...',
              style: const TextStyle(color: Colors.white54)),
          ),
          if (_policy != null && _policy!['relay'] != null)
            ListTile(
              leading: const Icon(Icons.wifi_tethering, color: ZymiColors.purple),
              title: const Text('Relay Region',
                  style: TextStyle(color: Colors.white)),
              subtitle: Text('${_policy!['relay']}',
                  style: const TextStyle(color: Colors.white54)),
            ),
        ],
      ),
    );
  }

  Widget _buildSectionHeader(String title) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 24, 16, 8),
      child: Text(
        title.toUpperCase(),
        style: const TextStyle(
            color: ZymiColors.primary,
            fontSize: 12,
            fontWeight: FontWeight.bold,
            letterSpacing: 1.2),
      ),
    );
  }
}
