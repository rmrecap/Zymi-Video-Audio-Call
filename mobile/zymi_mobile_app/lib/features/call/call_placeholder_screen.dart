import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import '../../core/config/app_config.dart';
import '../../core/navigation/zymi_routes.dart';
import '../../core/theme/zymi_brand_colors.dart';
import '../../services/api/auth_service.dart';

class CallPlaceholderScreen extends StatefulWidget {
  const CallPlaceholderScreen({super.key});

  @override
  State<CallPlaceholderScreen> createState() => _CallPlaceholderScreenState();
}

class _CallPlaceholderScreenState extends State<CallPlaceholderScreen> {
  final AuthService _authService = AuthService();
  List<Map<String, dynamic>> _callHistory = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadCallHistory();
  }

  Future<void> _loadCallHistory() async {
    try {
      final user = await _authService.getMe();
      final userId = user?['id'];
      if (userId == null || !mounted) {
        setState(() => _isLoading = false);
        return;
      }
      final token = await _authService.getToken();
      if (token == null || !mounted) {
        setState(() => _isLoading = false);
        return;
      }
      final res = await http.get(
        Uri.parse('${AppConfig.apiUrl}/api/calls/$userId'),
        headers: {'Authorization': 'Bearer $token'},
      ).timeout(const Duration(seconds: 15));
      if (mounted) {
        if (res.statusCode == 200) {
          setState(() {
            _callHistory = (jsonDecode(res.body) as List).map((e) => Map<String, dynamic>.from(e)).toList();
            _isLoading = false;
          });
        } else {
          setState(() => _isLoading = false);
        }
      }
    } catch (_) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Calls'),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: ZymiColors.primary))
          : _callHistory.isEmpty
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.call_end, size: 64, color: ZymiColors.textMuted.withValues(alpha: 0.5)),
                      const SizedBox(height: 16),
                      const Text('No call history', style: TextStyle(color: ZymiColors.textMuted, fontSize: 18)),
                      const SizedBox(height: 8),
                      const Text('Your recent calls will appear here', style: TextStyle(color: ZymiColors.textMuted, fontSize: 14)),
                    ],
                  ),
                )
              : RefreshIndicator(
                  onRefresh: _loadCallHistory,
                  child: ListView.separated(
                    padding: const EdgeInsets.symmetric(vertical: 8),
                    itemCount: _callHistory.length,
                    separatorBuilder: (_, __) => Divider(height: 1, color: ZymiColors.textMuted.withValues(alpha: 0.15)),
                    itemBuilder: (context, index) {
                      final call = _callHistory[index];
                      final callerId = call['caller_id']?.toString() ?? '';
                      final receiverId = call['receiver_id']?.toString() ?? '';
                      final callType = call['call_type'] ?? 'audio';
                      final status = call['status'] ?? '';
                      final isMissed = status == 'missed' || status == 'no_answer';
                      final isIncoming = call['direction'] == 'incoming';
                      final duration = call['duration'] != null ? _formatDuration(call['duration']) : null;
                      final timestamp = call['started_at'] ?? call['created_at'] ?? '';
                      final peerName = call['peer_name'] ?? 'Unknown';

                      return ListTile(
                        leading: CircleAvatar(
                          backgroundColor: isMissed
                              ? ZymiColors.danger.withValues(alpha: 0.15)
                              : ZymiColors.surface,
                          child: Icon(
                            callType == 'video' ? Icons.videocam : Icons.call,
                            color: isMissed ? ZymiColors.danger : ZymiColors.primary,
                            size: 20,
                          ),
                        ),
                        title: Text(
                          peerName,
                          style: TextStyle(
                            fontWeight: isMissed ? FontWeight.bold : FontWeight.normal,
                            color: isMissed ? ZymiColors.danger : ZymiColors.textPrimary,
                          ),
                        ),
                        subtitle: Text(
                          '${_formatTimestamp(timestamp)}${duration != null ? ' · $duration' : ''}',
                          style: const TextStyle(color: ZymiColors.textSecondary, fontSize: 12),
                        ),
                        trailing: IconButton(
                          icon: const Icon(Icons.call_outlined, color: ZymiColors.primary, size: 20),
                          onPressed: () {
                            Navigator.pushNamed(context, ZymiRoutes.callPreflight, arguments: {
                              'peerId': isIncoming ? callerId : receiverId,
                              'peerName': peerName,
                              'isVideo': callType == 'video',
                            });
                          },
                        ),
                      );
                    },
                  ),
                ),
    );
  }

  String _formatDuration(dynamic seconds) {
    final totalSec = seconds is int ? seconds : int.tryParse(seconds.toString()) ?? 0;
    final min = totalSec ~/ 60;
    final sec = totalSec % 60;
    return '${min.toString().padLeft(2, '0')}:${sec.toString().padLeft(2, '0')}';
  }

  String _formatTimestamp(String ts) {
    if (ts.isEmpty) return '';
    try {
      final dt = DateTime.parse(ts);
      final now = DateTime.now();
      final diff = now.difference(dt);
      if (diff.inDays == 0) return 'Today, ${dt.hour}:${dt.minute.toString().padLeft(2, '0')}';
      if (diff.inDays == 1) return 'Yesterday, ${dt.hour}:${dt.minute.toString().padLeft(2, '0')}';
      return '${dt.month}/${dt.day}, ${dt.hour}:${dt.minute.toString().padLeft(2, '0')}';
    } catch (_) {
      return ts;
    }
  }
}
