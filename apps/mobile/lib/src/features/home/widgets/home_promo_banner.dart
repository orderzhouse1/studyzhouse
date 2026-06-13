import "package:flutter/material.dart";
import "package:go_router/go_router.dart";

import "../../../core/theme/app_colors.dart";
import "../../../core/theme/app_gradients.dart";
import "../../../core/widgets/course_thumbnail.dart";
import "../../courses/models/student_dashboard.dart";

/// بانر ترويجي أفقي (متابعة تعلّم أو استكشاف).
class HomePromoBanner extends StatelessWidget {
  const HomePromoBanner({
    this.continueLearning,
    super.key,
  });

  final ContinueLearning? continueLearning;

  @override
  Widget build(BuildContext context) {
    final hasContinue = continueLearning != null;

    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 20, 16, 0),
      child: Material(
        color: Colors.transparent,
        borderRadius: BorderRadius.circular(18),
        child: InkWell(
          onTap: () {
            if (hasContinue) {
              context.push(
                "/learn/${continueLearning!.courseSlug}?lessonId=${continueLearning!.lessonId}",
              );
            } else {
              context.go("/courses");
            }
          },
          borderRadius: BorderRadius.circular(18),
          child: Ink(
            height: 120,
            decoration: BoxDecoration(
              gradient: AppGradients.promoBanner,
              borderRadius: BorderRadius.circular(18),
              boxShadow: [
                BoxShadow(
                  color: AppColors.orange.withValues(alpha: 0.25),
                  blurRadius: 14,
                  offset: const Offset(0, 6),
                ),
              ],
            ),
            child: Stack(
              children: [
                Positioned(
                  left: -20,
                  bottom: -20,
                  child: Container(
                    width: 100,
                    height: 100,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: Colors.white.withValues(alpha: 0.08),
                    ),
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.all(16),
                  child: Row(
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Text(
                              hasContinue
                                  ? "تابع من حيث توقفت"
                                  : "اكتشف كورسات جديدة",
                              style: const TextStyle(
                                color: AppColors.textOnDark,
                                fontSize: 17,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            const SizedBox(height: 6),
                            Text(
                              hasContinue
                                  ? continueLearning!.courseTitle
                                  : "دورات متنوعة بانتظارك — ابدأ رحلة التعلّم",
                              style: const TextStyle(
                                color: AppColors.textOnDarkMuted,
                                fontSize: 12,
                                height: 1.35,
                              ),
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ],
                        ),
                      ),
                      if (hasContinue &&
                          continueLearning!.courseCoverUrl != null) ...[
                        const SizedBox(width: 10),
                        ClipRRect(
                          borderRadius: BorderRadius.circular(12),
                          child: SizedBox(
                            width: 72,
                            height: 72,
                            child: CourseThumbnail(
                              thumbnailUrl: continueLearning!.courseCoverUrl,
                              aspectRatio: 1,
                            ),
                          ),
                        ),
                      ] else
                        const Icon(
                          Icons.play_circle_outline,
                          color: AppColors.textOnDark,
                          size: 48,
                        ),
                    ],
                  ),
                ),
                Positioned(
                  bottom: 8,
                  left: 0,
                  right: 0,
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: List.generate(
                      3,
                      (i) => Container(
                        margin: const EdgeInsets.symmetric(horizontal: 3),
                        width: i == 0 ? 8 : 6,
                        height: 6,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: i == 0
                              ? AppColors.textOnDark
                              : AppColors.textOnDark.withValues(alpha: 0.35),
                        ),
                      ),
                    ),
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
