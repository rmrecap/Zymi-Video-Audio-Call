import 'dart:async';
import 'package:flutter/material.dart';
import 'package:permission_handler/permission_handler.dart';
import '../../services/realtime/zymi_socket_client.dart';
import '../chat/screens/conversation_list_screen.dart';
import '../call/call_placeholder_screen.dart';
import '../nearby/screens/nearby_screen.dart';
import '../friend_requests_screen.dart';
import '../diagnostics/mobile_diagnostics_screen.dart';
import '../../services/api/auth_service.dart';
import '../../services/api/nearby_service.dart';
import '../../core/utils/location_utils.dart';
import '../verification/widgets/verification_status_bar.dart';
import '../../core/navigation/zymi_routes.dart';
import '../../core/theme/zymi_brand_colors.dart';
import '../profile/screens/profile_screen.dart';
import '../call/controllers/call_controller.dart';
import '../call/screens/incoming_call_screen.dart';
import '../../core/widgets/skeleton_placeholder.dart';
import '../chat/widgets/user_search_delegate.dart';
import '../../services/api/friend_service.dart';
import '../../services/realtime/zymi_presence_service.dart';
import '../call/call_launcher.dart';

class ZymiMobileHome extends StatefulWidget {
  const ZymiMobileHome({super.key});

  @override
  State<ZymiMobileHome> createState() => _ZymiMobileHomeState();
}

class _ZymiMobileHomeState extends State<ZymiMobileHome> {
  int _currentIndex = 0;
  String? _localUserId;
  Map<String, dynamic>? _user;
  int _pendingRequests = 0;

  final ZymiSocketClient _socketClient = ZymiSocketClient();
  final AuthService _authService = AuthService();
  final FriendService _friendService = FriendService();
  StreamSubscription<ZymiSocketStatus>? _socketSub;
  final CallController _callController = CallController();
  final ZymiPresenceService _presenceService = ZymiPresenceService();

  @override
  void initState() {
    super.initState();
    _presenceService.init();
    _socketSub = _socketClient.statusStream.listen((status) {
      if (!mounted) return;
      if (status == ZymiSocketStatus.authError) {
        _authService.logout();
        Navigator.pushReplacementNamed(context, ZymiRoutes.login);
        return;
      }
      setState(() {});
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
            callerId: _callController.peerId ?? 'Unknown Caller',
            callType: _callController.callType ?? 'audio',
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
        final token = await _authService.getToken();
        if (token != null) {
          _socketClient.connect(token);
        }
        // Request hardware permissions at boot
        initializeAppPermissions();
        // Fire-and-forget location update so the user appears on nearby discovery
        _updateLocation();
        // Load pending friend request count
        _fetchPendingRequestCount();
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

  Future<void> initializeAppPermissions() async {
    Map<Permission, PermissionStatus> statuses = await [
      Permission.location,
      Permission.camera,
      Permission.microphone,
    ].request();

    if (!mounted) return;

    if (statuses[Permission.location]!.isDenied) {
      final goSettings = await showDialog<bool>(
        context: context,
        builder: (ctx) => AlertDialog(
          backgroundColor: ZymiColors.surface,
          title: const Text('Location Required', style: TextStyle(color: Colors.white)),
          content: const Text(
            'Nearby discovery needs location access. Open settings to enable it.',
            style: TextStyle(color: ZymiColors.textSecondary),
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel', style: TextStyle(color: ZymiColors.textMuted))),
            TextButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Open Settings', style: TextStyle(color: ZymiColors.primary))),
          ],
        ),
      );
      if (goSettings == true) {
        openAppSettings();
      }
    }
  }

  Future<void> _updateLocation() async {
    try {
      final pos = await LocationUtils.getCurrentPosition();
      if (pos != null) {
        final nearbyService = NearbyService();
        await nearbyService.updateLocation(pos.latitude, pos.longitude);
        debugPrint('[HOME] Location updated for nearby discovery');
      }
    } catch (e) {
      debugPrint('[HOME] Location update skipped: $e');
    }
  }

  Future<void> _fetchPendingRequestCount() async {
    try {
      final requests = await _friendService.getPendingRequests();
      if (mounted) setState(() => _pendingRequests = requests.length);
    } catch (_) {}
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
    return PopScope(
      canPop: false,
      child: Scaffold(
      backgroundColor: ZymiColors.background,
      appBar: AppBar(
        automaticallyImplyLeading: false,
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
              icon: const Icon(Icons.search),
              onPressed: () async {
                final result = await showSearch<Map<String, dynamic>?>(context: context, delegate: UserSearchDelegate());
                if (result != null && context.mounted) {
                  final peerId = result['peerId'] as String?;
                  final peerName = result['peerName'] as String? ?? 'Unknown';
                  final action = result['action'] as String?;
                  if (peerId == null || action == null) return;
                  if (action == 'chat') {
                    Navigator.pushNamed(context, ZymiRoutes.chat, arguments: {'peerId': peerId, 'peerName': peerName});
                  } else if (action == 'audioCall') {
                    CallLauncher.startCall(context, peerId: peerId, peerName: peerName);
                  } else if (action == 'videoCall') {
                    CallLauncher.startCall(context, peerId: peerId, peerName: peerName, isVideo: true);
                  }
                }
              },
            ),
            IconButton(
              icon: const Icon(Icons.people_outline),
              onPressed: () => Navigator.pushNamed(context, ZymiRoutes.friendsList),
            ),
            Stack(
              children: [
                IconButton(
                  icon: const Icon(Icons.person_add_outlined),
                  onPressed: () async {
                    await Navigator.push(context, MaterialPageRoute(builder: (_) => const FriendRequestsScreen()));
                    _fetchPendingRequestCount();
                  },
                ),
                if (_pendingRequests > 0)
                  Positioned(
                    right: 6,
                    top: 6,
                    child: Container(
                      padding: const EdgeInsets.all(4),
                      decoration: const BoxDecoration(color: ZymiColors.danger, shape: BoxShape.circle),
                      child: Text(
                        '$_pendingRequests',
                        style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold),
                      ),
                    ),
                  ),
              ],
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
        backgroundColor: ZymiColors.surface,
        selectedItemColor: ZymiColors.primary,
        unselectedItemColor: ZymiColors.textMuted,
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
