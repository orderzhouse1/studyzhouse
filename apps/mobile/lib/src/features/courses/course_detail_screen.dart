import "package:flutter/material.dart";
import "package:flutter_riverpod/flutter_riverpod.dart";
import "package:go_router/go_router.dart";

import "../../core/network/api_exception.dart";
import "../../core/theme/app_colors.dart";
import "../../core/widgets/app_button.dart";
import "../../core/widgets/app_card.dart";
import "../../core/widgets/course_thumbnail.dart";
import "../../core/widgets/error_state.dart";
import "../../core/widgets/loading_view.dart";
import "../learn/repositories/learning_repository.dart";
import "models/course.dart";
import "providers/saved_course_ids_provider.dart";
import "repositories/course_repository.dart";

final courseDetailProvider = FutureProvider.autoDispose.family<Course, String>((
  ref,
  slug,
) {
  return ref.read(courseRepositoryProvider).getCourseBySlug(slug);
});

final courseAccessProvider = FutureProvider.autoDispose
    .family<CourseAccessInfo?, String>((ref, slug) async {
      try {
        return await ref.read(learningRepositoryProvider).getCourseAccess(slug);
      } on ApiException catch (e) {
        if (e.statusCode == 401) rethrow;
        return null;
      }
    });

class CourseDetailScreen extends ConsumerWidget {
  const CourseDetailScreen({required this.slug, super.key});

  final String slug;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(courseDetailProvider(slug));

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(title: _CourseDetailAppBarTitle(slug: slug)),
      body: SafeArea(
        child: async.when(
          loading: () => const LoadingView(message: "جاري التحميل…"),
          error: (e, _) => ErrorState(
            message: e is ApiException ? e.message : "تعذّر تحميل الكورس",
            onRetry: () => ref.invalidate(courseDetailProvider(slug)),
          ),
          data: (course) => _CourseDetailBody(course: course, slug: slug),
        ),
      ),
    );
  }
}

class _CourseDetailBody extends ConsumerStatefulWidget {
  const _CourseDetailBody({required this.course, required this.slug});

  final Course course;
  final String slug;

  @override
  ConsumerState<_CourseDetailBody> createState() => _CourseDetailBodyState();
}

class _CourseDetailBodyState extends ConsumerState<_CourseDetailBody> {
  bool _enrolling = false;

  Course get course => widget.course;
  String get slug => widget.slug;

