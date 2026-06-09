import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../../services/api/profile_service.dart';
import '../../../services/api/auth_service.dart';
import '../../../services/api/gamification_service.dart';
import '../../../core/navigation/zymi_routes.dart';
import '../../../core/widgets/skeleton_placeholder.dart';
import '../../../core/theme/zymi_brand_colors.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  final _profileService = ProfileService();
  final _authService = AuthService();
  final _gamificationService = GamificationService();
  final _statusController = TextEditingController();
  final _displayNameController = TextEditingController();
  
  Map<String, dynamic>? _profile;
  Map<String, dynamic>? _gamification;
  List<Map<String, dynamic>> _badges = [];
  List<Map<String, dynamic>> _achievements = [];
  bool _isLoading = true;
  bool _isEditingStatus = false;
  bool _isEditingName = false;

  @override
  void initState() {
    super.initState();
    _loadProfile();
  }

  @override
  void dispose() {
    _statusController.dispose();
    _displayNameController.dispose();
    super.dispose();
  }

  Future<void> _loadProfile() async {
    setState(() => _isLoading = true);
    final user = await _authService.getMe();
    if (user != null) {
      final gamification = await _gamificationService.getPoints();
      final badges = await _gamificationService.getBadges();
      final achievements = await _gamificationService.getAchievements();
      if (mounted) {
        setState(() {
          _profile = user;
          _gamification = gamification;
          _badges = badges;
          _achievements = achievements;
          _statusController.text = user['status_text'] ?? '';
          _displayNameController.text = user['display_name'] ?? user['username'] ?? '';
          _isLoading = false;
        });
      }
    }
  }

  Future<void> _updateProfile() async {
    if (_profile == null) return;
    
    final result = await _profileService.updateProfile(_profile!['id'].toString(), {
      'displayName': _displayNameController.text,
      'statusText': _statusController.text,
    });

    if (result['success']) {
      if (!mounted) return;
      setState(() {
        _isEditingStatus = false;
        _isEditingName = false;
        _profile!['profile_completion'] = result['profileCompletion'];
      });
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Profile updated successfully')),
      );
    }
  }

  void _copyToClipboard(String text) {
    Clipboard.setData(ClipboardData(text: text));
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Copied to clipboard')),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const ProfileSkeleton();
    }

    return Scaffold(
      backgroundColor: ZymiColors.background,
      body: SafeArea(
        child: SingleChildScrollView(
          physics: const BouncingScrollPhysics(),
          padding: const EdgeInsets.all(24),
          child: Column(
            children: [
              _buildAvatarSection(),
              const SizedBox(height: 32),
              _buildInfoCard(),
              const SizedBox(height: 24),
              _buildVerificationSection(),
              const SizedBox(height: 24),
              _buildGamificationPanel(),
              const SizedBox(height: 32),
              _buildActionButtons(),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildAvatarSection() {
    return Column(
      children: [
        Stack(
          children: [
            Container(
              padding: const EdgeInsets.all(4),
              decoration: const BoxDecoration(
                shape: BoxShape.circle,
                gradient: LinearGradient(colors: [ZymiColors.primary, ZymiColors.purple]),
              ),
              child: CircleAvatar(
                radius: 60,
                backgroundColor: const Color(0xFF1e293b),
                backgroundImage: _profile?['avatar'] != null 
                    ? NetworkImage(_profile!['avatar']) 
                    : null,
                child: _profile?['avatar'] == null 
                    ? const Icon(Icons.person, size: 60, color: Colors.white24) 
                    : null,
              ),
            ),
            Positioned(
              bottom: 0,
              right: 0,
              child: GestureDetector(
                onTap: () {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Image picker coming soon (local storage policy)')),
                  );
                },
                child: Container(
                  padding: const EdgeInsets.all(8),
                  decoration: const BoxDecoration(color: ZymiColors.primary, shape: BoxShape.circle),
                  child: const Icon(Icons.camera_alt, color: Colors.white, size: 20),
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 16),
        if (!_isEditingName)
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(
                _displayNameController.text,
                style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: Colors.white),
              ),
              IconButton(
                icon: const Icon(Icons.edit, size: 16, color: Colors.white54),
                onPressed: () => setState(() => _isEditingName = true),
              ),
            ],
          )
        else
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              SizedBox(
                width: 200,
                child: TextField(
                  controller: _displayNameController,
                  style: const TextStyle(color: Colors.white, fontSize: 20),
                  decoration: const InputDecoration(isDense: true),
                ),
              ),
              IconButton(
                icon: const Icon(Icons.check, color: Colors.green),
                onPressed: _updateProfile,
              ),
            ],
          ),
      ],
    );
  }

  Widget _buildInfoCard() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: const Color(0xFF1e293b),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.white.withValues(alpha: 0.05)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('STATUS', style: TextStyle(color: Colors.white38, fontSize: 11, letterSpacing: 1.5)),
          const SizedBox(height: 8),
          if (!_isEditingStatus)
            GestureDetector(
              onTap: () => setState(() => _isEditingStatus = true),
              child: Text(
                _statusController.text.isEmpty ? 'Set a status...' : _statusController.text,
                style: TextStyle(
                  color: _statusController.text.isEmpty ? Colors.white24 : Colors.white70,
                  fontSize: 15,
                  fontStyle: _statusController.text.isEmpty ? FontStyle.italic : null,
                ),
              ),
            )
          else
            Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _statusController,
                    style: const TextStyle(color: Colors.white70),
                    decoration: const InputDecoration(hintText: 'What\'s on your mind?'),
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.check, color: Colors.green),
                  onPressed: _updateProfile,
                ),
              ],
            ),
          const Divider(height: 32, color: Colors.white10),
          const Text('PHONE', style: TextStyle(color: Colors.white38, fontSize: 11, letterSpacing: 1.5)),
          const SizedBox(height: 8),
          GestureDetector(
            onTap: () => _copyToClipboard(_profile?['phone_normalized'] ?? 'Not set'),
            child: Row(
              children: [
                const Icon(Icons.phone_android, size: 18, color: ZymiColors.primary),
                const SizedBox(width: 12),
                Text(
                  _profile?['phone_normalized'] ?? 'Not set',
                  style: const TextStyle(color: Colors.white, fontSize: 16),
                ),
                const Spacer(),
                const Icon(Icons.copy, size: 14, color: Colors.white24),
              ],
            ),
          ),
          const Divider(height: 32, color: Colors.white10),
          const Text('ACCOUNT TYPE', style: TextStyle(color: Colors.white38, fontSize: 11, letterSpacing: 1.5)),
          const SizedBox(height: 8),
          Row(
            children: [
              const Icon(Icons.verified_user, size: 18, color: Colors.purpleAccent),
              const SizedBox(width: 12),
              Text(
                (_profile?['role'] ?? 'User').toUpperCase(),
                style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildVerificationSection() {
    final completion = _profile?['profile_completion'] ?? 40;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text('Profile Completion', style: TextStyle(color: Colors.white70, fontWeight: FontWeight.bold)),
            Text('$completion%', style: const TextStyle(color: ZymiColors.primary, fontWeight: FontWeight.bold)),
          ],
        ),
        const SizedBox(height: 12),
        LinearProgressIndicator(
          value: completion / 100,
          backgroundColor: Colors.white10,
          valueColor: const AlwaysStoppedAnimation<Color>(ZymiColors.primary),
          borderRadius: BorderRadius.circular(10),
          minHeight: 8,
        ),
        const SizedBox(height: 20),
        ElevatedButton.icon(
          onPressed: () => Navigator.pushNamed(context, ZymiRoutes.profileVerification).then((_) => _loadProfile()),
          icon: const Icon(Icons.security, size: 18),
          label: const Text('VERIFICATION CENTER'),
          style: ElevatedButton.styleFrom(
            backgroundColor: ZymiColors.primary.withValues(alpha: 0.1),
            foregroundColor: ZymiColors.primary,
            side: const BorderSide(color: ZymiColors.primary, width: 0.5),
            minimumSize: const Size(double.infinity, 44),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          ),
        ),
      ],
    );
  }

  Widget _buildGamificationPanel() {
    final points = _gamification?['points'] ?? 0;
    final level = _gamification?['level'] ?? 1;
    final messagesSent = _gamification?['messages_sent'] ?? 0;
    final callsMade = _gamification?['calls_made'] ?? 0;

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: const Color(0xFF1e293b),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.white.withValues(alpha: 0.05)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.emoji_events, color: ZymiColors.warning, size: 20),
              const SizedBox(width: 8),
              const Text('GAMIFICATION', style: TextStyle(color: Colors.white38, fontSize: 11, letterSpacing: 1.5)),
            ],
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              _statBadge(Icons.stars, 'Level', '$level', ZymiColors.purple),
              const SizedBox(width: 16),
              _statBadge(Icons.monetization_on, 'XP', '$points', ZymiColors.warning),
              const SizedBox(width: 16),
              _statBadge(Icons.chat, 'Messages', '$messagesSent', ZymiColors.primary),
              const SizedBox(width: 16),
              _statBadge(Icons.call, 'Calls', '$callsMade', ZymiColors.success),
            ],
          ),
          if (_badges.isNotEmpty) ...[
            const SizedBox(height: 16),
            const Text('BADGES', style: TextStyle(color: Colors.white38, fontSize: 11, letterSpacing: 1.5)),
            const SizedBox(height: 8),
            SizedBox(
              height: 40,
              child: ListView.separated(
                scrollDirection: Axis.horizontal,
                itemCount: _badges.length,
                separatorBuilder: (_, __) => const SizedBox(width: 8),
                itemBuilder: (context, index) {
                  final badge = _badges[index];
                  return Tooltip(
                    message: badge['name'] ?? '',
                    child: Container(
                      width: 40,
                      height: 40,
                      decoration: BoxDecoration(
                        color: ZymiColors.warning.withValues(alpha: 0.15),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Icon(Icons.emoji_events, color: ZymiColors.warning, size: 20),
                    ),
                  );
                },
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _statBadge(IconData icon, String label, String value, Color color) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 8),
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.1),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Column(
          children: [
            Icon(icon, color: color, size: 18),
            const SizedBox(height: 4),
            Text(value, style: TextStyle(color: color, fontSize: 16, fontWeight: FontWeight.bold)),
            Text(label, style: const TextStyle(color: Colors.white38, fontSize: 9)),
          ],
        ),
      ),
    );
  }

  Widget _buildActionButtons() {
    return Column(
      children: [
        ListTile(
          onTap: () {},
          leading: const Icon(Icons.settings_outlined, color: Colors.white70),
          title: const Text('Settings', style: TextStyle(color: Colors.white70)),
          trailing: const Icon(Icons.chevron_right, color: Colors.white24),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        ),
        ListTile(
          onTap: () async {
            await _authService.logout();
            if (mounted) Navigator.pushReplacementNamed(context, ZymiRoutes.login);
          },
          leading: const Icon(Icons.logout, color: Colors.redAccent),
          title: const Text('Logout', style: TextStyle(color: Colors.redAccent)),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        ),
      ],
    );
  }
}
