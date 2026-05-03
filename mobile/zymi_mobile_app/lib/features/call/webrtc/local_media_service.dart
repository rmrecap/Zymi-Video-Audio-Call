import 'package:flutter/foundation.dart';
import 'package:flutter_webrtc/flutter_webrtc.dart';
import 'zymi_webrtc_config.dart';

class LocalMediaService {
  MediaStream? _localStream;

  MediaStream? get localStream => _localStream;

  Future<MediaStream?> getUserMedia({required bool isVideo}) async {
    final constraints = isVideo
        ? ZymiWebRTCConfig.mediaConstraintsVideo
        : ZymiWebRTCConfig.mediaConstraintsAudio;

    try {
      _localStream = await navigator.mediaDevices.getUserMedia(constraints);
      return _localStream;
    } catch (e) {
      debugPrint('[LOCAL_MEDIA] Error getting user media: $e');
      return null;
    }
  }

  void toggleMicrophone(bool isMuted) {
    if (_localStream != null) {
      for (final track in _localStream!.getAudioTracks()) {
        track.enabled = !isMuted;
      }
    }
  }

  void toggleCamera(bool isEnabled) {
    if (_localStream != null) {
      for (final track in _localStream!.getVideoTracks()) {
        track.enabled = isEnabled;
      }
    }
  }

  Future<void> dispose() async {
    if (_localStream != null) {
      for (final track in _localStream!.getTracks()) {
        track.stop();
      }
      await _localStream!.dispose();
      _localStream = null;
    }
  }
}
