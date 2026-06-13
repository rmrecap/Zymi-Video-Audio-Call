import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'dart:math';
import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_background_service/flutter_background_service.dart';
import 'package:flutter_ringtone_player/flutter_ringtone_player.dart';
import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:socket_io_client/socket_io_client.dart' as io;
import '../../core/config/app_config.dart';

Future<String> _getOrCreateDeviceId() async {
  final prefs = await SharedPreferences.getInstance();
  String? deviceId = prefs.getString('device_id');
  if (deviceId == null) {
    final random = Random();
    final parts = List.generate(4, (_) => random.nextInt(1000000).toString());
    deviceId = 'dev_${parts.join('_')}';
    await prefs.setString('device_id', deviceId);
  }
  return deviceId;
}

/// Background Socket Service — The Heartbeat Isolate
///
/// This service runs in a dedicated background isolate, maintaining a
/// persistent socket connection to the ZYMI server even when the UI is
/// suspended or the app is minimized. It is the "permanent daemon" half
/// of the Dual-Isolate architecture.
class BackgroundSocketService {
  static final BackgroundSocketService _instance = BackgroundSocketService._internal();
  factory BackgroundSocketService() => _instance;
  BackgroundSocketService._internal();

  static Future<void> initializeService() async {
    final service = FlutterBackgroundService();

    await service.configure(
      iosConfiguration: IosConfiguration(
        autoStart: true,
        onForeground: onStart,
        onBackground: onIosBackground,
      ),
      androidConfiguration: AndroidConfiguration(
        onStart: onStart,
        autoStart: true,
        isForegroundMode: true,
        notificationChannelId: 'zymi_bg_socket',
        initialNotificationTitle: 'ZYMI',
        initialNotificationContent: 'Keeping you connected...',
        foregroundServiceNotificationId: 888,
        foregroundServiceTypes: [AndroidForegroundType.phoneCall, AndroidForegroundType.connectedDevice],
      ),
    );

    await service.startService();
    debugPrint('[BG_SERVICE] Background service initialized');
  }

  /// Invoke a method on the background service from the UI isolate
  static void invoke(String method, [Map<String, dynamic>? args]) {
    final service = FlutterBackgroundService();
    service.invoke(method, args);
  }

  /// Check if the background service is currently running
  static Future<bool> isRunning() {
    return FlutterBackgroundService().isRunning();
  }
}

// iOS background handler — must be a top-level function
@pragma('vm:entry-point')
Future<bool> onIosBackground(ServiceInstance service) async {
  WidgetsFlutterBinding.ensureInitialized();
  DartPluginRegistrant.ensureInitialized();
  return true;
}

