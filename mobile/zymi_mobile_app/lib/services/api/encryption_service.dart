import 'dart:typed_data';
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

  static String _bytesToHex(Uint8List bytes) {
    return bytes.map((b) => b.toRadixString(16).padLeft(2, '0')).join();
  }

  static Uint8List _hexToBytes(String hex) {
    final buf = <int>[];
    for (var i = 0; i < hex.length; i += 2) {
      buf.add(int.parse(hex.substring(i, i + 2), radix: 16));
    }
    return Uint8List.fromList(buf);
  }

  static String? decrypt(String encrypted) {
    if (encrypted.isEmpty) return null;
    try {
      final parts = encrypted.split(':');
      if (parts.length < 2) return encrypted;
      final iv = enc.IV(_hexToBytes(parts[0]));
      final cipherText = parts.sublist(1).join(':');
      final decrypted = _getEncrypter().decrypt(enc.Encrypted(_hexToBytes(cipherText)), iv: iv);
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
      return '${_bytesToHex(iv.bytes)}:${_bytesToHex(encrypted.bytes)}';
    } catch (_) {
      return plain;
    }
  }
}
