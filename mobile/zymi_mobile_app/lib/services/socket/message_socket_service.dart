import '../realtime/zymi_socket_client.dart';

class MessageSocketService {
  static final MessageSocketService _instance = MessageSocketService._internal();
  factory MessageSocketService() => _instance;
  MessageSocketService._internal();

  final _socket = ZymiSocketClient();

  void listenPendingMessages(Function(List<dynamic>) onSync) {
    _socket.onSafe('sync-pending-messages', (data) {
      if (data is List) {
        onSync(data);
      }
    });
  }

  void listenUnreadUpdate(Function(Map<String, dynamic>) onUpdate) {
    _socket.onSafe('unread-count-updated', (data) {
      if (data is Map<String, dynamic>) {
        onUpdate(data);
      }
    });
  }

  void listenNotificationCreated(Function(Map<String, dynamic>) onNotification) {
    _socket.onSafe('notification-created', (data) {
      if (data is Map<String, dynamic>) {
        onNotification(data);
      }
    });
  }

  void emitMessageDelivered(int messageId, String senderId, String receiverId) {
    _socket.emitSafe('message-delivered', {
      'messageId': messageId,
      'senderId': senderId,
      'receiverId': receiverId,
    });
  }

  void emitMessageRead(int messageId, String senderId, String receiverId) {
    _socket.emitSafe('message-read', {
      'messageId': messageId,
      'senderId': senderId,
      'receiverId': receiverId,
    });
  }
}
