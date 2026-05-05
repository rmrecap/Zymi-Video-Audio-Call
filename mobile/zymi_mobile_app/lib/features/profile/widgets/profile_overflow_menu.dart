import 'package:flutter/material.dart';

class ProfileOverflowMenu extends StatelessWidget {
  final VoidCallback onBlock;
  final VoidCallback onReport;
  final VoidCallback onShare;

  const ProfileOverflowMenu({
    super.key,
    required this.onBlock,
    required this.onReport,
    required this.onShare,
  });

  @override
  Widget build(BuildContext context) {
    return PopupMenuButton<String>(
      icon: const Icon(Icons.more_vert, color: Colors.white),
      color: const Color(0xFF1e293b),
      onSelected: (value) {
        switch (value) {
          case 'block':
            onBlock();
            break;
          case 'report':
            onReport();
            break;
          case 'share':
            onShare();
            break;
        }
      },
      itemBuilder: (context) => [
        const PopupMenuItem(
          value: 'share',
          child: Row(
            children: [
              Icon(Icons.share_outlined, color: Colors.white70, size: 20),
              SizedBox(width: 12),
              Text('Share Contact', style: TextStyle(color: Colors.white70)),
            ],
          ),
        ),
        const PopupMenuItem(
          value: 'report',
          child: Row(
            children: [
              Icon(Icons.report_problem_outlined, color: Colors.orangeAccent, size: 20),
              SizedBox(width: 12),
              Text('Report User', style: TextStyle(color: Colors.orangeAccent)),
            ],
          ),
        ),
        const PopupMenuItem(
          value: 'block',
          child: Row(
            children: [
              Icon(Icons.block, color: Colors.redAccent, size: 20),
              SizedBox(width: 12),
              Text('Block User', style: TextStyle(color: Colors.redAccent)),
            ],
          ),
        ),
      ],
    );
  }
}
