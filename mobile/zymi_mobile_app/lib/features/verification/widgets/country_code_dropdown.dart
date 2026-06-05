import 'package:flutter/material.dart';
import '../../../core/data/country_codes.dart';
import '../../../core/theme/zymi_brand_colors.dart';

class CountryCodeDropdown extends StatelessWidget {
  final CountryCode? selectedCountry;
  final ValueChanged<CountryCode?> onChanged;

  const CountryCodeDropdown({
    super.key,
    required this.selectedCountry,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12),
      decoration: BoxDecoration(
        color: const Color(0xFF1e293b),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.white10),
      ),
      child: DropdownButtonHideUnderline(
        child: DropdownButton<CountryCode>(
          value: selectedCountry,
          hint: const Text('Select Country', style: TextStyle(color: Colors.white38)),
          dropdownColor: const Color(0xFF1e293b),
          items: countryCodes.map((c) {
            return DropdownMenuItem<CountryCode>(
              value: c,
              child: Row(
                children: [
                  Text(c.iso, style: const TextStyle(color: Colors.white70, fontWeight: FontWeight.bold)),
                  const SizedBox(width: 8),
                  Text(c.code, style: const TextStyle(color: ZymiColors.primary)),
                  const SizedBox(width: 8),
                  Text(c.name, style: const TextStyle(color: Colors.white)),
                ],
              ),
            );
          }).toList(),
          onChanged: onChanged,
        ),
      ),
    );
  }
}
