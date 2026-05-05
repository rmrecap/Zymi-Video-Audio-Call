import 'package:flutter/material.dart';

class AttachmentLocationTile extends StatelessWidget {
  final String title;
  final String address;
  final VoidCallback onTap;

  const AttachmentLocationTile({
    super.key,
    required this.title,
    required this.address,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return ListTile(
      onTap: onTap,
      leading: Container(
        width: 44,
        height: 44,
        decoration: BoxDecoration(
          color: Colors.greenAccent.withValues(alpha: 0.1),
          shape: BoxShape.circle,
        ),
        child: const Icon(Icons.location_on, color: Colors.greenAccent, size: 24),
      ),
      title: Text(
        title,
        style: const TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.bold),
      ),
      subtitle: Text(
        address,
        style: const TextStyle(color: Colors.white38, fontSize: 12),
        maxLines: 1,
        overflow: TextOverflow.ellipsis,
      ),
      trailing: const Icon(Icons.send, color: Colors.greenAccent, size: 20),
    );
  }
}
