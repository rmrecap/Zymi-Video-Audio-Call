import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';

class ChatLocalCache {
  static const int _maxMessages = 100;

  static String _key(String conversationId) => 'chat_cache_$conversationId';

  static Future<void> saveMessages(String conversationId, List<Map<String, dynamic>> messages) async {
    final prefs = await SharedPreferences.getInstance();
    final trimmed = messages.length > _maxMessages
        ? messages.sublist(messages.length - _maxMessages)
        : messages;
    await prefs.setString(_key(conversationId), jsonEncode(trimmed));
  }

  static Future<List<Map<String, dynamic>>> loadMessages(String conversationId) async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString(_key(conversationId));
    if (raw == null) return [];
    try {
      final list = jsonDecode(raw) as List;
      return list.cast<Map<String, dynamic>>();
    } catch (_) {
      return [];
    }
  }

  static Future<int> getCacheCount(String conversationId) async {
    final msgs = await loadMessages(conversationId);
    return msgs.length;
  }

  static Future<void> clear(String conversationId) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_key(conversationId));
  }
}
