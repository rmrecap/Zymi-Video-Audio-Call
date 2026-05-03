import 'package:flutter/material.dart';
import 'live_call_screen.dart';

class IncomingCallScreen extends StatelessWidget {
  final String callerId;
  final String callType; // 'audio' or 'video'
  final String currentUserId;
  final VoidCallback onReject;
  final VoidCallback onAccept;

  const IncomingCallScreen({
    super.key,
    required this.callerId,
    required this.callType,
    required this.currentUserId,
    required this.onReject,
    required this.onAccept,
  });

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0f172a),
      body: SafeArea(
        child: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const CircleAvatar(
                radius: 50,
                backgroundColor: Colors.blueGrey,
                child: Icon(Icons.person, size: 50, color: Colors.white),
              ),
              const SizedBox(height: 24),
              Text(
                callerId,
                style: const TextStyle(color: Colors.white, fontSize: 28, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 8),
              Text(
                'Incoming ${callType == 'video' ? 'Video' : 'Audio'} Call...',
                style: const TextStyle(color: Colors.white54, fontSize: 16),
              ),
              const SizedBox(height: 60),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                children: [
                  _actionButton(
                    icon: Icons.call_end,
                    color: Colors.red,
                    label: 'Reject',
                    onPressed: () {
                      onReject();
                      Navigator.of(context).pop();
                    },
                  ),
                  _actionButton(
                    icon: callType == 'video' ? Icons.videocam : Icons.call,
                    color: Colors.green,
                    label: 'Accept',
                    onPressed: () {
                      onAccept();
                      Navigator.of(context).pushReplacement(
                        MaterialPageRoute(
                          builder: (_) => LiveCallScreen(
                            peerId: callerId,
                            isVideo: callType == 'video',
                          ),
                        ),
                      );
                    },
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _actionButton({
    required IconData icon,
    required Color color,
    required String label,
    required VoidCallback onPressed,
  }) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        InkWell(
          onTap: onPressed,
          borderRadius: BorderRadius.circular(40),
          child: Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: color,
              shape: BoxShape.circle,
              boxShadow: [
                BoxShadow(color: color.withValues(alpha: 0.4), blurRadius: 10, spreadRadius: 2),
              ],
            ),
            child: Icon(icon, color: Colors.white, size: 32),
          ),
        ),
        const SizedBox(height: 12),
        Text(label, style: const TextStyle(color: Colors.white70, fontSize: 14)),
      ],
    );
  }
}
