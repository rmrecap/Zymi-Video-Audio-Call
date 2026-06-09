import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:socket_io_client/socket_io_client.dart' as io;
import 'zymi_socket_config.dart';
import 'zymi_call_event_guard.dart';
import 'zymi_chat_socket_service.dart';
import 'zymi_chat_payloads.dart';
import '../../features/chat/services/offline_message_queue.dart';

enum ZymiSocketStatus { connected, disconnected, connecting, error, authError }

class ZymiSocketClient {
  static final ZymiSocketClient _instance = ZymiSocketClient._internal();
  factory ZymiSocketClient() => _instance;
  ZymiSocketClient._internal();

  io.Socket? _socket;
  ZymiSocketStatus _currentStatus = ZymiSocketStatus.disconnected;
  final _statusController = StreamController<ZymiSocketStatus>.broadcast();
  final Set<String> _registeredListeners = {};

  ZymiSocketStatus get currentStatus => _currentStatus;
  Stream<ZymiSocketStatus> get statusStream => _statusController.stream;
  bool get isConnected => _socket?.connected ?? false;

  void connect(String token) {
    if (_socket != null && _socket!.connected) return;

    _socket = io.io(ZymiSocketConfig.baseUrl, ZymiSocketConfig.getOptions(token));

    _socket!.onConnect((_) async {
      debugPrint('[SOCKET] Connected');
      _currentStatus = ZymiSocketStatus.connected;
      _statusController.add(_currentStatus);
      final pending = await OfflineMessageQueue.dequeueAll();
      for (final msg in pending) {
        ZymiChatSocketService().sendPrivateMessage(PrivateMessagePayload(
          to: msg['to'] as String? ?? '',
          from: msg['from'] as String? ?? '',
          content: msg['content'] as String? ?? '',
          tempId: msg['tempId'] as String? ?? '',
          messageType: msg['message_type'] as String? ?? 'text',
          metadata: msg['metadata'] as Map<String, dynamic>?,
        ));
      }
      if (pending.isNotEmpty) {
        debugPrint('[SOCKET] Flushed ${pending.length} offline messages');
      }
    });

    _socket!.onDisconnect((_) {
      debugPrint('[SOCKET] Disconnected');
      _currentStatus = ZymiSocketStatus.disconnected;
      _statusController.add(_currentStatus);
    });

    _socket!.onConnectError((err) {
      debugPrint('[SOCKET] Connect Error: $err');
      final msg = err.toString().toLowerCase();
      if (msg.contains('invalid token') || msg.contains('token expired') || msg.contains('authentication required')) {
        _currentStatus = ZymiSocketStatus.authError;
        _statusController.add(_currentStatus);
        return;
      }
      _currentStatus = ZymiSocketStatus.error;
      _statusController.add(_currentStatus);
    });

    _socket!.on('force-logout', (data) {
      debugPrint('[SOCKET] Force logout: $data');
      _currentStatus = ZymiSocketStatus.authError;
      _statusController.add(_currentStatus);
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
    _currentStatus = ZymiSocketStatus.disconnected;
    _statusController.add(_currentStatus);
  }

  void dispose() {
    disconnect();
    _statusController.close();
  }
}
