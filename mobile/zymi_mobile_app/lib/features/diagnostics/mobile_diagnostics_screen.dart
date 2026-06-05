import 'dart:async';
import 'package:flutter/material.dart';
import '../../services/realtime/zymi_socket_client.dart';
import '../call/controllers/call_controller.dart';
import '../../core/runtime/app_runtime_state.dart';
import '../../core/theme/zymi_brand_colors.dart';

class MobileDiagnosticsScreen extends StatefulWidget {
  const MobileDiagnosticsScreen({super.key});

  @override
  State<MobileDiagnosticsScreen> createState() => _MobileDiagnosticsScreenState();
}

class _MobileDiagnosticsScreenState extends State<MobileDiagnosticsScreen> {
  final ZymiSocketClient _socketClient = ZymiSocketClient();
  final CallController _callController = CallController();
  StreamSubscription<ZymiSocketStatus>? _socketSub;

  @override
  void initState() {
    super.initState();
    _socketSub = _socketClient.statusStream.listen((_) {
      if (mounted) setState(() {});
    });
    _callController.addListener(_update);
  }

  @override
  void dispose() {
    _socketSub?.cancel();
    _callController.removeListener(_update);
    super.dispose();
  }

  void _update() {
    if (mounted) setState(() {});
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0f172a),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            const Text('Mobile Diagnostics', style: TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.bold)),
            const SizedBox(height: 24),
            _buildCard('Socket Engine', [
              _row('Status', _socketClient.isConnected ? 'Connected' : 'Offline'),
            ]),
            const SizedBox(height: 16),
            _buildCard('Call Engine', [
              _row('State', _callController.state.name),
              _row('Peer State', _callController.peerConnectionState ?? 'None'),
              _row('ICE State', _callController.iceConnectionState ?? 'None'),
              _row('Queued ICE', '${_callController.queuedIceCount}'),
            ]),
            const SizedBox(height: 16),
            _buildCard('Ad Gate Constraints', [
              _row('isInCall', appRuntimeState.isInCall.toString()),
              _row('isConnectingCall', appRuntimeState.isConnectingCall.toString()),
              _row('canShowAds', appRuntimeState.canShowAds.toString()),
              _row('isInGracePeriod', appRuntimeState.isInGracePeriod.toString()),
            ]),
          ],
        ),
      ),
    );
  }

  Widget _buildCard(String title, List<Widget> children) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(color: Colors.white10, borderRadius: BorderRadius.circular(12)),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: const TextStyle(color: ZymiColors.primary, fontWeight: FontWeight.bold, fontSize: 18)),
          const Divider(color: Colors.white24, height: 24),
          ...children,
        ],
      ),
    );
  }

  Widget _row(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: const TextStyle(color: Colors.white70)),
          Text(value, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
        ],
      ),
    );
  }
}
