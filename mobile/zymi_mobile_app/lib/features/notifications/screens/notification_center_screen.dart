import 'package:flutter/material.dart';
import '../../../services/api/notification_service.dart';
import '../../../services/api/auth_service.dart';
import '../widgets/notification_tile.dart';

class NotificationCenterScreen extends StatefulWidget {
  const NotificationCenterScreen({super.key});

  @override
  State<NotificationCenterScreen> createState() => _NotificationCenterScreenState();
}

class _NotificationCenterScreenState extends State<NotificationCenterScreen> {
  List<dynamic> _notifications = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadNotifications();
  }

  Future<void> _loadNotifications() async {
    try {
      final token = await AuthService().getToken();
      if (token != null) {
        final data = await NotificationService.fetchNotifications(token);
        setState(() {
          _notifications = data;
          _isLoading = false;
        });
      }
    } catch (e) {
      setState(() => _isLoading = false);
    }
  }

  Future<void> _markAllRead() async {
    try {
      final token = await AuthService().getToken();
      if (token != null) {
        await NotificationService.markAllRead(token);
        setState(() {
          for (var n in _notifications) {
            n['is_read'] = 1;
          }
        });
      }
    } catch (e) {
      // Handle error
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0F172A), // Slate 900
      appBar: AppBar(
        title: const Text('Notifications', style: TextStyle(color: Colors.white)),
        backgroundColor: const Color(0xFF1E293B), // Slate 800
        iconTheme: const IconThemeData(color: Colors.white),
        actions: [
          IconButton(
            icon: const Icon(Icons.done_all),
            onPressed: _markAllRead,
            tooltip: 'Mark all as read',
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: Colors.blue))
          : _notifications.isEmpty
              ? _buildEmptyState()
              : RefreshIndicator(
                  onRefresh: _loadNotifications,
                  child: ListView.builder(
                    padding: const EdgeInsets.symmetric(vertical: 8),
                    itemCount: _notifications.length,
                    itemBuilder: (context, index) {
                      return NotificationTile(
                        notification: _notifications[index],
                        onTap: () async {
                          final token = await AuthService().getToken();
                          if (token != null) {
                            await NotificationService.markRead(_notifications[index]['id'], token);
                            setState(() {
                              _notifications[index]['is_read'] = 1;
                            });
                          }
                        },
                      );
                    },
                  ),
                ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.notifications_none, size: 64, color: const Color(0xFF64748B).withValues(alpha: 0.5)),
          const SizedBox(height: 16),
          Text(
            'No notifications yet',
            style: TextStyle(color: const Color(0xFF64748B).withValues(alpha: 0.5), fontSize: 16),
          ),
        ],
      ),
    );
  }
}
