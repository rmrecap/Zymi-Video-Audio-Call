import 'package:flutter/foundation.dart';
import '../../services/realtime/zymi_chat_socket_service.dart';
import '../../services/realtime/zymi_chat_payloads.dart';

class ChatStateController extends ChangeNotifier {
  String? selectedUserId;
  final List<Map<String, dynamic>> messages = [];
  bool isTyping = false;
  String? peerTypingId;

  void init() {
    final chatService = ZymiChatSocketService();

    chatService.listenReceiveMessage((data) {
      messages.add(data as Map<String, dynamic>);
      notifyListeners();
    });

    chatService.listenUserTyping((data) {
      peerTypingId = data['from'];
      notifyListeners();
    });

    chatService.listenUserStopTyping((data) {
      if (peerTypingId == data['from']) {
        peerTypingId = null;
        notifyListeners();
      }
    });
  }

  void sendMessage(String from, String content) {
    if (selectedUserId == null) return;
    
    final tempId = DateTime.now().millisecondsSinceEpoch.toString();
    final payload = PrivateMessagePayload(
      to: selectedUserId!,
      from: from,
      content: content,
      tempId: tempId,
    );

    ZymiChatSocketService().sendPrivateMessage(payload);
    
    // Optimistic update
    messages.add({
      'sender_id': from,
      'receiver_id': selectedUserId,
      'content': content,
      'tempId': tempId,
      'timestamp': DateTime.now().toIso8601String(),
    });
    notifyListeners();
  }

  void updateTyping(String from, bool typing) {
    if (selectedUserId == null) return;
    if (isTyping == typing) return;
    
    isTyping = typing;
    final payload = TypingPayload(to: selectedUserId!, from: from);
    if (typing) {
      ZymiChatSocketService().sendTyping(payload);
    } else {
      ZymiChatSocketService().sendStopTyping(payload);
    }
  }
}
