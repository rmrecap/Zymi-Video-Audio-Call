import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_webrtc/flutter_webrtc.dart';
import '../../core/theme/zymi_brand_colors.dart';

class GroupCallScreen extends StatefulWidget {
  final String groupId;
  final String groupName;
  final bool isVideo;

  const GroupCallScreen({
    super.key,
    required this.groupId,
    required this.groupName,
    this.isVideo = false,
  });

  @override
  State<GroupCallScreen> createState() => _GroupCallScreenState();
}

class _GroupCallScreenState extends State<GroupCallScreen> {
  final Map<String, MediaStream> _remoteStreams = {};
  MediaStream? _localStream;
  bool _isMuted = false;
  bool _isSpeakerOn = false;

  @override
  void initState() {
    super.initState();
    _initLocalStream();
  }

  Future<void> _initLocalStream() async {
    try {
      final stream = await navigator.mediaDevices.getUserMedia({
        'audio': true,
        'video': widget.isVideo,
      });
      if (mounted) setState(() => _localStream = stream);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to access media: $e'), backgroundColor: ZymiColors.danger),
        );
      }
    }
  }

  @override
  void dispose() {
    _localStream?.getTracks().forEach((t) => t.stop());
    for (final stream in _remoteStreams.values) {
      stream.getTracks().forEach((t) => t.stop());
    }
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      body: SafeArea(
        child: Column(
          children: [
            Expanded(
              child: _buildGrid(),
            ),
            _buildControls(),
          ],
        ),
      ),
    );
  }

  Widget _buildGrid() {
    final participants = <Widget>[];

    if (_localStream != null) {
      participants.add(_videoTile(
        RTCVideoView(_localStream!, mirror: true),
        'You',
        isLocal: true,
      ));
    }

    for (final entry in _remoteStreams.entries) {
      participants.add(_videoTile(
        RTCVideoView(entry.value),
        entry.key,
      ));
    }

    if (participants.isEmpty) {
      return const Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.group, size: 64, color: Colors.white24),
            SizedBox(height: 16),
            Text('Waiting for participants...', style: TextStyle(color: Colors.white54, fontSize: 16)),
          ],
        ),
      );
    }

    return LayoutBuilder(
      builder: (context, constraints) {
        final crossAxisCount = participants.length <= 2 ? 1 : 2;
        return GridView.builder(
          padding: const EdgeInsets.all(8),
          gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: crossAxisCount,
            childAspectRatio: 1,
            crossAxisSpacing: 4,
            mainAxisSpacing: 4,
          ),
          itemCount: participants.length,
          itemBuilder: (context, index) => participants[index],
        );
      },
    );
  }

  Widget _videoTile(Widget videoView, String label, {bool isLocal = false}) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.black26,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.white12),
      ),
      child: Stack(
        fit: StackFit.expand,
        children: [
          ClipRRect(
            borderRadius: BorderRadius.circular(12),
            child: videoView,
          ),
          Positioned(
            left: 8,
            bottom: 8,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
              decoration: BoxDecoration(
                color: Colors.black54,
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text(
                isLocal ? 'You' : label,
                style: const TextStyle(color: Colors.white, fontSize: 12),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildControls() {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 24),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceEvenly,
        children: [
          _controlButton(
            icon: _isMuted ? Icons.mic_off : Icons.mic,
            color: _isMuted ? ZymiColors.danger : Colors.white70,
            onPressed: () {
              _localStream?.getAudioTracks().forEach((t) {
                t.enabled = _isMuted;
              });
              setState(() => _isMuted = !_isMuted);
            },
          ),
          _controlButton(
            icon: _isSpeakerOn ? Icons.volume_up : Icons.volume_down,
            color: _isSpeakerOn ? ZymiColors.primary : Colors.white70,
            onPressed: () => setState(() => _isSpeakerOn = !_isSpeakerOn),
          ),
          _controlButton(
            icon: Icons.call_end,
            color: ZymiColors.danger,
            onPressed: () => Navigator.pop(context),
          ),
        ],
      ),
    );
  }

  Widget _controlButton({required IconData icon, required Color color, required VoidCallback onPressed}) {
    return GestureDetector(
      onTap: onPressed,
      child: Container(
        width: 56,
        height: 56,
        decoration: BoxDecoration(
          color: Colors.white.withValues(alpha: 0.1),
          shape: BoxShape.circle,
        ),
        child: Icon(icon, color: color, size: 28),
      ),
    );
  }
}
