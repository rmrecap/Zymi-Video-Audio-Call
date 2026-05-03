import 'package:flutter/material.dart';
import 'core/navigation/zymi_routes.dart';
import 'core/runtime/app_lifecycle_handler.dart';
import 'services/api/auth_service.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  WidgetsBinding.instance.addObserver(ZymiAppLifecycleObserver());
  
  final authService = AuthService();
  final token = await authService.getToken();
  final initialRoute = token != null ? ZymiRoutes.home : ZymiRoutes.login;
  
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
