import 'app_runtime_state.dart';

class RuntimeStateBinder {
  void setCallRinging(bool active) {
    appRuntimeState.isRinging = active;
  }

  void setCallConnecting(bool active) {
    appRuntimeState.isConnectingCall = active;
  }

  void setCallConnected(bool active) {
    appRuntimeState.isInCall = active;
    if (active) {
      appRuntimeState.isRinging = false;
      appRuntimeState.isConnectingCall = false;
    }
  }

  void setCallEnded() {
    appRuntimeState.isInCall = false;
    appRuntimeState.isRinging = false;
    appRuntimeState.isConnectingCall = false;
    appRuntimeState.isCameraActive = false;
    appRuntimeState.isMicActive = false;
    appRuntimeState.setLastCallEndedTime(DateTime.now());
  }

  void setComposerFocused(bool active) {
    appRuntimeState.isComposerFocused = active;
  }

  void setTyping(bool active) {
    appRuntimeState.isTyping = active;
  }

  void setCameraActive(bool active) {
    appRuntimeState.isCameraActive = active;
  }

  void setMicActive(bool active) {
    appRuntimeState.isMicActive = active;
  }
}

final runtimeStateBinder = RuntimeStateBinder();
