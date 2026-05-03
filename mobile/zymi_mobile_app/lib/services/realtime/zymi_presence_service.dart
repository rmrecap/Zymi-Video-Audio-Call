import 'package:flutter/foundation.dart';
import 'zymi_socket_client.dart';
import 'zymi_socket_event_names.dart';
import 'zymi_identity_normalizer.dart';

class ZymiPresenceService {
  static final ZymiPresenceService _instance = ZymiPresenceService._internal();
  factory ZymiPresenceService() => _instance;
  ZymiPresenceService._internal();

  final ValueNotifier<Set<String>> onlineUsers = ValueNotifier({});
  String? _currentUserId;

  void init() {
    final client = ZymiSocketClient();
    
    client.onSafe(ZymiSocketEvents.userOnline, (data) {
      final userId = ZymiIdentityNormalizer.normalize(data?['userId']);
      if (userId != null) {
        final current = Set<String>.from(onlineUsers.value);
        current.add(userId);
        onlineUsers.value = current;
      }
    });

    client.onSafe(ZymiSocketEvents.userOffline, (data) {
      final userId = ZymiIdentityNormalizer.normalize(data?['userId']);
      if (userId != null) {
        final current = Set<String>.from(onlineUsers.value);
        current.remove(userId);
        onlineUsers.value = current;
      }
    });

    // Handle re-join on reconnect
    client.statusStream.listen((status) {
      if (status == ZymiSocketStatus.connected && _currentUserId != null) {
        join(_currentUserId!);
      }
    });
  }

  void join(String userId) {
    _currentUserId = ZymiIdentityNormalizer.normalize(userId);
    if (_currentUserId == null) return;
    
    debugPrint('[PRESENCE] Joining as $_currentUserId');
    ZymiSocketClient().emitSafe(ZymiSocketEvents.join, _currentUserId);
  }

  void clear() {
    onlineUsers.value = {};
    _currentUserId = null;
  }
}
