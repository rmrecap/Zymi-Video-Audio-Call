import 'package:flutter/material.dart';
import 'package:audioplayers/audioplayers.dart';

class AttachmentMusicTile extends StatefulWidget {
  final String title;
  final String artist;
  final String duration;
  final String? url;
  final VoidCallback onTap;

  const AttachmentMusicTile({
    super.key,
    required this.title,
    required this.artist,
    required this.duration,
    this.url,
    required this.onTap,
  });

  @override
  State<AttachmentMusicTile> createState() => _AttachmentMusicTileState();
}

class _AttachmentMusicTileState extends State<AttachmentMusicTile> {
  final AudioPlayer _player = AudioPlayer();
  bool _isPlaying = false;
  Duration _position = Duration.zero;
  Duration _totalDuration = Duration.zero;

  @override
  void initState() {
    super.initState();
    _player.onPositionChanged.listen((p) => setState(() => _position = p));
    _player.onDurationChanged.listen((d) => setState(() => _totalDuration = d));
    _player.onPlayerComplete.listen((_) => setState(() => _isPlaying = false));
  }

  @override
  void dispose() {
    _player.dispose();
    super.dispose();
  }

  Future<void> _togglePlay() async {
    if (_isPlaying) {
      await _player.pause();
      setState(() => _isPlaying = false);
    } else {
      if (widget.url != null) {
        await _player.play(UrlSource(widget.url!));
      }
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
    return ListTile(
      onTap: widget.onTap,
      leading: Container(
        width: 44,
        height: 44,
        decoration: BoxDecoration(
          color: Colors.purpleAccent.withValues(alpha: 0.1),
          borderRadius: BorderRadius.circular(8),
        ),
        child: const Icon(Icons.music_note, color: Colors.purpleAccent, size: 24),
      ),
      title: Text(
        widget.title,
        style: const TextStyle(color: Colors.white, fontSize: 14),
        maxLines: 1,
        overflow: TextOverflow.ellipsis,
      ),
      subtitle: Text(
        widget.url != null ? '${widget.artist} • ${_formatDuration(_totalDuration > Duration.zero ? _totalDuration : Duration.zero)}' : '${widget.artist} • ${widget.duration}',
        style: const TextStyle(color: Colors.white38, fontSize: 12),
      ),
      trailing: widget.url != null
          ? IconButton(
              onPressed: _togglePlay,
              icon: Icon(
                _isPlaying ? Icons.pause_circle_filled : Icons.play_circle_fill,
                color: Colors.purpleAccent,
                size: 28,
              ),
            )
          : const Icon(Icons.play_circle_outline, color: Colors.purpleAccent, size: 24),
    );
  }
}
