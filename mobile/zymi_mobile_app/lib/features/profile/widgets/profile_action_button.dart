import 'package:flutter/material.dart';

class ProfileActionButton extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;
  final Color? color;

  const ProfileActionButton({
    super.key,
    required this.icon,
    required this.label,
    required this.onTap,
    this.color,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: (color ?? Colors.blueAccent).withValues(alpha: 0.1),
              shape: BoxShape.circle,
            ),
            child: Icon(icon, color: color ?? Colors.blueAccent, size: 24),
          ),
          const SizedBox(height: 8),
          Text(
            label,
            style: TextStyle(color: (color ?? Colors.blueAccent).withValues(alpha: 0.8), fontSize: 12),
          ),
        ],
      ),
    );
  }
}
