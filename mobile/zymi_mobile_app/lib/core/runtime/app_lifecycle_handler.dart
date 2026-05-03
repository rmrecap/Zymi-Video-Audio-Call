import 'package:flutter/material.dart';
import '../../features/call/controllers/call_controller.dart';
import '../../services/realtime/zymi_socket_client.dart';

class ZymiAppLifecycleObserver extends WidgetsBindingObserver {
  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.paused || state == AppLifecycleState.detached) {
      final callState = CallController().state;
      if (callState == CallState.connected || callState == CallState.connecting) {
        // App went to background during call — could mark reconnecting or end
        // CallController()._setState(CallState.reconnecting);
        // Or safely end to release camera:
        CallController().endCall(emit: true);
      }
    } else if (state == AppLifecycleState.resumed) {
      if (!ZymiSocketClient().isConnected) {
        // Zymi socket handles auto reconnect, but we can nudge it
      }
    }
  }
}
