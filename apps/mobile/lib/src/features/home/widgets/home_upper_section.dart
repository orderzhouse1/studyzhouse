import "package:flutter/material.dart";
import "package:flutter/services.dart";
import "package:flutter_riverpod/flutter_riverpod.dart";
import "package:go_router/go_router.dart";

import "../../../core/auth/current_user_provider.dart";
import "../../../core/platform/platform_purchase_policy.dart";
import "../../../core/theme/app_colors.dart";
import "../../../core/theme/app_gradients.dart";
import "../../../core/widgets/course_thumbnail.dart";
import "../../courses/models/student_dashboard.dart";

/// هيدر كامل العرض من أعلى الشاشة — نفس تخطيط الصورة المرجعية بثيم STUDYZHOUSE.
class HomeUpperSection extends ConsumerWidget {
  const HomeUpperSection({
    required this.userName,
    required this.statusLine,
    required this.dashboard,
    required this.onRedeem,
    required this.onMyCourses,
    super.key,
  });

  final String userName;
  final String statusLine;
  final StudentDashboard dashboard;
  final VoidCallback onRedeem;
  final VoidCallback onMyCourses;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(currentUserProvider);
    final topInset = MediaQuery.paddingOf(context).top;
    final email = user?.email.trim() ?? "";
    final pillLabel = email.isNotEmpty
        ? (email.length > 26 ? "${email.substring(0, 24)}…" : email)
        : "حساب الطالب";
    final initial = userName.isNotEmpty ? userName.characters.first : "ط";

    const radius = BorderRadius.only(
      bottomLeft: Radius.circular(28),
      bottomRight: Radius.circular(28),
    );

    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: SystemUiOverlayStyle.light,
      child: ClipRRect(
        borderRadius: radius,
        child: Container(
          width: double.infinity,
          decoration: const BoxDecoration(
            gradient: AppGradients.dashboardHero,
          ),
          child: Stack(
            clipBehavior: Clip.hardEdge,
            children: [
              Positioned(
                left: -40,
                bottom: -20,
                child: Container(
                  width: 140,
                  height: 140,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: AppColors.orange.withValues(alpha: 0.2),
                  ),
                ),
              ),
              Positioned(
                right: -24,
                top: 48,
                child: Container(
                  width: 100,
                  height: 100,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: AppColors.purpleTint.withValues(alpha: 0.3),
                  ),
                ),
              ),
            Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                SizedBox(height: topInset + 4),
                _TopActionBar(pillLabel: pillLabel),
                const SizedBox(height: 6),
                _ProfileRow(
                  initial: initial,
                  userName: userName,
                  statusLine: statusLine,
                  onInfo: () => context.push("/help"),
                ),
                const SizedBox(height: 14),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: _ContinueSection(dashboard: dashboard),
                ),
                const SizedBox(height: 16),
                Padding(
                  padding: const EdgeInsets.fromLTRB(16, 0, 16, 22),
                  child: _ActionButtons(
                    onRedeem: onRedeem,
                    onMyCourses: onMyCourses,
                  ),
                ),
              ],
            ),
          ],
        ),
        ),
      ),
    );
  }
}

/// RTL: إعدادات يمين — حبة وسط — إشعارات يسار (مثل المرجع).
class _TopActionBar extends StatelessWidget {
  const _TopActionBar({required this.pillLabel});

  final String pillLabel;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 4),
      child: Row(
        children: [
          IconButton(
            onPressed: () => context.push("/settings"),
            icon: const Icon(Icons.settings_outlined),
            color: AppColors.textOnDark,
          ),
          Expanded(
            child: Center(
              child: Container(
                constraints: const BoxConstraints(maxWidth: 240),
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 9),
                decoration: BoxDecoration(
                  color: const Color(0xFF2A2348),
                  borderRadius: BorderRadius.circular(26),
                  border: Border.all(
                    color: Colors.white.withValues(alpha: 0.12),
                  ),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Flexible(
                      child: Text(
                        pillLabel,
                        style: const TextStyle(
                          color: AppColors.textOnDark,
                          fontSize: 12,
                          fontWeight: FontWeight.w500,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        textAlign: TextAlign.center,
                      ),
                    ),
                    const SizedBox(width: 4),
                    Icon(
                      Icons.keyboard_arrow_down_rounded,
                      color: Colors.white.withValues(alpha: 0.7),
                      size: 18,
                    ),
                  ],
                ),
              ),
            ),
          ),
          IconButton(
            onPressed: () => context.push("/notifications"),
            icon: const Icon(Icons.notifications_outlined),
            color: AppColors.textOnDark,
          ),
        ],
      ),
    );
  }
}

class _ProfileRow extends StatelessWidget {
  const _ProfileRow({
    required this.initial,
    required this.userName,
    required this.statusLine,
    required this.onInfo,
  });

