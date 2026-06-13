import "package:flutter/material.dart";

import "app_colors.dart";

/// نفس تدرجات `student-dashboard-ui.tsx` على الويب.
abstract final class AppGradients {
  static const Alignment heroBegin = Alignment(-0.9, -1);
  static const Alignment heroEnd = Alignment(1, 1);

  /// `HERO_GRADIENT` — linear-gradient 118deg
  static const LinearGradient dashboardHero = LinearGradient(
    begin: heroBegin,
    end: heroEnd,
    colors: [
      Color(0xFF0E121D),
      Color(0xFF1A2438),
      Color(0xFF3A3052),
      Color(0xFF141C2C),
    ],
    stops: [0.0, 0.38, 0.72, 1.0],
  );

  static const LinearGradient dashboardCard = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [
      Color(0xFF121A2A),
      Color(0xFF1E2A42),
      Color(0xFF151F35),
    ],
    stops: [0.0, 0.52, 1.0],
  );

  static const LinearGradient promoBanner = LinearGradient(
    begin: Alignment.centerRight,
    end: Alignment.centerLeft,
    colors: [
      AppColors.orange,
      Color(0xFFC2410C),
      AppColors.navy,
    ],
    stops: [0.0, 0.45, 1.0],
  );

  static const LinearGradient avatar = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [
      Color(0xFF121A2A),
      Color(0xFF1A2438),
      Color(0xFF141C2C),
    ],
  );
}
