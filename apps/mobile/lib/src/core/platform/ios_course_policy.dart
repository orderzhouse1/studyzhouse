import "package:flutter/foundation.dart";

import "../../features/courses/models/course.dart";
import "../../features/courses/models/my_course_item.dart";
import "../../features/courses/models/saved_course.dart";
import "../../features/courses/models/student_dashboard.dart";

/// iOS App Store compliance — free digital courses only (Guideline 3.1.1).
abstract final class IosCoursePolicy {
  static bool get isIOSPlatform =>
      !kIsWeb && defaultTargetPlatform == TargetPlatform.iOS;

  static const String paidCourseBlockedMessage =
      "هذا الكورس غير متاح داخل تطبيق iOS.";

  static const String paidCourseBlockedTitle = "غير متاح حاليًا";

  static bool isPaidCoursePricingType(String pricingType) =>
      pricingType != "FREE";

  static bool isPaidCourse(Course course) => !course.isFree;

  static bool isPaidSavedCourse(SavedCourseItem item) => !item.course.isFree;

  static bool isCourseAllowedOnIOS({
    Course? course,
    String? pricingType,
    bool? isFree,
  }) {
    if (!isIOSPlatform) return true;
    if (course != null) return course.isFree;
    if (isFree != null) return isFree;
    if (pricingType != null) return pricingType == "FREE";
    return false;
  }

  static List<Course> filterCoursesForPlatform(Iterable<Course> courses) {
    if (!isIOSPlatform) return courses.toList(growable: false);
    return courses.where((c) => c.isFree).toList(growable: false);
  }

  static List<MyCourseItem> filterMyCourseItemsForPlatform(
    Iterable<MyCourseItem> items,
  ) {
    if (!isIOSPlatform) return items.toList(growable: false);
    return items
        .where((i) => i.course.isFree && !i.isPendingPayment)
        .toList(growable: false);
  }

  static List<SavedCourseItem> filterSavedCoursesForPlatform(
    Iterable<SavedCourseItem> items,
  ) {
    if (!isIOSPlatform) return items.toList(growable: false);
    return items.where((i) => i.course.isFree).toList(growable: false);
  }

  static StudentDashboard filterDashboardForPlatform(StudentDashboard dashboard) {
    // Dashboard counts and continue-learning are filtered server-side for iOS.
    return dashboard;
  }

  static Set<String> filterSavedCourseIdsForPlatform(
    Iterable<String> courseIds,
    Map<String, String> pricingByCourseId,
  ) {
    if (!isIOSPlatform) return courseIds.toSet();
    return courseIds
        .where((id) => pricingByCourseId[id] == "FREE")
        .toSet();
  }
}
