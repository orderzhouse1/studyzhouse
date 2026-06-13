import "package:flutter/material.dart";

import "../../../core/theme/app_colors.dart";
import "../models/learn_course.dart";

class LessonListItem extends StatelessWidget {
  const LessonListItem({
    required this.lesson,
    required this.isActive,
    required this.onTap,
    super.key,
  });

  final LearnLesson lesson;
  final bool isActive;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final done = lesson.progress.isCompleted;

    return Padding(
      padding: const EdgeInsets.only(bottom: 4),
      child: Material(
        color: isActive
            ? AppColors.orange.withValues(alpha: 0.1)
            : Colors.transparent,
        borderRadius: BorderRadius.circular(12),
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(12),
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 10),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(12),
              border: isActive
                  ? Border.all(
                      color: AppColors.orange.withValues(alpha: 0.35),
                    )
                  : null,
            ),
            child: Row(
              children: [
                _LessonIcon(done: done, isActive: isActive),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    lesson.title,
                    style: TextStyle(
                      color: AppColors.navy,
                      fontSize: 14,
                      fontWeight: isActive ? FontWeight.w700 : FontWeight.w500,
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
                if (done)
                  const Text(
                    "مكتمل",
                    style: TextStyle(
                      color: AppColors.orange,
                      fontSize: 11,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _LessonIcon extends StatelessWidget {
  const _LessonIcon({required this.done, required this.isActive});

  final bool done;
  final bool isActive;

  @override
  Widget build(BuildContext context) {
    if (done) {
      return const Icon(
        Icons.check_circle_rounded,
        color: AppColors.orange,
        size: 24,
      );
    }

    return Container(
      width: 28,
      height: 28,
      decoration: BoxDecoration(
        color: isActive ? AppColors.navy : AppColors.surfaceMuted,
        shape: BoxShape.circle,
        border: Border.all(
          color: isActive ? AppColors.navy : AppColors.border,
        ),
      ),
      child: Icon(
        Icons.play_arrow_rounded,
        size: 18,
        color: isActive ? AppColors.textOnDark : AppColors.navy,
      ),
    );
  }
}
