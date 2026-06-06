import 'dart:async';
import 'dart:io';
import 'package:record/record.dart';
import 'package:permission_handler/permission_handler.dart';

enum VoiceRecorderState { idle, recording, paused }

class VoiceRecorderService {
  final AudioRecorder _recorder = AudioRecorder();
  VoiceRecorderState _state = VoiceRecorderState.idle;
  String? _recordedPath;
  int _recordDuration = 0;
  Timer? _timer;

  VoiceRecorderState get state => _state;
  String? get recordedPath => _recordedPath;
  int get recordDuration => _recordDuration;

  Future<bool> requestPermissions() async {
    final mic = await Permission.microphone.request();
    final storage = await Permission.storage.request();
    return mic.isGranted && storage.isGranted;
  }

  Future<bool> startRecording() async {
    final granted = await requestPermissions();
    if (!granted) return false;

    final dir = Directory.systemTemp;
    final path = '${dir.path}/voice_${DateTime.now().millisecondsSinceEpoch}.m4a';

    try {
      await _recorder.start(
        const RecordConfig(
          encoder: AudioEncoder.aacLc,
          bitRate: 128000,
          sampleRate: 44100,
          numChannels: 1,
        ),
        path: path,
      );
      _state = VoiceRecorderState.recording;
      _recordedPath = path;
      _recordDuration = 0;
      _timer = Timer.periodic(const Duration(seconds: 1), (_) {
        _recordDuration++;
      });
      print('[VOICE] Recording started: $path');
      return true;
    } catch (e) {
      print('[VOICE] Failed to start recording: $e');
      return false;
    }
  }

  Future<String?> stopRecording() async {
    _timer?.cancel();
    _timer = null;
    try {
      final path = await _recorder.stop();
      _state = VoiceRecorderState.idle;
      print('[VOICE] Recording stopped: $path (${_recordDuration}s)');
      return path;
    } catch (e) {
      print('[VOICE] Failed to stop recording: $e');
      return null;
    }
  }

  Future<void> cancelRecording() async {
    _timer?.cancel();
    _timer = null;
    try {
      await _recorder.stop();
      if (_recordedPath != null) {
        File(_recordedPath!).deleteSync(recursive: true);
      }
    } catch (_) {}
    _state = VoiceRecorderState.idle;
    _recordedPath = null;
    _recordDuration = 0;
  }

  String get formattedDuration {
    final min = _recordDuration ~/ 60;
    final sec = _recordDuration % 60;
    return '${min.toString().padLeft(2, '0')}:${sec.toString().padLeft(2, '0')}';
  }

  void dispose() {
    _timer?.cancel();
    _recorder.dispose();
  }
}
