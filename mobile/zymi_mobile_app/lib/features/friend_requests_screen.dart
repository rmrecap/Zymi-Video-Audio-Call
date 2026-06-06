import 'package:flutter/material.dart';
import '../services/api/friend_service.dart';
import '../core/theme/zymi_brand_colors.dart';

class FriendRequestsScreen extends StatefulWidget {
  const FriendRequestsScreen({super.key});

  @override
  State<FriendRequestsScreen> createState() => _FriendRequestsScreenState();
}

class _FriendRequestsScreenState extends State<FriendRequestsScreen> {
  final FriendService _friendService = FriendService();
  List<Map<String, dynamic>> _requests = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _fetchRequests();
  }

  Future<void> _fetchRequests() async {
    setState(() => _isLoading = true);
    final requests = await _friendService.getPendingRequests();
    if (mounted) setState(() { _requests = requests; _isLoading = false; });
  }

  Future<void> _respond(int requesterId, String action) async {
    final result = await _friendService.respond(requesterId, action);
    if (result['success'] == true || result['status'] == action) {
      _fetchRequests();
      return;
    }
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(result['error'] ?? 'Failed to $action request'), backgroundColor: ZymiColors.danger),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: ZymiColors.background,
      appBar: AppBar(
        backgroundColor: ZymiColors.surface,
        title: const Text('Friend Requests', style: TextStyle(color: Colors.white)),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: ZymiColors.primary))
          : _requests.isEmpty
              ? const Center(child: Text('No pending requests', style: TextStyle(color: ZymiColors.textMuted)))
              : RefreshIndicator(
                  onRefresh: _fetchRequests,
                  child: ListView.builder(
                    itemCount: _requests.length,
                    itemBuilder: (context, index) {
                      final req = _requests[index];
                      return Card(
                        color: ZymiColors.card,
                        margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                        child: ListTile(
                          leading: CircleAvatar(
                            backgroundColor: ZymiColors.primary,
                            child: Text(
                              (req['username'] as String)[0].toUpperCase(),
                              style: const TextStyle(color: Colors.white),
                            ),
                          ),
                          title: Text(req['username'] ?? '', style: const TextStyle(color: Colors.white)),
                          subtitle: const Text('Wants to be friends', style: TextStyle(color: ZymiColors.textSecondary)),
                          trailing: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              IconButton(
                                icon: const Icon(Icons.check, color: ZymiColors.success),
                                onPressed: () => _respond(req['id'], 'accepted'),
                              ),
                              IconButton(
                                icon: const Icon(Icons.close, color: ZymiColors.danger),
                                onPressed: () => _respond(req['id'], 'rejected'),
                              ),
                            ],
                          ),
                        ),
                      );
                    },
                  ),
                ),
    );
  }
}
