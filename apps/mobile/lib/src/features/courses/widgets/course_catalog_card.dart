import "package:flutter/material.dart";
import "package:flutter_riverpod/flutter_riverpod.dart";
import "package:go_router/go_router.dart";

import "../../../core/network/api_exception.dart";
import "../../../core/platform/ios_course_policy.dart";
import "../../../core/theme/app_colors.dart";
import "../../../core/widgets/app_card.dart";
import "../../../core/widgets/course_thumbnail.dart";
import "../models/course.dart";
import "../providers/saved_course_ids_provider.dart";

/// بطاقة كتالوج — نفس تصميم أقسام الهوم (صورة، حفظ، سعر، دروس).
class CourseCatalogCard extends ConsumerWidget {
  const CourseCatalogCard({
    required this.course,
    super.key,
    this.width,
  });

  final Course course;

  /// عرض ثابت للتمرير الأفقي؛ `null` = عرض كامل القائمة.
  final double? width;

  static const double carouselWidth = 248;

  String _subtitle() {
    final cat = course.category?.name;
    if (cat != null && cat.isNotEmpty) return cat;
    return course.levelLabel;
  }

  String _metaLabel() {
    final minutes = course.estimatedDurationMinutes;
    if (minutes != null) {
      if (minutes < 60) return "$minutes دقيقة";
      final h = minutes ~/ 60;
      final m = minutes % 60;
      if (m == 0) return "$h ساعة";
      return "$h س $m د";
    }
    if (course.lessonCount > 0) return "${course.lessonCount} درس";
    return course.levelLabel;
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final savedAsync = ref.watch(savedCourseIdsProvider);
    final isSaved = (savedAsync.value ?? {}).contains(course.id);

    final card = AppCard(
      padding: EdgeInsets.zero,
      onTap: () => context.push("/courses/${course.slug}"),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Stack(
            children: [
              CourseThumbnail(
                thumbnailUrl: course.thumbnailUrl,
                borderRadius: 14,
              ),
              Positioned(
                top: 6,
                left: 6,
                child: Material(
                  color: Colors.white.withValues(alpha: 0.92),
                  shape: const CircleBorder(),
                  clipBehavior: Clip.antiAlias,
                  child: IconButton(
                    visualDensity: VisualDensity.compact,
                    padding: EdgeInsets.zero,
                    constraints: const BoxConstraints(
                      minWidth: 36,
                      minHeight: 36,
                    ),
                    onPressed: savedAsync.isLoading
                        ? null
                        : () => _toggleSave(context, ref, isSaved),
                    icon: Icon(
                      isSaved ? Icons.bookmark : Icons.bookmark_border,
                      size: 20,
                      color: isSaved ? AppColors.orange : AppColors.navy,
                    ),
                  ),
                ),
              ),
            ],
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(12, 10, 12, 12),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  course.title,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    color: AppColors.navy,
                    fontSize: 15,
                    fontWeight: FontWeight.bold,
                    height: 1.25,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  _subtitle(),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    color: AppColors.textSecondary,
                    fontSize: 12,
                  ),
                ),
                const SizedBox(height: 10),
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 10,
                        vertical: 6,
                      ),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(color: AppColors.navy, width: 1),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Container(
                            width: 18,
                            height: 18,
                            decoration: const BoxDecoration(
                              color: AppColors.navy,
                              shape: BoxShape.circle,
                            ),
                            child: const Icon(
                              Icons.play_arrow_rounded,
                              size: 14,
                              color: Colors.white,
                            ),
                          ),
                          const SizedBox(width: 6),
                          Text(
                            _metaLabel(),
                            style: const TextStyle(
                              color: AppColors.navy,
                              fontSize: 11,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ],
                      ),
                    ),
                    if (IosCoursePolicy.showPricesOnPlatform) ...[
                      const Spacer(),
                      Text(
                        course.priceLabel,
                        style: const TextStyle(
                          color: AppColors.navy,
                          fontSize: 14,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );

    if (width == null) return card;
    return SizedBox(width: width, child: card);
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
