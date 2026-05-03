import 'package:flutter/material.dart';

class NotificationTile extends StatelessWidget {
  final Map<String, dynamic> notification;
  final VoidCallback onTap;

  const NotificationTile({
    super.key,
    required this.notification,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final bool isRead = notification['is_read'] == 1;
    final String type = notification['type'] ?? 'system';

    IconData icon;
    Color iconColor;

    switch (type) {
      case 'message':
        icon = Icons.message;
        iconColor = Colors.blue;
        break;
      case 'call_missed':
        icon = Icons.phone_missed;
        iconColor = Colors.red;
        break;
      case 'security':
        icon = Icons.security;
        iconColor = Colors.orange;
        break;
      default:
        icon = Icons.info;
        iconColor = const Color(0xFF64748B); // Slate 500
    }

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
      decoration: BoxDecoration(
        color: isRead
            ? Colors.transparent
            : const Color(0xFF1E293B).withValues(alpha: 0.5),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: isRead ? Colors.transparent : Colors.blue.withValues(alpha: 0.3),
          width: 1,
        ),
      ),
      child: ListTile(
        onTap: onTap,
        leading: CircleAvatar(
          backgroundColor: iconColor.withValues(alpha: 0.1),
          child: Icon(icon, color: iconColor, size: 20),
        ),
        title: Text(
          notification['title'] ?? 'Notification',
          style: TextStyle(
            color: Colors.white,
            fontWeight: isRead ? FontWeight.normal : FontWeight.bold,
          ),
        ),
        subtitle: Text(
          notification['body'] ?? '',
          style: const TextStyle(
              color: Color(0xFF94A3B8), fontSize: 13), // Slate 400
        ),
        trailing: !isRead
            ? Container(
                width: 10,
                height: 10,
                decoration: const BoxDecoration(
                  color: Colors.blue,
                  shape: BoxShape.circle,
                ),
              )
            : null,
      ),
    );
  }
}
