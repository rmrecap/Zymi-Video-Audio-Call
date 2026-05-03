import 'package:flutter/material.dart';

class MediaTransferProgress extends StatelessWidget {
  final String status;
  final bool isMine;
  final VoidCallback? onRetry;

  const MediaTransferProgress({
    super.key,
    required this.status,
    required this.isMine,
    this.onRetry,
  });

  @override
  Widget build(BuildContext context) {
    Color color = Colors.blueAccent;
    String label = 'Transferring...';
    bool showRetry = false;

    switch (status) {
      case 'pending':
        color = Colors.orangeAccent;
        label = isMine ? 'Waiting for receiver...' : 'Waiting for sender...';
        break;
      case 'transferring':
        color = Colors.blueAccent;
        label = 'Transferring...';
        break;
      case 'failed':
      case 'expired':
        color = Colors.redAccent;
        label = 'Transfer failed';
        showRetry = true;
        break;
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            SizedBox(
              width: 12,
              height: 12,
              child: status == 'transferring' 
                ? const CircularProgressIndicator(strokeWidth: 2, color: Colors.blueAccent)
                : Icon(Icons.info_outline, size: 12, color: color),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: Text(
                label,
                style: TextStyle(color: color.withValues(alpha: 0.8), fontSize: 11),
              ),
            ),
            if (showRetry && onRetry != null)
              GestureDetector(
                onTap: onRetry,
                child: const Text(
                  'Retry',
                  style: TextStyle(color: Colors.blueAccent, fontSize: 11, fontWeight: FontWeight.bold),
                ),
              ),
          ],
        ),
        if (status == 'transferring') ...[
          const SizedBox(height: 4),
          const LinearProgressIndicator(
            backgroundColor: Colors.white10,
            color: Colors.blueAccent,
            minHeight: 2,
          ),
        ],
        if (status == 'pending') ...[
          const SizedBox(height: 4),
          const Text(
            'Both users must be online to transfer.',
            style: TextStyle(color: Colors.white24, fontSize: 10),
          ),
        ],
      ],
    );
  }
}
