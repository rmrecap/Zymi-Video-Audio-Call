import 'package:flutter/material.dart';
import 'attachment_category_tab.dart';
import 'attachment_recent_file_tile.dart';
import 'attachment_contact_tile.dart';
import 'attachment_location_tile.dart';
import 'attachment_music_tile.dart';
import '../../../core/theme/zymi_brand_colors.dart';

class AttachmentHubSheet extends StatefulWidget {
  final Function(String path, String type) onMediaSelected;
  final Function(String content, String type) onActionSelected;

  const AttachmentHubSheet({
    super.key,
    required this.onMediaSelected,
    required this.onActionSelected,
  });

  @override
  State<AttachmentHubSheet> createState() => _AttachmentHubSheetState();
}

class _AttachmentHubSheetState extends State<AttachmentHubSheet> {
  int _selectedCategoryIndex = 0;

  final List<Map<String, dynamic>> _categories = [
    {'label': 'Gallery', 'icon': Icons.photo_library_outlined},
    {'label': 'File', 'icon': Icons.insert_drive_file_outlined},
    {'label': 'Location', 'icon': Icons.location_on_outlined},
    {'label': 'Checklist', 'icon': Icons.checklist_outlined},
    {'label': 'Contact', 'icon': Icons.person_outline},
    {'label': 'Music', 'icon': Icons.music_note_outlined},
  ];

