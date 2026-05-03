import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';

class OfflineMessageQueue {
  static const String _queueKey = 'offline_message_queue';

  static Future<void> enqueue(Map<String, dynamic> message) async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString(_queueKey);
    final List<dynamic> queue = raw != null ? jsonDecode(raw) : [];
    queue.add(message);
    await prefs.setString(_queueKey, jsonEncode(queue));
  }

  static Future<List<Map<String, dynamic>>> dequeueAll() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString(_queueKey);
    if (raw == null) return [];
    try {
      final list = jsonDecode(raw) as List;
      await prefs.remove(_queueKey);
      return list.cast<Map<String, dynamic>>();
    } catch (_) {
      return [];
    }
  }

  static Future<int> getCount() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString(_queueKey);
    if (raw == null) return 0;
    try {
      return (jsonDecode(raw) as List).length;
    } catch (_) {
      return 0;
    }
  }
}
