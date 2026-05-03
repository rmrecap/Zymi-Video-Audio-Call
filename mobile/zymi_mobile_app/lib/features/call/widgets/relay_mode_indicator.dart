import 'package:flutter/material.dart';

class RelayModeIndicator extends StatelessWidget {
  final bool isRelay;

  const RelayModeIndicator({super.key, required this.isRelay});

  @override
  Widget build(BuildContext context) {
    if (!isRelay) return const SizedBox.shrink();

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: Colors.orangeAccent.withValues(alpha: 0.2),
        borderRadius: BorderRadius.circular(4),
        border: Border.all(color: Colors.orangeAccent.withValues(alpha: 0.5)),
      ),
      child: const Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(Icons.alt_route, color: Colors.orangeAccent, size: 12),
          SizedBox(width: 4),
          Text(
            'Relay Mode',
            style: TextStyle(
                color: Colors.orangeAccent,
                fontSize: 10,
                fontWeight: FontWeight.bold),
          ),
        ],
      ),
    );
  }
}
