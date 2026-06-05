import 'package:flutter/material.dart';
import '../../../core/theme/zymi_brand_colors.dart';

class ProfileMediaTabs extends StatelessWidget {
  final String userId;

  const ProfileMediaTabs({super.key, required this.userId});

  @override
  Widget build(BuildContext context) {
    return DefaultTabController(
      length: 5,
      child: Column(
        children: [
          const TabBar(
            isScrollable: true,
            tabAlignment: TabAlignment.start,
            indicatorColor: ZymiColors.primary,
            labelColor: ZymiColors.primary,
            unselectedLabelColor: Colors.white54,
            dividerColor: Colors.white10,
            tabs: [
              Tab(text: 'Media'),
              Tab(text: 'Files'),
              Tab(text: 'Links'),
              Tab(text: 'Music'),
              Tab(text: 'Groups'),
            ],
          ),
          SizedBox(
            height: 400, // Fixed height for simplicity in profile view
            child: TabBarView(
              children: [
                _buildPlaceholder('No media found'),
                _buildPlaceholder('No files shared'),
                _buildPlaceholder('No links found'),
                _buildPlaceholder('No music shared'),
                _buildPlaceholder('No common groups'),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPlaceholder(String message) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(
            Icons.inventory_2_outlined,
            color: Colors.white10,
            size: 48,
          ),
          const SizedBox(height: 16),
          Text(message, style: const TextStyle(color: Colors.white24)),
        ],
      ),
    );
  }
}
