import "package:flutter/material.dart";

import "../../../core/theme/app_colors.dart";
import "../../../core/widgets/app_card.dart";
import "../models/learn_course.dart";
import "lesson_list_item.dart";

class LessonSectionCard extends StatelessWidget {
  const LessonSectionCard({
    required this.section,
    required this.activeLessonId,
    required this.onLessonTap,
    super.key,
  });

  final LearnSection section;
  final String activeLessonId;
  final void Function(String lessonId) onLessonTap;

  @override
  Widget build(BuildContext context) {
    return AppCard(
      padding: const EdgeInsets.fromLTRB(12, 14, 12, 10),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(
            section.title,
            style: const TextStyle(
              color: AppColors.navy,
              fontSize: 15,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 8),
          ...section.lessons.map(
            (lesson) => LessonListItem(
              lesson: lesson,
              isActive: lesson.id == activeLessonId,
              onTap: () => onLessonTap(lesson.id),
            ),
          ),
        ],
      ),
    );
  }
}
