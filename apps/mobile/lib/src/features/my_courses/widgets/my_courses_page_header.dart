import "package:flutter/material.dart";
import "package:flutter/services.dart";
import "package:go_router/go_router.dart";

import "../../../core/theme/app_colors.dart";
import "../../../core/theme/app_gradients.dart";
import "../../../core/widgets/course_thumbnail.dart";
import "../../courses/models/student_dashboard.dart";

/// هيدر مخصّص لتبويب دوراتي — ثيم الهوم دون عناصر لوحة التحكم العامة.
class MyCoursesPageHeader extends StatelessWidget {
  const MyCoursesPageHeader({
    required this.enrolledCount,
    required this.inProgressCount,
    required this.overallProgressPercent,
    required this.pendingPayments,
    this.continueLearning,
    super.key,
  });

  final int enrolledCount;
  final int inProgressCount;
  final int overallProgressPercent;
  final int pendingPayments;
  final ContinueLearning? continueLearning;

  @override
  Widget build(BuildContext context) {
    final topInset = MediaQuery.paddingOf(context).top;

    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: SystemUiOverlayStyle.light,
      child: ClipRRect(
        borderRadius: const BorderRadius.only(
          bottomLeft: Radius.circular(28),
          bottomRight: Radius.circular(28),
        ),
        child: Container(
          width: double.infinity,
          decoration: const BoxDecoration(gradient: AppGradients.dashboardHero),
          child: Stack(
            clipBehavior: Clip.hardEdge,
            children: [
              Positioned(
                left: -30,
                bottom: -10,
                child: Container(
                  width: 100,
                  height: 100,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: AppColors.orange.withValues(alpha: 0.18),
                  ),
                ),
              ),
              Padding(
                padding: EdgeInsets.fromLTRB(20, topInset + 12, 20, 20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    const Text(
                      "دوراتي",
                      style: TextStyle(
                        color: AppColors.textOnDark,
                        fontSize: 26,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      _summaryLine(),
                      style: const TextStyle(
                        color: AppColors.textOnDarkMuted,
                        fontSize: 13,
                      ),
                    ),
                    if (enrolledCount > 0) ...[
                      const SizedBox(height: 14),
                      ClipRRect(
                        borderRadius: BorderRadius.circular(8),
                        child: LinearProgressIndicator(
                          value: (overallProgressPercent.clamp(0, 100)) / 100,
                          minHeight: 6,
                          backgroundColor: Colors.white.withValues(alpha: 0.15),
                          color: AppColors.orange,
                        ),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        "التقدّم الإجمالي: $overallProgressPercent%",
                        style: const TextStyle(
                          color: AppColors.textOnDarkMuted,
                          fontSize: 11,
                        ),
                      ),
                    ],
                    if (continueLearning != null) ...[
                      const SizedBox(height: 16),
                      _ContinueCard(learning: continueLearning!),
                    ],
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  String _summaryLine() {
    if (enrolledCount == 0) {
      return "تابع الدورات التي سجّلت فيها من هنا";
    }
    final parts = <String>["$enrolledCount كورس مسجّل"];
    if (inProgressCount > 0) {
      parts.add("$inProgressCount قيد التعلّم");
    }
    if (pendingPayments > 0) {
      parts.add("$pendingPayments بانتظار الدفع");
    }
    return parts.join(" · ");
  }
}

class _ContinueCard extends StatelessWidget {
  const _ContinueCard({required this.learning});

  final ContinueLearning learning;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: AppColors.glassFill,
      borderRadius: BorderRadius.circular(14),
      child: InkWell(
        onTap: () => context.push(
          "/learn/${learning.courseSlug}?lessonId=${learning.lessonId}",
        ),
        borderRadius: BorderRadius.circular(14),
        child: Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: AppColors.glassBorder),
          ),
          child: Row(
            children: [
              SizedBox(
                width: 52,
                height: 52,
                child: CourseThumbnail(
                  thumbnailUrl: learning.courseCoverUrl,
                  aspectRatio: 1,
                  borderRadius: 10,
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      "تابع من حيث توقفت",
                      style: TextStyle(
                        color: AppColors.orange,
                        fontSize: 10,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      learning.courseTitle,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        color: AppColors.textOnDark,
                        fontSize: 13,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    Text(
                      learning.lessonTitle,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        color: AppColors.textOnDarkMuted,
                        fontSize: 11,
                      ),
                    ),
                  ],
                ),
              ),
              const Icon(
                Icons.play_circle_fill_rounded,
                color: AppColors.orange,
                size: 32,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
