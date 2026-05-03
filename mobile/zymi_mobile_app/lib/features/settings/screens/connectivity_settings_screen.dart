import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

class ConnectivitySettingsScreen extends StatefulWidget {
  const ConnectivitySettingsScreen({super.key});

  @override
  State<ConnectivitySettingsScreen> createState() =>
      _ConnectivitySettingsScreenState();
}

class _ConnectivitySettingsScreenState
    extends State<ConnectivitySettingsScreen> {
  bool _autoFixEnabled = true;

  @override
  void initState() {
    super.initState();
    _loadSettings();
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
            activeThumbColor: Colors.blueAccent,
          ),
          const Padding(
            padding: EdgeInsets.all(16.0),
            child: Text(
              'Relay mode (TURN) ensures you stay connected in restrictive networks but may slightly increase latency.',
              style: TextStyle(color: Colors.white24, fontSize: 11),
            ),
          ),
          _buildSectionHeader('Connection Health'),
          const ListTile(
            leading: Icon(Icons.speed, color: Colors.blueAccent),
            title: Text('Protocol Strategy',
                style: TextStyle(color: Colors.white)),
            subtitle: Text('STUN-First, TURN-Fallback',
                style: TextStyle(color: Colors.white54)),
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
            color: Colors.blueAccent,
            fontSize: 12,
            fontWeight: FontWeight.bold,
            letterSpacing: 1.2),
      ),
    );
  }
}
