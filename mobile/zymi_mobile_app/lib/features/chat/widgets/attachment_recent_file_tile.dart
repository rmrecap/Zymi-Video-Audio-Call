import 'package:flutter/material.dart';
import '../../../core/theme/zymi_brand_colors.dart';

class AttachmentRecentFileTile extends StatelessWidget {
  final String fileName;
  final String fileSize;
  final String fileType;
  final VoidCallback onTap;

  const AttachmentRecentFileTile({
    super.key,
    required this.fileName,
    required this.fileSize,
    required this.fileType,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    IconData fileIcon;
    Color iconColor;

    switch (fileType.toLowerCase()) {
      case 'pdf':
        fileIcon = Icons.picture_as_pdf;
        iconColor = Colors.redAccent;
        break;
      case 'doc':
      case 'docx':
        fileIcon = Icons.description;
        iconColor = ZymiColors.primary;
        break;
      case 'zip':
      case 'rar':
        fileIcon = Icons.folder_zip;
        iconColor = Colors.orangeAccent;
        break;
      default:
        fileIcon = Icons.insert_drive_file;
        iconColor = Colors.white54;
    }

    return ListTile(
      onTap: onTap,
      leading: Container(
        width: 44,
        height: 44,
        decoration: BoxDecoration(
          color: iconColor.withValues(alpha: 0.1),
          borderRadius: BorderRadius.circular(8),
        ),
        child: Icon(fileIcon, color: iconColor, size: 24),
      ),
      title: Text(
        fileName,
        style: const TextStyle(color: Colors.white, fontSize: 14),
        maxLines: 1,
        overflow: TextOverflow.ellipsis,
      ),
      subtitle: Text(
        fileSize,
        style: const TextStyle(color: Colors.white38, fontSize: 12),
      ),
      trailing: const Icon(Icons.chevron_right, color: Colors.white10),
    );
  }
}
