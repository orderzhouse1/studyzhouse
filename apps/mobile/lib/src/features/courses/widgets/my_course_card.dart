import "package:flutter/material.dart";
import "package:go_router/go_router.dart";

import "../../../core/platform/platform_purchase_policy.dart";
import "../../../core/theme/app_colors.dart";
import "../../../core/widgets/app_card.dart";
import "../../../core/widgets/course_thumbnail.dart";
import "../models/my_course_item.dart";

class MyCourseCard extends StatelessWidget {
  const MyCourseCard({required this.item, super.key});

  final MyCourseItem item;

  void _open(BuildContext context) {
    final slug = item.course.slug;
    if (item.isEnrolled) {
      context.push("/learn/$slug");
    } else {
      context.push("/courses/$slug");
    }
  }

  @override
  Widget build(BuildContext context) {
    final course = item.course;
    return AppCard(
      padding: const EdgeInsets.all(12),
      onTap: () => _open(context),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 96,
            child: CourseThumbnail(
              thumbnailUrl: course.thumbnailUrl,
              aspectRatio: 4 / 3,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (item.isPendingPayment)
                  _StatusChip(
                    label: PlatformPurchasePolicy.pendingEnrollmentStatusLabel,
                    color: AppColors.orange,
                  ),
                Text(
                  course.title,
                  style: Theme.of(context).textTheme.titleSmall,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
                if (course.category != null) ...[
                  const SizedBox(height: 4),
                  Text(
                    course.category!.name,
                    style: Theme.of(context).textTheme.bodySmall,
                  ),
                ],
                if (item.isEnrolled && item.totalLessons > 0) ...[
                  const SizedBox(height: 8),
                  LinearProgressIndicator(
                    value: item.progressPercent / 100,
                    minHeight: 6,
                    borderRadius: BorderRadius.circular(4),
                    backgroundColor: AppColors.surfaceMuted,
                    color: AppColors.orange,
                  ),
                  const SizedBox(height: 4),
                  Text(
                    "${item.progressPercent}% · ${item.completedLessons}/${item.totalLessons} درس",
                    style: Theme.of(context).textTheme.bodySmall,
                  ),
                ],
              ],
            ),
          ),
          const Padding(
            padding: EdgeInsets.only(top: 4),
            child: Icon(
              Icons.chevron_left,
              color: AppColors.orange,
            ),
          ),
        ],
      ),
    );
  }
}

class _StatusChip extends StatelessWidget {
  const _StatusChip({required this.label, required this.color});

  final String label;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.15),
          borderRadius: BorderRadius.circular(8),
        ),
        child: Text(
          label,
          style: TextStyle(
            color: color,
            fontSize: 11,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
    );
  }
}
