import 'package:flutter/material.dart';

class ZymiColors {
  ZymiColors._();

  static const Color primary = Color(0xFF00F0FF);
  static const Color background = Color(0xFF0F172A);
  static const Color card = Color(0xFF111827);
  static const Color surface = Color(0xFF1E293B);
  static const Color surfaceTertiary = Color(0xFF334155);
  static const Color success = Color(0xFF00FF88);
  static const Color danger = Color(0xFFFF3355);
  static const Color warning = Color(0xFFFFAA00);
  static const Color purple = Color(0xFFA855F7);

  static const Color textPrimary = Color(0xFFF1F5F9);
  static const Color textSecondary = Color(0xFF94A3B8);
  static const Color textMuted = Color(0xFF64748B);
  static const Color border = Color(0xFF1E293B);
}

class ZymiTheme {
  ZymiTheme._();

  static ThemeData get dark {
    return ThemeData(
      brightness: Brightness.dark,
      primaryColor: ZymiColors.primary,
      scaffoldBackgroundColor: ZymiColors.background,
      cardColor: ZymiColors.card,
      appBarTheme: const AppBarTheme(
        backgroundColor: ZymiColors.surface,
        foregroundColor: ZymiColors.textPrimary,
        centerTitle: false,
        elevation: 0,
      ),
      bottomNavigationBarTheme: const BottomNavigationBarThemeData(
        backgroundColor: ZymiColors.surface,
        selectedItemColor: ZymiColors.primary,
        unselectedItemColor: ZymiColors.textMuted,
        type: BottomNavigationBarType.fixed,
      ),
      textTheme: const TextTheme(
        headlineLarge: TextStyle(
          fontFamily: 'JetBrains Mono',
          fontWeight: FontWeight.bold,
          letterSpacing: 1.5,
          color: ZymiColors.textPrimary,
        ),
        headlineMedium: TextStyle(
          fontFamily: 'JetBrains Mono',
          fontWeight: FontWeight.bold,
          letterSpacing: 1.0,
          color: ZymiColors.textPrimary,
        ),
        bodyLarge: TextStyle(
          fontFamily: 'JetBrains Mono',
          color: ZymiColors.textPrimary,
        ),
        bodyMedium: TextStyle(
          fontFamily: 'JetBrains Mono',
          color: ZymiColors.textSecondary,
        ),
        labelSmall: TextStyle(
          fontFamily: 'JetBrains Mono',
          color: ZymiColors.textMuted,
        ),
      ),
      iconTheme: const IconThemeData(
        color: ZymiColors.primary,
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: ZymiColors.surface,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide.none,
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: ZymiColors.primary, width: 1),
        ),
        labelStyle: const TextStyle(color: ZymiColors.textMuted),
        hintStyle: const TextStyle(color: ZymiColors.textMuted),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: ZymiColors.primary,
          foregroundColor: const Color(0xFF0A0E1A),
          padding: const EdgeInsets.symmetric(vertical: 16),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
        ),
      ),
      colorScheme: const ColorScheme.dark(
        primary: ZymiColors.primary,
        secondary: ZymiColors.purple,
        surface: ZymiColors.background,
        error: ZymiColors.danger,
      ),
    );
  }
}
