import '../../../services/connectivity/ice_server_service.dart';

class IceServerConfigLoader {
  static Future<Map<String, dynamic>> loadConfig({String? country, String? token}) async {
    final List<Map<String, dynamic>> iceServers = await IceServerService.fetchIceServers(
      country: country,
      token: token,
    );

    return {
      'iceServers': iceServers,
    };
  }
}