  Future<void> _enrollFree() async {
    setState(() => _enrolling = true);
    try {
      await ref.read(learningRepositoryProvider).enrollInFreeCourse(slug);
      ref.invalidate(courseAccessProvider(slug));
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("تم التسجيل في الكورس بنجاح.")),
      );
    } on ApiException catch (e) {
      if (e.code == "ALREADY_ENROLLED") {
        ref.invalidate(courseAccessProvider(slug));
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text("أنت مسجّل بالفعل في هذا الكورس.")),
        );
        return;
      }
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(e.message)),
      );
    } catch (_) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("تعذّر التسجيل في الكورس.")),
      );
    } finally {
      if (mounted) setState(() => _enrolling = false);
    }
  }

  void _openPurchases() {
    context.push("/purchases?courseId=${Uri.encodeComponent(course.id)}");
  }

  void _openRedeem() {
    context.push("/redeem");
  }

  @override
  Widget build(BuildContext context) {
    final accessAsync = ref.watch(courseAccessProvider(slug));
    final isEnrolled = accessAsync.value?.isEnrolled ?? false;

    return ListView(
      padding: const EdgeInsets.fromLTRB(20, 8, 20, 24),
      children: [
        CourseThumbnail(thumbnailUrl: course.thumbnailUrl, aspectRatio: 16 / 9),
        const SizedBox(height: 16),
        if (course.category != null)
          Text(
            course.category!.name,
            style: Theme.of(context).textTheme.labelLarge?.copyWith(
              color: AppColors.orange,
              fontWeight: FontWeight.w600,
            ),
          ),
        const SizedBox(height: 8),
        Text(course.title, style: Theme.of(context).textTheme.headlineSmall),
        const SizedBox(height: 8),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: [
            _Chip(label: course.priceLabel),
            _Chip(label: course.levelLabel),
            _Chip(label: "${course.lessonCount} درس"),
          ],
        ),
        if (isEnrolled && accessAsync.value != null) ...[
          const SizedBox(height: 12),
          LinearProgressIndicator(
            value: accessAsync.value!.progressPercent / 100,
            minHeight: 6,
            borderRadius: BorderRadius.circular(4),
            backgroundColor: AppColors.surfaceMuted,
            color: AppColors.orange,
          ),
          const SizedBox(height: 4),
          Text(
            "تقدّمك: ${accessAsync.value!.progressPercent}%",
            style: Theme.of(context).textTheme.bodySmall,
          ),
        ],
        const SizedBox(height: 16),
        if (isEnrolled)
          AppButton(
            label: "متابعة التعلّم",
            onPressed: () => context.push("/learn/$slug"),
          )
        else if (course.isFree)
          AppButton(
            label: "التسجيل مجانًا",
            isLoading: _enrolling,
            onPressed: _enrolling ? null : _enrollFree,
          )
        else
          AppButton(
            label: "طلب تفعيل عبر CliQ",
            onPressed: _openPurchases,
          ),
        if (!course.isFree) ...[
          const SizedBox(height: 8),
          OutlinedButton(
            onPressed: _openRedeem,
            child: const Text("تفعيل بكود"),
          ),
        ],
        const SizedBox(height: 20),
        AppCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text("عن الكورس", style: Theme.of(context).textTheme.titleMedium),
              const SizedBox(height: 8),
              Text(
                course.description ?? course.shortDescription ?? "لا يوجد وصف.",
                style: Theme.of(context).textTheme.bodyMedium,
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),
        AppCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                "محتوى الكورس",
                style: Theme.of(context).textTheme.titleMedium,
              ),
              const SizedBox(height: 8),
              Text(
                "${course.lessonCount} درس — ${isEnrolled ? "افتح متابعة التعلّم لمشاهدة الدروس." : "سجّل في الكورس للوصول للدروس."}",
                style: Theme.of(context).textTheme.bodyMedium,
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _CourseDetailAppBarTitle extends ConsumerWidget {
  const _CourseDetailAppBarTitle({required this.slug});

  final String slug;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final course = ref.watch(courseDetailProvider(slug)).value;

    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        const Text("تفاصيل الكورس"),
        if (course != null) ...[
          const SizedBox(width: 4),
          _CourseSaveIconButton(courseId: course.id),
        ],
      ],
    );
  }
}

class _CourseSaveIconButton extends ConsumerWidget {
  const _CourseSaveIconButton({required this.courseId});

  final String courseId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final savedAsync = ref.watch(savedCourseIdsProvider);
    final isSaved = (savedAsync.value ?? {}).contains(courseId);

    return IconButton(
      visualDensity: VisualDensity.compact,
      padding: EdgeInsets.zero,
      constraints: const BoxConstraints(minWidth: 40, minHeight: 40),
      onPressed: savedAsync.isLoading
          ? null
          : () => _toggleSave(context, ref, isSaved),
      icon: Icon(
        isSaved ? Icons.bookmark : Icons.bookmark_border,
        color: AppColors.orange,
      ),
    );
  }

  Future<void> _toggleSave(
    BuildContext context,
    WidgetRef ref,
    bool isSaved,
  ) async {
    try {
      await ref.read(savedCourseIdsProvider.notifier).toggleSave(courseId);
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
class _Chip extends StatelessWidget {
  const _Chip({required this.label});

  final String label;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: AppColors.surfaceMuted,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.border),
      ),
      child: Text(label, style: Theme.of(context).textTheme.bodySmall),
    );
  }
}

