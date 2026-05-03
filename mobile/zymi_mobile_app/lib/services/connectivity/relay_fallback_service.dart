import 'dart:async';
import 'package:flutter_webrtc/flutter_webrtc.dart';

class RelayFallbackService {
  final Function(List<Map<String, dynamic>>) onRetry;
  final Function(int seconds, String mode)? onRelayActive;
  Timer? _fallbackTimer;
  bool _fallbackTriggered = false;
  Stopwatch? _relayStopwatch;

  RelayFallbackService({required this.onRetry, this.onRelayActive});

  void monitorConnection(RTCPeerConnection pc, int timeoutSeconds, List<Map<String, dynamic>> turnConfig) {
    pc.onIceConnectionState = (state) {
      if (state == RTCIceConnectionState.RTCIceConnectionStateFailed || 
          state == RTCIceConnectionState.RTCIceConnectionStateDisconnected) {
        _startFallbackTimer(timeoutSeconds, turnConfig);
      } else if (state == RTCIceConnectionState.RTCIceConnectionStateConnected || 
                 state == RTCIceConnectionState.RTCIceConnectionStateCompleted) {
        _stopFallbackTimer();
        // Check if we are in relay mode
        pc.getStats().then((stats) {
          bool isRelay = false;
          for (var stat in stats) {
            if (stat.type == 'candidate-pair' && stat.values['state'] == 'succeeded') {
              String? localType = stat.values['localCandidateType'];
              if (localType == 'relay') isRelay = true;
            }
          }
          if (isRelay) {
            _relayStopwatch ??= Stopwatch()..start();
          }
        });
      }
    };
  }

  void _startFallbackTimer(int seconds, List<Map<String, dynamic>> turnConfig) {
    if (_fallbackTriggered || _fallbackTimer != null) return;

    _fallbackTimer = Timer(Duration(seconds: seconds), () {
      _fallbackTriggered = true;
      onRetry(turnConfig);
    });
  }

  void _stopFallbackTimer() {
    _fallbackTimer?.cancel();
    _fallbackTimer = null;
  }

  void dispose() {
    _stopFallbackTimer();
    if (_relayStopwatch != null && _relayStopwatch!.isRunning) {
      _relayStopwatch!.stop();
      onRelayActive?.call(_relayStopwatch!.elapsed.inSeconds, 'turn_udp');
    }
  }
}
