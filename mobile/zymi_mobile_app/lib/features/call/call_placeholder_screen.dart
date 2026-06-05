import 'package:flutter/material.dart';
import '../../core/theme/zymi_brand_colors.dart';

class CallPlaceholderScreen extends StatelessWidget {
  const CallPlaceholderScreen({super.key});

  static const _mockHistory = [
    {'name': 'Alice', 'type': 'outgoing', 'duration': '12:34', 'time': 'Today, 2:30 PM'},
    {'name': 'Bob', 'type': 'incoming', 'duration': '05:22', 'time': 'Today, 11:15 AM'},
    {'name': 'Charlie', 'type': 'missed', 'duration': null, 'time': 'Yesterday, 8:45 PM'},
    {'name': 'Diana', 'type': 'outgoing', 'duration': '03:10', 'time': 'Yesterday, 6:00 PM'},
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Calls'),
      ),
      body: _mockHistory.isEmpty
          ? Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.call_end, size: 64, color: ZymiColors.textMuted.withValues(alpha: 0.5)),
                  const SizedBox(height: 16),
                  const Text('No call history', style: TextStyle(color: ZymiColors.textMuted, fontSize: 18)),
                  const SizedBox(height: 8),
                  const Text('Your recent calls will appear here', style: TextStyle(color: ZymiColors.textMuted, fontSize: 14)),
                ],
              ),
            )
          : ListView.separated(
              padding: const EdgeInsets.symmetric(vertical: 8),
              itemCount: _mockHistory.length,
              separatorBuilder: (_, __) => Divider(height: 1, color: ZymiColors.textMuted.withValues(alpha: 0.15)),
              itemBuilder: (context, index) {
                final call = _mockHistory[index];
                final isMissed = call['type'] == 'missed';
                final isIncoming = call['type'] == 'incoming';
                return ListTile(
                  leading: CircleAvatar(
                    backgroundColor: isMissed
                        ? ZymiColors.danger.withValues(alpha: 0.15)
                        : ZymiColors.surface,
                    child: Icon(
                      isIncoming ? Icons.call_received : Icons.call_made,
                      color: isMissed ? ZymiColors.danger : ZymiColors.primary,
                      size: 20,
                    ),
                  ),
                  title: Text(
                    call['name'] as String,
                    style: TextStyle(
                      fontWeight: isMissed ? FontWeight.bold : FontWeight.normal,
                      color: isMissed ? ZymiColors.danger : ZymiColors.textPrimary,
                    ),
                  ),
                  subtitle: Text(
                    '${call['time']}${call['duration'] != null ? ' · ${call['duration']}' : ''}',
                    style: const TextStyle(color: ZymiColors.textSecondary, fontSize: 12),
                  ),
                  trailing: const Icon(Icons.info_outline, size: 18, color: ZymiColors.textMuted),
                );
              },
            ),
    );
  }
}
