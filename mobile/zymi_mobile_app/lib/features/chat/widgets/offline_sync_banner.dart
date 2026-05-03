import 'package:flutter/material.dart';
import '../../../services/realtime/zymi_socket_client.dart';

class OfflineSyncBanner extends StatelessWidget {
  const OfflineSyncBanner({super.key});

  @override
  Widget build(BuildContext context) {
    return StreamBuilder<ZymiSocketStatus>(
      stream: ZymiSocketClient().statusStream,
      builder: (context, snapshot) {
        final status = snapshot.data ?? ZymiSocketStatus.disconnected;
        
        if (status == ZymiSocketStatus.connected) {
          return const SizedBox.shrink();
        }

        return Container(
          width: double.infinity,
          padding: const EdgeInsets.symmetric(vertical: 4, horizontal: 12),
          color: const Color(0xFFFACC15), // Yellow 400
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.cloud_off, size: 14, color: Colors.black87),
              const SizedBox(width: 8),
              Text(
                status == ZymiSocketStatus.connecting 
                  ? 'Connecting to network...' 
                  : 'Offline - Messages will sync when reconnected',
                style: const TextStyle(
                  color: Colors.black87,
                  fontSize: 12,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}