  final String initial;
  final String userName;
  final String statusLine;
  final VoidCallback onInfo;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 12),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          CircleAvatar(
            radius: 32,
            backgroundColor: Colors.white.withValues(alpha: 0.2),
            child: CircleAvatar(
              radius: 28,
              backgroundColor: const Color(0xFF6B7280),
              child: Text(
                initial,
                style: const TextStyle(
                  color: AppColors.textOnDark,
                  fontSize: 26,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                RichText(
                  text: TextSpan(
                    style: const TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                      height: 1.2,
                    ),
                    children: [
                      const TextSpan(
                        text: "أهلاً، ",
                        style: TextStyle(color: AppColors.textOnDark),
                      ),
                      TextSpan(
                        text: userName,
                        style: const TextStyle(color: AppColors.orange),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  statusLine,
                  style: TextStyle(
                    color: AppColors.textOnDark.withValues(alpha: 0.75),
                    fontSize: 13,
                  ),
                ),
                const SizedBox(height: 6),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 10,
                    vertical: 3,
                  ),
                  decoration: BoxDecoration(
                    color: AppColors.orange.withValues(alpha: 0.25),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: const Text(
                    "نشط",
                    style: TextStyle(
                      color: AppColors.textOnDark,
                      fontSize: 11,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ],
            ),
          ),
          IconButton(
            onPressed: onInfo,
            icon: Container(
              width: 30,
              height: 30,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                border: Border.all(
                  color: Colors.white.withValues(alpha: 0.5),
                  width: 1.5,
                ),
              ),
              child: Icon(
                Icons.info_outline,
                size: 17,
                color: Colors.white.withValues(alpha: 0.9),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _ContinueSection extends StatelessWidget {
  const _ContinueSection({required this.dashboard});

  final StudentDashboard dashboard;

  @override
  Widget build(BuildContext context) {
    if (dashboard.continueLearning != null) {
      return _ContinueCourseCard(
        continueLearning: dashboard.continueLearning!,
      );
    }
    return _ContinueEmptyCard(onExplore: () => context.go("/courses"));
  }
}

/// آخر كورس/درس — متابعة من حيث توقف الطالب.
class _ContinueCourseCard extends StatelessWidget {
  const _ContinueCourseCard({required this.continueLearning});

  final ContinueLearning continueLearning;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: AppColors.glassFill,
      borderRadius: BorderRadius.circular(14),
      child: InkWell(
        onTap: () => context.push(
          "/learn/${continueLearning.courseSlug}?lessonId=${continueLearning.lessonId}",
        ),
        borderRadius: BorderRadius.circular(14),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 10),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: AppColors.glassBorder),
          ),
          child: Row(
            children: [
              ClipRRect(
                borderRadius: BorderRadius.circular(10),
                child: SizedBox(
                  width: 48,
                  height: 48,
                  child: CourseThumbnail(
                    thumbnailUrl: continueLearning.courseCoverUrl,
                    aspectRatio: 1,
                  ),
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
                        color: AppColors.primary,
                        fontSize: 10,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const SizedBox(height: 3),
                    Text(
                      continueLearning.courseTitle,
                      style: const TextStyle(
                        color: AppColors.textOnDark,
                        fontSize: 13,
                        fontWeight: FontWeight.bold,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    Text(
                      continueLearning.lessonTitle,
                      style: const TextStyle(
                        color: AppColors.textOnDarkMuted,
                        fontSize: 11,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
              ),
              const Icon(
                Icons.chevron_left,
                color: AppColors.orange,
                size: 28,
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _ContinueEmptyCard extends StatelessWidget {
  const _ContinueEmptyCard({required this.onExplore});

  final VoidCallback onExplore;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: AppColors.glassFill,
      borderRadius: BorderRadius.circular(14),
      child: InkWell(
        onTap: onExplore,
        borderRadius: BorderRadius.circular(14),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 14),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: AppColors.glassBorder),
          ),
          child: const Row(
            children: [
              Icon(Icons.explore_outlined, color: AppColors.orange, size: 28),
              SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      "ابدأ أول كورس",
                      style: TextStyle(
                        color: AppColors.textOnDark,
                        fontSize: 13,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    Text(
                      "استكشف الكورسات وابدأ التعلّم",
                      style: TextStyle(
                        color: AppColors.textOnDarkMuted,
                        fontSize: 11,
                      ),
                    ),
                  ],
                ),
              ),
              Icon(Icons.chevron_left, color: AppColors.textOnDarkMuted),
            ],
          ),
        ),
      ),
    );
  }
}

/// RTL: كورساتي يمين (محدّد) — تفعيل كورس يسار (برتقالي) مثل المرجع.
class _ActionButtons extends StatelessWidget {
  const _ActionButtons({
    required this.onRedeem,
    required this.onMyCourses,
  });

  final VoidCallback onRedeem;
  final VoidCallback onMyCourses;

  @override
  Widget build(BuildContext context) {
    if (!PlatformPurchasePolicy.showExternalPaymentFlows) {
      return SizedBox(
        width: double.infinity,
        child: OutlinedButton(
          onPressed: onMyCourses,
          style: OutlinedButton.styleFrom(
            foregroundColor: AppColors.textOnDark,
            backgroundColor: Colors.transparent,
            minimumSize: const Size.fromHeight(52),
            side: BorderSide(
              color: Colors.white.withValues(alpha: 0.85),
              width: 1.5,
            ),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(14),
            ),
          ),
          child: const Text(
            "كورساتي",
            style: TextStyle(fontWeight: FontWeight.w600, fontSize: 15),
          ),
        ),
      );
    }

    return Row(
      children: [
        Expanded(
          child: OutlinedButton(
            onPressed: onMyCourses,
            style: OutlinedButton.styleFrom(
              foregroundColor: AppColors.textOnDark,
              backgroundColor: Colors.transparent,
              minimumSize: const Size.fromHeight(52),
              side: BorderSide(
                color: Colors.white.withValues(alpha: 0.85),
                width: 1.5,
              ),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(14),
              ),
            ),
            child: const Text(
              "كورساتي",
              style: TextStyle(fontWeight: FontWeight.w600, fontSize: 15),
            ),
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: FilledButton(
            onPressed: onRedeem,
            style: FilledButton.styleFrom(
              backgroundColor: AppColors.orange,
              foregroundColor: AppColors.textOnNavy,
              minimumSize: const Size.fromHeight(52),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(14),
              ),
              elevation: 0,
            ),
            child: const Text(
              "تفعيل كورس",
              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
            ),
          ),
        ),
      ],
    );
  }
}
