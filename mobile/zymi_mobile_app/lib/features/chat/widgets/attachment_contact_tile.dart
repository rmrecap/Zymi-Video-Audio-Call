import 'package:flutter/material.dart';
import '../../../core/theme/zymi_brand_colors.dart';

class AttachmentContactTile extends StatelessWidget {
  final String name;
  final String? avatar;
  final String? phone;
  final VoidCallback onTap;

  const AttachmentContactTile({
    super.key,
    required this.name,
    this.avatar,
    this.phone,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return ListTile(
      onTap: onTap,
      leading: CircleAvatar(
        backgroundColor: ZymiColors.primary.withValues(alpha: 0.1),
        backgroundImage: avatar != null ? NetworkImage(avatar!) : null,
        child: avatar == null
            ? Text(
                name.isNotEmpty ? name[0].toUpperCase() : '?',
                style: const TextStyle(color: ZymiColors.primary, fontWeight: FontWeight.bold),
              )
            : null,
      ),
      title: Text(
        name,
        style: const TextStyle(color: Colors.white, fontSize: 14),
      ),
      subtitle: phone != null
          ? Text(
              phone!,
              style: const TextStyle(color: Colors.white38, fontSize: 12),
            )
          : null,
      trailing: const Icon(Icons.person_add_outlined, color: ZymiColors.primary, size: 20),
    );
  }
}
