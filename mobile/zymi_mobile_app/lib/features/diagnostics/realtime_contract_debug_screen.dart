import 'package:flutter/material.dart';
import '../../services/realtime/zymi_socket_client.dart';
import '../../services/realtime/zymi_presence_service.dart';
import '../../core/runtime/app_runtime_state.dart';
import '../chat/services/offline_message_queue.dart';
import '../chat/storage/chat_local_cache.dart';
import '../call/controllers/call_controller.dart';

class RealtimeContractDebugScreen extends StatefulWidget {
  const RealtimeContractDebugScreen({super.key});

  @override
  State<RealtimeContractDebugScreen> createState() => _RealtimeContractDebugScreenState();
}

class _RealtimeContractDebugScreenState extends State<RealtimeContractDebugScreen> {
  ZymiSocketStatus _status = ZymiSocketStatus.disconnected;
  int _offlineQueueCount = 0;
  int _cacheCount = 0;
  final CallController _callController = CallController();

  @override
  void initState() {
    super.initState();
    ZymiSocketClient().statusStream.listen((status) {
      if (mounted) setState(() => _status = status);
    });
    _callController.addListener(_onCallStateChanged);
    _loadCounts();
  }

  @override
  void dispose() {
    _callController.removeListener(_onCallStateChanged);
    super.dispose();
  }

  void _onCallStateChanged() {
    if (mounted) setState(() {});
  }

  Future<void> _loadCounts() async {
    final queueCount = await OfflineMessageQueue.getCount();
    final cache = await ChatLocalCache.getCacheCount('user_mobile_user_web');
    if (mounted) {
      setState(() {
        _offlineQueueCount = queueCount;
        _cacheCount = cache;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final presence = ZymiPresenceService();

    return Scaffold(
      backgroundColor: const Color(0xFF0f172a),
      appBar: AppBar(
        title: const Text('Phase 49 Diagnostics'),
        backgroundColor: const Color(0xFF1e293b),
        actions: [
          IconButton(icon: const Icon(Icons.refresh), onPressed: () { _loadCounts(); setState(() {}); }),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          _sectionHeader('Socket & Presence'),
          _statusCard('Socket', _status.name.toUpperCase(),
              _status == ZymiSocketStatus.connected ? Colors.green : Colors.red),
          _statusCard('Online Users', '${presence.onlineUsers.value.length}', Colors.cyan),

          const SizedBox(height: 12),
          _sectionHeader('Chat System'),
          _statusCard('Chat Cache', '$_cacheCount msgs', Colors.blue),
          _statusCard('Offline Queue', '$_offlineQueueCount msgs',
              _offlineQueueCount > 0 ? Colors.orange : Colors.green),

          const SizedBox(height: 12),
          _sectionHeader('WebRTC Engine'),
          _statusCard('Call State', _callController.state.name.toUpperCase(), Colors.amber),
          _statusCard('PC State', _callController.peerConnectionState ?? 'none', Colors.purple),
          _statusCard('ICE State', _callController.iceConnectionState ?? 'none', Colors.purple),
          _statusCard('Queued ICE', '${_callController.queuedIceCount}', Colors.purple),
          _statusCard('Local Tracks', '${_callController.localTracksCount}', Colors.white),
          _statusCard('Remote Tracks', '${_callController.remoteTracksCount}', Colors.white),
          
          const SizedBox(height: 12),
          _sectionHeader('Ad Gate Lock'),
          _statusCard('isConnectingCall', appRuntimeState.isConnectingCall.toString(), Colors.blue),
          _statusCard('isInCall', appRuntimeState.isInCall.toString(), Colors.blue),
          _statusCard('canShowAds', appRuntimeState.canShowAds ? 'ALLOWED' : 'BLOCKED',
              appRuntimeState.canShowAds ? Colors.green : Colors.redAccent),

          const SizedBox(height: 20),
          ElevatedButton(
            onPressed: () => ZymiSocketClient().connect('test-token'),
            child: const Text('Manual Connect'),
          ),
          ElevatedButton(
            onPressed: () => ZymiPresenceService().join('user_mobile'),
            child: const Text('Manual Join'),
          ),
        ],
      ),
    );
  }

  Widget _sectionHeader(String title) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8, top: 4),
      child: Text(title, style: const TextStyle(color: Colors.white, fontSize: 15, fontWeight: FontWeight.bold)),
    );
  }

  Widget _statusCard(String title, String value, Color color) {
    return Card(
      color: const Color(0xFF1e293b),
      margin: const EdgeInsets.only(bottom: 6),
      child: ListTile(
        dense: true,
        title: Text(title, style: const TextStyle(color: Colors.white70, fontSize: 13)),
        trailing: Text(value, style: TextStyle(color: color, fontSize: 13, fontWeight: FontWeight.bold)),
      ),
    );
  }
}
