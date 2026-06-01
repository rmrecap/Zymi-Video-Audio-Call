import 'package:flutter/material.dart';
import '../../services/realtime/background_socket_service.dart';
import '../../services/realtime/zymi_socket_client.dart';

/// App Lifecycle Observer — Dual-Isolate Lifecycle Handler
///
/// CRITICAL FIX: No longer terminates active calls when the app is minimized.
/// Instead, hands off the connection state to the Background Service isolate,
/// which maintains the persistent socket and can relay incoming signals.
class ZymiAppLifecycleObserver extends WidgetsBindingObserver {
  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.paused) {
      // DO NOT endCall() here anymore.
      // Instead, notify the background isolate to take over signaling
      BackgroundSocketService.invoke('transfer_to_bg');
      debugPrint('[LIFECYCLE] App paused — handed off to Background Service');
    } else if (state == AppLifecycleState.resumed) {
      // Notify Background Service that UI is back in foreground
      BackgroundSocketService.invoke('transfer_to_ui');

      // Nudge UI socket reconnect if it dropped
      if (!ZymiSocketClient().isConnected) {
        debugPrint('[LIFECYCLE] App resumed — UI socket disconnected, will auto-reconnect');
      }
      debugPrint('[LIFECYCLE] App resumed');
    } else if (state == AppLifecycleState.detached) {
      // App is being destroyed — background service continues independently
      debugPrint('[LIFECYCLE] App detached — Background Service continues');
    }
  }
}
