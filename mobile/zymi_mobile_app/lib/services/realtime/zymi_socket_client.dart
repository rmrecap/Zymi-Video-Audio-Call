import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:socket_io_client/socket_io_client.dart' as io;
import 'zymi_socket_config.dart';
import 'zymi_call_event_guard.dart';

enum ZymiSocketStatus { connected, disconnected, connecting, error, authError }

class ZymiSocketClient {
  static final ZymiSocketClient _instance = ZymiSocketClient._internal();
  factory ZymiSocketClient() => _instance;
  ZymiSocketClient._internal();

  io.Socket? _socket;
  final _statusController = StreamController<ZymiSocketStatus>.broadcast();
  final Set<String> _registeredListeners = {};

  Stream<ZymiSocketStatus> get statusStream => _statusController.stream;
  bool get isConnected => _socket?.connected ?? false;

  void connect(String token) {
    if (_socket != null) return;

    _socket = io.io(ZymiSocketConfig.baseUrl, ZymiSocketConfig.getOptions(token));

    _socket!.onConnect((_) {
      debugPrint('[SOCKET] Connected');
      _statusController.add(ZymiSocketStatus.connected);
    });

    _socket!.onDisconnect((_) {
      debugPrint('[SOCKET] Disconnected');
      _statusController.add(ZymiSocketStatus.disconnected);
    });

    _socket!.onConnectError((err) {
      debugPrint('[SOCKET] Connect Error: $err');
      final msg = err.toString().toLowerCase();
      if (msg.contains('invalid token') || msg.contains('token expired') || msg.contains('authentication required')) {
        _statusController.add(ZymiSocketStatus.authError);
        return;
      }
      _statusController.add(ZymiSocketStatus.error);
    });

    _socket!.on('force-logout', (data) {
      debugPrint('[SOCKET] Force logout: $data');
      _statusController.add(ZymiSocketStatus.authError);
    });

    _socket!.connect();
  }

  void emitSafe(String event, dynamic data) {
    if (ZymiCallEventGuard.isBlocked(event)) {
      debugPrint('[SOCKET] BLOCKED: ${ZymiCallEventGuard.getBlockedReason()} ($event)');
      return;
    }
    _socket?.emit(event, data);
  }

  void onSafe(String event, Function(dynamic) callback) {
    if (_registeredListeners.contains(event)) {
      debugPrint('[SOCKET] Guard: Listener for $event already registered');
      return;
    }
    _socket?.on(event, (data) {
      debugPrint('[SOCKET] Received event: $event');
      callback(data);
    });
    _registeredListeners.add(event);
  }

  void offSafe(String event) {
    _socket?.off(event);
    _registeredListeners.remove(event);
  }

  void disconnect() {
    _socket?.disconnect();
    _socket = null;
    _registeredListeners.clear();
    _statusController.add(ZymiSocketStatus.disconnected);
  }

  void dispose() {
    disconnect();
    _statusController.close();
  }
}
