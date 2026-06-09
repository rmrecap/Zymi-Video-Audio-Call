import 'dart:convert';
import 'package:encrypt/encrypt.dart' as enc;

class EncryptionService {
  static const String _keyStr = 'zymi-secure-encryption-key-32-chars';
  static enc.Key? _key;
  static enc.Encrypter? _encrypter;

  static enc.Encrypter _getEncrypter() {
    if (_encrypter == null) {
      _key = enc.Key.fromUtf8(_keyStr.padRight(32).substring(0, 32));
      _encrypter = enc.Encrypter(enc.AES(_key!, mode: enc.AESMode.cbc));
    }
    return _encrypter!;
  }

  static String? decrypt(String encrypted) {
    if (encrypted.isEmpty) return null;
    try {
      final parts = encrypted.split(':');
      if (parts.length < 2) return encrypted;
      final iv = enc.IV.fromHex(parts[0]);
      final cipherText = parts.sublist(1).join(':');
      final decrypted = _getEncrypter().decrypt(enc.Encrypted.fromHex(cipherText), iv: iv);
      return decrypted;
    } catch (_) {
      return encrypted;
    }
  }

  static String? encrypt(String plain) {
    if (plain.isEmpty) return null;
    try {
      final iv = enc.IV.fromSecureRandom(16);
      final encrypted = _getEncrypter().encrypt(plain, iv: iv);
      return '${iv.hex}:${encrypted.hex}';
    } catch (_) {
      return plain;
    }
  }
}
