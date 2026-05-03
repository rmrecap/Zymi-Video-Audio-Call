import 'package:flutter/material.dart';
import '../../../services/api/otp_service.dart';

class EmailOtpScreen extends StatefulWidget {
  final String? initialEmail;
  const EmailOtpScreen({super.key, this.initialEmail});

  @override
  State<EmailOtpScreen> createState() => _EmailOtpScreenState();
}

class _EmailOtpScreenState extends State<EmailOtpScreen> {
  final _emailController = TextEditingController();
  final _otpController = TextEditingController();
  final _otpService = OtpService();
  
  bool _isLoading = false;
  bool _otpSent = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    if (widget.initialEmail != null) {
      _emailController.text = widget.initialEmail!;
    }
  }

  void _handleRequestOtp() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    final result = await _otpService.requestEmailOtp(_emailController.text);

    if (mounted) {
      setState(() {
        _isLoading = false;
      });

      if (result['success']) {
        setState(() {
          _otpSent = true;
        });
      } else {
        setState(() {
          _error = result['error'];
        });
      }
    }
  }

  void _handleVerifyOtp() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    final result = await _otpService.verifyEmailOtp(_otpController.text);

    if (mounted) {
      setState(() {
        _isLoading = false;
      });

      if (result['success']) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Email verified successfully')),
        );
        Navigator.pop(context, true);
      } else {
        setState(() {
          _error = result['error'];
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Email Verification'),
        backgroundColor: Colors.transparent,
      ),
      body: Center(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 400),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const Icon(Icons.mark_email_read, size: 64, color: Colors.blueAccent),
                const SizedBox(height: 24),
                if (_error != null) ...[
                  Text(_error!, style: const TextStyle(color: Colors.redAccent), textAlign: TextAlign.center),
                  const SizedBox(height: 16),
                ],
                if (!_otpSent) ...[
                  TextField(
                    controller: _emailController,
                    keyboardType: TextInputType.emailAddress,
                    decoration: InputDecoration(
                      labelText: 'Email Address',
                      filled: true,
                      fillColor: const Color(0xFF1e293b),
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                  ),
                  const SizedBox(height: 24),
                  ElevatedButton(
                    onPressed: _isLoading ? null : _handleRequestOtp,
                    style: ElevatedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      backgroundColor: Colors.blueAccent,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                    child: _isLoading ? const CircularProgressIndicator() : const Text('SEND OTP'),
                  ),
                ] else ...[
                  const Text(
                    'We sent a verification code to your email.',
                    style: TextStyle(color: Colors.white70),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 24),
                  TextField(
                    controller: _otpController,
                    keyboardType: TextInputType.number,
                    textAlign: TextAlign.center,
                    style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold, letterSpacing: 8),
                    decoration: InputDecoration(
                      hintText: '000000',
                      filled: true,
                      fillColor: const Color(0xFF1e293b),
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                  ),
                  const SizedBox(height: 24),
                  ElevatedButton(
                    onPressed: _isLoading ? null : _handleVerifyOtp,
                    style: ElevatedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      backgroundColor: Colors.blueAccent,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                    child: _isLoading ? const CircularProgressIndicator() : const Text('VERIFY EMAIL'),
                  ),
                  TextButton(
                    onPressed: () => setState(() => _otpSent = false),
                    child: const Text('Change Email'),
                  ),
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }
}
