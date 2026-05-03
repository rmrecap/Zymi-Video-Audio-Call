import 'dart:io';
import 'package:flutter/material.dart';
import '../../../core/local_db/local_media_record.dart';
import 'media_transfer_progress.dart';

class MediaMessageBubble extends StatelessWidget {
  final LocalMediaRecord? localRecord;
  final Map<String, dynamic>? serverMetadata;
  final bool isMine;
  final VoidCallback? onRetry;

  const MediaMessageBubble({
    super.key,
    this.localRecord,
    this.serverMetadata,
    required this.isMine,
    this.onRetry,
  });

  @override
  Widget build(BuildContext context) {
    final status = localRecord?.transferStatus ?? serverMetadata?['transfer_status'] ?? 'pending';
    final mediaType = localRecord?.mediaType ?? serverMetadata?['media_type'] ?? 'file';
    final fileName = localRecord?.fileName ?? serverMetadata?['file_name'] ?? 'Unknown File';
    final fileSize = localRecord?.fileSize ?? serverMetadata?['file_size'] ?? 0;

    return Container(
      margin: const EdgeInsets.symmetric(vertical: 4),
      padding: const EdgeInsets.all(8),
      constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.7),
      decoration: BoxDecoration(
        color: isMine ? const Color(0xFF3B82F6).withValues(alpha: 0.2) : const Color(0xFF1E293B),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.white10),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildPreview(context, status, mediaType),
          const SizedBox(height: 8),
          Text(
            fileName,
            style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.bold),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
          Text(
            '${(fileSize / 1024).toStringAsFixed(1)} KB',
            style: const TextStyle(color: Colors.white54, fontSize: 11),
          ),
          if (status != 'completed') ...[
            const SizedBox(height: 8),
            MediaTransferProgress(status: status, isMine: isMine, onRetry: onRetry),
          ],
        ],
      ),
    );
  }

  Widget _buildPreview(BuildContext context, String status, String type) {
    if (status == 'completed' && localRecord != null) {
      if (type == 'image') {
        return ClipRRect(
          borderRadius: BorderRadius.circular(8),
          child: Image.file(
            File(localRecord!.localPath),
            fit: BoxFit.cover,
            width: double.infinity,
            height: 150,
          ),
        );
      }
    }

    IconData icon;
    switch (type) {
      case 'image': icon = Icons.image; break;
      case 'video': icon = Icons.videocam; break;
      case 'voice': icon = Icons.mic; break;
      default: icon = Icons.insert_drive_file;
    }

    return Container(
      width: double.infinity,
      height: 100,
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.05),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Center(
        child: Icon(icon, color: Colors.white24, size: 40),
      ),
    );
  }
}
