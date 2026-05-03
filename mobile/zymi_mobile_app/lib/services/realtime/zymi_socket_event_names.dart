class ZymiSocketEvents {
  static const String join = 'join';
  static const String privateMessage = 'private-message';
  static const String newMessage = 'new-message';
  static const String typing = 'typing';
  static const String stopTyping = 'stop-typing';
  static const String userTyping = 'user-typing';
  static const String userStopTyping = 'user-stop-typing';
  static const String userOnline = 'user-online';
  static const String userOffline = 'user-offline';
  
  static const String callUser = 'call-user';
  static const String incomingCall = 'incoming-call';
  static const String makeAnswer = 'make-answer';
  static const String callAnswer = 'call-answer';
  static const String iceCandidate = 'ice-candidate';
  static const String endCall = 'end-call';
  static const String callEnded = 'call-ended';
  static const String rejectCall = 'reject-call';
  static const String callRejected = 'call-rejected';
  static const String callTimeout = 'call-timeout';
  static const String callFailed = 'call-failed';
  
  static const String banned = 'banned';
}
