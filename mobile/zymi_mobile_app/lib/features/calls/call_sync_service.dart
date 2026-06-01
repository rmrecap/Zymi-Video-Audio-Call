import 'package:flutter/material.dart';

/// Burst Activity Aggregator for UI Isolate
/// Handles 'sync_ui_state' payload from Background Isolate
class CallSyncService {
  static void handleSyncState(Map<String, dynamic> data) {
    // If it's a single string legacy format, convert to list
    List<dynamic> missed = [];
    if (data['missed_list'] != null) {
      missed = data['missed_list'];
    } else if (data['missed'] != null) {
      missed = [{'name': data['missed']}];
    } else if (data['missed_caller'] != null) {
      missed = [{'name': data['missed_caller']}];
    }
    
    if (missed.isEmpty) return;

    if (missed.length > 3) {
      // Leaf Aggregation: Show summary for bursts
      debugPrint('[UI_SYNC] Burst Activity: ${missed.length} missed calls from ${missed.first['name']} and others.');
      // In a real app, this would use a notification service wrapper like flutter_local_notifications
      // NotificationService.showSummaryNotification(
      //   title: "Missed Activity",
      //   body: "You have ${missed.length} missed calls from ${missed.first['name']} and others."
      // );
    } else {
      // Individual alerts for low volume
      for (var item in missed) {
        debugPrint('[UI_SYNC] Missed call from: ${item['name']}');
        // NotificationService.showCallNotification(item['name']);
      }
    }
  }
}
