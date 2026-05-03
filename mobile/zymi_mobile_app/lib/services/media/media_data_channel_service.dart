import 'dart:async';
import 'dart:typed_data';
import 'package:flutter_webrtc/flutter_webrtc.dart';
import '../../services/realtime/zymi_socket_client.dart';
import '../../features/call/services/ice_server_config.dart';

class MediaDataChannelService {
  RTCPeerConnection? _peerConnection;
  RTCDataChannel? _dataChannel;
  final String peerId;
  final String fileId;
  final bool isSender;

  final _onMessageController = StreamController<dynamic>.broadcast();
  Stream<dynamic> get onMessage => _onMessageController.stream;

  final _onStateChangeController = StreamController<RTCDataChannelState>.broadcast();
  Stream<RTCDataChannelState> get onStateChange => _onStateChangeController.stream;

  MediaDataChannelService({
    required this.peerId,
    required this.fileId,
    required this.isSender,
  });

  Future<void> init({String? token}) async {
    final configuration = await IceServerConfigLoader.loadConfig(token: token);

    _peerConnection = await createPeerConnection(configuration);

    if (isSender) {
      RTCDataChannelInit init = RTCDataChannelInit()
        ..binaryType = 'arraybuffer'
        ..ordered = true;
      _dataChannel = await _peerConnection!.createDataChannel('media-transfer-$fileId', init);
      _setupDataChannelListeners();

      RTCSessionDescription offer = await _peerConnection!.createOffer();
      await _peerConnection!.setLocalDescription(offer);

      ZymiSocketClient().emitSafe('media-transfer-offer', {
        'to': peerId,
        'fileId': fileId,
        'metadata': {'sdp': offer.sdp, 'type': offer.type}
      });
    } else {
      _peerConnection!.onDataChannel = (channel) {
        _dataChannel = channel;
        _setupDataChannelListeners();
      };
    }

    _peerConnection!.onIceCandidate = (candidate) {
      // Ice candidates are usually handled via signaling, but for simplicity we'll assume host-only for now or bundle them.
      // In a full implementation, we'd emit 'media-ice-candidate'
    };
  }

  void _setupDataChannelListeners() {
    _dataChannel!.onMessage = (data) {
      _onMessageController.add(data.binary);
    };

    _dataChannel!.onDataChannelState = (state) {
      _onStateChangeController.add(state);
    };
  }

  Future<void> handleAnswer(Map<String, dynamic> signalData) async {
    RTCSessionDescription description = RTCSessionDescription(signalData['sdp'], signalData['type']);
    await _peerConnection!.setRemoteDescription(description);
  }

  Future<void> acceptOffer(Map<String, dynamic> offerData) async {
    RTCSessionDescription description = RTCSessionDescription(offerData['sdp'], offerData['type']);
    await _peerConnection!.setRemoteDescription(description);

    RTCSessionDescription answer = await _peerConnection!.createAnswer();
    await _peerConnection!.setLocalDescription(answer);

    ZymiSocketClient().emitSafe('media-transfer-accept', {
      'to': peerId,
      'fileId': fileId,
      'signalData': {'sdp': answer.sdp, 'type': answer.type}
    });
  }

  Future<void> sendChunk(List<int> chunk) async {
    if (_dataChannel?.state == RTCDataChannelState.RTCDataChannelOpen) {
      _dataChannel!.send(RTCDataChannelMessage.fromBinary(Uint8List.fromList(chunk)));
    }
  }

  Future<void> dispose() async {
    await _dataChannel?.close();
    await _peerConnection?.close();
    await _onMessageController.close();
    await _onStateChangeController.close();
  }
}
