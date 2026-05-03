import 'zymi_socket_client.dart';
import 'zymi_socket_event_names.dart';
import 'zymi_chat_payloads.dart';

class ZymiChatSocketService {
  static final ZymiChatSocketService _instance = ZymiChatSocketService._internal();
  factory ZymiChatSocketService() => _instance;
  ZymiChatSocketService._internal();

  void sendPrivateMessage(PrivateMessagePayload payload) {
    ZymiSocketClient().emitSafe(ZymiSocketEvents.privateMessage, payload.toJson());
  }

  void sendTyping(TypingPayload payload) {
    ZymiSocketClient().emitSafe(ZymiSocketEvents.typing, payload.toJson());
  }

  void sendStopTyping(TypingPayload payload) {
    ZymiSocketClient().emitSafe(ZymiSocketEvents.stopTyping, payload.toJson());
  }

  void listenReceiveMessage(Function(dynamic) onData) {
    ZymiSocketClient().onSafe('receive_message', onData);
  }

  void listenNewMessage(Function(dynamic) onData) {
    ZymiSocketClient().onSafe(ZymiSocketEvents.newMessage, onData);
  }

  void listenMessageSent(Function(dynamic) onData) {
    ZymiSocketClient().onSafe('message-sent', onData);
  }

  void listenUserTyping(Function(dynamic) onData) {
    ZymiSocketClient().onSafe(ZymiSocketEvents.userTyping, onData);
  }

  void listenUserStopTyping(Function(dynamic) onData) {
    ZymiSocketClient().onSafe(ZymiSocketEvents.userStopTyping, onData);
  }
}
