import "package:flutter/material.dart";
import "package:flutter/services.dart";

import "../../../core/theme/app_colors.dart";
import "../../../core/theme/app_gradients.dart";
import "learning_progress_bar.dart";

class LearnPageHeader extends StatelessWidget {
  const LearnPageHeader({
    required this.courseTitle,
    required this.progressPercent,
    required this.completedLessons,
    required this.totalLessons,
    required this.onBack,
    this.videoPlayer,
    super.key,
  });

  final String courseTitle;
  final int progressPercent;
  final int completedLessons;
  final int totalLessons;
  final VoidCallback onBack;
  final Widget? videoPlayer;

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
          child: Padding(
            padding: EdgeInsets.fromLTRB(8, topInset + 4, 16, 20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Row(
                  children: [
                    IconButton(
                      onPressed: onBack,
                      icon: const Icon(
                        Icons.arrow_forward_rounded,
                        color: AppColors.textOnDark,
                      ),
                    ),
                    Expanded(
                      child: Text(
                        courseTitle,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          color: AppColors.textOnDark,
                          fontSize: 17,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ],
                ),
                const Padding(
                  padding: EdgeInsets.only(right: 12, left: 4),
                  child: Text(
                    "متابعة التعلّم",
                    style: TextStyle(
                      color: AppColors.orange,
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
                const SizedBox(height: 10),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 8),
                  child: LearningProgressBar(
                    percent: progressPercent,
                    completed: completedLessons,
                    total: totalLessons,
                    onDark: true,
                  ),
                ),
                if (videoPlayer != null) ...[
                  const SizedBox(height: 14),
                  Padding(
                    padding: const EdgeInsets.fromLTRB(8, 0, 0, 0),
                    child: videoPlayer!,
                  ),
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }
}
