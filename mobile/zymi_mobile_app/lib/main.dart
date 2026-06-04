import 'package:flutter/material.dart';
import 'core/navigation/zymi_routes.dart';
import 'core/runtime/app_lifecycle_handler.dart';
import 'services/api/auth_service.dart';
import 'services/realtime/background_socket_service.dart';
import 'package:flutter_background_service/flutter_background_service.dart';
import 'features/calls/call_sync_service.dart';
import 'services/governance/policy_gate_service.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  String initialRoute;
  try {
    WidgetsBinding.instance.addObserver(ZymiAppLifecycleObserver());

    final authService = AuthService();
    final token = await authService.getToken();

    if (token != null) {
      await BackgroundSocketService.initializeService();
      FlutterBackgroundService().on('sync_ui_state').listen((event) {
        if (event != null) {
          CallSyncService.handleSyncState(event);
        }
      });
      FlutterBackgroundService().on('policy_update').listen((event) {
        if (event != null) {
          PolicyGateService().updateFromDaemon(Map<String, dynamic>.from(event));
        }
      });
      FlutterBackgroundService().on('nearby_settings_update').listen((event) {
        if (event != null) {
          final radius = event['radius'] as int? ?? 10000;
          final fuzzing = event['fuzzing'] == true;
          PolicyGateService().updateNearbySettings(radius, fuzzing);
        }
      });
    }

    initialRoute = token != null ? ZymiRoutes.home : ZymiRoutes.login;
  } catch (e) {
    debugPrint('[MAIN] Startup error, falling back to login: $e');
    initialRoute = ZymiRoutes.login;
  }

  runApp(MyApp(initialRoute: initialRoute));
}

class MyApp extends StatelessWidget {
  final String initialRoute;
  const MyApp({super.key, required this.initialRoute});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'ZYMI',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        brightness: Brightness.dark,
        primaryColor: Colors.blueAccent,
        scaffoldBackgroundColor: const Color(0xFF0f172a),
      ),
      onGenerateRoute: ZymiRoutes.onGenerateRoute,
      initialRoute: initialRoute,
    );
  }
}
