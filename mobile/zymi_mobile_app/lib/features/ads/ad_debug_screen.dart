import 'package:flutter/material.dart';
import '../../services/zrcs/zrcs_config_model.dart';
import '../../services/zrcs/zrcs_remote_config_service.dart';
import '../../services/ads/interstitial_ad_manager.dart';
import '../../services/ads/rewarded_ad_manager.dart';
import '../../core/runtime/app_runtime_state.dart';
import '../../core/runtime/runtime_state_binder.dart';
import 'widgets/safe_banner_ad.dart';
import 'widgets/ad_blocked_notice.dart';

class AdDebugScreen extends StatefulWidget {
  const AdDebugScreen({super.key});

  @override
  State<AdDebugScreen> createState() => _AdDebugScreenState();
}

class _AdDebugScreenState extends State<AdDebugScreen> {
  ZrcsConfigModel? _config;
  bool _isLoading = true;
  String _statusMessage = '';
  final InterstitialAdManager _interstitialManager = InterstitialAdManager();
  final RewardedAdManager _rewardedManager = RewardedAdManager();

  @override
  void initState() {
    super.initState();
    _fetchConfig();
  }

  @override
  void dispose() {
    _interstitialManager.dispose();
    _rewardedManager.dispose();
    super.dispose();
  }

  Future<void> _fetchConfig() async {
    setState(() => _isLoading = true);
    final service = ZrcsRemoteConfigService();
    final config = await service.fetchConfig();
    setState(() {
      _config = config;
      _isLoading = false;
    });
  }

  void _setStatus(String msg) {
    setState(() => _statusMessage = msg);
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return Scaffold(
        backgroundColor: const Color(0xFF0f172a),
        body: Center(child: CircularProgressIndicator(color: Colors.cyan.shade200)),
      );
    }

    final config = _config!;
    final state = appRuntimeState;

    return Scaffold(
      backgroundColor: const Color(0xFF0f172a),
      appBar: AppBar(
        title: const Text('ZRCS Real Runtime Debug'),
        backgroundColor: const Color(0xFF1e293b),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _fetchConfig,
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          _sectionHeader('ZRCS Ad Config'),
          _infoRow('Enabled', config.adsEnabled ? 'YES' : 'NO', config.adsEnabled ? Colors.green : Colors.red),
          _infoRow('Network', config.activeNetwork.toUpperCase(), Colors.cyan),
          _infoRow('Test Mode', config.testMode ? 'ON' : 'OFF', config.testMode ? Colors.amber : Colors.grey),
          const SizedBox(height: 16),
          _sectionHeader('Real-Time Runtime State'),
          _infoRow('isInCall', state.isInCall ? 'TRUE' : 'FALSE', state.isInCall ? Colors.red : Colors.green),
          _infoRow('isRinging', state.isRinging ? 'TRUE' : 'FALSE', state.isRinging ? Colors.red : Colors.green),
          _infoRow('isConnecting', state.isConnectingCall ? 'TRUE' : 'FALSE', state.isConnectingCall ? Colors.red : Colors.green),
          _infoRow('isTyping', state.isTyping ? 'TRUE' : 'FALSE', state.isTyping ? Colors.red : Colors.green),
          _infoRow('isFocused', state.isComposerFocused ? 'TRUE' : 'FALSE', state.isComposerFocused ? Colors.red : Colors.green),
          _infoRow('Camera', state.isCameraActive ? 'ON' : 'OFF', state.isCameraActive ? Colors.red : Colors.green),
          _infoRow('Mic', state.isMicActive ? 'ON' : 'OFF', state.isMicActive ? Colors.red : Colors.green),
          _infoRow('Grace Period', state.isInGracePeriod ? 'ACTIVE' : 'EXPIRED', state.isInGracePeriod ? Colors.red : Colors.green),
          
          const SizedBox(height: 10),
          _infoRow('CAN SHOW ADS', state.canShowAds ? 'YES' : 'BLOCKED', state.canShowAds ? Colors.green : Colors.red),
          const AdBlockedNotice(),

          const Divider(color: Colors.white24, height: 32),

          _sectionHeader('Runtime Test Controls (Manual Override)'),
          Wrap(
            spacing: 8,
            children: [
              ActionChip(
                label: const Text('Clear All State'),
                onPressed: () => setState(() => runtimeStateBinder.setCallEnded()),
              ),
              ActionChip(
                label: const Text('Start Ringing'),
                onPressed: () => setState(() => runtimeStateBinder.setCallRinging(true)),
              ),
              ActionChip(
                label: const Text('Connect Call'),
                onPressed: () => setState(() => runtimeStateBinder.setCallConnected(true)),
              ),
            ],
          ),

          const SizedBox(height: 24),

          _sectionHeader('Ad Test Controls'),
          Row(
            children: [
              Expanded(
                child: ElevatedButton(
                  onPressed: () {
                    _interstitialManager.loadAd();
                    _setStatus('Interstitial loading...');
                  },
                  child: const Text('Load Interstitial'),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: ElevatedButton(
                  onPressed: () {
                    if (_interstitialManager.canShow()) {
                      _interstitialManager.showAd();
                      _setStatus('Interstitial shown');
                    } else {
                      _setStatus('Blocked: ${_interstitialManager.getBlockReason()}');
                    }
                  },
                  style: ElevatedButton.styleFrom(backgroundColor: Colors.orange),
                  child: const Text('Show Interstitial'),
                ),
              ),
            ],
          ),

          if (_statusMessage.isNotEmpty) ...[
            const SizedBox(height: 12),
            Text(_statusMessage, style: const TextStyle(color: Colors.white70, fontSize: 13)),
          ],

          const SizedBox(height: 24),
          _sectionHeader('Banner Live Preview'),
          const SafeBannerAd(),
        ],
      ),
    );
  }

  Widget _sectionHeader(String title) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Text(title, style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold)),
    );
  }

  Widget _infoRow(String label, String value, Color valueColor) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label, style: const TextStyle(color: Colors.grey, fontSize: 14)),
        Text(value, style: TextStyle(color: valueColor, fontSize: 14, fontWeight: FontWeight.bold)),
      ],
    );
  }
}
