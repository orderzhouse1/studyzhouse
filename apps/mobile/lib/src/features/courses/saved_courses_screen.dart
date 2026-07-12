import "package:flutter/material.dart";
import "package:flutter_riverpod/flutter_riverpod.dart";
import "package:go_router/go_router.dart";

import "../../core/network/api_exception.dart";
import "../../core/platform/ios_course_policy.dart";
import "../../core/utils/friendly_error_message.dart";
import "../../core/theme/app_colors.dart";
import "../../core/widgets/app_button.dart";
import "../../core/widgets/app_card.dart";
import "../../core/widgets/course_thumbnail.dart";
import "../../core/widgets/empty_state.dart";
import "../../core/widgets/error_state.dart";
import "../../core/widgets/loading_view.dart";
import "../courses/models/saved_course.dart";
import "../courses/providers/saved_course_ids_provider.dart";
import "../courses/repositories/student_courses_repository.dart";

final savedCoursesProvider = FutureProvider.autoDispose((ref) {
  return ref.read(studentCoursesRepositoryProvider).getSavedCourses();
});

class SavedCoursesScreen extends ConsumerWidget {
  const SavedCoursesScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(savedCoursesProvider);

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text("المحفوظات"),
        leading: IconButton(
          icon: const Icon(Icons.arrow_forward_rounded),
          onPressed: () => context.pop(),
        ),
      ),
      body: SafeArea(
        child: async.when(
          loading: () => const LoadingView(message: "جاري التحميل…"),
          error: (e, _) => ErrorState(
            message: userFacingErrorMessage(
              e,
              fallback: "تعذّر تحميل المحفوظات",
            ),
            onRetry: () => ref.invalidate(savedCoursesProvider),
          ),
          data: (data) {
            if (data.items.isEmpty) {
              final isIos = IosCoursePolicy.isIOSPlatform;
              return Column(
                children: [
                  Expanded(
                    child: EmptyState(
                      title: isIos
                          ? IosCoursePolicy.emptyMyCoursesTitle
                          : "لا توجد كورسات محفوظة",
                      subtitle: isIos
                          ? IosCoursePolicy.emptyMyCoursesDescription
                          : "احفظ الكورسات من صفحة الاستكشاف.",
                      icon: Icons.bookmark_border_rounded,
                    ),
                  ),
                  if (!isIos)
                    Padding(
                      padding: const EdgeInsets.all(20),
                      child: AppButton(
                        label: "استكشف الكورسات",
                        onPressed: () => context.go("/courses"),
                      ),
                    ),
                ],
              );
            }
            return RefreshIndicator(
              color: AppColors.orange,
              onRefresh: () async {
                ref.invalidate(savedCoursesProvider);
                ref.invalidate(savedCourseIdsProvider);
                await ref.read(savedCoursesProvider.future);
              },
              child: ListView.separated(
                padding: const EdgeInsets.all(20),
                itemCount: data.items.length,
                separatorBuilder: (_, _) => const SizedBox(height: 12),
                itemBuilder: (_, i) => _SavedCard(item: data.items[i]),
              ),
            );
          },
        ),
      ),
    );
  }
}

class _SavedCard extends ConsumerWidget {
  const _SavedCard({required this.item});

  final SavedCourseItem item;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final course = item.course;
    return AppCard(
      padding: const EdgeInsets.all(12),
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
                Text(
                  course.title,
                  style: Theme.of(context).textTheme.titleSmall,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
                if (course.category != null)
                  Text(
                    course.category!.name,
                    style: Theme.of(context).textTheme.bodySmall,
                  ),
                const SizedBox(height: 8),
                Row(
                  children: [
                    TextButton(
                      onPressed: () => context.push("/courses/${course.slug}"),
                      child: const Text("عرض الكورس"),
                    ),
                    IconButton(
                      tooltip: "إزالة",
                      onPressed: () => _unsave(context, ref),
                      icon: const Icon(
                        Icons.bookmark_remove_outlined,
                        color: AppColors.error,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _unsave(BuildContext context, WidgetRef ref) async {
    try {
      await ref.read(savedCourseIdsProvider.notifier).toggleSave(item.courseId);
      ref.invalidate(savedCoursesProvider);
      if (!context.mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("تمت إزالة الكورس من المحفوظات")),
      );
    } on ApiException catch (e) {
      if (!context.mounted) return;
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text(e.message)));
    }
  }
}
