import 'dart:io';
import 'package:record/record.dart';
import 'package:permission_handler/permission_handler.dart';

class VoiceRecorderService {
  final AudioRecorder _recorder = AudioRecorder();
  bool _isRecording = false;
  String? _currentPath;

  bool get isRecording => _isRecording;

  Future<bool> requestPermission() async {
    final mic = await Permission.microphone.request();
    return mic.isGranted;
  }

  Future<String?> startRecording() async {
    if (_isRecording) return null;
    final hasPerm = await requestPermission();
    if (!hasPerm) return null;

    final dir = Directory.systemTemp;
    final path = '${dir.path}/voice_${DateTime.now().millisecondsSinceEpoch}.m4a';
    _currentPath = path;

    await _recorder.start(
      const RecordConfig(encoder: AudioEncoder.aacLc),
      path: path,
    );
    _isRecording = true;
    return path;
  }

  Future<String?> stopRecording() async {
    if (!_isRecording) return null;
    final path = await _recorder.stop();
    _isRecording = false;
    _currentPath = null;
    return path;
  }

  void dispose() {
    _recorder.dispose();
  }
}
