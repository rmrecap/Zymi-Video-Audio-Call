import 'package:flutter/foundation.dart';

class ZymiReconnectGuard {
  static final ZymiReconnectGuard _instance = ZymiReconnectGuard._internal();
  factory ZymiReconnectGuard() => _instance;
  ZymiReconnectGuard._internal();

  DateTime? _lastConnectAttempt;
  bool _isConnecting = false;

  bool canAttemptConnect() {
    if (_isConnecting) return false;
    
    if (_lastConnectAttempt != null) {
      final elapsed = DateTime.now().difference(_lastConnectAttempt!).inSeconds;
      if (elapsed < 5) {
        debugPrint('[RECONNECT] Guard: Wait ${5 - elapsed}s before retry');
        return false;
      }
    }
    return true;
  }

  void startAttempt() {
    _isConnecting = true;
    _lastConnectAttempt = DateTime.now();
  }

  void endAttempt() {
    _isConnecting = false;
  }
}
