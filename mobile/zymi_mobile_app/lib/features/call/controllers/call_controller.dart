import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:flutter_webrtc/flutter_webrtc.dart';
import '../webrtc/local_media_service.dart';
import '../webrtc/peer_connection_service.dart';
import '../services/call_signaling_service.dart';
import '../../../core/runtime/app_runtime_state.dart';
import '../../../core/runtime/runtime_state_binder.dart';
import '../webrtc/zymi_webrtc_config.dart';

enum CallState { idle, outgoingRinging, incomingRinging, connecting, connected, reconnecting, ended, failed }

class CallController extends ChangeNotifier {
  static final CallController _instance = CallController._internal();
  factory CallController() => _instance;
  CallController._internal() {
    _setupSignaling();
  }

  CallState state = CallState.idle;
  
  final LocalMediaService _mediaService = LocalMediaService();
  final PeerConnectionService _peerConnectionService = PeerConnectionService();
  final CallSignalingService _signalingService = CallSignalingService();

  String? _currentUserId;
  String? _peerId;
  String? _callType;

  String? get peerId => _peerId;
  String? get callType => _callType;
  String? get currentUserId => _currentUserId;

  String? peerConnectionState;
  String? iceConnectionState;
  
  int get localTracksCount => _mediaService.localStream?.getTracks().length ?? 0;
  int get remoteTracksCount => _peerConnectionService.peerConnection?.getRemoteStreams().firstOrNull?.getTracks().length ?? 0;

  
  RTCVideoRenderer localRenderer = RTCVideoRenderer();
  RTCVideoRenderer remoteRenderer = RTCVideoRenderer();
  
  final List<RTCIceCandidate> _remoteIceCandidates = [];
  bool _isRemoteDescriptionSet = false;

  int queuedIceCount = 0;
  Timer? _ringTimer;

  Future<void> initRenderers() async {
    await localRenderer.initialize();
    await remoteRenderer.initialize();
  }

  void _setState(CallState newState) {
    state = newState;
    if (newState == CallState.ended || newState == CallState.failed) {
      _ringTimer?.cancel();
      appRuntimeState.isConnectingCall = false;
      appRuntimeState.isInCall = false;
      runtimeStateBinder.setCallEnded();
    } else if (newState == CallState.connecting || newState == CallState.outgoingRinging || newState == CallState.incomingRinging) {
      appRuntimeState.isConnectingCall = true;
      appRuntimeState.isInCall = false;
    } else if (newState == CallState.connected) {
      _ringTimer?.cancel();
      appRuntimeState.isConnectingCall = false;
      appRuntimeState.isInCall = true;
    }
    notifyListeners();
  }

  void _setupSignaling() {
    _signalingService.listenIncomingCall((data) async {
      if (state != CallState.idle) return; // Busy
      
      _peerId = data['from'];
      _callType = data['type'];
      _setState(CallState.incomingRinging);
      _ringTimer?.cancel();
      _ringTimer = Timer(const Duration(seconds: 45), () {
        if (state == CallState.incomingRinging) rejectCall(_currentUserId ?? '');
      });
      
      // Store offer for later
      _remoteOffer = data['offer'];
    });

    _signalingService.listenCallAnswer((data) async {
      final answer = data['answer'];
      await _peerConnectionService.peerConnection?.setRemoteDescription(
        RTCSessionDescription(answer['sdp'], answer['type']),
      );
      _isRemoteDescriptionSet = true;
      _processQueuedCandidates();
    });

    _signalingService.listenIceCandidate((data) async {
      final candidateMap = data['candidate'];
      final candidate = RTCIceCandidate(
        candidateMap['candidate'],
        candidateMap['sdpMid'],
        candidateMap['sdpMLineIndex'],
      );
      
      if (_isRemoteDescriptionSet) {
        await _peerConnectionService.peerConnection?.addCandidate(candidate);
      } else {
        _remoteIceCandidates.add(candidate);
        queuedIceCount = _remoteIceCandidates.length;
        notifyListeners();
      }
    });

    _signalingService.listenCallEnded((_) => endCall(emit: false));
    _signalingService.listenCallRejected((_) => endCall(emit: false));
  }

  dynamic _remoteOffer;

