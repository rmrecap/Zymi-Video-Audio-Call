enum CallPreflightStatus {
  idle,
  checkingPermission,
  permissionDenied,
  ready,
  blockedByAdGate,
  blockedByActiveChat,
  failed,
}

class CallPreflightState {
  CallPreflightStatus status;
  bool hasMicPermission;
  bool hasCameraPermission;
  String? errorMessage;

  CallPreflightState({
    this.status = CallPreflightStatus.idle,
    this.hasMicPermission = false,
    this.hasCameraPermission = false,
    this.errorMessage,
  });

  bool get isReady => status == CallPreflightStatus.ready;
}
