class ZymiSocketConfig {
  static const String baseUrl = String.fromEnvironment('API_URL', defaultValue: 'http://localhost:5001');
  
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
