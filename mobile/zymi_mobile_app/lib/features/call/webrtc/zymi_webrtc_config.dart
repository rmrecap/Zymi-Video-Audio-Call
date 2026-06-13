class ZymiWebRTCConfig {
  static const Map<String, dynamic> rtcConfiguration = {
    'iceServers': [
      {'urls': 'stun:stun.l.google.com:19302'},
      {'urls': 'stun:stun1.l.google.com:19302'}
    ],
    // 'sdpSemantics': 'unified-plan'
  };

  static const Map<String, dynamic> offerConstraints = {
    'mandatory': {
      'OfferToReceiveAudio': true,
      'OfferToReceiveVideo': true,
    },
    'optional': [],
  };

  static const Map<String, dynamic> mediaConstraintsVideo = {
    'audio': true,
    'video': {
      'mandatory': {
        'minWidth': '640',
        'minHeight': '480',
        'minFrameRate': '30',
      },
      'facingMode': 'user',
      'optional': [],
    }
  };

  static const Map<String, dynamic> mediaConstraintsAudio = {
    'audio': true,
    'video': false,
  };
}
