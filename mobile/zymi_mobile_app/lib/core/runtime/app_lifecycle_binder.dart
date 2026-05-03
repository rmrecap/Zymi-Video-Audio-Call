import 'package:flutter/widgets.dart';
import '../../services/realtime/zymi_socket_client.dart';
import '../../services/realtime/zymi_reconnect_guard.dart';

class AppLifecycleBinder extends WidgetsBindingObserver {
  static final AppLifecycleBinder _instance = AppLifecycleBinder._internal();
  factory AppLifecycleBinder() => _instance;
  AppLifecycleBinder._internal();

  String? _lastToken;

  void init() {
    WidgetsBinding.instance.addObserver(this);
  }

  void setToken(String token) {
    _lastToken = token;
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    debugPrint('[LIFECYCLE] State changed to: $state');
    
    if (state == AppLifecycleState.resumed) {
      if (!ZymiSocketClient().isConnected && _lastToken != null) {
        if (ZymiReconnectGuard().canAttemptConnect()) {
          ZymiReconnectGuard().startAttempt();
          ZymiSocketClient().connect(_lastToken!);
          ZymiReconnectGuard().endAttempt();
        }
      }
    }
  }

  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
  }
}