  Future<void> startCall(String currentUserId, String peerId, String callType) async {
    _currentUserId = currentUserId;
    _peerId = peerId;
    _callType = callType;
    _isRemoteDescriptionSet = false;
    _remoteIceCandidates.clear();
    queuedIceCount = 0;

    _setState(CallState.outgoingRinging);
    _ringTimer?.cancel();
    _ringTimer = Timer(const Duration(seconds: 45), () {
      if (state == CallState.outgoingRinging) endCall();
    });

    final stream = await _mediaService.getUserMedia(isVideo: callType == 'video');
    if (stream != null) {
      localRenderer.srcObject = stream;
      if (callType == 'video') runtimeStateBinder.setCameraActive(true);
      runtimeStateBinder.setMicActive(true);
    } else {
      _setState(CallState.failed);
      return;
    }

    await _peerConnectionService.initialize();
    
    _peerConnectionService.onIceCandidate = (candidate) {
      _signalingService.emitIceCandidate(peerId, {
        'candidate': candidate.candidate,
        'sdpMid': candidate.sdpMid,
        'sdpMLineIndex': candidate.sdpMLineIndex,
      });
    };
    
    _peerConnectionService.onAddTrack = (track, receiver) {
      if (track.kind == 'video') {
        remoteRenderer.srcObject = _peerConnectionService.peerConnection?.getRemoteStreams().firstOrNull;
      }
    };
    
    _peerConnectionService.onConnectionState = (pcState) {
      if (pcState == RTCPeerConnectionState.RTCPeerConnectionStateConnected) {
        _setState(CallState.connected);
      } else if (pcState == RTCPeerConnectionState.RTCPeerConnectionStateDisconnected ||
                 pcState == RTCPeerConnectionState.RTCPeerConnectionStateFailed) {
        endCall(emit: true);
      }
    };

    await _peerConnectionService.addLocalStream(stream);

    final offer = await _peerConnectionService.peerConnection?.createOffer(ZymiWebRTCConfig.offerConstraints);
    if (offer != null) {
      await _peerConnectionService.peerConnection?.setLocalDescription(offer);
      _signalingService.emitCallUser(peerId, currentUserId, {
        'sdp': offer.sdp,
        'type': offer.type,
      }, callType);
    }
  }

  Future<void> acceptCall(String currentUserId) async {
    if (_peerId == null || _remoteOffer == null || state == CallState.connecting || state == CallState.connected) return;
    _currentUserId = currentUserId;
    
    _setState(CallState.connecting);
    
    final stream = await _mediaService.getUserMedia(isVideo: _callType == 'video');
    if (stream != null) {
      localRenderer.srcObject = stream;
      if (_callType == 'video') runtimeStateBinder.setCameraActive(true);
      runtimeStateBinder.setMicActive(true);
    }

    await _peerConnectionService.initialize();
    
    _peerConnectionService.onIceCandidate = (candidate) {
      _signalingService.emitIceCandidate(_peerId!, {
        'candidate': candidate.candidate,
        'sdpMid': candidate.sdpMid,
        'sdpMLineIndex': candidate.sdpMLineIndex,
      });
    };
    
    _peerConnectionService.onAddTrack = (track, receiver) {
      if (track.kind == 'video') {
        remoteRenderer.srcObject = _peerConnectionService.peerConnection?.getRemoteStreams().firstOrNull;
      }
    };
    
    _peerConnectionService.onConnectionState = (pcState) {
      if (pcState == RTCPeerConnectionState.RTCPeerConnectionStateConnected) {
        _setState(CallState.connected);
      } else if (pcState == RTCPeerConnectionState.RTCPeerConnectionStateDisconnected ||
                 pcState == RTCPeerConnectionState.RTCPeerConnectionStateFailed) {
        endCall(emit: true);
      }
    };

    if (stream != null) {
      await _peerConnectionService.addLocalStream(stream);
    }

    await _peerConnectionService.peerConnection?.setRemoteDescription(
      RTCSessionDescription(_remoteOffer['sdp'], _remoteOffer['type']),
    );
    _isRemoteDescriptionSet = true;
    _processQueuedCandidates();

    final answer = await _peerConnectionService.peerConnection?.createAnswer();
    if (answer != null) {
      await _peerConnectionService.peerConnection?.setLocalDescription(answer);
      _signalingService.emitMakeAnswer(_peerId!, {
        'sdp': answer.sdp,
        'type': answer.type,
      });
    }
  }

  void rejectCall(String currentUserId) {
    if (_peerId != null) {
      _signalingService.emitRejectCall(_peerId!, currentUserId);
    }
    _setState(CallState.idle);
    _remoteOffer = null;
    _peerId = null;
  }

  Future<void> endCall({bool emit = true}) async {
    if (state == CallState.ended || state == CallState.idle) return;
    if (emit && _peerId != null && _currentUserId != null) {
      _signalingService.emitEndCall(_peerId!, _currentUserId!);
    }
    _setState(CallState.ended);
    await _cleanup();
  }

  Future<void> _processQueuedCandidates() async {
    for (final candidate in _remoteIceCandidates) {
      await _peerConnectionService.peerConnection?.addCandidate(candidate);
    }
    _remoteIceCandidates.clear();
    queuedIceCount = 0;
    notifyListeners();
  }

  Future<void> _cleanup() async {
    runtimeStateBinder.setCameraActive(false);
    runtimeStateBinder.setMicActive(false);
    await _mediaService.dispose();
    await _peerConnectionService.dispose();
    localRenderer.srcObject = null;
    remoteRenderer.srcObject = null;
    _peerId = null;
    _currentUserId = null;
    _remoteOffer = null;
    _isRemoteDescriptionSet = false;
    _remoteIceCandidates.clear();
    queuedIceCount = 0;
    // Keep signaling listeners alive for subsequent incoming calls
  }

  void toggleCamera(bool enabled) {
    _mediaService.toggleCamera(enabled);
    notifyListeners();
  }

  void toggleMic(bool enabled) {
    _mediaService.toggleMicrophone(!enabled); // localMediaService expects 'isMuted' which is !enabled
    notifyListeners();
  }
}
