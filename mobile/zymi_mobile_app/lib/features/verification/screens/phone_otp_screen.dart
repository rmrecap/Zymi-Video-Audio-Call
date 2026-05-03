import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../../services/api/otp_service.dart';
import '../widgets/country_code_dropdown.dart';
import '../../../core/data/country_codes.dart';

class PhoneOtpScreen extends StatefulWidget {
  const PhoneOtpScreen({super.key});

  @override
  State<PhoneOtpScreen> createState() => _PhoneOtpScreenState();
}

class _PhoneOtpScreenState extends State<PhoneOtpScreen> {
  final _phoneController = TextEditingController();
  final _otpService = OtpService();
  
  CountryCode? _selectedCountry;
  bool _isLoading = false;
  bool _linkGenerated = false;
  String? _verificationLink;
  String? _error;

  @override
  void dispose() {
    _phoneController.dispose();
    super.dispose();
  }

  void _handleRequestLink() async {
    if (_selectedCountry == null || _phoneController.text.isEmpty) {
      setState(() => _error = 'Please select country and enter phone number');
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
      setState(() {
        _isLoading = false;
      });

      if (result['success']) {
        setState(() {
          _linkGenerated = true;
          _verificationLink = result['link'];
        });
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
        title: const Text('Phone Verification'),
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
                const Icon(Icons.phonelink_setup, size: 64, color: Colors.blueAccent),
                const SizedBox(height: 24),
                if (_error != null) ...[
                  Text(_error!, style: const TextStyle(color: Colors.redAccent), textAlign: TextAlign.center),
                  const SizedBox(height: 16),
                ],
                if (!_linkGenerated) ...[
                  const Text(
                    'Select your country and enter your phone number to receive a verification link.',
                    style: TextStyle(color: Colors.white70),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 24),
                  CountryCodeDropdown(
                    selectedCountry: _selectedCountry,
                    onChanged: (c) => setState(() => _selectedCountry = c),
                  ),
                  const SizedBox(height: 16),
                  TextField(
                    controller: _phoneController,
                    keyboardType: TextInputType.phone,
                    decoration: InputDecoration(
                      labelText: 'Phone Number',
                      hintText: '17XXXXXXXX',
                      filled: true,
                      fillColor: const Color(0xFF1e293b),
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                  ),
                  const SizedBox(height: 24),
                  ElevatedButton(
                    onPressed: _isLoading ? null : _handleRequestLink,
                    style: ElevatedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      backgroundColor: Colors.blueAccent,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                    child: _isLoading ? const CircularProgressIndicator() : const Text('GENERATE VERIFICATION LINK'),
                  ),
                ] else ...[
                  const Text(
                    'Verification link generated. Since we use a self-hosted system, please open this link in your browser to complete verification.',
                    style: TextStyle(color: Colors.white70),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 24),
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: Colors.black26,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: Colors.blueAccent.withValues(alpha: 0.3)),
                    ),
                    child: Text(
                      _verificationLink ?? '',
                      style: const TextStyle(color: Colors.blueAccent, fontSize: 12),
                      textAlign: TextAlign.center,
                    ),
                  ),
                  const SizedBox(height: 16),
                  ElevatedButton.icon(
                    onPressed: () {
                      Clipboard.setData(ClipboardData(text: _verificationLink ?? ''));
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Link copied to clipboard')),
                      );
                    },
                    icon: const Icon(Icons.copy),
                    label: const Text('COPY LINK'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF334155),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                  ),
                  const SizedBox(height: 24),
                  const Text(
                    'After verifying on the page, return here and refresh.',
                    style: TextStyle(color: Colors.white38, fontSize: 12),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 12),
                  TextButton(
                    onPressed: () => Navigator.pop(context, true),
                    child: const Text('I HAVE VERIFIED'),
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
