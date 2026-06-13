import 'dart:async';
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import '../../../core/config/app_config.dart';
import '../../../core/navigation/zymi_routes.dart';
import '../../../core/theme/zymi_brand_colors.dart';
import '../../../services/api/auth_service.dart';
import '../../../services/realtime/zymi_socket_client.dart';
import '../widgets/unread_badge.dart';

class ConversationListScreen extends StatefulWidget {
  const ConversationListScreen({super.key});

  @override
  State<ConversationListScreen> createState() => _ConversationListScreenState();
}

class _ConversationListScreenState extends State<ConversationListScreen> {
  List<Map<String, dynamic>> _conversations = [];
  bool _isLoading = true;
  StreamSubscription<ZymiSocketStatus>? _statusSub;
  StreamSubscription<dynamic>? _conversationSub;
  // Track online state locally so socket events update the dot in real-time
  final Set<String> _onlineUserIds = {};

  @override
  void initState() {
    super.initState();
    _fetchConversations();
    _statusSub = ZymiSocketClient().statusStream.listen((status) {
      if (status == ZymiSocketStatus.connected) {
        _fetchConversations();
        _listenConversationUpdates();
      }
    });
    _listenConversationUpdates();
    _listenPresenceEvents();
  }

  void _listenConversationUpdates() {
    _conversationSub?.cancel();
    ZymiSocketClient().onSafe('conversation-update', (_) {
      _fetchConversations();
    });
  }

  void _listenPresenceEvents() {
    ZymiSocketClient().onSafe('user-online', (data) {
      if (data is Map<String, dynamic>) {
        final uid = data['userId']?.toString() ?? '';
        if (uid.isEmpty) return;
        setState(() {
          _onlineUserIds.add(uid);
          for (final c in _conversations) {
            if (c['peer_id']?.toString() == uid) c['is_online'] = true;
          }
        });
      }
    });

    ZymiSocketClient().onSafe('user-offline', (data) {
      if (data is Map<String, dynamic>) {
        final uid = data['userId']?.toString() ?? '';
        if (uid.isEmpty) return;
        setState(() {
          _onlineUserIds.remove(uid);
          for (final c in _conversations) {
            if (c['peer_id']?.toString() == uid) c['is_online'] = false;
          }
        });
      }
    });
  }

  @override
  void dispose() {
    _statusSub?.cancel();
    _conversationSub?.cancel();
    ZymiSocketClient().offSafe('conversation-update');
    ZymiSocketClient().offSafe('user-online');
    ZymiSocketClient().offSafe('user-offline');
    super.dispose();
  }

  Future<void> _fetchConversations() async {
    try {
      final token = await AuthService().getToken();
      if (token == null) return;
      final res = await http.get(
        Uri.parse('${AppConfig.apiUrl}/api/messages/conversations'),
        headers: {'Authorization': 'Bearer $token'},
      ).timeout(const Duration(seconds: 15));
      if (mounted) {
        setState(() {
          _conversations = res.statusCode == 200
              ? (jsonDecode(res.body) as List).map((e) => Map<String, dynamic>.from(e)).toList()
              : [];
          _isLoading = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0f172a),
      appBar: AppBar(
        title: const Text('Conversations', style: TextStyle(color: Colors.white)),
        backgroundColor: const Color(0xFF1e293b),
        iconTheme: const IconThemeData(color: Colors.white),
        actions: [
          IconButton(
            icon: const Icon(Icons.groups_outlined, color: ZymiColors.primary),
            tooltip: 'Groups',
            onPressed: () => Navigator.pushNamed(context, ZymiRoutes.groupList),
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: ZymiColors.primary))
          : _conversations.isEmpty
              ? const Center(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Icons.chat_bubble_outline, size: 48, color: Colors.white24),
                      SizedBox(height: 16),
                      Text('No conversations yet', style: TextStyle(color: Colors.white38, fontSize: 16)),
                    ],
                  ),
                )
              : RefreshIndicator(
                  onRefresh: _fetchConversations,
                  color: ZymiColors.primary,
                  child: ListView.separated(
                    padding: const EdgeInsets.symmetric(vertical: 8),
                    itemCount: _conversations.length,
                    separatorBuilder: (_, __) => Divider(height: 1, color: Colors.white.withValues(alpha: 0.05)),
                    itemBuilder: (context, index) {
                      final conv = _conversations[index];
                      final peerId = conv['peer_id']?.toString() ?? '';
                      final peerName = conv['username'] ?? 'Unknown';
                      final lastMessage = conv['last_message'] ?? '';
                      final unread = conv['unread_count'] ?? 0;
                      // Merge API-reported status with live socket events
                      final isOnline = _onlineUserIds.contains(peerId) || (conv['is_online'] ?? false);

                      return ListTile(
                        leading: Stack(
                          children: [
                            CircleAvatar(
                              backgroundColor: ZymiColors.primary,
                              child: Text(
                                peerName.isNotEmpty ? peerName[0].toUpperCase() : '?',
                                style: const TextStyle(color: Colors.white),
                              ),
                            ),
                            if (isOnline)
                              Positioned(
                                right: 2,
                                bottom: 2,
                                child: Container(
                                  width: 12,
                                  height: 12,
                                  decoration: const BoxDecoration(
                                    color: ZymiColors.success,
                                    shape: BoxShape.circle,
                                  ),
                                ),
                              ),
                          ],
                        ),
                        title: Text(peerName, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w500)),
                        subtitle: Text(
                          lastMessage,
                          style: const TextStyle(color: Colors.white38, fontSize: 13),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                        trailing: unread > 0 ? UnreadBadge(count: unread) : null,
                        onTap: () {
                          Navigator.pushNamed(context, ZymiRoutes.chat, arguments: {
                            'peerId': peerId,
                            'peerName': peerName,
                          });
                        },
                      );
                    },
                  ),
                ),
    );
  }
}
