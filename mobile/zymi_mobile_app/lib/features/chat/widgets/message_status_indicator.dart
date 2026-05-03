import 'package:flutter/material.dart';

class MessageStatusIndicator extends StatelessWidget {
  final String status;
  final bool isMine;

  const MessageStatusIndicator({
    super.key,
    required this.status,
    required this.isMine,
  });

  @override
  Widget build(BuildContext context) {
    if (!isMine) return const SizedBox.shrink();

    IconData icon;
    Color color;

    switch (status) {
      case 'sending':
      case 'queued':
        icon = Icons.access_time;
        color = const Color(0xFF64748B); // Slate 500
        break;
      case 'sent':
        icon = Icons.check;
        color = const Color(0xFF64748B);
        break;
      case 'delivered':
        icon = Icons.done_all;
        color = const Color(0xFF64748B);
        break;
      case 'read':
        icon = Icons.done_all;
        color = Colors.blue;
        break;
      case 'failed':
        icon = Icons.error_outline;
        color = Colors.red;
        break;
      default:
        return const SizedBox.shrink();
    }

    return Icon(icon, size: 14, color: color);
  }
}
