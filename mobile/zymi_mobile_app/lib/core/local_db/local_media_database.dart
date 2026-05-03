import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import 'local_media_record.dart';

class LocalMediaDatabase {
  static const String _storageKey = 'zymi_local_media_index';

  static Future<void> saveRecord(LocalMediaRecord record) async {
    final prefs = await SharedPreferences.getInstance();
    final records = await getAllRecords();
    
    // Remove if already exists
    records.removeWhere((r) => r.fileId == record.fileId);
    records.add(record);
    
    final jsonList = records.map((r) => r.toJson()).toList();
    await prefs.setString(_storageKey, jsonEncode(jsonList));
  }

  static Future<List<LocalMediaRecord>> getAllRecords() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString(_storageKey);
    if (raw == null) return [];
    
    try {
      final list = jsonDecode(raw) as List;
      return list.map((item) => LocalMediaRecord.fromJson(item)).toList();
    } catch (e) {
      return [];
    }
  }

  static Future<LocalMediaRecord?> getRecordByFileId(String fileId) async {
    final records = await getAllRecords();
    try {
      return records.firstWhere((r) => r.fileId == fileId);
    } catch (e) {
      return null;
    }
  }

  static Future<List<LocalMediaRecord>> getConversationMedia(String conversationId) async {
    final records = await getAllRecords();
    return records.where((r) => r.conversationId == conversationId).toList();
  }

  static Future<void> updateStatus(String fileId, String status) async {
    final records = await getAllRecords();
    final index = records.indexWhere((r) => r.fileId == fileId);
    if (index != -1) {
      final record = records[index];
      records[index] = LocalMediaRecord(
        fileId: record.fileId,
        conversationId: record.conversationId,
        senderId: record.senderId,
        receiverId: record.receiverId,
        mediaType: record.mediaType,
        localPath: record.localPath,
        fileName: record.fileName,
        fileSize: record.fileSize,
        mimeType: record.mimeType,
        checksum: record.checksum,
        transferStatus: status,
        createdAt: record.createdAt,
        receivedAt: status == 'completed' ? DateTime.now() : record.receivedAt,
      );
      
      final prefs = await SharedPreferences.getInstance();
      final jsonList = records.map((r) => r.toJson()).toList();
      await prefs.setString(_storageKey, jsonEncode(jsonList));
    }
  }

  static Future<void> deleteRecord(String fileId) async {
    final prefs = await SharedPreferences.getInstance();
    final records = await getAllRecords();
    records.removeWhere((r) => r.fileId == fileId);
    final jsonList = records.map((r) => r.toJson()).toList();
    await prefs.setString(_storageKey, jsonEncode(jsonList));
  }
}
