import 'dart:async';

class TypingThrottle {
  Timer? _typingTimer;
  Timer? _stopTimer;
  bool _isSending = false;

  final Duration typingInterval;
  final Duration stopDelay;
  final void Function() onTyping;
  final void Function() onStopTyping;

  TypingThrottle({
    required this.onTyping,
    required this.onStopTyping,
    this.typingInterval = const Duration(seconds: 2),
    this.stopDelay = const Duration(milliseconds: 1500),
  });

  void onTextChanged(String text) {
    if (text.isEmpty) {
      _cancelAll();
      onStopTyping();
      return;
    }

    // Throttle typing emit to max once per interval
    if (!_isSending) {
      _isSending = true;
      onTyping();
      _typingTimer = Timer(typingInterval, () => _isSending = false);
    }

    // Reset stop timer
    _stopTimer?.cancel();
    _stopTimer = Timer(stopDelay, () {
      onStopTyping();
      _isSending = false;
    });
  }

  void onSend() {
    _cancelAll();
    onStopTyping();
  }

  void _cancelAll() {
    _typingTimer?.cancel();
    _stopTimer?.cancel();
    _isSending = false;
  }

  void dispose() {
    _cancelAll();
  }
}
