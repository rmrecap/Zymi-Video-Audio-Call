import 'package:flutter/material.dart';
import '../../features/home/zymi_mobile_home.dart';
import '../../features/chat/screens/conversation_list_screen.dart';
import '../../features/chat/screens/conversation_screen.dart';
import '../../features/call/call_placeholder_screen.dart';
import '../../features/diagnostics/mobile_diagnostics_screen.dart';
import '../../features/auth/screens/login_screen.dart';
import '../../features/auth/screens/register_screen.dart';
import '../../features/auth/screens/forgot_password_screen.dart';
import '../../features/verification/screens/profile_verification_screen.dart';
import '../../features/verification/screens/email_otp_screen.dart';
import '../../features/verification/screens/phone_otp_screen.dart';
import '../../features/notifications/screens/notification_center_screen.dart';
import '../../features/profile/screens/profile_screen.dart';
import '../../features/call/call_preflight_screen.dart';
import '../../features/profile/screens/contact_detail_screen.dart';
import '../../features/admin/screens/admin_dashboard_screen.dart';

class ZymiRoutes {
  static const String home = '/home';
  static const String chat = '/chat';
  static const String chatList = '/chat_list';
  static const String calls = '/calls';
  static const String nearby = '/nearby';
  static const String debug = '/debug';
  static const String settings = '/settings';
  static const String login = '/login';
  static const String register = '/register';
  static const String forgotPassword = '/forgot_password';
  static const String profileVerification = '/profile_verification';
  static const String emailOtp = '/email_otp';
  static const String phoneOtp = '/phone_otp';
  static const String notifications = '/notifications';
  static const String profile = '/profile';
  static const String contactDetail = '/contact_detail';
  static const String callPreflight = '/call_preflight';
  static const String adminPanel = '/admin_panel';

  static Route<dynamic> onGenerateRoute(RouteSettings settings) {
    switch (settings.name) {
      case home:
        return MaterialPageRoute(builder: (_) => const ZymiMobileHome());
      case login:
        return MaterialPageRoute(builder: (_) => const LoginScreen());
      case register:
        return MaterialPageRoute(builder: (_) => const RegisterScreen());
      case forgotPassword:
        return MaterialPageRoute(builder: (_) => const ForgotPasswordScreen());
      case profileVerification:
        return MaterialPageRoute(builder: (_) => const ProfileVerificationScreen());
      case emailOtp:
        final email = settings.arguments as String?;
        return MaterialPageRoute(builder: (_) => EmailOtpScreen(initialEmail: email));
      case phoneOtp:
        return MaterialPageRoute(builder: (_) => const PhoneOtpScreen());
      case chat:
        final args = settings.arguments as Map<String, dynamic>?;
        return MaterialPageRoute(
          builder: (_) => ConversationScreen(
            peerId: args?['peerId'] ?? '',
            peerName: args?['peerName'] ?? 'Unknown',
          ),
        );
      case chatList:
        return MaterialPageRoute(builder: (_) => const ConversationListScreen());
      case calls:
        return MaterialPageRoute(builder: (_) => const CallPlaceholderScreen());
      case debug:
        return MaterialPageRoute(builder: (_) => const MobileDiagnosticsScreen());
      case notifications:
        return MaterialPageRoute(builder: (_) => const NotificationCenterScreen());
      case profile:
        return MaterialPageRoute(builder: (_) => const ProfileScreen());
      case contactDetail:
        final args = settings.arguments as Map<String, dynamic>?;
        return MaterialPageRoute(
          builder: (_) => ContactDetailScreen(
            userId: args?['userId'] ?? '',
            username: args?['username'] ?? 'User',
          ),
        );
      case callPreflight:
        final args = settings.arguments as Map<String, dynamic>?;
        return MaterialPageRoute(
          builder: (_) => CallPreflightScreen(
            peerId: args?['peerId'] ?? '',
            peerName: args?['peerName'] ?? 'Unknown',
            isVideo: args?['isVideo'] ?? false,
          ),
        );
      case adminPanel:
        return MaterialPageRoute(builder: (_) => const AdminDashboardScreen());
      default:
        return MaterialPageRoute(builder: (_) => const ZymiMobileHome());
    }
  }
}
