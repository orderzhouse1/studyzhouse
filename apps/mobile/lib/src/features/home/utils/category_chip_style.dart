import "package:flutter/material.dart";

import "../../../core/theme/app_colors.dart";

/// ألوان خلفية بسيطة متناسقة مع ثيم STUDYZHOUSE لكل تصنيف.
class CategoryChipStyle {
  const CategoryChipStyle({
    required this.gradient,
    required this.borderColor,
    required this.textColor,
  });

  final LinearGradient gradient;
  final Color borderColor;
  final Color textColor;
}

CategoryChipStyle categoryChipStyleFor(String slug) {
  switch (slug) {
    case "artificial-intelligence":
      return const CategoryChipStyle(
        gradient: LinearGradient(
          begin: Alignment.topRight,
          end: Alignment.bottomLeft,
          colors: [Color(0xFFEDE8F5), Color(0xFFF6F3FB)],
        ),
        borderColor: Color(0xFFD8CFE8),
        textColor: Color(0xFF3A3052),
      );
    case "business":
      return const CategoryChipStyle(
        gradient: LinearGradient(
          begin: Alignment.topRight,
          end: Alignment.bottomLeft,
          colors: [Color(0xFFFFF0E6), Color(0xFFFFF8F2)],
        ),
        borderColor: Color(0xFFF5D4BC),
        textColor: Color(0xFF6B3D1F),
      );
    case "personal-development":
      return const CategoryChipStyle(
        gradient: LinearGradient(
          begin: Alignment.topRight,
          end: Alignment.bottomLeft,
          colors: [Color(0xFFE6F4EE), Color(0xFFF2FAF6)],
        ),
        borderColor: Color(0xFFB8DEC9),
        textColor: Color(0xFF1F4D38),
      );
    case "programming":
      return const CategoryChipStyle(
        gradient: LinearGradient(
          begin: Alignment.topRight,
          end: Alignment.bottomLeft,
          colors: [Color(0xFFE8EEF8), Color(0xFFF4F7FC)],
        ),
        borderColor: Color(0xFFC5D4EB),
        textColor: AppColors.navy,
      );
    case "design":
      return const CategoryChipStyle(
        gradient: LinearGradient(
          begin: Alignment.topRight,
          end: Alignment.bottomLeft,
          colors: [Color(0xFFFDEBF3), Color(0xFFFFF5F9)],
        ),
        borderColor: Color(0xFFF0C8DC),
        textColor: Color(0xFF5C2A42),
      );
    case "language-learning":
      return const CategoryChipStyle(
        gradient: LinearGradient(
          begin: Alignment.topRight,
          end: Alignment.bottomLeft,
          colors: [Color(0xFFE8F6FA), Color(0xFFF3FBFD)],
        ),
        borderColor: Color(0xFFB8DFEA),
        textColor: Color(0xFF1A4A57),
      );
    case "healthcare":
      return const CategoryChipStyle(
        gradient: LinearGradient(
          begin: Alignment.topRight,
          end: Alignment.bottomLeft,
          colors: [Color(0xFFE5F5F8), Color(0xFFF0FAFC)],
        ),
        borderColor: Color(0xFFA8D8E2),
        textColor: Color(0xFF1E5560),
      );
    case "marketing":
      return const CategoryChipStyle(
        gradient: LinearGradient(
          begin: Alignment.topRight,
          end: Alignment.bottomLeft,
          colors: [Color(0xFFFFF4E8), Color(0xFFFFFAF4)],
        ),
        borderColor: Color(0xFFF5D9B8),
        textColor: Color(0xFF7A4A12),
      );
    case "finance":
      return const CategoryChipStyle(
        gradient: LinearGradient(
          begin: Alignment.topRight,
          end: Alignment.bottomLeft,
          colors: [Color(0xFFEEF5E8), Color(0xFFF7FBF3)],
        ),
        borderColor: Color(0xFFC8DEB8),
        textColor: Color(0xFF2F4A22),
      );
    case "university":
      return const CategoryChipStyle(
        gradient: LinearGradient(
          begin: Alignment.topRight,
          end: Alignment.bottomLeft,
          colors: [Color(0xFFEEEFF5), Color(0xFFF7F8FC)],
        ),
        borderColor: Color(0xFFD0D4E2),
        textColor: AppColors.navy,
      );
    default:
      return _fallbackStyle(slug);
  }
}

const _fallbackPalette = <CategoryChipStyle>[
  CategoryChipStyle(
    gradient: LinearGradient(
      colors: [Color(0xFFF0EBE3), Color(0xFFFAF7F3)],
    ),
    borderColor: AppColors.border,
    textColor: AppColors.navy,
  ),
  CategoryChipStyle(
    gradient: LinearGradient(
      colors: [Color(0xFFE8EDF5), Color(0xFFF4F7FB)],
    ),
    borderColor: Color(0xFFC8D4E8),
    textColor: AppColors.navy,
  ),
  CategoryChipStyle(
    gradient: LinearGradient(
      colors: [Color(0xFFFFF2E8), Color(0xFFFFFAF5)],
    ),
    borderColor: Color(0xFFF0D4BC),
    textColor: Color(0xFF5C3D20),
  ),
];

CategoryChipStyle _fallbackStyle(String slug) {
  final index = slug.hashCode.abs() % _fallbackPalette.length;
  return _fallbackPalette[index];
}
