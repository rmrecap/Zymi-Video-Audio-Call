import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import '../../services/realtime/background_socket_service.dart';
import '../../services/realtime/zymi_socket_client.dart';

/// App Lifecycle Observer — Dual-Isolate Lifecycle Handler
///
/// CRITICAL FIX: No longer terminates active calls when the app is minimized.
/// Instead, hands off the connection state to the Background Service isolate,
/// which maintains the persistent socket and can relay incoming signals.
class ZymiAppLifecycleObserver extends WidgetsBindingObserver {
  bool get _supportsBackgroundService =>
      !kIsWeb && (Platform.isAndroid || Platform.isIOS);

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.paused) {
      if (_supportsBackgroundService) {
        BackgroundSocketService.invoke('transfer_to_bg');
      }
      debugPrint('[LIFECYCLE] App paused');
    } else if (state == AppLifecycleState.resumed) {
      if (_supportsBackgroundService) {
        BackgroundSocketService.invoke('transfer_to_ui');
      }

      if (!ZymiSocketClient().isConnected) {
        debugPrint('[LIFECYCLE] App resumed — UI socket disconnected, will auto-reconnect');
      }
      debugPrint('[LIFECYCLE] App resumed');
    } else if (state == AppLifecycleState.detached) {
      debugPrint('[LIFECYCLE] App detached');
    }
  }
}
