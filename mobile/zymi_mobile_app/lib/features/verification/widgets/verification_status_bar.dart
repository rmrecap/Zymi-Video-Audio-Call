import 'package:flutter/material.dart';
import '../../../core/theme/zymi_brand_colors.dart';

class VerificationStatusBar extends StatelessWidget {
  final int completionPercentage;
  final bool emailVerified;
  final bool phoneVerified;
  final VoidCallback onTap;

  const VerificationStatusBar({
    super.key,
    required this.completionPercentage,
    required this.emailVerified,
    required this.phoneVerified,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    if (completionPercentage == 100) return const SizedBox.shrink();

    return GestureDetector(
      onTap: onTap,
      child: Container(
        margin: const EdgeInsets.all(12),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: [
              ZymiColors.primary.withValues(alpha: 0.2),
              const Color(0xFF1e293b).withValues(alpha: 0.8),
            ],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: ZymiColors.primary.withValues(alpha: 0.3)),
          boxShadow: [
            BoxShadow(
              color: ZymiColors.primary.withValues(alpha: 0.1),
              blurRadius: 10,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'Profile Verification',
                  style: TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                    fontSize: 16,
                  ),
                ),
                Text(
                  '$completionPercentage%',
                  style: const TextStyle(
                    color: ZymiColors.primary,
                    fontWeight: FontWeight.bold,
                    fontSize: 16,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            ClipRRect(
              borderRadius: BorderRadius.circular(8),
              child: LinearProgressIndicator(
                value: completionPercentage / 100,
                backgroundColor: Colors.white10,
                valueColor: const AlwaysStoppedAnimation<Color>(ZymiColors.primary),
                minHeight: 8,
              ),
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                _buildStatusChip(emailVerified, 'Email'),
                const SizedBox(width: 8),
                _buildStatusChip(phoneVerified, 'Phone'),
                const Spacer(),
                const Text(
                  'Complete Now',
                  style: TextStyle(
                    color: ZymiColors.primary,
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const Icon(Icons.chevron_right, color: ZymiColors.primary, size: 16),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStatusChip(bool verified, String label) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: verified ? Colors.green.withValues(alpha: 0.1) : Colors.orange.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: verified ? Colors.green.withValues(alpha: 0.3) : Colors.orange.withValues(alpha: 0.3),
        ),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            verified ? Icons.check_circle : Icons.warning_rounded,
            size: 12,
            color: verified ? Colors.green : Colors.orange,
          ),
          const SizedBox(width: 4),
          Text(
            label,
            style: TextStyle(
              fontSize: 10,
              color: verified ? Colors.green : Colors.orange,
              fontWeight: FontWeight.bold,
            ),
          ),
        ],
      ),
    );
  }
}
