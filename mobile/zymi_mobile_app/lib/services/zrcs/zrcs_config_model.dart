class ZrcsConfigModel {
  final bool adsEnabled;
  final String activeNetwork;
  final bool testMode;
  final Map<String, dynamic> intervals;
  final Map<String, dynamic> placements;
  final Map<String, dynamic> activeNetworkIds;

  ZrcsConfigModel({
    required this.adsEnabled,
    required this.activeNetwork,
    required this.testMode,
    required this.intervals,
    required this.placements,
    required this.activeNetworkIds,
  });

  factory ZrcsConfigModel.fromJson(Map<String, dynamic> json) {
    try {
      return ZrcsConfigModel(
        adsEnabled: json['ads_enabled'] == true,
        activeNetwork: json['active_network'] ?? 'admob',
        testMode: json['test_mode'] == true,
        intervals: json['intervals'] ?? {},
        placements: json['placements'] ?? {},
        activeNetworkIds: json['networks']?[json['active_network']] ?? {},
      );
    } catch (e) {
      return ZrcsConfigModel.safeDefault();
    }
  }

  factory ZrcsConfigModel.safeDefault() {
    return ZrcsConfigModel(
      adsEnabled: false,
      activeNetwork: 'admob',
      testMode: true,
      intervals: {},
      placements: {},
      activeNetworkIds: {},
    );
  }
}
