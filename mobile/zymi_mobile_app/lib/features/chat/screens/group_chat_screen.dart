import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import '../../../core/config/app_config.dart';
import '../../../core/theme/zymi_brand_colors.dart';
import '../../../services/api/auth_service.dart';
import '../../call/call_launcher.dart';

class GroupChatScreen extends StatefulWidget {
  final String groupId;
  final String groupName;

  const GroupChatScreen({super.key, required this.groupId, required this.groupName});

  @override
  State<GroupChatScreen> createState() => _GroupChatScreenState();
}

class _GroupChatScreenState extends State<GroupChatScreen> {
  final TextEditingController _msgController = TextEditingController();
  List<Map<String, dynamic>> _messages = [];
  final ScrollController _scrollController = ScrollController();

  @override
  void initState() {
    super.initState();
    _loadMessages();
  }

  @override
  void dispose() {
    _msgController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  Future<void> _loadMessages() async {
    final token = await AuthService().getToken();
    if (token == null) return;
    try {
      final res = await http.get(
        Uri.parse('${AppConfig.apiUrl}/api/groups/${widget.groupId}/messages'),
        headers: {'Authorization': 'Bearer $token'},
      );
      if (res.statusCode == 200 && mounted) {
        setState(() => _messages = (jsonDecode(res.body) as List).map((e) => Map<String, dynamic>.from(e)).toList());
      }
    } catch (_) {}
  }

  void _sendMessage() async {
    if (_msgController.text.trim().isEmpty) return;
    final token = await AuthService().getToken();
    if (token == null) return;
    try {
      await http.post(
        Uri.parse('${AppConfig.apiUrl}/api/groups/${widget.groupId}/messages'),
        headers: {'Authorization': 'Bearer $token', 'Content-Type': 'application/json'},
        body: jsonEncode({'content': _msgController.text.trim()}),
      );
      _msgController.clear();
      _loadMessages();
    } catch (_) {}
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0f172a),
      appBar: AppBar(
        backgroundColor: const Color(0xFF1e293b),
        title: Text(widget.groupName, style: const TextStyle(color: Colors.white)),
        actions: [
          IconButton(
            icon: const Icon(Icons.call_outlined, color: ZymiColors.success),
            tooltip: 'Group Audio Call',
            onPressed: () => _startGroupCall(false),
          ),
          IconButton(
            icon: const Icon(Icons.videocam_outlined, color: ZymiColors.purple),
            tooltip: 'Group Video Call',
            onPressed: () => _startGroupCall(true),
          ),
        ],
      ),
      body: Column(
        children: [
          Expanded(
            child: ListView.builder(
              controller: _scrollController,
              padding: const EdgeInsets.all(16),
              itemCount: _messages.length,
              itemBuilder: (context, index) {
                final msg = _messages[index];
                return Align(
                  alignment: Alignment.centerLeft,
                  child: Container(
                    margin: const EdgeInsets.symmetric(vertical: 4),
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                    decoration: BoxDecoration(
                      color: const Color(0xFF1E293B),
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(msg['sender_name'] ?? '', style: const TextStyle(color: ZymiColors.primary, fontSize: 12)),
                        const SizedBox(height: 2),
                        Text(msg['content'] ?? '', style: const TextStyle(color: Colors.white, fontSize: 15)),
                      ],
                    ),
                  ),
                );
              },
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
            decoration: const BoxDecoration(
              color: Color(0xFF1e293b),
              border: Border(top: BorderSide(color: Colors.white10)),
            ),
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _msgController,
                    style: const TextStyle(color: Colors.white),
                    decoration: const InputDecoration(
                      hintText: 'Type a message...',
                      hintStyle: TextStyle(color: Colors.white54),
                      border: InputBorder.none,
                    ),
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.send, color: ZymiColors.primary),
                  onPressed: _sendMessage,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  void _startGroupCall(bool isVideo) {
    CallLauncher.startGroupCall(context, groupId: widget.groupId, groupName: widget.groupName, isVideo: isVideo);
  }
}
