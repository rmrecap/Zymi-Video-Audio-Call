import 'package:flutter/material.dart';
import 'package:flutter_webrtc/flutter_webrtc.dart';
import '../controllers/call_controller.dart';

class LiveCallScreen extends StatefulWidget {
  final String peerId;
  final bool isVideo;

  const LiveCallScreen({
    super.key,
    required this.peerId,
    required this.isVideo,
  });

  @override
  State<LiveCallScreen> createState() => _LiveCallScreenState();
}

class _LiveCallScreenState extends State<LiveCallScreen> {
  final CallController _callController = CallController();
  bool _isMicEnabled = true;
  bool _isCameraEnabled = true;

  @override
  void initState() {
    super.initState();
    _callController.addListener(_onStateChange);
    _callController.initRenderers();
  }

  void _onStateChange() {
    if (mounted) setState(() {});
    if (_callController.state == CallState.ended || _callController.state == CallState.failed) {
      if (mounted) Navigator.of(context).pop();
    }
  }

  @override
  void dispose() {
    _callController.removeListener(_onStateChange);
    super.dispose();
  }

  void _toggleMic() {
    setState(() => _isMicEnabled = !_isMicEnabled);
    _callController.toggleMic(_isMicEnabled);
  }

  void _toggleCamera() {
    setState(() => _isCameraEnabled = !_isCameraEnabled);
    _callController.toggleCamera(_isCameraEnabled);
  }

  Future<void> _endCall() async {
    await _callController.endCall();
    _callController.removeListener(_onStateChange);
    if (mounted) Navigator.of(context).pop();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      body: SafeArea(
        child: Stack(
          children: [
            // Remote Video Full Screen
            if (widget.isVideo)
              Positioned.fill(
                child: RTCVideoView(
                  _callController.remoteRenderer,
                  objectFit: RTCVideoViewObjectFit.RTCVideoViewObjectFitCover,
                ),
              ),

            // Local Preview Bottom Right
            if (widget.isVideo)
              Positioned(
                bottom: 120,
                right: 20,
                width: 100,
                height: 150,
                child: Container(
                  decoration: BoxDecoration(
                    color: Colors.black54,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: Colors.white24),
                  ),
                  clipBehavior: Clip.antiAlias,
                  child: RTCVideoView(
                    _callController.localRenderer,
                    mirror: true,
                    objectFit: RTCVideoViewObjectFit.RTCVideoViewObjectFitCover,
                  ),
                ),
              ),

            // Audio Call Placeholder
            if (!widget.isVideo)
              Center(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const CircleAvatar(
                      radius: 60,
                      backgroundColor: Colors.blueGrey,
                      child: Icon(Icons.person, size: 60, color: Colors.white),
                    ),
                    const SizedBox(height: 20),
                    Text(
                      widget.peerId,
                      style: const TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(height: 10),
                    Text(
                      _callController.state.name.toUpperCase(),
                      style: const TextStyle(color: Colors.white54, fontSize: 16),
                    ),
                  ],
                ),
              ),

            // State Overlay for Video Call
            if (widget.isVideo && _callController.state != CallState.connected)
              Positioned(
                top: 40,
                left: 0,
                right: 0,
                child: Center(
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                    decoration: BoxDecoration(
                      color: Colors.black54,
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Text(
                      _callController.state.name.toUpperCase(),
                      style: const TextStyle(color: Colors.white, fontSize: 14),
                    ),
                  ),
                ),
              ),

            // Controls
            Positioned(
              bottom: 30,
              left: 0,
              right: 0,
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                children: [
                  _controlButton(
                    icon: _isMicEnabled ? Icons.mic : Icons.mic_off,
                    color: _isMicEnabled ? Colors.white24 : Colors.white,
                    iconColor: _isMicEnabled ? Colors.white : Colors.black,
                    onPressed: _toggleMic,
                  ),
                  if (widget.isVideo)
                    _controlButton(
                      icon: _isCameraEnabled ? Icons.videocam : Icons.videocam_off,
                      color: _isCameraEnabled ? Colors.white24 : Colors.white,
                      iconColor: _isCameraEnabled ? Colors.white : Colors.black,
                      onPressed: _toggleCamera,
                    ),
                  _controlButton(
                    icon: Icons.call_end,
                    color: Colors.red,
                    iconColor: Colors.white,
                    onPressed: _endCall,
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _controlButton({
    required IconData icon,
    required Color color,
    required Color iconColor,
    required VoidCallback onPressed,
  }) {
    return InkWell(
      onTap: onPressed,
      borderRadius: BorderRadius.circular(30),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: color,
          shape: BoxShape.circle,
        ),
        child: Icon(icon, color: iconColor, size: 28),
      ),
    );
  }
}
