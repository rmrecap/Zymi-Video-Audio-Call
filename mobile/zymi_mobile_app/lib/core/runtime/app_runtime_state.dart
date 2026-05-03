class AppRuntimeState {
  bool isInCall = false;
  bool isRinging = false;
  bool isConnectingCall = false;
  bool isCameraActive = false;
  bool isMicActive = false;
  bool isTyping = false;
  bool isComposerFocused = false;
  DateTime? _lastCallEndedTime;

  void setLastCallEndedTime(DateTime time) {
    _lastCallEndedTime = time;
  }

  bool get isInGracePeriod {
    if (_lastCallEndedTime == null) return false;
    final elapsed = DateTime.now().difference(_lastCallEndedTime!).inSeconds;
    return elapsed < 10; // 10 seconds grace period
  }

  bool get canShowAds {
    if (isInCall || isRinging || isConnectingCall) return false;
    if (isCameraActive || isMicActive) return false;
    if (isTyping || isComposerFocused) return false;
    if (isInGracePeriod) return false;
    return true;
  }
}

final appRuntimeState = AppRuntimeState();
