import 'package:socket_io_client/socket_io_client.dart' as io;

class ZymiSocketConfig {
  static const String baseUrl = String.fromEnvironment('API_URL', defaultValue: 'https://zymi-server.onrender.com');
  
  /// Get socket options for the UI (Main Isolate) socket connection.
  /// type=UI identifies this as the volatile view socket.
  static Map<String, dynamic> getOptions(String token) {
    final Map<String, dynamic> options = io.OptionBuilder()
        .setTransports(['websocket'])
        .enableForceNew()
        .disableAutoConnect()
        .enableReconnection()
        .setAuth({
          'token': token,
          'type': 'UI', // Socket Type Protocol: volatile UI socket
        })
        .build();

    print('[Socket Config] Main UI Socket connection attempt. Transports: ${options['transports']}');

    options.addAll({
      'reconnectionAttempts': 5,
      'reconnectionDelay': 1000,
      'reconnectionDelayMax': 5000,
      'timeout': 10000,
    });

    return options;
  }
}

