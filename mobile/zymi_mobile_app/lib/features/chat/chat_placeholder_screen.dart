import 'package:flutter/material.dart';
import '../../core/runtime/runtime_state_binder.dart';
import 'controllers/chat_controller.dart';
import 'services/typing_throttle.dart';

class ChatPlaceholderScreen extends StatefulWidget {
  const ChatPlaceholderScreen({super.key});

  @override
  State<ChatPlaceholderScreen> createState() => _ChatPlaceholderScreenState();
}

class _ChatPlaceholderScreenState extends State<ChatPlaceholderScreen> {
  final TextEditingController _textController = TextEditingController();
  final FocusNode _focusNode = FocusNode();
  final ScrollController _scrollController = ScrollController();
  late final ChatController _chatController;
  late final TypingThrottle _typingThrottle;

  final String _currentUserId = 'user_mobile';
  final String _targetUserId = 'user_web';

  @override
  void initState() {
    super.initState();
    _chatController = ChatController(currentUserId: _currentUserId);
    _chatController.selectedUserId = _targetUserId;
    _chatController.init();
    _chatController.loadHistory();
    _chatController.addListener(_onStateChange);
    _focusNode.addListener(_onFocusChange);

    _typingThrottle = TypingThrottle(
      onTyping: () {
        runtimeStateBinder.setTyping(true);
        _chatController.selectedUserId != null
            ? _emitTyping(true)
            : null;
      },
      onStopTyping: () {
        runtimeStateBinder.setTyping(false);
        _emitTyping(false);
      },
    );

    _textController.addListener(() => _typingThrottle.onTextChanged(_textController.text));
  }

  void _emitTyping(bool typing) {
    // Delegated to socket service via old ChatStateController path
    // but now uses throttle
  }

  void _onStateChange() {
    if (mounted) {
      setState(() {});
      _scrollToBottom();
    }
  }

  void _onFocusChange() {
    runtimeStateBinder.setComposerFocused(_focusNode.hasFocus);
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 200),
          curve: Curves.easeOut,
        );
      }
    });
  }

  @override
  void dispose() {
    _chatController.removeListener(_onStateChange);
    _focusNode.removeListener(_onFocusChange);
    _typingThrottle.dispose();
    _focusNode.dispose();
    _textController.dispose();
    _scrollController.dispose();
    runtimeStateBinder.setComposerFocused(false);
    runtimeStateBinder.setTyping(false);
    super.dispose();
  }

  Widget _statusIcon(String status) {
    switch (status) {
      case 'sending':
        return const Icon(Icons.access_time, size: 12, color: Colors.grey);
      case 'sent':
        return const Icon(Icons.check, size: 12, color: Colors.grey);
      case 'delivered':
        return const Icon(Icons.done_all, size: 12, color: Colors.grey);
      case 'read':
        return const Icon(Icons.done_all, size: 12, color: Colors.blue);
      case 'failed':
        return const Icon(Icons.error_outline, size: 12, color: Colors.red);
      default:
        return const SizedBox.shrink();
    }
  }

  bool get _isOnline => true; // Placeholder — wire to presence service
  bool get _isConnected => true; // Placeholder — wire to socket status

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0f172a),
      appBar: AppBar(
        backgroundColor: const Color(0xFF1e293b),
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(_targetUserId, style: const TextStyle(fontSize: 16)),
            if (_chatController.peerTypingId == _targetUserId)
              const Text('typing...', style: TextStyle(fontSize: 11, color: Colors.greenAccent))
            else
              Text(_isOnline ? 'online' : 'offline',
                  style: TextStyle(fontSize: 11, color: _isOnline ? Colors.green : Colors.grey)),
          ],
        ),
      ),
      body: Column(
        children: [
          // Offline banner
          if (!_isConnected)
            Container(
              width: double.infinity,
              color: Colors.orange.shade900,
              padding: const EdgeInsets.all(6),
              child: const Text('Offline — messages will be queued',
                  textAlign: TextAlign.center, style: TextStyle(color: Colors.white, fontSize: 12)),
            ),

          // Messages
          Expanded(
            child: _chatController.isLoadingHistory
                ? const Center(child: CircularProgressIndicator())
                : ListView.builder(
                    controller: _scrollController,
                    padding: const EdgeInsets.all(8),
                    itemCount: _chatController.messages.length,
                    itemBuilder: (context, index) {
                      final msg = _chatController.messages[index];
                      return Align(
                        alignment: msg.isMine ? Alignment.centerRight : Alignment.centerLeft,
                        child: GestureDetector(
                          onTap: msg.status == 'failed'
                              ? () => _chatController.retryMessage(msg.tempId ?? '')
                              : null,
                          child: Container(
                            margin: const EdgeInsets.symmetric(vertical: 3),
                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                            decoration: BoxDecoration(
                              color: msg.isMine ? const Color(0xFF3b82f6) : const Color(0xFF334155),
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.end,
                              children: [
                                Text(msg.content, style: const TextStyle(color: Colors.white)),
                                const SizedBox(height: 2),
                                Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    Text(
                                      '${msg.createdAt.hour}:${msg.createdAt.minute.toString().padLeft(2, '0')}',
                                      style: const TextStyle(color: Colors.white38, fontSize: 10),
                                    ),
                                    if (msg.isMine) ...[
                                      const SizedBox(width: 4),
                                      _statusIcon(msg.status),
                                    ],
                                    if (msg.status == 'failed')
                                      const Padding(
                                        padding: EdgeInsets.only(left: 4),
                                        child: Text('Tap to retry', style: TextStyle(color: Colors.red, fontSize: 9)),
                                      ),
                                  ],
                                ),
                              ],
                            ),
                          ),
                        ),
                      );
                    },
                  ),
          ),

          // Composer
          Container(
            color: const Color(0xFF1e293b),
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _textController,
                    focusNode: _focusNode,
                    style: const TextStyle(color: Colors.white),
                    decoration: InputDecoration(
                      hintText: 'Type a message...',
                      hintStyle: const TextStyle(color: Colors.white38),
                      filled: true,
                      fillColor: const Color(0xFF0f172a),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(20),
                        borderSide: BorderSide.none,
                      ),
                      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                IconButton(
                  icon: const Icon(Icons.send, color: Colors.blue),
                  onPressed: () {
                    if (_textController.text.isEmpty) return;
                    _chatController.sendMessage(_textController.text);
                    _textController.clear();
                    _typingThrottle.onSend();
                  },
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
