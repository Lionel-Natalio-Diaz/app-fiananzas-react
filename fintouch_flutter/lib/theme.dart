import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class AppTheme {
  static const Color primaryColor = Color(0xFF4285F4);
  static const Color accentColor = Color(0xFF34A853);
  static const Color backgroundColor = Color(0xFFE8F0FE);

  static ThemeData get themeData => ThemeData(
        primaryColor: primaryColor,
        colorScheme: ColorScheme.fromSeed(
          seedColor: primaryColor,
          primary: primaryColor,
          secondary: accentColor,
          background: backgroundColor,
        ),
        textTheme: TextTheme(
          headlineMedium: GoogleFonts.spaceGrotesk(),
          bodyLarge: GoogleFonts.inter(),
          bodyMedium: GoogleFonts.inter(),
        ),
      );
}
