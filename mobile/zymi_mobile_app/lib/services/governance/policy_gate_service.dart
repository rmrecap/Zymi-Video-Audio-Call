import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

class PolicyGateService extends ChangeNotifier {
  static final PolicyGateService instance = PolicyGateService._internal();
  
  PolicyGateService._internal() {
    _loadFromPrefs();
  }

  factory PolicyGateService() => instance;

  final Map<String, bool> _features = {
    'video_call_enabled': true,
    'audio_call_enabled': true,
    'nearby_enabled': true,
  };

  int _nearbyRadius = 10000;
  bool _nearbyFuzzing = true;

  int get nearbyRadius => _nearbyRadius;
  bool get nearbyFuzzing => _nearbyFuzzing;

  Future<void> _loadFromPrefs() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      _features.forEach((key, _) {
        final val = prefs.getBool('feature_$key');
        if (val != null) {
          _features[key] = val;
        }
      });
      _nearbyRadius = prefs.getInt('nearby_radius') ?? 10000;
      _nearbyFuzzing = prefs.getBool('nearby_fuzzing') ?? true;
      notifyListeners();
    } catch (_) {}
  }

  void updateFromDaemon(Map<String, dynamic> payload) {
    // Trunk: Receive updates from Background Isolate via MethodChannel or Sync State
    if (payload.containsKey('featureKey')) {
      final key = payload['featureKey']?.toString();
      final val = payload['enabled'];
      if (key != null && _features.containsKey(key)) {
        _features[key] = val == true || val == 1 || val == 'true';
      }
    } else {
      payload.forEach((key, value) {
        if (_features.containsKey(key)) {
          _features[key] = value == true || value == 1 || value == 'true';
        }
      });
    }
    notifyListeners(); // Leaf: Triggers immediate UI Rebuild
  }

  void updateNearbySettings(int radius, bool fuzzing) {
    _nearbyRadius = radius;
    _nearbyFuzzing = fuzzing;
    notifyListeners();
  }

  bool isEnabled(String feature) => _features[feature] ?? true;
}
