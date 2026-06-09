import 'package:flutter/material.dart';
import '../services/api/friend_service.dart';
import '../core/theme/zymi_brand_colors.dart';
import '../core/navigation/zymi_routes.dart';
import 'call/call_launcher.dart';

class FriendsListScreen extends StatefulWidget {
  const FriendsListScreen({super.key});

  @override
  State<FriendsListScreen> createState() => _FriendsListScreenState();
}

class _FriendsListScreenState extends State<FriendsListScreen> {
  final FriendService _friendService = FriendService();
  List<Map<String, dynamic>> _friends = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _fetchFriends();
  }

  Future<void> _fetchFriends() async {
    setState(() => _isLoading = true);
    try {
      final friends = await _friendService.getFriends();
      if (mounted) setState(() { _friends = friends; _isLoading = false; });
    } catch (_) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: ZymiColors.background,
      appBar: AppBar(
        backgroundColor: ZymiColors.surface,
        title: const Text('Contacts', style: TextStyle(color: Colors.white)),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: ZymiColors.primary))
          : _friends.isEmpty
              ? const Center(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Icons.people_outline, size: 64, color: ZymiColors.textMuted),
                      SizedBox(height: 16),
                      Text(
                        'No contacts yet',
                        style: TextStyle(color: ZymiColors.textMuted, fontSize: 16),
                      ),
                      SizedBox(height: 8),
                      Text(
                        'Accept friend requests to see them here',
                        style: TextStyle(color: ZymiColors.textMuted, fontSize: 13),
                      ),
                    ],
                  ),
                )
              : RefreshIndicator(
                  onRefresh: _fetchFriends,
                  child: ListView.builder(
                    itemCount: _friends.length,
                    itemBuilder: (context, index) {
                      final friend = _friends[index];
                      final userId = friend['id']?.toString() ?? '';
                      final username = friend['username'] ?? 'Unknown';
                      final isOnline = friend['is_online'] == true;

                      return Card(
                        color: ZymiColors.card,
                        margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                        child: InkWell(
                          borderRadius: BorderRadius.circular(12),
                          onTap: () {
                            Navigator.pushNamed(context, ZymiRoutes.chat, arguments: {
                              'peerId': userId,
                              'peerName': username,
                            });
                          },
                          child: Padding(
                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                            child: Row(
                              children: [
                                Stack(
                                  children: [
                                    CircleAvatar(
                                      radius: 24,
                                      backgroundColor: ZymiColors.primary,
                                      child: Text(
                                        username.isNotEmpty ? username[0].toUpperCase() : '?',
                                        style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
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
                                            border: Border.fromBorderSide(BorderSide(color: ZymiColors.card, width: 2)),
                                          ),
                                        ),
                                      ),
                                  ],
                                ),
                                const SizedBox(width: 16),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        username,
                                        style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.w500),
                                      ),
                                      const SizedBox(height: 2),
                                      Text(
                                        isOnline ? 'Online' : 'Offline',
                                        style: TextStyle(
                                          color: isOnline ? ZymiColors.success : ZymiColors.textMuted,
                                          fontSize: 12,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                                IconButton(
                                  icon: const Icon(Icons.chat_bubble_outline, color: ZymiColors.primary, size: 20),
                                  tooltip: 'Chat',
                                  onPressed: () {
                                    Navigator.pushNamed(context, ZymiRoutes.chat, arguments: {
                                      'peerId': userId,
                                      'peerName': username,
                                    });
                                  },
                                ),
                                IconButton(
                                  icon: const Icon(Icons.call_outlined, color: ZymiColors.success, size: 20),
                                  tooltip: 'Audio Call',
                                  onPressed: () => CallLauncher.startCall(context, peerId: userId, peerName: username),
                                ),
                                IconButton(
                                  icon: const Icon(Icons.videocam_outlined, color: ZymiColors.purple, size: 20),
                                  tooltip: 'Video Call',
                                  onPressed: () => CallLauncher.startCall(context, peerId: userId, peerName: username, isVideo: true),
                                ),
                              ],
                            ),
                          ),
                        ),
                      );
                    },
                  ),
                ),
    );
  }
}
