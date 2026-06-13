import 'dart:io';
import 'dart:convert';
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
import '../../../services/realtime/zymi_socket_client.dart';
import '../../call/call_launcher.dart';
import '../services/voice_recorder_service.dart';

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
  ChatController? _controller;
  final TextEditingController _messageController = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  final VoiceRecorderService _voiceRecorder = VoiceRecorderService();
  bool _isRecording = false;
  bool _isPeerOnline = false;
  String _currentUserId = '';

  @override
  void initState() {
    super.initState();
    _messageController.addListener(_onTextChanged);
    _init();
  }

  Future<void> _init() async {
    // Resolve real userId from persistent auth store
    final userId = await AuthService().getUserId() ?? 'me';
    if (!mounted) return;
    setState(() => _currentUserId = userId);
    _controller = ChatController(currentUserId: userId);
    _controller!.selectedUserId = widget.peerId;
    _controller!.init();
    _controller!.addListener(_onStateChanged);
    _initLoadHistory();
    // Mark conversation as read when screen opens
    _markConversationRead();
    // Bind peer presence
    _bindPresence();
  }

  Future<void> _initLoadHistory() async {
    final token = await AuthService().getToken();
    _controller!.loadHistory(token: token);
  }

  void _bindPresence() {
    ZymiSocketClient().onSafe('user-online', (data) {
      if (data is Map<String, dynamic> &&
          data['userId']?.toString() == widget.peerId) {
        if (mounted) setState(() => _isPeerOnline = true);
      }
    });
    ZymiSocketClient().onSafe('user-offline', (data) {
      if (data is Map<String, dynamic> &&
          data['userId']?.toString() == widget.peerId) {
        if (mounted) setState(() => _isPeerOnline = false);
      }
    });
  }

  Future<void> _markConversationRead() async {
    try {
      final token = await AuthService().getToken();
      if (token == null) return;
      final ids = [_currentUserId, widget.peerId]..sort();
      final conversationId = ids.join('_');
      await MessageService.markConversationRead(conversationId, token);
    } catch (_) {}
  }

  @override
  void dispose() {
    _messageController.removeListener(_onTextChanged);
    if (_currentUserId.isNotEmpty) {
      _controller!.removeListener(_onStateChanged);
    }
    _messageController.dispose();
    _scrollController.dispose();
    _voiceRecorder.dispose();
    ZymiSocketClient().offSafe('user-online');
    ZymiSocketClient().offSafe('user-offline');
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
    _controller!.sendMessage(_messageController.text.trim());
    _messageController.clear();
    FocusScope.of(context).unfocus();
  }

  @override
  Widget build(BuildContext context) {
    final ctrl = _controller;
    if (ctrl == null) {
      return const Scaffold(
        backgroundColor: Color(0xFF0f172a),
        body: Center(child: CircularProgressIndicator()),
      );
    }
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
                  ctrl.peerTypingId == widget.peerId
                      ? 'typing...'
                      : _isPeerOnline
                          ? 'online'
                          : 'offline',
                  style: TextStyle(
                    fontSize: 12,
                    color: ctrl.peerTypingId == widget.peerId
                        ? Colors.green
                        : _isPeerOnline
                            ? Colors.green
                            : Colors.white38,
                  ),
                ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.call_outlined, color: ZymiColors.primary),
            onPressed: () => CallLauncher.startCall(context, peerId: widget.peerId, peerName: widget.peerName),
          ),
          IconButton(
            icon: const Icon(Icons.videocam_outlined, color: ZymiColors.primary),
            onPressed: () => CallLauncher.startCall(context, peerId: widget.peerId, peerName: widget.peerName, isVideo: true),
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
              itemCount: ctrl.messages.length,
              itemBuilder: (context, index) {
                final msg = ctrl.messages[index];
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
    _controller!.loadHistory(token: token);
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
    _controller!.loadHistory(token: token);
  }

  void _openMap(String coords) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('Location: $coords'),
        duration: const Duration(seconds: 3),
      ),
    );
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
            onRetry: () => _controller!.retryMessage(msg.tempId ?? ''),
          ),
        ),
      );
    }

    if (msg.type == 'contact') {
      String name = 'Unknown Contact';
      String phone = '';
      try {
        if (msg.content.startsWith('{')) {
          final data = jsonDecode(msg.content);
          name = data['username'] ?? data['name'] ?? 'Unknown Contact';
          phone = data['phone'] ?? '';
        } else {
          final parts = msg.content.replaceFirst('Contact: ', '').split(' (');
          name = parts[0];
          if (parts.length > 1) {
            phone = parts[1].replaceAll(')', '');
          }
        }
      } catch (_) {
        name = msg.content;
      }

      return Align(
        alignment: isMine ? Alignment.centerRight : Alignment.centerLeft,
        child: GestureDetector(
          onLongPress: isMine ? () => _showMessageContextMenu(msg) : null,
          child: Container(
            margin: const EdgeInsets.symmetric(vertical: 4),
            padding: const EdgeInsets.all(12),
            width: 240,
            decoration: BoxDecoration(
              color: isMine ? const Color(0xFF1E40AF) : const Color(0xFF1E293B),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: ZymiColors.primary.withValues(alpha: 0.3)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    CircleAvatar(
                      radius: 20,
                      backgroundColor: ZymiColors.primary.withValues(alpha: 0.2),
                      child: const Icon(Icons.person, color: ZymiColors.primary),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(name, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14)),
                          if (phone.isNotEmpty)
                            Text(phone, style: const TextStyle(color: Colors.white54, fontSize: 12)),
                        ],
                      ),
                    ),
                  ],
                ),
                const Divider(color: Colors.white12, height: 16),
                Row(
                  mainAxisAlignment: MainAxisAlignment.end,
                  children: [
                    TextButton.icon(
                      style: TextButton.styleFrom(
                        padding: EdgeInsets.zero,
                        minimumSize: const Size(50, 30),
                        tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                      ),
                      onPressed: () {
                        if (phone.isNotEmpty) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(content: Text('Calling $name ($phone)...')),
                          );
                        }
                      },
                      icon: const Icon(Icons.phone, size: 14, color: ZymiColors.success),
                      label: const Text('Call', style: TextStyle(color: ZymiColors.success, fontSize: 12)),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      );
    }

    if (msg.type == 'location') {
      final coords = msg.content.replaceAll('Current Location: ', '').trim();
      return Align(
        alignment: isMine ? Alignment.centerRight : Alignment.centerLeft,
        child: GestureDetector(
          onTap: () => _openMap(coords),
          onLongPress: isMine ? () => _showMessageContextMenu(msg) : null,
          child: Container(
            margin: const EdgeInsets.symmetric(vertical: 4),
            width: 220,
            decoration: BoxDecoration(
              color: isMine ? const Color(0xFF3B82F6) : const Color(0xFF1E293B),
              borderRadius: BorderRadius.circular(16),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                ClipRRect(
                  borderRadius: const BorderRadius.vertical(top: Radius.circular(16)),
                  child: Container(
                    height: 100,
                    color: const Color(0xFF0F172A),
                    child: Center(
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(Icons.map, color: ZymiColors.primary, size: 32),
                          const SizedBox(height: 4),
                          Text(
                            coords,
                            style: const TextStyle(color: Colors.white54, fontSize: 11),
                            textAlign: TextAlign.center,
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
                const Padding(
                  padding: EdgeInsets.all(10),
                  child: Row(
                    children: [
                      Icon(Icons.location_on, size: 16, color: Colors.white70),
                      SizedBox(width: 6),
                      Expanded(
                        child: Text('Location', style: TextStyle(color: Colors.white, fontSize: 13)),
                      ),
                      Icon(Icons.open_in_new, size: 14, color: Colors.white38),
                    ],
                  ),
                ),
              ],
            ),
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
          _controller!.sendMedia(path, type);
        },
        onActionSelected: (content, type) {
          _controller!.sendMessage(content, type: type);
        },
      ),
    );
  }

  Future<void> _startVoiceRecord() async {
    if (_isRecording) return;
    final path = await _voiceRecorder.startRecording();
    if (path != null) {
      setState(() => _isRecording = true);
    }
  }

  Future<void> _stopVoiceRecord() async {
    if (!_isRecording) return;
    final path = await _voiceRecorder.stopRecording();
    setState(() => _isRecording = false);
    if (path != null) {
      final file = File(path);
      if (await file.exists()) {
        await _controller!.sendMedia(path, 'audio');
      }
    }
    // Safety cleanup: remove temp file if still exists
    if (path != null) {
      try {
        final f = File(path);
        if (await f.exists()) await f.delete();
      } catch (_) {}
    }
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
                : GestureDetector(
                    key: const ValueKey('mic'),
                    onLongPressStart: (_) => _startVoiceRecord(),
                    onLongPressEnd: (_) => _stopVoiceRecord(),
                    child: Icon(
                      _isRecording ? Icons.mic : Icons.mic_none_outlined,
                      color: _isRecording ? Colors.redAccent : ZymiColors.textMuted,
                    ),
                  ),
          ),
        ],
      ),
    );
  }
}
