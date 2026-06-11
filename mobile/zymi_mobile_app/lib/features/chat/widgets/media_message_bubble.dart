import 'dart:io';
import 'package:flutter/material.dart';
import 'package:audioplayers/audioplayers.dart';
import '../../../core/local_db/local_media_record.dart';
import 'media_transfer_progress.dart';

class MediaMessageBubble extends StatefulWidget {
  final LocalMediaRecord? localRecord;
  final Map<String, dynamic>? serverMetadata;
  final bool isMine;
  final VoidCallback? onRetry;

  const MediaMessageBubble({
    super.key,
    this.localRecord,
    this.serverMetadata,
    required this.isMine,
    this.onRetry,
  });

  @override
  State<MediaMessageBubble> createState() => _MediaMessageBubbleState();
}

class _MediaMessageBubbleState extends State<MediaMessageBubble> {
  AudioPlayer? _audioPlayer;
  bool _isPlaying = false;
  Duration _position = Duration.zero;
  Duration _duration = Duration.zero;

  @override
  void dispose() {
    _audioPlayer?.dispose();
    super.dispose();
  }

  void _initAudioPlayer(String source, {bool isLocal = false}) {
    _audioPlayer?.dispose();
    _audioPlayer = AudioPlayer();
    _audioPlayer!.onPositionChanged.listen((p) {
      if (mounted) setState(() => _position = p);
    });
    _audioPlayer!.onDurationChanged.listen((d) {
      if (mounted) setState(() => _duration = d);
    });
    _audioPlayer!.onPlayerComplete.listen((_) {
      if (mounted) setState(() {
        _isPlaying = false;
        _position = Duration.zero;
      });
    });

    if (isLocal) {
      _audioPlayer!.play(DeviceFileSource(source));
    } else {
      _audioPlayer!.play(UrlSource(source));
    }
    setState(() => _isPlaying = true);
  }

  void _toggleAudio(String source, {bool isLocal = false}) {
    if (_audioPlayer == null) {
      _initAudioPlayer(source, isLocal: isLocal);
      return;
    }
    if (_isPlaying) {
      _audioPlayer!.pause();
      setState(() => _isPlaying = false);
    } else {
      _audioPlayer!.resume();
      setState(() => _isPlaying = true);
    }
  }

  String _formatDuration(Duration d) {
    final m = d.inMinutes.remainder(60);
    final s = d.inSeconds.remainder(60);
    return '${m.toString().padLeft(2, '0')}:${s.toString().padLeft(2, '0')}';
  }

  @override
  Widget build(BuildContext context) {
    final status = widget.localRecord?.transferStatus ?? widget.serverMetadata?['transfer_status'] ?? 'pending';
    final mediaType = widget.localRecord?.mediaType ?? widget.serverMetadata?['media_type'] ?? 'file';
    final fileName = widget.localRecord?.fileName ?? widget.serverMetadata?['file_name'] ?? 'Unknown File';
    final fileSize = widget.localRecord?.fileSize ?? widget.serverMetadata?['file_size'] ?? 0;

    return Container(
      margin: const EdgeInsets.symmetric(vertical: 4),
      padding: const EdgeInsets.all(8),
      constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.7),
      decoration: BoxDecoration(
        color: widget.isMine ? const Color(0xFF3B82F6).withValues(alpha: 0.2) : const Color(0xFF1E293B),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.white10),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildPreview(context, status, mediaType),
          const SizedBox(height: 8),
          Text(
            fileName,
            style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.bold),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
          Text(
            '${(fileSize / 1024).toStringAsFixed(1)} KB',
            style: const TextStyle(color: Colors.white54, fontSize: 11),
          ),
          if (status != 'completed') ...[
            const SizedBox(height: 8),
            MediaTransferProgress(status: status, isMine: widget.isMine, onRetry: widget.onRetry),
          ],
        ],
      ),
    );
  }

  Widget _buildAudioBar(String source, {bool isLocal = false}) {
    return Container(
      width: double.infinity,
      height: 56,
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.05),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        children: [
          IconButton(
            onPressed: () => _toggleAudio(source, isLocal: isLocal),
            icon: Icon(
              _isPlaying ? Icons.pause_circle_filled : Icons.play_circle_fill,
              color: Colors.blueAccent,
              size: 32,
            ),
          ),
          Expanded(
            child: LinearProgressIndicator(
              value: _duration.inMilliseconds > 0 ? _position.inMilliseconds / _duration.inMilliseconds : 0,
              color: Colors.blueAccent,
              backgroundColor: Colors.white10,
            ),
          ),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 12),
            child: Text(
              _formatDuration(_duration),
              style: const TextStyle(color: Colors.white38, fontSize: 11),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPreview(BuildContext context, String status, String type) {
    if (status == 'completed') {
      if (type == 'audio' || type == 'voice') {
        final source = widget.localRecord?.localPath ?? widget.serverMetadata?['file_url'] ?? '';
        return _buildAudioBar(source, isLocal: widget.localRecord?.localPath != null);
      }

      if (type == 'image' && widget.localRecord != null) {
        return ClipRRect(
          borderRadius: BorderRadius.circular(8),
          child: Image.file(
            File(widget.localRecord!.localPath),
            fit: BoxFit.cover,
            width: double.infinity,
            height: 150,
          ),
        );
      }
    }

    IconData icon;
    switch (type) {
      case 'image': icon = Icons.image; break;
      case 'video': icon = Icons.videocam; break;
      case 'voice': icon = Icons.mic; break;
      case 'audio': icon = Icons.audiotrack; break;
      default: icon = Icons.insert_drive_file;
    }

    return Container(
      width: double.infinity,
      height: 100,
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.05),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Center(
        child: Icon(icon, color: Colors.white24, size: 40),
      ),
    );
  }
}
