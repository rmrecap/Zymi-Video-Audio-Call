import 'dart:async';
import 'package:flutter/material.dart';
import '../../services/realtime/zymi_socket_client.dart';
import '../chat/screens/conversation_list_screen.dart';
import '../call/call_placeholder_screen.dart';
import '../nearby/screens/nearby_screen.dart';
import '../diagnostics/mobile_diagnostics_screen.dart';
import '../../services/api/auth_service.dart';
import '../verification/widgets/verification_status_bar.dart';
import '../../core/navigation/zymi_routes.dart';
import '../profile/screens/profile_screen.dart';
import '../call/controllers/call_controller.dart';
import '../call/screens/incoming_call_screen.dart';
import '../../core/widgets/skeleton_placeholder.dart';

class ZymiMobileHome extends StatefulWidget {
  const ZymiMobileHome({super.key});

  @override
  State<ZymiMobileHome> createState() => _ZymiMobileHomeState();
}

class _ZymiMobileHomeState extends State<ZymiMobileHome> {
  int _currentIndex = 0;
  String? _localUserId;
  Map<String, dynamic>? _user;

  final ZymiSocketClient _socketClient = ZymiSocketClient();
  final AuthService _authService = AuthService();
  StreamSubscription<ZymiSocketStatus>? _socketSub;
  final CallController _callController = CallController();

  @override
  void initState() {
    super.initState();
    _socketSub = _socketClient.statusStream.listen((_) {
      if (mounted) setState(() {});
    });
    _callController.addListener(_handleCallStateChange);
    _initAuthAndSocket();
  }

  void _handleCallStateChange() {
    if (_callController.state == CallState.incomingRinging) {
      // Show incoming call screen
      Navigator.of(context).push(
        MaterialPageRoute(
          builder: (_) => IncomingCallScreen(
            callerId: 'Incoming Call', // In a real app, get this from controller
            callType: 'video', // In a real app, get this from controller
            currentUserId: _localUserId ?? '',
            onReject: () => _callController.rejectCall(_localUserId ?? ''),
            onAccept: () => _callController.acceptCall(_localUserId ?? ''),
          ),
        ),
      );
    }
  }

  Future<void> _initAuthAndSocket() async {
    try {
      final user = await _authService.getMe();
      if (user != null && mounted) {
        setState(() {
          _user = user;
          _localUserId = user['id'].toString();
        });
        _socketClient.connect(_localUserId!);
        return;
      }
    } catch (e) {
      debugPrint('[HOME] Auth init failed: $e');
    }
    // Not authenticated or network error — redirect to login
    if (mounted) {
      Navigator.pushReplacementNamed(context, ZymiRoutes.login);
    }
  }

  @override
  void dispose() {
    _socketSub?.cancel();
    _callController.removeListener(_handleCallStateChange);
    super.dispose();
  }

  Widget _buildBody() {
    if (_localUserId == null) {
      return const HomeSkeleton();
    }

    return Column(
      children: [
        if (_user != null)
          VerificationStatusBar(
            completionPercentage: _user!['profile_completion'] ?? 40,
            emailVerified: _user!['email_verified'] == 1,
            phoneVerified: _user!['phone_verified'] == 1,
            onTap: () async {
              final result = await Navigator.pushNamed(context, ZymiRoutes.profileVerification);
              if (result == true) _initAuthAndSocket();
            },
          ),
        Expanded(
          child: _buildCurrentPage(),
        ),
      ],
    );
  }

  Widget _buildCurrentPage() {
    switch (_currentIndex) {
      case 0: return const ConversationListScreen();
      case 1: return const CallPlaceholderScreen();
      case 2: return const NearbyScreen();
      case 3: return const ProfileScreen();
      case 4: return const MobileDiagnosticsScreen();
      default: return const Center(child: Text('Unknown'));
    }
  }

  @override
  Widget build(BuildContext context) {
    return WillPopScope(
      onWillPop: () async => false,
      child: Scaffold(
      backgroundColor: const Color(0xFF0f172a),
      appBar: AppBar(
        automaticallyImplyLeading: false,
        backgroundColor: const Color(0xFF1e293b),
        title: Row(
          children: [
            const Text('ZYMI', style: TextStyle(fontWeight: FontWeight.bold, letterSpacing: 1.5)),
            const Spacer(),
            if (_localUserId != null)
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                decoration: BoxDecoration(
                  color: _socketClient.isConnected ? Colors.green.withAlpha(50) : Colors.red.withAlpha(50),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: _socketClient.isConnected ? Colors.green : Colors.red),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(
                      _socketClient.isConnected ? Icons.wifi : Icons.wifi_off,
                      size: 14,
                      color: _socketClient.isConnected ? Colors.green : Colors.red,
                    ),
                    const SizedBox(width: 6),
                    Text(
                      _socketClient.isConnected ? 'Connected' : 'Offline',
                      style: TextStyle(
                        fontSize: 12,
                        color: _socketClient.isConnected ? Colors.green : Colors.red,
                      ),
                    ),
                  ],
                ),
              ),
            IconButton(
              icon: const Icon(Icons.notifications_none),
              onPressed: () => Navigator.pushNamed(context, ZymiRoutes.notifications),
            ),
            IconButton(
              icon: const Icon(Icons.logout),
              onPressed: () async {
                await _authService.logout();
                if (context.mounted) {
                  Navigator.pushReplacementNamed(context, ZymiRoutes.login);
                }
              },
            ),
          ],
        ),
      ),
      body: _buildBody(),
      bottomNavigationBar: _localUserId == null ? null : BottomNavigationBar(
        backgroundColor: const Color(0xFF1e293b),
        selectedItemColor: Colors.blueAccent,
        unselectedItemColor: Colors.white54,
        currentIndex: _currentIndex,
        type: BottomNavigationBarType.fixed,
        onTap: (idx) => setState(() => _currentIndex = idx),
        items: const [
          BottomNavigationBarItem(icon: Icon(Icons.chat_bubble_outline), label: 'Chat'),
          BottomNavigationBarItem(icon: Icon(Icons.call_outlined), label: 'Calls'),
          BottomNavigationBarItem(icon: Icon(Icons.radar), label: 'Nearby'),
          BottomNavigationBarItem(icon: Icon(Icons.person_outline), label: 'Profile'),
        ],
      ),
      ),
    );
  }
}
