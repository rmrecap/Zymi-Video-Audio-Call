import 'package:permission_handler/permission_handler.dart';

class MediaPermissionService {
  static Future<bool> requestStoragePermissions() async {
    Map<Permission, PermissionStatus> statuses = await [
      Permission.storage,
      Permission.photos,
      Permission.videos,
      Permission.audio,
    ].request();

    return statuses.values.every((status) => status.isGranted || status.isLimited);
  }

  static Future<bool> checkStoragePermissions() async {
    bool storage = await Permission.storage.isGranted;
    bool photos = await Permission.photos.isGranted;
    return storage || photos;
  }
}
