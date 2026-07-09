import "package:flutter/material.dart";
import "package:flutter_riverpod/flutter_riverpod.dart";
import "package:go_router/go_router.dart";

import "../../core/network/api_exception.dart";
import "../../core/platform/ios_course_policy.dart";
import "../../core/theme/app_colors.dart";
import "../../core/widgets/app_button.dart";
import "../../core/widgets/app_card.dart";
import "../../core/widgets/brand_loading_indicator.dart";
import "../../core/widgets/error_state.dart";
import "models/learn_course.dart";
import "repositories/learning_repository.dart";
import "../courses/widgets/ios_paid_course_blocked_view.dart";
import "widgets/learn_page_header.dart";
import "widgets/lesson_navigation_bar.dart";
import "widgets/lesson_section_card.dart";
import "widgets/youtube_lesson_player.dart";

class LearnScreen extends ConsumerStatefulWidget {
  const LearnScreen({
    required this.courseSlug,
    this.initialLessonId,
    super.key,
  });

  final String courseSlug;
  final String? initialLessonId;

  @override
  ConsumerState<LearnScreen> createState() => _LearnScreenState();
}

class _LearnScreenState extends ConsumerState<LearnScreen> {
  LearnCourseResponse? _payload;
  bool _loading = true;
  bool _completing = false;
  bool _blockedOnIos = false;
  String? _errorMessage;
  String? _errorCode;
  String? _selectedLessonId;

  @override
  void initState() {
    super.initState();
    _selectedLessonId = widget.initialLessonId;
    _load();
  }

  Future<void> _load({String? lessonId}) async {
    setState(() {
      _loading = true;
      _errorMessage = null;
      _errorCode = null;
      _blockedOnIos = false;
    });
    try {
      final data = await ref
          .read(learningRepositoryProvider)
          .getLearnCourse(
            widget.courseSlug,
            lessonId: lessonId ?? _selectedLessonId,
          );
      if (!mounted) return;
      if (!IosCoursePolicy.isCourseAllowedOnIOS(
        pricingType: data.course.pricingType,
      )) {
        setState(() {
          _blockedOnIos = true;
          _payload = null;
          _loading = false;
        });
        return;
      }
      setState(() {
        _payload = data;
        _selectedLessonId = data.currentLesson.id;
        _loading = false;
      });
    } on ApiException catch (e) {
      if (!mounted) return;
      if (IosCoursePolicy.isIOSPlatform &&
          (e.statusCode == 404 ||
              e.code == "NOT_FOUND" ||
              e.code == "COURSE_NOT_FOUND")) {
        setState(() {
          _blockedOnIos = true;
          _payload = null;
          _loading = false;
        });
        return;
      }
      setState(() {
        _errorMessage = _mapLearnError(e);
        _errorCode = e.code;
        _loading = false;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _errorMessage = "تعذّر تحميل محتوى الكورس";
        _loading = false;
      });
    }
  }

  String _mapLearnError(ApiException e) {
    if (e.code == "FORBIDDEN") {
      return "لا تملك صلاحية الوصول إلى هذا الكورس.";
    }
    if (e.code == "NOT_FOUND" || e.code == "COURSE_NOT_FOUND") {
      return "الكورس غير موجود أو غير متاح.";
    }
    if (e.code == "NO_LESSONS") {
      return "لا توجد دروس متاحة بعد.";
    }
    return e.message;
  }

  void _selectLesson(String lessonId) {
    final lesson = findLearnLessonById(_payload!.sections, lessonId);
    if (lesson == null) return;
    setState(() {
      _selectedLessonId = lessonId;
      _payload = _payload!.withSelectedLesson(lesson);
    });
    context.replace("/learn/${widget.courseSlug}?lessonId=$lessonId");
  }

  void _goToNeighbor(String? lessonId) {
    if (lessonId == null) return;
    _selectLesson(lessonId);
  }

