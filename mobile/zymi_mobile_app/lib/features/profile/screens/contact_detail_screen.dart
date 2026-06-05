import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../widgets/profile_action_button.dart';
import '../widgets/profile_media_tabs.dart';
import '../widgets/profile_overflow_menu.dart';
import '../../../core/navigation/zymi_routes.dart';
import '../../../core/theme/zymi_brand_colors.dart';

class ContactDetailScreen extends StatefulWidget {
  final String userId;
  final String username;

  const ContactDetailScreen({
    super.key,
    required this.userId,
    required this.username,
  });

  @override
  State<ContactDetailScreen> createState() => _ContactDetailScreenState();
}

class _ContactDetailScreenState extends State<ContactDetailScreen> {
  bool _isMuted = false;

  void _copyToClipboard(String text) {
    Clipboard.setData(ClipboardData(text: text));
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Copied to clipboard')),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0f172a),
      body: CustomScrollView(
        slivers: [
          _buildSliverAppBar(),
          SliverToBoxAdapter(
            child: Column(
              children: [
                const SizedBox(height: 24),
                _buildActionRow(),
                const SizedBox(height: 32),
                _buildInfoSection(),
                const SizedBox(height: 24),
                ProfileMediaTabs(userId: widget.userId),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSliverAppBar() {
    return SliverAppBar(
      expandedHeight: 300,
      pinned: true,
      backgroundColor: const Color(0xFF1e293b),
      actions: [
        ProfileOverflowMenu(
          onBlock: () => ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('User blocked'))),
          onReport: () => ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('User reported'))),
          onShare: () => ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Contact shared'))),
        ),
      ],
      flexibleSpace: FlexibleSpaceBar(
        title: Text(
          widget.username,
          style: const TextStyle(
            color: Colors.white,
            fontWeight: FontWeight.bold,
            shadows: [Shadow(color: Colors.black45, blurRadius: 10)],
          ),
        ),
        background: Stack(
          fit: StackFit.expand,
          children: [
            Container(
              color: const Color(0xFF1e293b),
              child: const Icon(Icons.person, size: 100, color: Colors.white10),
            ),
            Container(
              decoration: const BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [Colors.transparent, Color(0xFF0f172a)],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildActionRow() {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceEvenly,
      children: [
        ProfileActionButton(
          icon: Icons.chat_bubble_outline,
          label: 'Message',
          onTap: () => Navigator.pop(context),
        ),
        ProfileActionButton(
          icon: _isMuted ? Icons.notifications_off_outlined : Icons.notifications_none_outlined,
          label: _isMuted ? 'Unmute' : 'Mute',
          onTap: () => setState(() => _isMuted = !_isMuted),
          color: _isMuted ? Colors.orangeAccent : null,
        ),
        ProfileActionButton(
          icon: Icons.call_outlined,
          label: 'Call',
          onTap: () {
            Navigator.pushNamed(context, ZymiRoutes.callPreflight, arguments: {
              'peerId': widget.userId,
              'peerName': widget.username,
              'isVideo': false,
            });
          },
        ),
        ProfileActionButton(
          icon: Icons.videocam_outlined,
          label: 'Video',
          onTap: () {
            Navigator.pushNamed(context, ZymiRoutes.callPreflight, arguments: {
              'peerId': widget.userId,
              'peerName': widget.username,
              'isVideo': true,
            });
          },
        ),
      ],
    );
  }

  Widget _buildInfoSection() {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: const Color(0xFF1e293b),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: Colors.white.withValues(alpha: 0.05)),
      ),
      child: Column(
        children: [
          _buildInfoItem(
            icon: Icons.phone_android,
            title: 'Phone',
            value: '+880 1XXX XXXXXX',
            onTap: () => _copyToClipboard('+8801XXXXXXXXX'),
          ),
          const Divider(height: 32, color: Colors.white10),
          _buildInfoItem(
            icon: Icons.alternate_email,
            title: 'Username',
            value: '@${widget.username.toLowerCase()}',
            onTap: () => _copyToClipboard('@${widget.username.toLowerCase()}'),
          ),
        ],
      ),
    );
  }

  Widget _buildInfoItem({
    required IconData icon,
    required String title,
    required String value,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      child: Row(
        children: [
          Icon(icon, color: ZymiColors.primary, size: 20),
          const SizedBox(width: 16),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(title, style: const TextStyle(color: Colors.white38, fontSize: 11)),
              const SizedBox(height: 2),
              Text(value, style: const TextStyle(color: Colors.white, fontSize: 15)),
            ],
          ),
          const Spacer(),
          const Icon(Icons.copy, color: Colors.white10, size: 14),
        ],
      ),
    );
  }
}
