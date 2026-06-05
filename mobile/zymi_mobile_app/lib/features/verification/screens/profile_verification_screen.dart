import 'package:flutter/material.dart';
import '../../../services/api/auth_service.dart';
import '../../../core/navigation/zymi_routes.dart';
import '../../../core/theme/zymi_brand_colors.dart';

class ProfileVerificationScreen extends StatefulWidget {
  const ProfileVerificationScreen({super.key});

  @override
  State<ProfileVerificationScreen> createState() => _ProfileVerificationScreenState();
}

class _ProfileVerificationScreenState extends State<ProfileVerificationScreen> {
  final _authService = AuthService();
  Map<String, dynamic>? _user;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadUser();
  }

  Future<void> _loadUser() async {
    final user = await _authService.getMe();
    if (mounted) {
      setState(() {
        _user = user;
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }

    final emailVerified = _user?['email_verified'] == 1;
    final phoneVerified = _user?['phone_verified'] == 1;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Verify Profile'),
        backgroundColor: Colors.transparent,
        elevation: 0,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            _buildVerificationCard(
              title: 'Email Verification',
              description: emailVerified 
                  ? 'Your email is verified.' 
                  : 'Verify your email to secure your account and recover password.',
              icon: Icons.email,
              isVerified: emailVerified,
              onTap: emailVerified ? null : () => Navigator.pushNamed(context, ZymiRoutes.emailOtp, arguments: _user?['email']),
            ),
            const SizedBox(height: 24),
            _buildVerificationCard(
              title: 'Phone Verification',
              description: phoneVerified 
                  ? 'Your phone is verified.' 
                  : 'Verify your phone to enable secure calls and better discovery.',
              icon: Icons.phone_android,
              isVerified: phoneVerified,
              onTap: phoneVerified ? null : () => Navigator.pushNamed(context, ZymiRoutes.phoneOtp),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildVerificationCard({
    required String title,
    required String description,
    required IconData icon,
    required bool isVerified,
    VoidCallback? onTap,
  }) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: const Color(0xFF1e293b),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: isVerified ? Colors.green.withValues(alpha: 0.3) : ZymiColors.primary.withValues(alpha: 0.3)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, color: isVerified ? Colors.green : ZymiColors.primary, size: 32),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(title, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                    if (isVerified)
                      const Text('Verified', style: TextStyle(color: Colors.green, fontSize: 12, fontWeight: FontWeight.bold)),
                  ],
                ),
              ),
              if (isVerified)
                const Icon(Icons.check_circle, color: Colors.green)
              else
                const Icon(Icons.pending, color: Colors.orange),
            ],
          ),
          const SizedBox(height: 16),
          Text(description, style: const TextStyle(color: Colors.white70, fontSize: 14)),
          if (!isVerified && onTap != null) ...[
            const SizedBox(height: 20),
            ElevatedButton(
              onPressed: onTap,
              style: ElevatedButton.styleFrom(
                backgroundColor: ZymiColors.primary,
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                minimumSize: const Size(double.infinity, 44),
              ),
              child: const Text('Verify Now'),
            ),
          ],
        ],
      ),
    );
  }
}
