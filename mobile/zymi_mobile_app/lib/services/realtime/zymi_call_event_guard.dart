import 'package:flutter/foundation.dart';

class ZymiCallEventGuard {
  static const List<String> blockedEvents = [];

  static bool isBlocked(String event) {
    return blockedEvents.contains(event);
  }

  static String getBlockedReason() {
    return 'CALL_EVENT_BLOCKED_IN_PHASE_48';
  }

  /// Debug verification: returns a map of event -> blocked status.
  static Map<String, bool> runDiagnostic() {
    final results = <String, bool>{};
    for (final event in blockedEvents) {
      results[event] = isBlocked(event);
      debugPrint('[CALL_GUARD] $event -> BLOCKED: ${results[event]}');
    }
    return results;
  }
}