  Future<void> _markComplete() async {
    final payload = _payload;
    if (payload == null || _completing) return;
    final lessonId = payload.currentLesson.id;
    final wasDone = payload.currentLesson.progress.isCompleted;
    if (wasDone) return;

    setState(() => _completing = true);
    try {
      final result = await ref
          .read(learningRepositoryProvider)
          .markLessonComplete(lessonId);
      if (!mounted) return;
      setState(() {
        _payload = payload.updateLessonProgress(
          lessonId,
          result.lessonProgress,
          enrollmentProgressPercent: result.enrollmentProgressPercent,
          incrementCompleted: !wasDone,
        );
        _completing = false;
      });
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(const SnackBar(content: Text("تم إكمال الدرس بنجاح")));
    } on ApiException catch (e) {
      if (!mounted) return;
      setState(() => _completing = false);
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text(e.message)));
    } catch (_) {
      if (!mounted) return;
      setState(() => _completing = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.canvas,
      body: _buildBody(context),
    );
  }

  Widget _buildBody(BuildContext context) {
    if (_loading) {
      return const AppPageLoading(message: "جاري تحميل الدروس…");
    }

    if (_blockedOnIos) {
      return Column(
        children: [
          LearnPageHeader(
            courseTitle: IosCoursePolicy.paidCourseBlockedTitle,
            progressPercent: 0,
            completedLessons: 0,
            totalLessons: 0,
            onBack: () => context.pop(),
          ),
          const Expanded(child: IosPaidCourseBlockedView()),
        ],
      );
    }

    if (_errorMessage != null) {
      return Column(
        children: [
          LearnPageHeader(
            courseTitle: "متابعة التعلّم",
            progressPercent: 0,
            completedLessons: 0,
            totalLessons: 0,
            onBack: () => context.pop(),
          ),
          Expanded(
            child: ErrorState(
              message: _errorMessage!,
              onRetry: _errorCode == "FORBIDDEN" || _errorCode == "NOT_FOUND"
                  ? null
                  : () => _load(),
            ),
          ),
          if (_errorCode == "FORBIDDEN") const LearnAccessDeniedActions(),
        ],
      );
    }

    final payload = _payload;
    if (payload == null) {
      return const AppPageLoading();
    }

    if (payload.stats.totalLessons == 0) {
      return Column(
        children: [
          LearnPageHeader(
            courseTitle: payload.course.title,
            progressPercent: 0,
            completedLessons: 0,
            totalLessons: 0,
            onBack: () => context.pop(),
          ),
          Expanded(
            child: ErrorState(
              message: "لا توجد دروس متاحة بعد.",
              onRetry: () => _load(),
            ),
          ),
        ],
      );
    }

    final lesson = payload.currentLesson;
    final nav = payload.navigation;

    return RefreshIndicator(
      color: AppColors.orange,
      onRefresh: () => _load(lessonId: _selectedLessonId),
      child: ListView(
        padding: EdgeInsets.zero,
        children: [
          LearnPageHeader(
            courseTitle: payload.course.title,
            progressPercent: payload.stats.progressPercent,
            completedLessons: payload.stats.completedLessons,
            totalLessons: payload.stats.totalLessons,
            onBack: () => context.pop(),
            videoPlayer: YoutubeLessonPlayer(
              videoId: lesson.effectiveYoutubeVideoId,
              watchUrl: lesson.youtubeUrl,
              embeddedInHero: true,
            ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                AppCard(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        "الدرس الحالي",
                        style: TextStyle(
                          color: AppColors.orange,
                          fontSize: 11,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        lesson.title,
                        style: const TextStyle(
                          color: AppColors.navy,
                          fontSize: 17,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      if (lesson.sectionTitle != null) ...[
                        const SizedBox(height: 4),
                        Text(
                          lesson.sectionTitle!,
                          style: const TextStyle(
                            color: AppColors.textSecondary,
                            fontSize: 13,
                          ),
                        ),
                      ],
                      if (lesson.description != null &&
                          lesson.description!.isNotEmpty) ...[
                        const SizedBox(height: 10),
                        Text(
                          lesson.description!,
                          style: const TextStyle(
                            color: AppColors.textSecondary,
                            fontSize: 14,
                            height: 1.4,
                          ),
                        ),
                      ],
                      if (lesson.progress.isCompleted) ...[
                        const SizedBox(height: 12),
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 10,
                            vertical: 6,
                          ),
                          decoration: BoxDecoration(
                            color: AppColors.orange.withValues(alpha: 0.12),
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: const Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(
                                Icons.check_circle_rounded,
                                color: AppColors.orange,
                                size: 18,
                              ),
                              SizedBox(width: 6),
                              Text(
                                "تم إكمال الدرس",
                                style: TextStyle(
                                  color: AppColors.orange,
                                  fontWeight: FontWeight.w600,
                                  fontSize: 13,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
                const SizedBox(height: 14),
                AppButton(
                  label: lesson.progress.isCompleted
                      ? "الدرس مكتمل"
                      : "تحديد الدرس مكتمل",
                  isLoading: _completing,
                  onPressed: lesson.progress.isCompleted || _completing
                      ? null
                      : _markComplete,
                ),
                const SizedBox(height: 12),
                LessonNavigationBar(
                  hasPrevious: nav.previousLessonId != null,
                  hasNext: nav.nextLessonId != null,
                  onPrevious: () => _goToNeighbor(nav.previousLessonId),
                  onNext: () => _goToNeighbor(nav.nextLessonId),
                ),
                const SizedBox(height: 20),
                const Text(
                  "قائمة الدروس",
                  style: TextStyle(
                    color: AppColors.navy,
                    fontSize: 17,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 10),
                ...payload.sections.map(
                  (sec) => Padding(
                    padding: const EdgeInsets.only(bottom: 10),
                    child: LessonSectionCard(
                      section: sec,
                      activeLessonId: lesson.id,
                      onLessonTap: _selectLesson,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

/// Access denied footer actions.
class LearnAccessDeniedActions extends StatelessWidget {
  const LearnAccessDeniedActions({super.key});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(16),
      child: AppButton(
        label: "استكشف الكورسات",
        onPressed: () => context.go("/courses"),
      ),
    );
  }
}
