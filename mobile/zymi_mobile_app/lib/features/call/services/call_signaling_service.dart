import '../../../services/realtime/zymi_socket_client.dart';
import '../../../services/realtime/zymi_socket_event_names.dart';
import '../../../services/realtime/zymi_identity_normalizer.dart';

class CallSignalingService {
  void emitCallUser(String to, String from, dynamic offer, String type) {
    ZymiSocketClient().emitSafe(ZymiSocketEvents.callUser, {
      'to': ZymiIdentityNormalizer.normalize(to),
      'from': ZymiIdentityNormalizer.normalize(from),
      'offer': offer,
      'type': type,
    });
  }

  void emitMakeAnswer(String to, dynamic answer) {
    ZymiSocketClient().emitSafe(ZymiSocketEvents.makeAnswer, {
      'to': ZymiIdentityNormalizer.normalize(to),
      'answer': answer,
    });
  }

  void emitIceCandidate(String to, dynamic candidate) {
    ZymiSocketClient().emitSafe(ZymiSocketEvents.iceCandidate, {
      'to': ZymiIdentityNormalizer.normalize(to),
      'candidate': candidate,
    });
  }

  void emitEndCall(String to, String from) {
    ZymiSocketClient().emitSafe(ZymiSocketEvents.endCall, {
      'to': ZymiIdentityNormalizer.normalize(to),
      'from': ZymiIdentityNormalizer.normalize(from),
    });
  }

  void emitRejectCall(String to, String from) {
    ZymiSocketClient().emitSafe(ZymiSocketEvents.rejectCall, {
      'to': ZymiIdentityNormalizer.normalize(to),
      'from': ZymiIdentityNormalizer.normalize(from),
    });
  }

  void listenIncomingCall(Function(dynamic) callback) {
    ZymiSocketClient().onSafe(ZymiSocketEvents.incomingCall, callback);
  }

  void listenCallAnswer(Function(dynamic) callback) {
    ZymiSocketClient().onSafe(ZymiSocketEvents.callAnswer, callback);
  }

  void listenIceCandidate(Function(dynamic) callback) {
    ZymiSocketClient().onSafe(ZymiSocketEvents.iceCandidate, callback);
  }

  void listenCallEnded(Function(dynamic) callback) {
    ZymiSocketClient().onSafe(ZymiSocketEvents.callEnded, callback);
  }

  void listenCallRejected(Function(dynamic) callback) {
    ZymiSocketClient().onSafe(ZymiSocketEvents.callRejected, callback);
  }

  void removeListeners() {
    final client = ZymiSocketClient();
    client.offSafe(ZymiSocketEvents.incomingCall);
    client.offSafe(ZymiSocketEvents.callAnswer);
    client.offSafe(ZymiSocketEvents.iceCandidate);
    client.offSafe(ZymiSocketEvents.callEnded);
    client.offSafe(ZymiSocketEvents.callRejected);
  }
}
