import 'package:flutter/material.dart';
import '../../../core/navigation/zymi_routes.dart';

class ZymiUserFoundDialog extends StatelessWidget {
  final String userId;
  final String username;
  final String? avatar;

  const ZymiUserFoundDialog({
    super.key,
    required this.userId,
    required this.username,
    this.avatar,
  });

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      backgroundColor: const Color(0xFF1e293b),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      title: const Row(
        children: [
          Icon(Icons.check_circle, color: Colors.green),
          SizedBox(width: 12),
          Text('ZYMI User Found', style: TextStyle(color: Colors.white, fontSize: 18)),
        ],
      ),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const SizedBox(height: 16),
          CircleAvatar(
            radius: 40,
            backgroundColor: Colors.blueAccent.withAlpha(50),
            child: avatar != null 
              ? ClipOval(child: Image.network(avatar!))
              : const Icon(Icons.person, size: 40, color: Colors.blueAccent),
          ),
          const SizedBox(height: 16),
          Text(
            username,
            style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 20),
          ),
          const SizedBox(height: 8),
          const Text(
            'এই ব্যবহারকারী ZYMI-তে নিবন্ধিত আছেন।',
            textAlign: TextAlign.center,
            style: TextStyle(color: Colors.white70),
          ),
        ],
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.of(context).pop(),
          child: const Text('Cancel', style: TextStyle(color: Colors.white54)),
        ),
        ElevatedButton(
          onPressed: () {
            Navigator.of(context).pop();
            Navigator.pushNamed(
              context, 
              ZymiRoutes.chat, 
              arguments: {'peerId': userId, 'peerName': username}
            );
          },
          style: ElevatedButton.styleFrom(
            backgroundColor: Colors.blueAccent,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
          ),
          child: const Text('Open Chat', style: TextStyle(color: Colors.white)),
        ),
      ],
    );
  }
}
