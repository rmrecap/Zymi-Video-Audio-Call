import 'package:flutter_webrtc/flutter_webrtc.dart';
import 'zymi_webrtc_config.dart';

class PeerConnectionService {
  RTCPeerConnection? _peerConnection;
  Function(RTCIceCandidate)? onIceCandidate;
  Function(MediaStream)? onAddStream;
  Function(MediaStreamTrack, RTCRtpReceiver)? onAddTrack;
  Function(RTCPeerConnectionState)? onConnectionState;

  RTCPeerConnection? get peerConnection => _peerConnection;

  Future<void> initialize() async {
    _peerConnection = await createPeerConnection(ZymiWebRTCConfig.rtcConfiguration);

    _peerConnection!.onIceCandidate = (RTCIceCandidate candidate) {
      if (onIceCandidate != null) {
        onIceCandidate!(candidate);
      }
    };

    _peerConnection!.onAddStream = (MediaStream stream) {
      if (onAddStream != null) {
        onAddStream!(stream);
      }
    };

    _peerConnection!.onTrack = (RTCTrackEvent event) {
      if (onAddTrack != null && event.track.kind == 'video') {
        onAddTrack!(event.track, event.receiver!);
      }
    };

    _peerConnection!.onConnectionState = (RTCPeerConnectionState state) {
      if (onConnectionState != null) {
        onConnectionState!(state);
      }
    };
  }

  Future<void> addLocalStream(MediaStream stream) async {
    if (_peerConnection == null) return;
    stream.getTracks().forEach((track) async {
      await _peerConnection!.addTrack(track, stream);
    });
  }

  Future<void> dispose() async {
    if (_peerConnection != null) {
      await _peerConnection!.close();
      await _peerConnection!.dispose();
      _peerConnection = null;
    }
  }
}
