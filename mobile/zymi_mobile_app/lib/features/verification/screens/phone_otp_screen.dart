import 'dart:async';
import 'package:flutter/material.dart';
import '../../../services/api/otp_service.dart';
import '../widgets/country_code_dropdown.dart';
import '../../../core/data/country_codes.dart';
import '../../../core/theme/zymi_brand_colors.dart';

class PhoneOtpScreen extends StatefulWidget {
  const PhoneOtpScreen({super.key});

  @override
  State<PhoneOtpScreen> createState() => _PhoneOtpScreenState();
}

class _PhoneOtpScreenState extends State<PhoneOtpScreen> {
  final _phoneController = TextEditingController();
  final _otpInputController = TextEditingController();
  final _otpService = OtpService();
  
  CountryCode? _selectedCountry;
  bool _isLoading = false;
  bool _otpGenerated = false;
  String? _otpPreview;
  DateTime? _expiresAt;
  String? _error;
  Timer? _timer;
  int _secondsRemaining = 0;

  @override
  void dispose() {
    _phoneController.dispose();
    _otpInputController.dispose();
    _timer?.cancel();
    super.dispose();
  }

  void _startTimer() {
    _timer?.cancel();
    if (_expiresAt == null) return;
    
    _secondsRemaining = _expiresAt!.difference(DateTime.now()).inSeconds;
    if (_secondsRemaining <= 0) return;

    _timer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (mounted) {
        setState(() {
          _secondsRemaining = _expiresAt!.difference(DateTime.now()).inSeconds;
          if (_secondsRemaining <= 0) {
            _timer?.cancel();
          }
        });
      }
    });
  }

  String _formatTime(int seconds) {
    if (seconds <= 0) return "Expired";
    final m = (seconds / 60).floor();
    final s = seconds % 60;
    return "${m.toString().padLeft(2, '0')}:${s.toString().padLeft(2, '0')}";
  }

  void _handleGenerateOtp() async {
    if (_selectedCountry == null || _phoneController.text.isEmpty) {
      setState(() => _error = 'Select country and enter phone');
      return;
    }

    setState(() {
      _isLoading = true;
      _error = null;
    });

    final result = await _otpService.requestPhoneLink(
      phone: _phoneController.text,
      countryCode: _selectedCountry!.code,
      countryName: _selectedCountry!.name,
      phoneCountryIso: _selectedCountry!.iso,
    );

    if (mounted) {
      setState(() => _isLoading = false);

      if (result['success']) {
        setState(() {
          _otpGenerated = true;
          _otpPreview = result['otpPreview'];
          _expiresAt = DateTime.parse(result['expiresAt']);
          _startTimer();
        });
      } else {
        setState(() => _error = result['error']);
      }
    }
  }

  void _handleVerifyOtp() async {
    if (_otpInputController.text.length < 6) {
      setState(() => _error = 'Enter 6-digit OTP');
      return;
    }

    setState(() {
      _isLoading = true;
      _error = null;
    });

    final result = await _otpService.verifyPhoneOtpInline(_otpInputController.text);

    if (mounted) {
      setState(() => _isLoading = false);

      if (result['success']) {
        _showSuccessDialog();
      } else {
        setState(() => _error = result['error']);
      }
    }
  }

  void _showSuccessDialog() {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => AlertDialog(
        backgroundColor: const Color(0xFF1e293b),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Row(
          children: [
            Icon(Icons.check_circle, color: Colors.green),
            SizedBox(width: 12),
            Text('Success', style: TextStyle(color: Colors.white)),
          ],
        ),
        content: const Text('Your phone number has been verified successfully.', style: TextStyle(color: Colors.white70)),
        actions: [
          TextButton(
            onPressed: () {
              Navigator.pop(context); // Close dialog
              Navigator.pop(context, true); // Return to profile
            },
            child: const Text('OK'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0f172a),
      appBar: AppBar(
        title: const Text('Phone Verification'),
        backgroundColor: Colors.transparent,
        elevation: 0,
        centerTitle: true,
      ),
      body: Center(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 40),
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 400),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                _buildHeader(),
                const SizedBox(height: 32),
                if (_error != null) _buildError(),
                if (!_otpGenerated) _buildPhoneInput() else _buildOtpVerification(),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildHeader() {
    return Column(
      children: [
        Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            color: ZymiColors.primary.withValues(alpha: 0.1),
            shape: BoxShape.circle,
          ),
          child: const Icon(Icons.phonelink_lock, size: 64, color: ZymiColors.primary),
        ),
        const SizedBox(height: 24),
        const Text(
          'Secure Verification',
          style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: Colors.white),
        ),
        const SizedBox(height: 8),
        Text(
          _otpGenerated ? 'Enter the OTP shown below' : 'Verify your phone to secure your account',
          style: const TextStyle(color: Colors.white54),
          textAlign: TextAlign.center,
        ),
      ],
    );
  }

  Widget _buildError() {
    return Container(
      margin: const EdgeInsets.only(bottom: 24),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.redAccent.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.redAccent.withValues(alpha: 0.3)),
      ),
      child: Row(
        children: [
          const Icon(Icons.error_outline, color: Colors.redAccent, size: 20),
          const SizedBox(width: 12),
          Expanded(child: Text(_error!, style: const TextStyle(color: Colors.redAccent, fontSize: 13))),
        ],
      ),
    );
  }

  Widget _buildPhoneInput() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const Text('Country', style: TextStyle(color: Colors.white70, fontSize: 12)),
        const SizedBox(height: 8),
        CountryCodeDropdown(
          selectedCountry: _selectedCountry,
          onChanged: (c) => setState(() => _selectedCountry = c),
        ),
        const SizedBox(height: 20),
        const Text('Phone Number', style: TextStyle(color: Colors.white70, fontSize: 12)),
        const SizedBox(height: 8),
        TextField(
          controller: _phoneController,
          keyboardType: TextInputType.phone,
          style: const TextStyle(color: Colors.white),
          decoration: InputDecoration(
            hintText: 'e.g. 1712345678',
            hintStyle: const TextStyle(color: Colors.white24),
            filled: true,
            fillColor: const Color(0xFF1e293b),
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
            prefixIcon: const Icon(Icons.phone, color: Colors.white38),
          ),
        ),
        const SizedBox(height: 32),
        ElevatedButton(
          onPressed: _isLoading ? null : _handleGenerateOtp,
          style: ElevatedButton.styleFrom(
            padding: const EdgeInsets.symmetric(vertical: 16),
            backgroundColor: ZymiColors.primary,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            elevation: 0,
          ),
          child: _isLoading ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white)) : const Text('GENERATE OTP', style: TextStyle(fontWeight: FontWeight.bold, letterSpacing: 1.1)),
        ),
        const SizedBox(height: 20),
        const Text(
          'No SMS needed. Your secure OTP is generated by ZYMI self-hosted engine.',
          style: TextStyle(color: Colors.white38, fontSize: 11),
          textAlign: TextAlign.center,
        ),
      ],
    );
  }

  Widget _buildOtpVerification() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        if (_otpPreview != null) ...[
          Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [ZymiColors.primary.withValues(alpha: 0.2), Colors.purpleAccent.withValues(alpha: 0.1)],
              ),
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: ZymiColors.primary.withValues(alpha: 0.3)),
            ),
            child: Column(
              children: [
                const Text('YOUR SECURE OTP', style: TextStyle(color: Colors.white54, fontSize: 12, letterSpacing: 2)),
                const SizedBox(height: 12),
                Text(
                  _otpPreview!,
                  style: const TextStyle(color: Colors.white, fontSize: 48, fontWeight: FontWeight.bold, letterSpacing: 8),
                ),
                const SizedBox(height: 12),
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Icon(Icons.timer_outlined, size: 16, color: Colors.orangeAccent),
                    const SizedBox(width: 8),
                    Text(
                      'Expires in: ${_formatTime(_secondsRemaining)}',
                      style: const TextStyle(color: Colors.orangeAccent, fontWeight: FontWeight.bold),
                    ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 32),
        ],
        const Text('Enter OTP', style: TextStyle(color: Colors.white70, fontSize: 12)),
        const SizedBox(height: 8),
        TextField(
          controller: _otpInputController,
          keyboardType: TextInputType.number,
          maxLength: 6,
          textAlign: TextAlign.center,
          style: const TextStyle(color: Colors.white, fontSize: 24, letterSpacing: 12, fontWeight: FontWeight.bold),
          decoration: InputDecoration(
            counterText: '',
            filled: true,
            fillColor: const Color(0xFF1e293b),
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
          ),
        ),
        const SizedBox(height: 32),
        ElevatedButton(
          onPressed: _isLoading || _secondsRemaining <= 0 ? null : _handleVerifyOtp,
          style: ElevatedButton.styleFrom(
            padding: const EdgeInsets.symmetric(vertical: 16),
            backgroundColor: Colors.green,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            elevation: 0,
          ),
          child: _isLoading ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white)) : const Text('VERIFY OTP', style: TextStyle(fontWeight: FontWeight.bold, letterSpacing: 1.1)),
        ),
        const SizedBox(height: 16),
        TextButton(
          onPressed: () => setState(() => _otpGenerated = false),
          child: const Text('Change Phone Number', style: TextStyle(color: Colors.white38)),
        ),
      ],
    );
  }
}
