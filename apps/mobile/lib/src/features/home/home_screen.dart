import "package:flutter/material.dart";
import "package:flutter_riverpod/flutter_riverpod.dart";
import "package:go_router/go_router.dart";

import "../../core/auth/current_user_provider.dart";
import "../../core/platform/ios_course_policy.dart";
import "../../core/platform/platform_purchase_policy.dart";
import "../../core/theme/app_colors.dart";
import "../../core/utils/friendly_error_message.dart";
import "../../core/widgets/error_state.dart";
import "../../core/widgets/brand_loading_indicator.dart";
import "../courses/models/my_course_item.dart";
import "../courses/models/student_dashboard.dart";
import "../courses/repositories/student_courses_repository.dart";
import "../courses/widgets/my_course_card.dart";
import "providers/home_discover_provider.dart";
import "widgets/home_discover_section.dart";
import "widgets/home_promo_banner.dart";
import "widgets/home_quick_actions.dart";
import "widgets/home_section_title.dart";
import "widgets/home_upper_section.dart";

final homeDataProvider = FutureProvider.autoDispose<HomeData>((ref) async {
  final studentRepo = ref.read(studentCoursesRepositoryProvider);
  final dashboard = await studentRepo.getDashboard();
  final myCourses = await studentRepo.getMyCourses();
  final filteredItems = IosCoursePolicy.filterMyCourseItemsForPlatform(
    myCourses.items,
  );
  return HomeData(
    dashboard: IosCoursePolicy.filterDashboardForPlatform(dashboard),
    myCoursesPreview: filteredItems.take(3).toList(),
    pendingPayments: PlatformPurchasePolicy.showExternalPaymentFlows
        ? myCourses.pendingPaymentsCount
        : 0,
  );
});

class HomeData {
  const HomeData({
    required this.dashboard,
    required this.myCoursesPreview,
    required this.pendingPayments,
  });

  final StudentDashboard dashboard;
  final List<MyCourseItem> myCoursesPreview;
  final int pendingPayments;
}

class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  String _greetingName(WidgetRef ref) {
    final user = ref.watch(currentUserProvider);
    if (user == null || user.fullName.trim().isEmpty) return "طالب";
    return user.fullName.trim().split(RegExp(r"\s+")).first;
  }

  String _statusLine(HomeData data) {
    final n = data.dashboard.enrolledCoursesCount;
    if (n == 0) return "ابدأ رحلتك التعليمية اليوم";
    if (PlatformPurchasePolicy.showExternalPaymentFlows &&
        data.pendingPayments > 0) {
      return "$n كورس • ${data.pendingPayments} طلب دفع";
    }
    return "$n كورس مسجّل • تابع تقدّمك";
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(homeDataProvider);

    return Scaffold(
      backgroundColor: AppColors.canvas,
      extendBodyBehindAppBar: true,
      body: async.when(
        loading: () => const AppPageLoading(),
        error: (e, _) => ErrorState(
          message: userFacingErrorMessage(
            e,
            fallback: "تعذّر تحميل لوحة التحكم",
          ),
          onRetry: () => ref.invalidate(homeDataProvider),
        ),
        data: (data) => RefreshIndicator(
          color: AppColors.orange,
          onRefresh: () async {
            ref.invalidate(homeDataProvider);
            ref.invalidate(homeDiscoverProvider);
            await Future.wait([
              ref.read(homeDataProvider.future),
              ref.read(homeDiscoverProvider.future),
            ]);
          },
          child: ListView(
            padding: EdgeInsets.zero,
            children: [
              HomeUpperSection(
                userName: _greetingName(ref),
                statusLine: _statusLine(data),
                dashboard: data.dashboard,
                onRedeem: () => context.push("/redeem"),
                onMyCourses: () => context.go("/my-courses"),
              ),
              if (data.dashboard.continueLearning == null)
                HomePromoBanner(continueLearning: null),
              const HomeQuickActionsGrid(),
              const SizedBox(height: 8),
              HomeSectionTitle(
                title: "كورساتي",
                action: "عرض الكل",
                onAction: () => context.go("/my-courses"),
              ),
              const SizedBox(height: 10),
              if (data.myCoursesPreview.isEmpty)
                const _EmptyHint(text: "لم تسجّل في أي كورس بعد.")
              else
                ...data.myCoursesPreview.map(
                  (item) => Padding(
                    padding: const EdgeInsets.fromLTRB(16, 0, 16, 10),
                    child: MyCourseCard(item: item),
                  ),
                ),
              const HomeDiscoverSection(),
              const SizedBox(height: 28),
            ],
          ),
        ),
      ),
    );
  }
}

class _EmptyHint extends StatelessWidget {
  const _EmptyHint({required this.text});

  final String text;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Text(text, style: const TextStyle(color: AppColors.textSecondary)),
    );
  }
}
