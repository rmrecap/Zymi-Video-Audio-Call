import 'package:flutter/material.dart';
import 'package:permission_handler/permission_handler.dart';
import 'screens/live_call_screen.dart';
import 'group_call_screen.dart';

class CallLauncher {
  static Future<void> startCall(BuildContext context, {
    required String peerId,
    required String peerName,
    bool isVideo = false,
  }) async {
    final mic = await Permission.microphone.request();
    if (mic.isDenied || mic.isPermanentlyDenied) {
      if (context.mounted) {
        await showDialog(
          context: context,
          builder: (ctx) => AlertDialog(
            title: const Text('Microphone Required'),
            content: const Text('Calling requires microphone access.'),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(ctx),
                child: const Text('Cancel'),
              ),
              TextButton(
                onPressed: () {
                  Navigator.pop(ctx);
                  openAppSettings();
                },
                child: const Text('Open Settings'),
              ),
            ],
          ),
        );
      }
      return;
    }

    if (isVideo) {
      final cam = await Permission.camera.request();
      if (cam.isDenied || cam.isPermanentlyDenied) {
        if (context.mounted) {
          await showDialog(
            context: context,
            builder: (ctx) => AlertDialog(
              title: const Text('Camera Required'),
              content: const Text('Video calling requires camera access.'),
              actions: [
                TextButton(
                  onPressed: () => Navigator.pop(ctx),
                  child: const Text('Cancel'),
                ),
                TextButton(
                  onPressed: () {
                    Navigator.pop(ctx);
                    openAppSettings();
                  },
                  child: const Text('Open Settings'),
                ),
              ],
            ),
          );
        }
        return;
      }
    }

    if (context.mounted) {
      Navigator.push(
        context,
        MaterialPageRoute(
          builder: (_) => LiveCallScreen(peerId: peerId, isVideo: isVideo),
        ),
      );
    }
  }

  static Future<void> startGroupCall(BuildContext context, {
    required String groupId,
    required String groupName,
    bool isVideo = false,
  }) async {
    final mic = await Permission.microphone.request();
    if (mic.isDenied || mic.isPermanentlyDenied) {
      if (context.mounted) {
        await showDialog(
          context: context,
          builder: (ctx) => AlertDialog(
            title: const Text('Microphone Required'),
            content: const Text('Group calling requires microphone access.'),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(ctx),
                child: const Text('Cancel'),
              ),
              TextButton(
                onPressed: () {
                  Navigator.pop(ctx);
                  openAppSettings();
                },
                child: const Text('Open Settings'),
              ),
            ],
          ),
        );
      }
      return;
    }

    if (isVideo) {
      final cam = await Permission.camera.request();
      if (cam.isDenied || cam.isPermanentlyDenied) {
        if (context.mounted) {
          await showDialog(
            context: context,
            builder: (ctx) => AlertDialog(
              title: const Text('Camera Required'),
              content: const Text('Video calling requires camera access.'),
              actions: [
                TextButton(
                  onPressed: () => Navigator.pop(ctx),
                  child: const Text('Cancel'),
                ),
                TextButton(
                  onPressed: () {
                    Navigator.pop(ctx);
                    openAppSettings();
                  },
                  child: const Text('Open Settings'),
                ),
              ],
            ),
          );
        }
        return;
      }
    }

    if (context.mounted) {
      Navigator.push(
        context,
        MaterialPageRoute(
          builder: (_) => GroupCallScreen(
            groupId: groupId,
            groupName: groupName,
            isVideo: isVideo,
          ),
        ),
      );
    }
  }
}
