import 'package:flutter/foundation.dart';
import 'package:permission_handler/permission_handler.dart';

class CallPermissionService {
  /// Check if microphone permission is available.
  /// Does NOT open a media stream — preflight check only.
  static Future<bool> checkMicrophonePermission() async {
    final status = await Permission.microphone.request();
    debugPrint('[CALL_PERM] Mic permission check: $status');
    return status.isGranted;
  }

  /// Check if camera permission is available.
  /// Does NOT open a media stream — preflight check only.
  static Future<bool> checkCameraPermission() async {
    final status = await Permission.camera.request();
    debugPrint('[CALL_PERM] Camera permission check: $status');
    return status.isGranted;
  }
}
