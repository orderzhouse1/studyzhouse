import "package:flutter/material.dart";
import "package:flutter_riverpod/flutter_riverpod.dart";
import "package:go_router/go_router.dart";

import "../../core/theme/app_colors.dart";
import "../../core/utils/friendly_error_message.dart";
import "../../core/widgets/app_button.dart";
import "../../core/widgets/app_filter_chip.dart";
import "../../core/widgets/error_state.dart";
import "../../core/widgets/brand_loading_indicator.dart";
import "../courses/models/my_course_item.dart";
import "../courses/models/student_dashboard.dart";
import "../courses/repositories/student_courses_repository.dart";
import "../courses/widgets/my_course_card.dart";
import "widgets/my_courses_page_header.dart";

enum _MyCoursesFilter { all, learning, pending }

final myCoursesTabDataProvider = FutureProvider.autoDispose<MyCoursesTabData>((
  ref,
) async {
  final studentRepo = ref.read(studentCoursesRepositoryProvider);
  final dashboard = await studentRepo.getDashboard();
  final myCourses = await studentRepo.getMyCourses();
  return MyCoursesTabData(
    dashboard: dashboard,
    myCourses: myCourses.items,
    pendingPayments: myCourses.pendingPaymentsCount,
  );
});

class MyCoursesTabData {
  const MyCoursesTabData({
    required this.dashboard,
    required this.myCourses,
    required this.pendingPayments,
  });

  final StudentDashboard dashboard;
  final List<MyCourseItem> myCourses;
  final int pendingPayments;
}

/// تبويب دوراتي — متابعة الدورات المسجّلة فقط (ثيم الهوم، محتوى مخصّص).
class MyCoursesTabScreen extends ConsumerStatefulWidget {
  const MyCoursesTabScreen({super.key});

  @override
  ConsumerState<MyCoursesTabScreen> createState() => _MyCoursesTabScreenState();
}

class _MyCoursesTabScreenState extends ConsumerState<MyCoursesTabScreen> {
  _MyCoursesFilter _filter = _MyCoursesFilter.all;

  List<MyCourseItem> _filtered(List<MyCourseItem> items) {
    return switch (_filter) {
      _MyCoursesFilter.all => items,
      _MyCoursesFilter.learning =>
        items.where((i) => i.isEnrolled).toList(growable: false),
      _MyCoursesFilter.pending =>
        items.where((i) => i.isPendingPayment).toList(growable: false),
    };
  }

  @override
  Widget build(BuildContext context) {
    final async = ref.watch(myCoursesTabDataProvider);

    return Scaffold(
      backgroundColor: AppColors.canvas,
      body: async.when(
        loading: () => const AppPageLoading(),
        error: (e, _) => ErrorState(
          message: userFacingErrorMessage(
            e,
            fallback: "تعذّر تحميل كورساتك",
          ),
          onRetry: () => ref.invalidate(myCoursesTabDataProvider),
        ),
        data: (data) {
          final filtered = _filtered(data.myCourses);
          final learningCount =
              data.myCourses.where((i) => i.isEnrolled).length;

          return RefreshIndicator(
            color: AppColors.orange,
            onRefresh: () async {
              ref.invalidate(myCoursesTabDataProvider);
              await ref.read(myCoursesTabDataProvider.future);
            },
            child: ListView(
              padding: EdgeInsets.zero,
              children: [
                MyCoursesPageHeader(
                  enrolledCount: data.dashboard.enrolledCoursesCount,
                  inProgressCount: data.dashboard.inProgressCoursesCount,
                  overallProgressPercent:
                      data.dashboard.overallProgressPercent,
                  pendingPayments: data.pendingPayments,
                  continueLearning: data.dashboard.continueLearning,
                ),
                const SizedBox(height: 16),
                if (data.myCourses.isNotEmpty) ...[
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    child: _FilterRow(
                      filter: _filter,
                      learningCount: learningCount,
                      pendingCount: data.pendingPayments,
                      onChanged: (f) => setState(() => _filter = f),
                    ),
                  ),
                  const SizedBox(height: 12),
                ],
                if (data.myCourses.isEmpty)
                  const _MyCoursesEmptyBlock()
                else if (filtered.isEmpty)
                  const Padding(
                    padding: EdgeInsets.symmetric(horizontal: 16),
                    child: Text(
                      "لا توجد دورات في هذا التصنيف.",
                      style: TextStyle(color: AppColors.textSecondary),
                    ),
                  )
                else
                  ...filtered.map(
                    (item) => Padding(
                      padding: const EdgeInsets.fromLTRB(16, 0, 16, 10),
                      child: MyCourseCard(item: item),
                    ),
                  ),
                Padding(
                  padding: const EdgeInsets.fromLTRB(16, 16, 16, 28),
                  child: OutlinedButton.icon(
                    onPressed: () => context.go("/courses"),
                    icon: const Icon(Icons.explore_outlined),
                    label: const Text("استكشف دورات جديدة"),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: AppColors.navy,
                      minimumSize: const Size.fromHeight(48),
                      side: const BorderSide(color: AppColors.border),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(14),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }
}

class _FilterRow extends StatelessWidget {
  const _FilterRow({
    required this.filter,
    required this.learningCount,
    required this.pendingCount,
    required this.onChanged,
  });

  final _MyCoursesFilter filter;
  final int learningCount;
  final int pendingCount;
  final ValueChanged<_MyCoursesFilter> onChanged;

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: Row(
        children: [
          AppFilterChip(
            label: "الكل",
            selected: filter == _MyCoursesFilter.all,
            onTap: () => onChanged(_MyCoursesFilter.all),
          ),
          const SizedBox(width: 8),
          AppFilterChip(
            label: "قيد التعلّم ($learningCount)",
            selected: filter == _MyCoursesFilter.learning,
            onTap: () => onChanged(_MyCoursesFilter.learning),
          ),
          if (pendingCount > 0) ...[
            const SizedBox(width: 8),
            AppFilterChip(
              label: "بانتظار الدفع ($pendingCount)",
              selected: filter == _MyCoursesFilter.pending,
              onTap: () => onChanged(_MyCoursesFilter.pending),
            ),
          ],
        ],
      ),
    );
  }
}

class _MyCoursesEmptyBlock extends StatelessWidget {
  const _MyCoursesEmptyBlock();

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 8, 20, 8),
      child: Column(
        children: [
          Icon(
            Icons.school_outlined,
            size: 56,
            color: AppColors.navy.withValues(alpha: 0.35),
          ),
          const SizedBox(height: 12),
          const Text(
            "لا توجد دورات مسجّلة",
            style: TextStyle(
              color: AppColors.navy,
              fontSize: 17,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 6),
          const Text(
            "عند التسجيل في دورة ستظهر هنا لمتابعة التقدّم ومشاهدة الدروس.",
            textAlign: TextAlign.center,
            style: TextStyle(color: AppColors.textSecondary, height: 1.4),
          ),
          const SizedBox(height: 20),
          AppButton(
            label: "استكشف الدورات",
            onPressed: () => context.go("/courses"),
          ),
        ],
      ),
    );
  }
}
