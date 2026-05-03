class CountryCode {
  final String name;
  final String code;
  final String iso;

  const CountryCode({required this.name, required this.code, required this.iso});
}

const List<CountryCode> countryCodes = [
  CountryCode(name: 'Bangladesh', code: '+880', iso: 'BD'),
  CountryCode(name: 'India', code: '+91', iso: 'IN'),
  CountryCode(name: 'United States', code: '+1', iso: 'US'),
  CountryCode(name: 'United Kingdom', code: '+44', iso: 'GB'),
  CountryCode(name: 'United Arab Emirates', code: '+971', iso: 'AE'),
  CountryCode(name: 'Saudi Arabia', code: '+966', iso: 'SA'),
  CountryCode(name: 'Qatar', code: '+974', iso: 'QA'),
  CountryCode(name: 'Oman', code: '+968', iso: 'OM'),
  CountryCode(name: 'Kuwait', code: '+965', iso: 'KW'),
  CountryCode(name: 'Malaysia', code: '+60', iso: 'MY'),
  CountryCode(name: 'Singapore', code: '+65', iso: 'SG'),
];
