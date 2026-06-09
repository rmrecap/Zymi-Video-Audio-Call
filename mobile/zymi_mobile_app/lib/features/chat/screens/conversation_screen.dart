import 'package:flutter/material.dart';
import '../controllers/chat_controller.dart';
import '../models/zymi_message.dart';
import '../widgets/message_status_indicator.dart';
import '../widgets/offline_sync_banner.dart';
import '../widgets/media_message_bubble.dart';
import '../widgets/attachment_hub_sheet.dart';
import '../../../core/navigation/zymi_routes.dart';
import '../../../core/theme/zymi_brand_colors.dart';
import '../../../services/api/message_service.dart';
import '../../../services/api/auth_service.dart';

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
    _messageController.addListener(_onTextChanged);
    _controller = ChatController(currentUserId: 'me');
    _controller.selectedUserId = widget.peerId;
    _controller.init();
    _controller.addListener(_onStateChanged);
    _controller.loadHistory();
  }

  @override
  void dispose() {
    _messageController.removeListener(_onTextChanged);
    _controller.removeListener(_onStateChanged);
    _messageController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  void _onTextChanged() {
    if (mounted) setState(() {});
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
    FocusScope.of(context).unfocus();
  }

  @override
  Widget build(BuildContext context) {
    final hasText = _messageController.text.trim().isNotEmpty;

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
        actions: [
          IconButton(
            icon: const Icon(Icons.call_outlined, color: ZymiColors.primary),
            onPressed: () {
               Navigator.pushNamed(context, ZymiRoutes.callPreflight, arguments: {
                 'peerId': widget.peerId,
                 'peerName': widget.peerName,
                 'isVideo': false,
               });
            },
          ),
          IconButton(
            icon: const Icon(Icons.videocam_outlined, color: ZymiColors.primary),
            onPressed: () {
               Navigator.pushNamed(context, ZymiRoutes.callPreflight, arguments: {
                 'peerId': widget.peerId,
                 'peerName': widget.peerName,
                 'isVideo': true,
               });
            },
          ),
          IconButton(
            icon: const Icon(Icons.more_vert),
            onPressed: () {
               Navigator.pushNamed(context, ZymiRoutes.contactDetail, arguments: {
                 'userId': widget.peerId,
                 'username': widget.peerName,
               });
            },
          ),
        ],
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
          _buildInputArea(hasText),
        ],
      ),
    );
  }

  void _showMessageContextMenu(ZymiMessage msg) {
    if (!msg.isMine) return;
    showModalBottomSheet(
      context: context,
      backgroundColor: ZymiColors.surface,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (ctx) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 8),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              ListTile(
                leading: const Icon(Icons.edit, color: ZymiColors.primary),
                title: const Text('Edit Message', style: TextStyle(color: Colors.white)),
                onTap: () {
                  Navigator.pop(ctx);
                  _showEditDialog(msg);
                },
              ),
              ListTile(
                leading: const Icon(Icons.delete_outline, color: ZymiColors.danger),
                title: const Text('Delete Message', style: TextStyle(color: Colors.white)),
                onTap: () {
                  Navigator.pop(ctx);
                  _deleteMessage(msg);
                },
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _showEditDialog(ZymiMessage msg) {
    final editController = TextEditingController(text: msg.content);
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: ZymiColors.surface,
        title: const Text('Edit Message', style: TextStyle(color: Colors.white)),
        content: TextField(
          controller: editController,
          style: const TextStyle(color: Colors.white),
          decoration: const InputDecoration(hintText: 'Edit your message...'),
          maxLines: 3,
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel', style: TextStyle(color: ZymiColors.textMuted))),
          TextButton(
            onPressed: () async {
              Navigator.pop(ctx);
              final token = await AuthService().getToken();
              if (token == null) return;
              await MessageService.editMessage(msg.id!, editController.text.trim(), token);
              _controller.loadHistory();
            },
            child: const Text('Save', style: TextStyle(color: ZymiColors.primary)),
          ),
        ],
      ),
    );
  }

  void _deleteMessage(ZymiMessage msg) async {
    final token = await AuthService().getToken();
    if (token == null) return;
    await MessageService.deleteMessage(msg.id!, token);
    _controller.loadHistory();
  }

  Widget _buildMessageBubble(ZymiMessage msg) {
    final isMine = msg.isMine;
    if (msg.type == 'media') {
      return GestureDetector(
        onLongPress: isMine ? () => _showMessageContextMenu(msg) : null,
        child: Align(
          alignment: isMine ? Alignment.centerRight : Alignment.centerLeft,
          child: MediaMessageBubble(
            isMine: isMine,
            serverMetadata: msg.mediaMetadata,
            onRetry: () => _controller.retryMessage(msg.tempId ?? ''),
          ),
        ),
      );
    }

    return Align(
      alignment: isMine ? Alignment.centerRight : Alignment.centerLeft,
      child: GestureDetector(
        onLongPress: isMine ? () => _showMessageContextMenu(msg) : null,
        child: Container(
          margin: const EdgeInsets.symmetric(vertical: 4),
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
          constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.75),
          decoration: BoxDecoration(
            color: isMine ? const Color(0xFF3B82F6) : const Color(0xFF1E293B),
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
      ),
    );
  }

  void _showAttachmentHub() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => AttachmentHubSheet(
        onMediaSelected: (path, type) {
          _controller.sendMedia(path, type);
        },
        onActionSelected: (content, type) {
          _controller.sendMessage(content, type: type);
        },
      ),
    );
  }

  Widget _buildInputArea(bool hasText) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
      decoration: const BoxDecoration(
        color: Color(0xFF1e293b),
        border: Border(top: BorderSide(color: Colors.white10)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          IconButton(
            onPressed: hasText ? null : () {
              ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Emoji picker coming soon')));
            },
            icon: const Icon(Icons.sentiment_satisfied_alt_outlined, color: Colors.white54),
          ),
          IconButton(
            onPressed: _showAttachmentHub,
            icon: const Icon(Icons.attach_file, color: Colors.white54),
          ),
          Expanded(
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 12),
              decoration: BoxDecoration(
                color: const Color(0xFF0f172a),
                borderRadius: BorderRadius.circular(24),
              ),
              child: TextField(
                controller: _messageController,
                maxLines: 5,
                minLines: 1,
                textInputAction: TextInputAction.send,
                onSubmitted: (_) => _sendMessage(),
                style: const TextStyle(color: Colors.white),
                decoration: const InputDecoration(
                  hintText: 'Type a message...',
                  hintStyle: TextStyle(color: Colors.white54),
                  border: InputBorder.none,
                ),
              ),
            ),
          ),
          const SizedBox(width: 8),
          AnimatedSwitcher(
            duration: const Duration(milliseconds: 200),
            child: hasText
                ? Container(
                    key: const ValueKey('send'),
                    decoration: const BoxDecoration(
                      color: ZymiColors.primary,
                      shape: BoxShape.circle,
                    ),
                    child: IconButton(
                      onPressed: _sendMessage,
                      icon: const Icon(Icons.send, color: Colors.white),
                    ),
                  )
                : IconButton(
                    key: const ValueKey('mic'),
                    onPressed: () {
                      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Voice recording coming soon')));
                    },
                    icon: const Icon(Icons.mic_none_outlined, color: ZymiColors.primary),
                  ),
          ),
        ],
      ),
    );
  }
}
