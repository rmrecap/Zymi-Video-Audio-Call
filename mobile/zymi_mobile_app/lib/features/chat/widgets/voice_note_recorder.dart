import 'dart:convert';
import 'package:flutter/material.dart';
import '../services/voice_recorder_service.dart';
import '../../../core/theme/zymi_brand_colors.dart';
import '../../../services/api/auth_service.dart';
import '../../../core/config/app_config.dart';
import 'package:http/http.dart' as http;

class VoiceNoteRecorder extends StatefulWidget {
  final Function(String fileUrl, int duration)? onSent;
  const VoiceNoteRecorder({super.key, this.onSent});

  @override
  State<VoiceNoteRecorder> createState() => _VoiceNoteRecorderState();
}

class _VoiceNoteRecorderState extends State<VoiceNoteRecorder>
    with SingleTickerProviderStateMixin {
  final VoiceRecorderService _service = VoiceRecorderService();
  late AnimationController _pulseController;
  bool _isUploading = false;
  bool _isStarting = false;

  @override
  void initState() {
    super.initState();
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 800),
    );
    _startRecording();
  }

  Future<void> _startRecording() async {
    setState(() => _isStarting = true);
    final ok = await _service.startRecording();
    if (mounted) {
      setState(() => _isStarting = false);
      if (ok) {
        _pulseController.repeat(reverse: true);
      } else {
        Navigator.pop(context);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Microphone permission denied'),
            backgroundColor: ZymiColors.danger,
          ),
        );
      }
    }
  }

  Future<void> _stopAndSend() async {
    setState(() => _isUploading = true);
    final path = await _service.stopRecording();
    _pulseController.stop();
    if (path != null) {
      final url = await _uploadVoiceNote(path);
      if (url != null && mounted) {
        widget.onSent?.call(url, _service.recordDuration);
        Navigator.pop(context, url);
        return;
      }
    }
    if (mounted) {
      setState(() => _isUploading = false);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Failed to send voice note'),
          backgroundColor: ZymiColors.danger,
        ),
      );
    }
  }

  Future<String?> _uploadVoiceNote(String filePath) async {
    try {
      final token = await AuthService().getToken();
      if (token == null) return null;
      final uri = Uri.parse('${AppConfig.apiUrl}/api/upload/message');
      final request = http.MultipartRequest('POST', uri);
      request.headers['Authorization'] = 'Bearer $token';
      request.files.add(await http.MultipartFile.fromPath('file', filePath));
      final streamed = await request.send();
      if (streamed.statusCode == 200) {
        final body = await streamed.stream.bytesToString();
        final data = jsonDecode(body) as Map<String, dynamic>;
        return data['url'];
      }
    } catch (e) {
      debugPrint('[VOICE] Upload error: $e');
    }
    return null;
  }

  @override
  void dispose() {
    _pulseController.dispose();
    _service.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
      decoration: const BoxDecoration(
        color: ZymiColors.surface,
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(width: 40, height: 4, decoration: BoxDecoration(color: ZymiColors.textMuted, borderRadius: BorderRadius.circular(2))),
          const SizedBox(height: 20),
          if (_isStarting)
            const CircularProgressIndicator(color: ZymiColors.primary)
          else ...[
            AnimatedBuilder(
              animation: _pulseController,
              builder: (context, _) {
                return Container(
                  width: 80 + _pulseController.value * 20,
                  height: 80 + _pulseController.value * 20,
                  decoration: BoxDecoration(
                    color: ZymiColors.danger.withAlpha(30),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(Icons.mic, color: ZymiColors.danger, size: 36),
                );
              },
            ),
            const SizedBox(height: 12),
            Text(
              _service.formattedDuration,
              style: const TextStyle(color: Colors.white, fontSize: 36, fontWeight: FontWeight.bold, fontFamily: 'monospace'),
            ),
            const SizedBox(height: 24),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [
                _roundButton(Icons.close, ZymiColors.textMuted, () async {
                  final nav = Navigator.of(context);
                  await _service.cancelRecording();
                  if (mounted) nav.pop();
                }),
                _roundButton(Icons.check, ZymiColors.success, _stopAndSend),
              ],
            ),
          ],
        ],
      ),
    );
  }

  Widget _roundButton(IconData icon, Color color, VoidCallback onPressed) {
    return InkWell(
      onTap: _isUploading ? null : onPressed,
      child: Container(
        width: 56, height: 56,
        decoration: BoxDecoration(color: color.withAlpha(40), shape: BoxShape.circle),
        child: _isUploading
            ? const Padding(padding: EdgeInsets.all(16), child: CircularProgressIndicator(strokeWidth: 2, color: ZymiColors.primary))
            : Icon(icon, color: color),
      ),
    );
  }
}
