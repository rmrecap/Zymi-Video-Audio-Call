import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import '../../../core/config/app_config.dart';
import '../../../core/theme/zymi_brand_colors.dart';
import '../../../services/api/auth_service.dart';
import '../../../services/api/friend_service.dart';
import '../../nearby/screens/nearby_screen.dart' show SkeletonShimmer;

class UserSearchDelegate extends SearchDelegate<String?> {
  final FriendService _friendService = FriendService();

  @override
  String get searchFieldLabel => 'Search by username or email';

  @override
  ThemeData appBarTheme(BuildContext context) {
    return Theme.of(context).copyWith(
      appBarTheme: const AppBarTheme(
        backgroundColor: ZymiColors.surface,
        iconTheme: IconThemeData(color: Colors.white),
      ),
      inputDecorationTheme: const InputDecorationTheme(
        hintStyle: TextStyle(color: ZymiColors.textMuted),
        border: InputBorder.none,
      ),
    );
  }

  @override
  List<Widget>? buildActions(BuildContext context) {
    return [
      if (query.isNotEmpty)
        IconButton(
          icon: const Icon(Icons.clear, color: Colors.white),
          onPressed: () => query = '',
        ),
    ];
  }

  @override
  Widget? buildLeading(BuildContext context) {
    return IconButton(
      icon: const Icon(Icons.arrow_back, color: Colors.white),
      onPressed: () => close(context, null),
    );
  }

  @override
  Widget buildResults(BuildContext context) => _buildSearchResults(context);

  @override
  Widget buildSuggestions(BuildContext context) => _buildSearchResults(context);

  Widget _buildSearchResults(BuildContext context) {
    if (query.trim().length < 2) {
      return const Center(
        child: Text('Type at least 2 characters to search', style: TextStyle(color: ZymiColors.textMuted)),
      );
    }

    return FutureBuilder<List<Map<String, dynamic>>>(
      future: _searchUsers(query.trim()),
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return _buildShimmer();
        }
        if (snapshot.hasError || !snapshot.hasData) {
          return const Center(child: Text('Search failed', style: TextStyle(color: ZymiColors.textMuted)));
        }
        final users = snapshot.data!;
        if (users.isEmpty) {
          return const Center(child: Text('No users found', style: TextStyle(color: ZymiColors.textMuted)));
        }
        return ListView.builder(
          itemCount: users.length,
          itemBuilder: (context, index) {
            final user = users[index];
            return Card(
              color: ZymiColors.card,
              margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
              child: ListTile(
                leading: CircleAvatar(
                  backgroundColor: ZymiColors.primary,
                  child: Text(
                    (user['username'] as String)[0].toUpperCase(),
                    style: const TextStyle(color: Colors.white),
                  ),
                ),
                title: Text(user['username'] ?? '', style: const TextStyle(color: Colors.white)),
                trailing: IconButton(
                  icon: const Icon(Icons.person_add, color: ZymiColors.primary),
                  onPressed: () => _addFriend(context, user['id']),
                ),
                onTap: () => _showPreview(context, user),
              ),
            );
          },
        );
      },
    );
  }

  Future<List<Map<String, dynamic>>> _searchUsers(String query) async {
    final token = await AuthService().getToken();
    if (token == null) return [];
    try {
      final res = await http.get(
        Uri.parse('${AppConfig.apiUrl}/api/users/search?q=${Uri.encodeQueryComponent(query)}'),
        headers: {'Authorization': 'Bearer $token'},
      );
      if (res.statusCode == 200) {
        final List<dynamic> data = jsonDecode(res.body);
        return data.map((e) => Map<String, dynamic>.from(e)).toList();
      }
    } catch (e) {
      debugPrint('[SEARCH] Error: $e');
    }
    return [];
  }

  void _showPreview(BuildContext context, Map<String, dynamic> user) {
    final userId = user['id'] as int;
    showModalBottomSheet(
      context: context,
      backgroundColor: ZymiColors.surface,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (ctx) => Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            CircleAvatar(
              radius: 30,
              backgroundColor: ZymiColors.primary,
              child: Text((user['username'] as String)[0].toUpperCase(), style: const TextStyle(fontSize: 24, color: Colors.white)),
            ),
            const SizedBox(height: 10),
            Text(user['username'] ?? '', style: const TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold)),
            const SizedBox(height: 24),
            _actionButton(ctx, Icons.person_add, 'Add Friend', ZymiColors.primary, () async {
              Navigator.pop(ctx);
              final result = await _friendService.sendRequest(userId);
              if (context.mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text(result['error'] ?? 'Friend request sent!'),
                    backgroundColor: result['error'] != null ? ZymiColors.danger : ZymiColors.success,
                  ),
                );
              }
            }),
          ],
        ),
      ),
    );
  }

  Widget _actionButton(BuildContext context, IconData icon, String label, Color color, VoidCallback onPressed) {
    return SizedBox(
      width: double.infinity,
      child: ElevatedButton.icon(
        onPressed: onPressed,
        icon: Icon(icon),
        label: Text(label),
        style: ElevatedButton.styleFrom(
          backgroundColor: color,
          foregroundColor: Colors.white,
          padding: const EdgeInsets.symmetric(vertical: 14),
        ),
      ),
    );
  }

  void _addFriend(BuildContext context, dynamic userId) async {
    final result = await _friendService.sendRequest(userId as int);
    if (context.mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(result['error'] ?? 'Friend request sent!'),
          backgroundColor: result['error'] != null ? ZymiColors.danger : ZymiColors.success,
        ),
      );
    }
  }

  Widget _buildShimmer() {
    return ListView.builder(
      itemCount: 6,
      itemBuilder: (context, index) => const Padding(
        padding: EdgeInsets.symmetric(horizontal: 12, vertical: 4),
        child: Card(
          color: ZymiColors.card,
          child: ListTile(
            leading: SkeletonShimmer(width: 40, height: 40, borderRadius: 20),
            title: SkeletonShimmer(width: 120, height: 14),
            trailing: SkeletonShimmer(width: 40, height: 40, borderRadius: 20),
          ),
        ),
      ),
    );
  }
}
