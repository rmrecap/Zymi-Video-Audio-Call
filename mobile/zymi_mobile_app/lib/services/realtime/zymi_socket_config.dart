class ZymiSocketConfig {
  // CRITICAL: For physical device, replace 'localhost' with your PC's LAN IP (e.g., 'http://192.168.1.5:5000')
  static const String baseUrl = 'http://localhost:5000'; 
  
  static Map<String, dynamic> getOptions(String token) {
    return {
      'transports': ['websocket'],
      'autoConnect': false,
      'reconnection': true,
      'reconnectionAttempts': 5,
      'reconnectionDelay': 1000,
      'reconnectionDelayMax': 5000,
      'timeout': 10000,
      'auth': {'token': token},
    };
  }
}