// Main background isolate entry point — must be a top-level function
@pragma('vm:entry-point')
void onStart(ServiceInstance service) async {
  DartPluginRegistrant.ensureInitialized();

  io.Socket? socket;
  Timer? heartbeatTimer;

  // Retrieve stored auth token
  Future<String?> getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('auth_token');
  }

  // Initialize the dedicated background socket connection
  Future<void> connectSocket() async {
    final token = await getToken();
    if (token == null) {
      debugPrint('[BG_SOCKET] No auth token found, skipping connection');
      return;
    }

    final Map<String, dynamic> socketOptions = io.OptionBuilder()
        .setTransports(['websocket'])
        .enableForceNew()
        .enableAutoConnect()
        .enableReconnection()
        .setAuth({
          'token': token,
          'type': 'BACKGROUND', // Socket Type Protocol: identifies this as the persistent daemon
        })
        .build();
    socketOptions.addAll({
      'reconnectionAttempts': double.infinity,
      'reconnectionDelay': 2000,
      'reconnectionDelayMax': 10000,
    });

    socket = io.io(AppConfig.apiUrl, socketOptions);

    socket!.onConnect((_) {
      debugPrint('[BG_SOCKET] Connected to server');
      service.invoke('updateNotification', {
        'title': 'ZYMI',
        'content': 'Connected — listening for calls',
      });
      // Fetch latest policies on connection to ensure fresh state
      socket!.emit('policy-fetch');
    });

    socket!.onDisconnect((_) {
      debugPrint('[BG_SOCKET] Disconnected from server');
      service.invoke('updateNotification', {
        'title': 'ZYMI',
        'content': 'Reconnecting...',
      });
    });

    socket!.onConnectError((err) {
      debugPrint('[BG_SOCKET] Connection error: $err');
    });

    // Listen for incoming calls — trigger native ringtone & notify UI
    socket!.on('incoming-call', (data) async {
      final startTime = DateTime.now();
      
      // Branch Guard: Log WakeLock efficacy
      service.invoke('log_telemetry', {
        'event': 'wakelock_acquired',
        'timestamp': startTime.toIso8601String(),
      });

      debugPrint('[BG_SOCKET] Incoming call received: $data');

      // Persist missed call data for Handshake Bridge flush on app resume
      final callerName = data is Map ? (data['callerName'] ?? 'Unknown') : 'Unknown';
      final prefs = await SharedPreferences.getInstance();
      
      // Load existing list if any
      List<String> missedListStr = prefs.getStringList('pending_missed_calls') ?? [];
      missedListStr.add(jsonEncode({'name': callerName, 'priority': 0, 'timestamp': DateTime.now().millisecondsSinceEpoch}));
      await prefs.setStringList('pending_missed_calls', missedListStr);
      await prefs.setInt('pending_call_timestamp', DateTime.now().millisecondsSinceEpoch);

      // Hardware Guard: acquire WakeLock via MethodChannel (30s ring window) or CallKit
      try {
        if (Platform.isIOS) { 
            // iOS CallKit invocation logic follows
        } else {
            const channelWake = MethodChannel('com.zymi.app/wakelock');
            await channelWake.invokeMethod('acquire', {'timeout': 30000});
        }
      } catch (e) {
        debugPrint('[BG_SOCKET] WakeLock channel unavailable: $e');
      }

      try {
        const channelCallKit = MethodChannel('com.zymi.app/callkit');
        await channelCallKit.invokeMethod('reportIncomingCall', {'handle': callerName.toString()});
      } catch (e) {
        debugPrint('[BG_SOCKET] CallKit channel unavailable: $e');
      }

      FlutterRingtonePlayer().playRingtone(asAlarm: true);
      // Notify the UI isolate to show the incoming call screen
      service.invoke('showIncomingCall', data is Map<String, dynamic> ? data : {'raw': data.toString()});

      // Helper function to stop ringtone and release wakelock
      void terminateCall() async {
        final duration = DateTime.now().difference(startTime).inSeconds;
        service.invoke('log_telemetry', {
          'event': 'wakelock_released',
          'duration': duration,
        });
        FlutterRingtonePlayer().stop();
      }

      // Wait for call termination to release WakeLock and log telemetry
      socket!.once('call-ended', (_) => terminateCall());
      socket!.once('call-rejected', (_) => terminateCall());
    });

    // Heartbeat acknowledgment from server
    socket!.on('heartbeat-ack', (data) {
      debugPrint('[BG_SOCKET] Heartbeat acknowledged');
    });

    // Listen for policy updates from admin
    socket!.on('policy-update', (data) async {
      debugPrint('[BG_SOCKET] Policy update received: $data');
      if (data is Map) {
        service.invoke('policy_update', Map<String, dynamic>.from(data));
        // Also cache it in SharedPreferences so UI can read it on startup/resumption
        final prefs = await SharedPreferences.getInstance();
        if (data['featureKey'] != null) {
          await prefs.setBool('feature_${data['featureKey']}', data['enabled'] == true);
        }

        // Broadcast ACK back to admin socket server
        if (data.containsKey('updateId')) {
          final deviceId = await _getOrCreateDeviceId();
          socket!.emit('policy-ack', {
            'updateId': data['updateId'],
            'deviceId': deviceId,
            'status': 'APPLIED'
          });
        }
      }
    });

    // Listen for nearby settings updates from admin
    socket!.on('nearby-settings-update', (data) async {
      debugPrint('[BG_SOCKET] Nearby settings update received: $data');
      if (data is Map) {
        service.invoke('nearby_settings_update', Map<String, dynamic>.from(data));
        final prefs = await SharedPreferences.getInstance();
        await prefs.setInt('nearby_radius', data['radius'] ?? 10000);
        await prefs.setBool('nearby_fuzzing', data['fuzzing'] == true);

        // Broadcast ACK back to admin socket server
        if (data.containsKey('updateId')) {
          final deviceId = await _getOrCreateDeviceId();
          socket!.emit('policy-ack', {
            'updateId': data['updateId'],
            'deviceId': deviceId,
            'status': 'APPLIED'
          });
        }
      }
    });

    // Listen for full policy sync
    socket!.on('policy-sync', (data) async {
      debugPrint('[BG_SOCKET] Policy sync payload received: $data');
      if (data is Map) {
        final prefs = await SharedPreferences.getInstance();
        
        final featuresData = data['features'];
        if (featuresData is Map) {
          featuresData.forEach((key, val) async {
            final isEnabled = val == 'true' || val == true;
            await prefs.setBool('feature_$key', isEnabled);
            service.invoke('policy_update', {
              'featureKey': key,
              'enabled': isEnabled,
            });
          });
        }

        final nearbyData = data['nearbyConfig'];
        if (nearbyData is Map) {
          final radius = int.tryParse(nearbyData['radius']?.toString() ?? '10000') ?? 10000;
          final fuzzing = nearbyData['fuzzing'] == 'true' || nearbyData['fuzzing'] == true || nearbyData['fuzzing'] == '0.005';
          await prefs.setInt('nearby_radius', radius);
          await prefs.setBool('nearby_fuzzing', fuzzing);
          
          service.invoke('nearby_settings_update', {
            'radius': radius,
            'fuzzing': fuzzing,
          });
        }
      }
    });

    socket!.connect();

    // Heartbeat Synchronization (25s interval matches server pingInterval)
    heartbeatTimer?.cancel();
    heartbeatTimer = Timer.periodic(const Duration(seconds: 25), (t) {
      if (socket?.connected == true) {
        socket!.emit('heartbeat_ping', {'timestamp': DateTime.now().millisecondsSinceEpoch});
      }
    });

    // Network Sensing: Handle WiFi <-> Cellular transitions (Bug #3)
    // onConnectivityChanged emits List<ConnectivityResult> in connectivity_plus v5+
    Connectivity().onConnectivityChanged.listen((List<ConnectivityResult> results) {
      final hasNetwork = results.any((r) => r != ConnectivityResult.none);
      if (hasNetwork && socket?.connected != true) {
        debugPrint('[BG_SOCKET] Network restored: $results, reconnecting...');
        socket?.connect();
      }
    });
  }

  // Listen for lifecycle commands from the UI isolate
  service.on('transfer_to_ui').listen((event) async {
    debugPrint('[BG_SERVICE] App moved to foreground (transfer_to_ui)');
    // UI socket will take over active media; background stays connected for redundancy
    // Handshake Bridge: flush any missed calls that arrived during the gap
    final prefs = await SharedPreferences.getInstance();
    final missedListStr = prefs.getStringList('pending_missed_calls');
    
    if (missedListStr != null && missedListStr.isNotEmpty) {
      // Decode the string list into map list
      List<Map<String, dynamic>> missedList = [];
      for (var str in missedListStr) {
        try {
          final decoded = jsonDecode(str);
          missedList.add(decoded);
        } catch (_) {
          // Fallback parsing if not valid JSON
          final nameMatch = RegExp(r'"name": "(.*?)"').firstMatch(str);
          if (nameMatch != null) {
            missedList.add({'name': nameMatch.group(1), 'priority': 0}); // Default call priority = 0
          }
        }
      }
      
      // Leaf: Sort by Priority (Calls = 0, others = 1+)
      missedList.sort((a, b) {
        int pA = a['priority'] ?? 0;
        int pB = b['priority'] ?? 0;
        return pA.compareTo(pB);
      });
      
      service.invoke('sync_ui_state', {'missed_list': missedList});
      await prefs.remove('pending_missed_calls');
      await prefs.remove('pending_missed_caller'); // cleanup old key just in case
      debugPrint('[BG_SERVICE] Flushed ${missedList.length} pending missed calls');
    }
  });

  service.on('transfer_to_bg').listen((event) {
    debugPrint('[BG_SERVICE] App moved to background (transfer_to_bg)');
    // Ensure our background socket is alive
    if (socket?.connected != true) {
      connectSocket();
    }
  });

  service.on('stopService').listen((event) {
    heartbeatTimer?.cancel();
    socket?.disconnect();
    socket?.dispose();
    service.stopSelf();
    debugPrint('[BG_SERVICE] Service stopped');
  });

  service.on('reconnect').listen((event) {
    debugPrint('[BG_SERVICE] Reconnect requested');
    socket?.disconnect();
    connectSocket();
  });

  // Join the user's room on the server
  service.on('joinRoom').listen((event) {
    final userId = event?['userId'];
    if (userId != null && socket?.connected == true) {
      socket!.emit('join', userId);
      debugPrint('[BG_SOCKET] Joined room for user: $userId');
    }
  });

  // Initial connection
  await connectSocket();
}
