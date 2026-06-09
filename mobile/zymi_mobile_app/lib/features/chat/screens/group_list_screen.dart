import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import '../../../core/config/app_config.dart';
import '../../../core/navigation/zymi_routes.dart';
import '../../../core/theme/zymi_brand_colors.dart';
import '../../../services/api/auth_service.dart';

class GroupListScreen extends StatefulWidget {
  const GroupListScreen({super.key});

  @override
  State<GroupListScreen> createState() => _GroupListScreenState();
}

class _GroupListScreenState extends State<GroupListScreen> {
  final AuthService _authService = AuthService();
  List<Map<String, dynamic>> _groups = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadGroups();
  }

  Future<void> _loadGroups() async {
    setState(() => _isLoading = true);
    final token = await _authService.getToken();
    if (token == null) return;
    try {
      final res = await http.get(
        Uri.parse('${AppConfig.apiUrl}/api/groups'),
        headers: {'Authorization': 'Bearer $token'},
      );
      if (res.statusCode == 200 && mounted) {
        setState(() {
          _groups = (jsonDecode(res.body) as List).map((e) => Map<String, dynamic>.from(e)).toList();
          _isLoading = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  void _showCreateGroupSheet() {
    final nameController = TextEditingController();
    showModalBottomSheet(
      context: context,
      backgroundColor: ZymiColors.surface,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (ctx) => Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text('Create Group', style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold)),
            const SizedBox(height: 16),
            TextField(
              controller: nameController,
              style: const TextStyle(color: Colors.white),
              decoration: const InputDecoration(
                hintText: 'Group name',
                hintStyle: TextStyle(color: ZymiColors.textMuted),
              ),
            ),
            const SizedBox(height: 20),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () async {
                  if (nameController.text.trim().isEmpty) return;
                  Navigator.pop(ctx);
                  final token = await _authService.getToken();
                  if (token == null) return;
                  await http.post(
                    Uri.parse('${AppConfig.apiUrl}/api/groups'),
                    headers: {'Authorization': 'Bearer $token', 'Content-Type': 'application/json'},
                    body: jsonEncode({'name': nameController.text.trim()}),
                  );
                  _loadGroups();
                },
                child: const Text('Create'),
              ),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0f172a),
      appBar: AppBar(
        backgroundColor: const Color(0xFF1e293b),
        title: const Text('Groups', style: TextStyle(color: Colors.white)),
        actions: [
          IconButton(
            icon: const Icon(Icons.add, color: ZymiColors.primary),
            onPressed: _showCreateGroupSheet,
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: ZymiColors.primary))
          : _groups.isEmpty
              ? const Center(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Icons.groups_outlined, size: 64, color: ZymiColors.textMuted),
                      SizedBox(height: 16),
                      Text('No groups yet', style: TextStyle(color: ZymiColors.textMuted)),
                      SizedBox(height: 8),
                      Text('Tap + to create one', style: TextStyle(color: ZymiColors.textMuted, fontSize: 13)),
                    ],
                  ),
                )
              : RefreshIndicator(
                  onRefresh: _loadGroups,
                  child: ListView.builder(
                    itemCount: _groups.length,
                    itemBuilder: (context, index) {
                      final group = _groups[index];
                      return ListTile(
                        leading: CircleAvatar(
                          backgroundColor: ZymiColors.purple,
                          child: Text(
                            (group['name'] as String)[0].toUpperCase(),
                            style: const TextStyle(color: Colors.white),
                          ),
                        ),
                        title: Text(group['name'] ?? '', style: const TextStyle(color: Colors.white)),
                        subtitle: Text('${group['member_count'] ?? 0} members', style: const TextStyle(color: Colors.white54)),
                        trailing: const Icon(Icons.chevron_right, color: Colors.white24),
                        onTap: () {
                          Navigator.pushNamed(context, ZymiRoutes.groupChat, arguments: {
                            'groupId': group['id'].toString(),
                            'groupName': group['name'],
                          });
                        },
                      );
                    },
                  ),
                ),
    );
  }
}
