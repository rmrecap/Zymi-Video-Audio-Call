import 'package:flutter/material.dart';
import '../../core/runtime/runtime_state_binder.dart';
import '../../core/runtime/app_runtime_state.dart';

class CallPlaceholderScreen extends StatefulWidget {
  const CallPlaceholderScreen({super.key});

  @override
  State<CallPlaceholderScreen> createState() => _CallPlaceholderScreenState();
}

class _CallPlaceholderScreenState extends State<CallPlaceholderScreen> {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Real Runtime Call Test')),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Text('Simulation for Flutter Real Runtime Binding'),
            const SizedBox(height: 20),
            ElevatedButton(
              onPressed: () => setState(() => runtimeStateBinder.setCallRinging(true)),
              child: const Text('Simulate Ringing'),
            ),
            ElevatedButton(
              onPressed: () => setState(() => runtimeStateBinder.setCallConnecting(true)),
              child: const Text('Simulate Connecting'),
            ),
            ElevatedButton(
              onPressed: () => setState(() => runtimeStateBinder.setCallConnected(true)),
              child: const Text('Simulate Connected'),
            ),
            ElevatedButton(
              onPressed: () => setState(() => runtimeStateBinder.setCallEnded()),
              style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
              child: const Text('End Call'),
            ),
            const Divider(),
            SwitchListTile(
              title: const Text('Camera Active'),
              value: appRuntimeState.isCameraActive,
              onChanged: (v) => setState(() => runtimeStateBinder.setCameraActive(v)),
            ),
            SwitchListTile(
              title: const Text('Mic Active'),
              value: appRuntimeState.isMicActive,
              onChanged: (v) => setState(() => runtimeStateBinder.setMicActive(v)),
            ),
          ],
        ),
      ),
    );
  }
}
