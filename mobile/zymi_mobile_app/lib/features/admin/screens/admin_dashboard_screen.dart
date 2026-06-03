import 'package:flutter/material.dart';
import '../../../services/api/admin_service.dart';

class AdminDashboardScreen extends StatefulWidget {
  const AdminDashboardScreen({super.key});

  @override
  State<AdminDashboardScreen> createState() => _AdminDashboardScreenState();
}

class _AdminDashboardScreenState extends State<AdminDashboardScreen> {
  final _adminService = AdminService();
  Map<String, dynamic>? _stats;
  List<dynamic> _users = [];
  bool _isLoading = true;
  bool _showUsers = false;
  bool _showAudit = false;
  List<dynamic> _auditLogs = [];

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() => _isLoading = true);
    try {
      final stats = await _adminService.getStats();
      final users = await _adminService.getUsers();
      setState(() {
        _stats = stats;
        _users = users;
        _isLoading = false;
      });
    } catch (e) {
      setState(() => _isLoading = false);
    }
  }

  Future<void> _loadAuditLogs() async {
    final logs = await _adminService.getAuditLogs();
    setState(() => _auditLogs = logs);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0f172a),
      appBar: AppBar(
        backgroundColor: const Color(0xFF1e293b),
        title: const Text('Admin Panel', style: TextStyle(fontWeight: FontWeight.bold)),
        actions: [
          IconButton(icon: const Icon(Icons.refresh), onPressed: _loadData),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _buildStatsGrid(),
                  const SizedBox(height: 24),
                  _buildSectionHeader('User Management', Icons.people, () {
                    setState(() => _showUsers = !_showUsers);
                  }),
                  if (_showUsers) _buildUserList(),
                  const SizedBox(height: 24),
                  _buildSectionHeader('Audit Logs', Icons.history, () {
                    _loadAuditLogs();
                    setState(() => _showAudit = !_showAudit);
                  }),
                  if (_showAudit) _buildAuditLogs(),
                  const SizedBox(height: 24),
                  _buildSectionHeader('Message Health', Icons.message, () async {
                    final health = await _adminService.getMessageHealth();
                    if (!mounted) return;
                    showDialog(
                      context: context,
                      builder: (ctx) => AlertDialog(
                        backgroundColor: const Color(0xFF1e293b),
                        title: const Text('Message Health'),
                        content: Text(health.toString()),
                        actions: [TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Close'))],
                      ),
                    );
                  }),
                  const SizedBox(height: 24),
                  _buildSectionHeader('Call Health', Icons.call, () async {
                    final health = await _adminService.getCallHealth();
                    if (!mounted) return;
                    showDialog(
                      context: context,
                      builder: (ctx) => AlertDialog(
                        backgroundColor: const Color(0xFF1e293b),
                        title: const Text('Call Health'),
                        content: Text(health.toString()),
                        actions: [TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Close'))],
                      ),
                    );
                  }),
                ],
              ),
            ),
    );
  }

  Widget _buildStatsGrid() {
    final items = [
      {'label': 'Users', 'value': '${_stats?['totalUsers'] ?? 0}', 'icon': Icons.people, 'color': Colors.blueAccent},
      {'label': 'Messages', 'value': '${_stats?['totalMessages'] ?? 0}', 'icon': Icons.message, 'color': Colors.greenAccent},
      {'label': 'Online', 'value': '${_stats?['activeConnections'] ?? 0}', 'icon': Icons.wifi, 'color': Colors.orangeAccent},
      {'label': 'Calls Today', 'value': '${_stats?['callsToday'] ?? 0}', 'icon': Icons.call, 'color': Colors.purpleAccent},
      {'label': 'Uptime', 'value': _formatUptime(_stats?['serverUptime'] ?? 0), 'icon': Icons.timer, 'color': Colors.tealAccent},
      {'label': 'Messages Today', 'value': '${_stats?['messagesToday'] ?? 0}', 'icon': Icons.chat, 'color': Colors.cyanAccent},
    ];

    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        childAspectRatio: 1.6,
        crossAxisSpacing: 12,
        mainAxisSpacing: 12,
      ),
      itemCount: items.length,
      itemBuilder: (ctx, i) {
        final item = items[i];
        return Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: const Color(0xFF1e293b),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: Colors.white.withValues(alpha: 0.05)),
          ),
          child: Row(
            children: [
              Icon(item['icon'] as IconData, color: item['color'] as Color, size: 28),
              const SizedBox(width: 12),
              Column(
                mainAxisAlignment: MainAxisAlignment.center,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(item['value'] as String, style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: item['color'] as Color)),
                  Text(item['label'] as String, style: const TextStyle(color: Colors.white54, fontSize: 11)),
                ],
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildSectionHeader(String title, IconData icon, VoidCallback onTap) {
    return ListTile(
      onTap: onTap,
      leading: Icon(icon, color: Colors.blueAccent),
      title: Text(title, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
      trailing: const Icon(Icons.chevron_right, color: Colors.white24),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      tileColor: const Color(0xFF1e293b),
    );
  }

  Widget _buildUserList() {
    return Container(
      margin: const EdgeInsets.only(top: 8),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: const Color(0xFF1e293b),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        children: _users.map((user) {
          final id = user['id'] as int;
          final username = user['username'] as String? ?? 'unknown';
          final role = user['role'] as String? ?? 'user';
          final banned = user['is_banned'] == true;
          return ListTile(
            dense: true,
            title: Text(username, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w500)),
            subtitle: Text('Role: $role', style: const TextStyle(color: Colors.white38, fontSize: 12)),
            trailing: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                if (banned)
                  const Chip(label: Text('Banned', style: TextStyle(color: Colors.redAccent, fontSize: 10)), backgroundColor: Colors.redAccent.withValues(alpha: 0.1))
                else
                  const Chip(label: Text('Active', style: TextStyle(color: Colors.greenAccent, fontSize: 10)), backgroundColor: Colors.greenAccent.withValues(alpha: 0.1)),
                PopupMenuButton<String>(
                  onSelected: (value) async {
                    if (value == 'ban') {
                      await _adminService.banUser(id, reason: 'Banned by admin');
                    } else if (value == 'unban') {
                      await _adminService.unbanUser(id);
                    } else if (value == 'make_admin') {
                      await _adminService.updateRole(id, 'admin');
                    } else if (value == 'make_user') {
                      await _adminService.updateRole(id, 'user');
                    }
                    _loadData();
                  },
                  itemBuilder: (ctx) => [
                    if (!banned) const PopupMenuItem(value: 'ban', child: Text('Ban')),
                    if (banned) const PopupMenuItem(value: 'unban', child: Text('Unban')),
                    if (role != 'admin') const PopupMenuItem(value: 'make_admin', child: Text('Make Admin')),
                    if (role == 'admin') const PopupMenuItem(value: 'make_user', child: Text('Remove Admin')),
                  ],
                ),
              ],
            ),
          );
        }).toList(),
      ),
    );
  }

  Widget _buildAuditLogs() {
    return Container(
      margin: const EdgeInsets.only(top: 8),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: const Color(0xFF1e293b),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        children: _auditLogs.map((log) {
          return ListTile(
            dense: true,
            leading: const Icon(Icons.circle, size: 8, color: Colors.blueAccent),
            title: Text('${log['action'] ?? 'unknown'}', style: const TextStyle(color: Colors.white70, fontSize: 13)),
            subtitle: Text('${log['admin_username'] ?? log['admin_id']} - ${log['timestamp'] ?? ''}', style: const TextStyle(color: Colors.white24, fontSize: 11)),
          );
        }).toList(),
      ),
    );
  }

  String _formatUptime(int seconds) {
    final h = seconds ~/ 3600;
    final m = (seconds % 3600) ~/ 60;
    final s = seconds % 60;
    return '${h}h ${m}m ${s}s';
  }
}
