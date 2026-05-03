import 'package:flutter/material.dart';
import '../../../core/runtime/app_runtime_state.dart';

class AdBlockedNotice extends StatelessWidget {
  const AdBlockedNotice({super.key});

  String _getBlockReason() {
    final s = appRuntimeState;
    if (s.isInCall) return 'Active call in progress';
    if (s.isRinging) return 'Incoming call ringing';
    if (s.isConnectingCall) return 'Call connecting';
    if (s.isCameraActive) return 'Camera permission active';
    if (s.isMicActive) return 'Microphone permission active';
    if (s.isTyping) return 'User is typing';
    if (s.isComposerFocused) return 'Message composer focused';
    return 'Unknown block reason';
  }

  @override
  Widget build(BuildContext context) {
    if (appRuntimeState.canShowAds) {
      return const SizedBox.shrink();
    }

    return Container(
      margin: const EdgeInsets.all(12),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      decoration: BoxDecoration(
        color: Colors.red.shade900.withValues(alpha: 0.3),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Colors.red.shade700),
      ),
      child: Row(
        children: [
          const Icon(Icons.block, color: Colors.redAccent, size: 18),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              'Ad Blocked: ${_getBlockReason()}',
              style: const TextStyle(color: Colors.redAccent, fontSize: 13),
            ),
          ),
        ],
      ),
    );
  }
}
