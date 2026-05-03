abstract class ZymiRealtimeContract {
  void onMessageReceived(Map<String, dynamic> data);
  void onIncomingCall(Map<String, dynamic> data);
  void onCallEnded(Map<String, dynamic> data);
  void onUserTyping(String userId);
  void onUserStopTyping(String userId);
  void onPresenceChanged(String userId, bool isOnline);
}
