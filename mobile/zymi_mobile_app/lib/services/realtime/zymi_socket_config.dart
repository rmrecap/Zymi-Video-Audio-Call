class ZymiSocketConfig {
  static const String baseUrl = String.fromEnvironment('API_URL', defaultValue: 'https://zymi-server.onrender.com');
  
  /// Get socket options for the UI (Main Isolate) socket connection.
  /// type=UI identifies this as the volatile view socket.
  static Map<String, dynamic> getOptions(String token) {
    return {
      'transports': ['websocket'],
      'autoConnect': false,
      'reconnection': true,
      'reconnectionAttempts': 5,
      'reconnectionDelay': 1000,
      'reconnectionDelayMax': 5000,
      'timeout': 10000,
      'auth': {
        'token': token,
        'type': 'UI', // Socket Type Protocol: volatile UI socket
      },
    };
  }
}
