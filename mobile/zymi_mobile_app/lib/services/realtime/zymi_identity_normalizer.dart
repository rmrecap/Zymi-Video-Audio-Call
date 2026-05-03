import 'package:flutter/foundation.dart';

class ZymiIdentityNormalizer {
  static String? normalize(dynamic userId) {
    if (userId == null) {
      debugPrint('[IDENTITY] VERIFY REQUIRED: Attempted normalization with null ID');
      return null;
    }
    return userId.toString();
  }
}