  @override
  Widget build(BuildContext context) {
    return Container(
      height: MediaQuery.of(context).size.height * 0.6,
      decoration: const BoxDecoration(
        color: Color(0xFF111827), // Deep Dark Gray
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: Column(
        children: [
          // Drag Handle
          Center(
            child: Container(
              margin: const EdgeInsets.symmetric(vertical: 12),
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: Colors.white24,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),
          
          // Header
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  _categories[_selectedCategoryIndex]['label'],
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                IconButton(
                  onPressed: () => Navigator.pop(context),
                  icon: const Icon(Icons.close, color: Colors.white54),
                ),
              ],
            ),
          ),

          // Content Area
          Expanded(
            child: _buildCategoryContent(),
          ),

          // Category Tabs
          Container(
            padding: const EdgeInsets.only(bottom: 24, top: 12),
            decoration: const BoxDecoration(
              border: Border(top: BorderSide(color: Colors.white10)),
            ),
            child: SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Row(
                children: List.generate(_categories.length, (index) {
                  return AttachmentCategoryTab(
                    icon: _categories[index]['icon'],
                    label: _categories[index]['label'],
                    isSelected: _selectedCategoryIndex == index,
                    onTap: () => setState(() => _selectedCategoryIndex = index),
                  );
                }),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCategoryContent() {
    switch (_selectedCategoryIndex) {
      case 0: // Gallery
        return _buildGalleryGrid();
      case 1: // File
        return _buildFileList();
      case 2: // Location
        return _buildLocationList();
      case 3: // Checklist
        return _buildChecklistCreator();
      case 4: // Contact
        return _buildContactList();
      case 5: // Music
        return _buildMusicList();
      default:
        return const Center(child: Text('Coming Soon', style: TextStyle(color: Colors.white38)));
    }
  }

  Widget _buildGalleryGrid() {
    final mediaTypes = [
      {'icon': Icons.image, 'label': 'Photo'},
      {'icon': Icons.image, 'label': 'Photo'},
      {'icon': Icons.image, 'label': 'Photo'},
      {'icon': Icons.image, 'label': 'Photo'},
      {'icon': Icons.image, 'label': 'Photo'},
      {'icon': Icons.image, 'label': 'Photo'},
    ];
    return GridView.builder(
      padding: const EdgeInsets.all(16),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 3,
        crossAxisSpacing: 8,
        mainAxisSpacing: 8,
      ),
      itemCount: mediaTypes.length,
      itemBuilder: (context, index) {
        final item = mediaTypes[index];
        return GestureDetector(
          onTap: () {
            widget.onMediaSelected('/path/to/image_$index.jpg', 'image');
            Navigator.pop(context);
          },
          child: Container(
            decoration: BoxDecoration(
              color: Colors.white10,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(item['icon'] as IconData, color: Colors.white38, size: 28),
                const SizedBox(height: 4),
                Text(
                  item['label'] as String,
                  style: const TextStyle(color: Colors.white24, fontSize: 10),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildFileList() {
    return ListView(
      padding: const EdgeInsets.symmetric(vertical: 8),
      children: [
        AttachmentRecentFileTile(
          fileName: 'Project_Proposal.pdf',
          fileSize: '1.2 MB',
          fileType: 'pdf',
          onTap: () {},
        ),
        AttachmentRecentFileTile(
          fileName: 'Quarterly_Report.docx',
          fileSize: '850 KB',
          fileType: 'doc',
          onTap: () {},
        ),
        AttachmentRecentFileTile(
          fileName: 'Assets_Backup.zip',
          fileSize: '15.4 MB',
          fileType: 'zip',
          onTap: () {},
        ),
        const Center(
          child: Padding(
            padding: EdgeInsets.all(16.0),
            child: Text('Native file picker coming soon', style: TextStyle(color: Colors.white24, fontSize: 12)),
          ),
        ),
      ],
    );
  }

  Widget _buildLocationList() {
    return Column(
      children: [
        AttachmentLocationTile(
          title: 'Send Current Location',
          address: 'Approximate accuracy: 20m',
          onTap: () {
            widget.onActionSelected('Current Location: 23.8103, 90.4125', 'location');
            Navigator.pop(context);
          },
        ),
        const Divider(color: Colors.white10, indent: 72),
        const Padding(
          padding: EdgeInsets.all(20),
          child: Text(
            'Location sharing requires permissions. ZYMI only shares approximate data unless you confirm exact location.',
            textAlign: TextAlign.center,
            style: TextStyle(color: Colors.white24, fontSize: 11),
          ),
        ),
      ],
    );
  }

  Widget _buildChecklistCreator() {
    return Padding(
      padding: const EdgeInsets.all(24),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(Icons.checklist_rtl, color: ZymiColors.primary, size: 48),
          const SizedBox(height: 16),
          const Text(
            'Create Checklist',
            style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 8),
          const Text(
            'Collaborate on tasks with your peer.',
            textAlign: TextAlign.center,
            style: TextStyle(color: Colors.white38, fontSize: 14),
          ),
          const SizedBox(height: 32),
          ElevatedButton(
            onPressed: () {
               widget.onActionSelected('Checklist: Task 1, Task 2', 'checklist');
               Navigator.pop(context);
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: ZymiColors.primary,
              minimumSize: const Size(200, 48),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
            child: const Text('New Checklist'),
          ),
        ],
      ),
    );
  }

  Widget _buildContactList() {
    return ListView(
      padding: const EdgeInsets.symmetric(vertical: 8),
      children: [
        AttachmentContactTile(
          name: 'Peer User',
          phone: '+880123456789',
          onTap: () {
            widget.onActionSelected('Contact: Peer User (+880123456789)', 'contact');
            Navigator.pop(context);
          },
        ),
        const Center(
          child: Padding(
            padding: EdgeInsets.all(16.0),
            child: Text('Internal contacts only', style: TextStyle(color: Colors.white24, fontSize: 12)),
          ),
        ),
      ],
    );
  }

  Widget _buildMusicList() {
    return ListView(
      padding: const EdgeInsets.symmetric(vertical: 8),
      children: [
        AttachmentMusicTile(
          title: 'Deep Dark Vibes',
          artist: 'Zymi Audio',
          duration: '3:45',
          onTap: () {},
        ),
        AttachmentMusicTile(
          title: 'Future Synth',
          artist: 'Unknown Artist',
          duration: '4:12',
          onTap: () {},
        ),
        const Center(
          child: Padding(
            padding: EdgeInsets.all(16.0),
            child: Text('Local audio files only', style: TextStyle(color: Colors.white24, fontSize: 12)),
          ),
        ),
      ],
    );
  }
}
