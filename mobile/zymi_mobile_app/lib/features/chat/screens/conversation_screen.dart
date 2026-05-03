import 'package:flutter/material.dart';
import '../controllers/chat_controller.dart';
import '../models/zymi_message.dart';
import '../widgets/message_status_indicator.dart';
import '../widgets/offline_sync_banner.dart';
import '../widgets/media_message_bubble.dart';

class ConversationScreen extends StatefulWidget {
  final String peerId;
  final String peerName;

  const ConversationScreen({
    super.key,
    required this.peerId,
    required this.peerName,
  });

  @override
  State<ConversationScreen> createState() => _ConversationScreenState();
}

class _ConversationScreenState extends State<ConversationScreen> {
  late ChatController _controller;
  final TextEditingController _messageController = TextEditingController();
  final ScrollController _scrollController = ScrollController();

  @override
  void initState() {
    super.initState();
    // Assuming we have access to currentUserId via a global state or provider
    // For now, using a placeholder or identifying from socket client
    _controller = ChatController(currentUserId: 'me'); // Placeholder
    _controller.selectedUserId = widget.peerId;
    _controller.init();
    _controller.addListener(_onStateChanged);
    _controller.loadHistory();
  }

  @override
  void dispose() {
    _controller.removeListener(_onStateChanged);
    _messageController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  void _onStateChanged() {
    if (mounted) {
      setState(() {});
      _scrollToBottom();
    }
  }

  void _scrollToBottom() {
    if (_scrollController.hasClients) {
      _scrollController.animateTo(
        _scrollController.position.maxScrollExtent,
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeOut,
      );
    }
  }

  void _sendMessage() {
    if (_messageController.text.trim().isEmpty) return;
    _controller.sendMessage(_messageController.text.trim());
    _messageController.clear();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0f172a),
      appBar: AppBar(
        backgroundColor: const Color(0xFF1e293b),
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(widget.peerName, style: const TextStyle(fontSize: 16)),
            Text(
              _controller.peerTypingId == widget.peerId ? 'typing...' : 'online',
              style: TextStyle(fontSize: 12, color: _controller.peerTypingId == widget.peerId ? Colors.green : Colors.white54),
            ),
          ],
        ),
      ),
      body: Column(
        children: [
          const OfflineSyncBanner(),
          Expanded(
            child: ListView.builder(
              controller: _scrollController,
              padding: const EdgeInsets.all(16),
              itemCount: _controller.messages.length,
              itemBuilder: (context, index) {
                final msg = _controller.messages[index];
                return _buildMessageBubble(msg);
              },
            ),
          ),
          _buildInputArea(),
        ],
      ),
    );
  }

  Widget _buildMessageBubble(ZymiMessage msg) {
    final isMine = msg.isMine;
    if (msg.type == 'media') {
      return Align(
        alignment: isMine ? Alignment.centerRight : Alignment.centerLeft,
        child: MediaMessageBubble(
          isMine: isMine,
          serverMetadata: msg.mediaMetadata,
          onRetry: () => _controller.retryMessage(msg.tempId ?? ''),
        ),
      );
    }

    return Align(
      alignment: isMine ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.symmetric(vertical: 4),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.75),
        decoration: BoxDecoration(
          color: isMine ? const Color(0xFF3B82F6) : const Color(0xFF1E293B), // Blue 500 : Slate 800
          borderRadius: BorderRadius.circular(16).copyWith(
            bottomRight: isMine ? const Radius.circular(0) : const Radius.circular(16),
            bottomLeft: !isMine ? const Radius.circular(0) : const Radius.circular(16),
          ),
        ),
        child: Column(
          crossAxisAlignment: isMine ? CrossAxisAlignment.end : CrossAxisAlignment.start,
          children: [
            Text(msg.content, style: const TextStyle(color: Colors.white, fontSize: 15)),
            const SizedBox(height: 4),
            Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  '${msg.createdAt.hour}:${msg.createdAt.minute.toString().padLeft(2, '0')}',
                  style: const TextStyle(color: Colors.white54, fontSize: 10),
                ),
                if (isMine) ...[
                  const SizedBox(width: 4),
                  MessageStatusIndicator(status: msg.status, isMine: true),
                ],
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildInputArea() {
    return Container(
      padding: const EdgeInsets.all(8),
      color: const Color(0xFF1e293b),
      child: Row(
        children: [
          IconButton(
            onPressed: () {
              // Placeholder for media picker
              _controller.sendMedia('/path/to/test/image.jpg', 'image');
            },
            icon: const Icon(Icons.attach_file, color: Colors.white54),
          ),
          Expanded(
            child: TextField(
              controller: _messageController,
              style: const TextStyle(color: Colors.white),
              decoration: const InputDecoration(
                hintText: 'Type a message...',
                hintStyle: TextStyle(color: Colors.white54),
                border: InputBorder.none,
                contentPadding: EdgeInsets.symmetric(horizontal: 16),
              ),
            ),
          ),
          IconButton(
            onPressed: _sendMessage,
            icon: const Icon(Icons.send, color: Colors.blueAccent),
          ),
        ],
      ),
    );
  }
}
