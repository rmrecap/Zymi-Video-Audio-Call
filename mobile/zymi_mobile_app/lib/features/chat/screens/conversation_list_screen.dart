import 'package:flutter/material.dart';
import '../../../core/navigation/zymi_routes.dart';
import '../../../core/theme/zymi_brand_colors.dart';
import '../widgets/unread_badge.dart';

class ConversationListScreen extends StatelessWidget {
  const ConversationListScreen({super.key});

  @override
  Widget build(BuildContext context) {
    // Placeholder data for conversation list (In production, this would come from a provider/controller)
    final conversations = [
      {'userId': 'user_web', 'name': 'Web User', 'lastMessage': 'Hello!', 'online': true, 'unread': 2},
      {'userId': 'user_2', 'name': 'User 2', 'lastMessage': 'See you', 'online': false, 'unread': 0},
      {'userId': 'user_3', 'name': 'User 3', 'lastMessage': 'Call me', 'online': true, 'unread': 5},
    ];

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
      body: ListView.builder(
        itemCount: conversations.length,
        itemBuilder: (context, index) {
          final conv = conversations[index];
          final isOnline = conv['online'] as bool;
          final unread = conv['unread'] as int;

          return ListTile(
            leading: Stack(
              children: [
                const CircleAvatar(
                  backgroundColor: Color(0xFF334155),
                  child: Icon(Icons.person, color: Colors.white70),
                ),
                if (isOnline)
                  Positioned(
                    bottom: 0,
                    right: 0,
                    child: Container(
                      width: 12,
                      height: 12,
                      decoration: BoxDecoration(
                        color: Colors.green,
                        shape: BoxShape.circle,
                        border: Border.all(color: const Color(0xFF0f172a), width: 2),
                      ),
                    ),
                  ),
              ],
            ),
            title: Text(conv['name'] as String, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w500)),
            subtitle: Text(conv['lastMessage'] as String, style: const TextStyle(color: Colors.white54, fontSize: 13)),
            trailing: UnreadBadge(count: unread),
            onTap: () {
              Navigator.pushNamed(
                context, 
                ZymiRoutes.chat,
                arguments: {'peerId': conv['userId'], 'peerName': conv['name']},
              );
            },
          );
        },
      ),
    );
  }
}
