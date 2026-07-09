import "../../courses/models/course.dart";
import "course_interest_match.dart";
import "../../../core/platform/ios_course_policy.dart";

class HomeDiscoverRow {
  const HomeDiscoverRow({
    required this.id,
    required this.title,
    required this.courses,
    this.categorySlugFilter,
  });

  final String id;
  final String title;
  final List<Course> courses;
  final String? categorySlugFilter;
}

List<HomeDiscoverRow> buildHomeDiscoverRows({
  required List<Course> courses,
  required List<String> interests,
}) {
  final visibleCourses = IosCoursePolicy.filterCoursesForPlatform(courses);
  final rows = <HomeDiscoverRow>[];

  void add(String id, String title, List<Course> picked) {
    if (picked.isEmpty) return;
    rows.add(HomeDiscoverRow(id: id, title: title, courses: picked));
  }

  if (interests.isNotEmpty) {
    add(
      "interests",
      "حسب اهتماماتك",
      visibleCourses
          .where((c) => courseMatchesInterests(c, interests))
          .take(10)
          .toList(growable: false),
    );
  }

  add(
    "short",
    "كورسات قصيرة",
    visibleCourses.where(isShortCourse).take(10).toList(growable: false),
  );

  add(
    "ai",
    "الذكاء الاصطناعي",
    visibleCourses
        .where(courseMatchesAiTopic)
        .take(10)
        .toList(growable: false),
  );

  final newest = List<Course>.from(visibleCourses)
    ..sort((a, b) {
      final ap = a.publishedAt ?? "";
      final bp = b.publishedAt ?? "";
      return bp.compareTo(ap);
    });
  add("newest", "جديد على المنصة", newest.take(10).toList(growable: false));

  add(
    "free",
    "كورسات مجانية",
    visibleCourses.where((c) => c.isFree).take(10).toList(growable: false),
  );

  return rows;
}
