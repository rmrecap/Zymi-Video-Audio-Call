class PhoneNormalizer {
  /// Normalizes phone numbers to a canonical format (+880...)
  /// Supports Bangladesh numbers starting with 01, 880, +880
  static String? normalize(String? phone) {
    if (phone == null || phone.isEmpty) return null;

    // Remove all non-numeric characters except +
    String cleaned = phone.replaceAll(RegExp(r'[^\d+]'), '');

    // Handle Bangladesh specific normalization
    // If starts with 01..., add +88
    if (cleaned.startsWith('01') && cleaned.length == 11) {
      cleaned = '+88$cleaned';
    }
    
    // If starts with 8801..., add +
    if (cleaned.startsWith('8801') && cleaned.length == 13) {
      cleaned = '+$cleaned';
    }

    return cleaned;
  }
}
