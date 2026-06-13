import "package:flutter/material.dart";
import "package:flutter_riverpod/flutter_riverpod.dart";
import "package:go_router/go_router.dart";

import "../../../core/network/api_exception.dart";
import "../../../core/theme/app_colors.dart";
import "../../../core/widgets/app_card.dart";
import "../../../core/widgets/course_thumbnail.dart";
import "../models/course.dart";
import "../providers/saved_course_ids_provider.dart";

class CourseListCard extends ConsumerWidget {
  const CourseListCard({
    required this.course,
    super.key,
    this.showSaveButton = true,
    this.onTap,
  });

  final Course course;
  final bool showSaveButton;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final savedAsync = ref.watch(savedCourseIdsProvider);
    final savedIds = savedAsync.value ?? {};
    final isSaved = savedIds.contains(course.id);

    return AppCard(
      padding: EdgeInsets.zero,
      onTap: onTap ?? () => context.push("/courses/${course.slug}"),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Stack(
            children: [
              CourseThumbnail(thumbnailUrl: course.thumbnailUrl),
              Positioned(
                top: 8,
                right: 8,
                child: _PricingChip(label: course.priceLabel),
              ),
              if (showSaveButton)
                Positioned(
                  top: 4,
                  left: 4,
                  child: IconButton(
                    onPressed: savedAsync.isLoading
                        ? null
                        : () => _toggleSave(context, ref, isSaved),
                    icon: Icon(
                      isSaved ? Icons.bookmark : Icons.bookmark_border,
                      color: isSaved ? AppColors.orange : AppColors.navy,
                    ),
                  ),
                ),
            ],
          ),
          Padding(
            padding: const EdgeInsets.all(14),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (course.category != null)
                  Text(
                    course.category!.name,
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: AppColors.orange,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                const SizedBox(height: 4),
                Text(
                  course.title,
                  style: Theme.of(context).textTheme.titleMedium,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
                if (course.shortDescription != null &&
                    course.shortDescription!.isNotEmpty) ...[
                  const SizedBox(height: 6),
                  Text(
                    course.shortDescription!,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: Theme.of(context).textTheme.bodySmall,
                  ),
                ],
                const SizedBox(height: 8),
                Text(
                  "${course.lessonCount} درس",
                  style: Theme.of(context).textTheme.bodySmall,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _toggleSave(
    BuildContext context,
    WidgetRef ref,
    bool isSaved,
  ) async {
    try {
      await ref.read(savedCourseIdsProvider.notifier).toggleSave(course.id);
      if (!context.mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            isSaved ? "تمت إزالة الكورس من المحفوظات" : "تم حفظ الكورس",
          ),
        ),
      );
    } on ApiException catch (e) {
      if (!context.mounted) return;
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text(e.message)));
    }
  }
}

class _PricingChip extends StatelessWidget {
  const _PricingChip({required this.label});

  final String label;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: AppColors.navy.withValues(alpha: 0.85),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        label,
        style: const TextStyle(
          color: AppColors.textOnNavy,
          fontSize: 12,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }
}
