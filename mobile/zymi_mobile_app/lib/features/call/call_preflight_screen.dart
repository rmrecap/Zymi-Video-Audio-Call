import 'package:flutter/material.dart';
import 'call_preflight_state.dart';
import 'services/call_permission_service.dart';
import '../../core/runtime/app_runtime_state.dart';
import '../../core/runtime/runtime_state_binder.dart';

class CallPreflightScreen extends StatefulWidget {
  final String peerId;
  final String peerName;
  final bool isVideo;

  const CallPreflightScreen({
    super.key,
    required this.peerId,
    required this.peerName,
    this.isVideo = false,
  });

  @override
  State<CallPreflightScreen> createState() => _CallPreflightScreenState();
}

class _CallPreflightScreenState extends State<CallPreflightScreen> {
  final CallPreflightState _state = CallPreflightState();

  @override
  void initState() {
    super.initState();
    // Block ads during preflight
    appRuntimeState.isConnectingCall = true;
  }

  @override
  void dispose() {
    // Clear preflight state on exit if not entering a real call
    if (_state.status != CallPreflightStatus.ready) {
      appRuntimeState.isConnectingCall = false;
    }
    super.dispose();
  }

  Future<void> _checkMic() async {
    setState(() => _state.status = CallPreflightStatus.checkingPermission);
    _state.hasMicPermission = await CallPermissionService.checkMicrophonePermission();
    setState(() {
      _state.status = _state.hasMicPermission
          ? CallPreflightStatus.idle
          : CallPreflightStatus.permissionDenied;
    });
  }

  Future<void> _checkCamera() async {
    setState(() => _state.status = CallPreflightStatus.checkingPermission);
    _state.hasCameraPermission = await CallPermissionService.checkCameraPermission();
    setState(() {
      _state.status = _state.hasCameraPermission
          ? CallPreflightStatus.idle
          : CallPreflightStatus.permissionDenied;
    });
  }

  void _markReady() {
    if (!_state.hasMicPermission) {
      setState(() => _state.errorMessage = 'Microphone permission required');
      return;
    }
    if (!appRuntimeState.canShowAds) {
      // canShowAds being false here is expected because we set isConnectingCall
    }
    setState(() => _state.status = CallPreflightStatus.ready);
  }

  void _cancel() {
    runtimeStateBinder.setCallEnded();
    Navigator.of(context).pop();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0f172a),
      appBar: AppBar(
        title: const Text('Call Preflight'),
        backgroundColor: const Color(0xFF1e293b),
      ),
      body: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            _permRow('Microphone', _state.hasMicPermission),
            const SizedBox(height: 8),
            ElevatedButton(onPressed: _checkMic, child: const Text('Check Microphone')),

            const SizedBox(height: 16),
            _permRow('Camera', _state.hasCameraPermission),
            const SizedBox(height: 8),
            ElevatedButton(onPressed: _checkCamera, child: const Text('Check Camera')),

            const SizedBox(height: 24),
            Text(
              'Status: ${_state.status.name}',
              style: const TextStyle(color: Colors.white70, fontSize: 14),
            ),
            Text(
              'Ad Gate: ${appRuntimeState.canShowAds ? "SAFE" : "BLOCKED (expected)"}',
              style: TextStyle(
                color: appRuntimeState.canShowAds ? Colors.green : Colors.amber,
                fontSize: 13,
              ),
            ),
            if (_state.errorMessage != null)
              Text(_state.errorMessage!, style: const TextStyle(color: Colors.redAccent)),

            const Spacer(),
            ElevatedButton(
              onPressed: _state.hasMicPermission ? _markReady : null,
              style: ElevatedButton.styleFrom(backgroundColor: Colors.green),
              child: const Text('Ready to Call (Preflight Only)'),
            ),
            const SizedBox(height: 8),
            OutlinedButton(
              onPressed: _cancel,
              child: const Text('Cancel'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _permRow(String label, bool granted) {
    return Row(
      children: [
        Icon(granted ? Icons.check_circle : Icons.cancel, color: granted ? Colors.green : Colors.red),
        const SizedBox(width: 8),
        Text('$label: ${granted ? "Granted" : "Not checked"}',
            style: const TextStyle(color: Colors.white, fontSize: 14)),
      ],
    );
  }
}
