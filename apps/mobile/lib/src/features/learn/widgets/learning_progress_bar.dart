import "package:flutter/material.dart";

import "../../../core/theme/app_colors.dart";

class LearningProgressBar extends StatelessWidget {
  const LearningProgressBar({
    required this.percent,
    super.key,
    this.completed,
    this.total,
    this.onDark = false,
  });

  final int percent;
  final int? completed;
  final int? total;
  final bool onDark;

  @override
  Widget build(BuildContext context) {
    final value = (percent.clamp(0, 100)) / 100;
    final labelColor = onDark ? AppColors.textOnDark : AppColors.navy;
    final subColor = onDark
        ? AppColors.textOnDarkMuted
        : AppColors.textSecondary;
    final trackBg = onDark
        ? Colors.white.withValues(alpha: 0.15)
        : AppColors.surfaceMuted;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              "التقدّم",
              style: TextStyle(
                color: labelColor,
                fontSize: 13,
                fontWeight: FontWeight.w600,
              ),
            ),
            Text(
              completed != null && total != null
                  ? "$percent% · $completed/$total درس"
                  : "$percent%",
              style: TextStyle(color: subColor, fontSize: 12),
            ),
          ],
        ),
        const SizedBox(height: 8),
        ClipRRect(
          borderRadius: BorderRadius.circular(6),
          child: LinearProgressIndicator(
            value: value,
            minHeight: 6,
            backgroundColor: trackBg,
            color: AppColors.orange,
          ),
        ),
      ],
    );
  }
}
