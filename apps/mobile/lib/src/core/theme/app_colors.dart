import "package:flutter/material.dart";

/// STUDYZHOUSE — متوافق مع `apps/web` (hsl 222 / 24 / 265).
abstract final class AppColors {
  /// Brand orange (mobile + CTAs).
  static const Color orange = Color(0xFFFA812F);

  /// Web `--primary` ≈ hsl(24 95% 53%).
  static const Color primary = Color(0xFFF97316);

  static const Color navy = Color(0xFF151F35);

  /// hsl(222 47% 10%) — خلفية التطبيق الداكنة */
  static const Color canvasDark = Color(0xFF0E121D);

  /// hsl(222 47% 17%) */
  static const Color navyMid = Color(0xFF1A2438);

  /// hsl(222 47% 14%) */
  static const Color navySoft = Color(0xFF141C2C);

  /// hsl(265 38% 24%) — لمسة بنفسجية في التدرج */
  static const Color purpleTint = Color(0xFF3A3052);

  /// خلفية التطبيق — أبيض نقي.
  static const Color canvas = Color(0xFFFFFFFF);

  static const Color background = canvas;
  static const Color surface = Color(0xFFFFFFFF);
  static const Color surfaceMuted = Color(0xFFF0EBE3);
  static const Color border = Color(0xFFE2DAD0);

  static const Color textPrimary = Color(0xFF151F35);
  static const Color textSecondary = Color(0xFF5C6478);
  static const Color textOnDark = Color(0xFFFFFFFF);
  static const Color textOnDarkMuted = Color(0xB3FFFFFF);
  static const Color textOnNavy = Color(0xFFFFFFFF);

  static const Color glassBorder = Color(0x26FFFFFF);
  static const Color glassFill = Color(0x1AFFFFFF);

  static const Color error = Color(0xFFC62828);
}
