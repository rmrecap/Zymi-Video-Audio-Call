import 'package:flutter/material.dart';

class AttachmentMusicTile extends StatelessWidget {
  final String title;
  final String artist;
  final String duration;
  final VoidCallback onTap;

  const AttachmentMusicTile({
    super.key,
    required this.title,
    required this.artist,
    required this.duration,
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
          color: Colors.purpleAccent.withValues(alpha: 0.1),
          borderRadius: BorderRadius.circular(8),
        ),
        child: const Icon(Icons.music_note, color: Colors.purpleAccent, size: 24),
      ),
      title: Text(
        title,
        style: const TextStyle(color: Colors.white, fontSize: 14),
        maxLines: 1,
        overflow: TextOverflow.ellipsis,
      ),
      subtitle: Text(
        '$artist • $duration',
        style: const TextStyle(color: Colors.white38, fontSize: 12),
      ),
      trailing: const Icon(Icons.play_circle_outline, color: Colors.purpleAccent, size: 24),
    );
  }
}
