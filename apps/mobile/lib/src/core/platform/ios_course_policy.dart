import "package:flutter/foundation.dart";

import "../../features/courses/models/course.dart";
import "../../features/courses/models/my_course_item.dart";
import "../../features/courses/models/saved_course.dart";
import "../../features/courses/models/student_dashboard.dart";

/// iOS App Store compliance — learning companion (reader) model.
///
/// Catalog shows free courses only. Enrolled paid courses appear in
/// My Courses / Continue Learning, not as purchasable marketplace items.
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

  /// Catalog / explore / home discover: free courses only on iOS.
  static bool isCourseVisibleOnIosCatalog(Course course) {
    return course.isFree;
  }

  /// Course detail / learn gate without enrollment context.
  static bool isCourseAllowedOnIOS({
    Course? course,
    String? pricingType,
    bool? isFree,
  }) {
    if (!isIOSPlatform) return true;
    if (course != null) return course.isFree;
    if (isFree == true || pricingType == "FREE") return true;
    return false;
  }

  /// Course detail with enrollment: free always; paid only if enrolled.
  static bool isCourseDetailAllowedOnIOS({
    required Course course,
    required bool isEnrolled,
  }) {
    if (!isIOSPlatform) return true;
    if (course.isFree) return true;
    return isEnrolled;
  }

  static bool get showPricesOnPlatform => !isIOSPlatform;

  static List<Course> filterCoursesForPlatform(Iterable<Course> courses) {
    return filterCoursesForCatalog(courses);
  }

  /// Force FREE list filter on iOS so the API never returns paid marketplace items.
  static String? effectiveListPricingType(String? pricingType) {
    if (!isIOSPlatform) return pricingType;
    return "FREE";
  }

  static List<Course> filterCoursesForCatalog(
    Iterable<Course> courses, {
    String? pricingType,
    bool apiIncludesIapFields = true,
  }) {
    if (!isIOSPlatform) {
      var visible = courses;
      if (pricingType == "FREE") {
        return visible.where((c) => c.isFree).toList(growable: false);
      }
      if (pricingType == "PAID") {
        return visible.where((c) => !c.isFree).toList(growable: false);
      }
      return visible.toList(growable: false);
    }

    final freeOnly = courses.where((c) => c.isFree);
    return freeOnly.toList(growable: false);
  }

  /// My Courses: enrolled free + enrolled paid; hide pending payment.
  static List<MyCourseItem> filterMyCourseItemsForPlatform(
    Iterable<MyCourseItem> items,
  ) {
    if (!isIOSPlatform) return items.toList(growable: false);
    return items
        .where((i) {
          if (i.isPendingPayment) return false;
          return i.isEnrolled;
        })
        .toList(growable: false);
  }

  /// Saved list: free courses only on iOS (paid are not marketplace items).
  static List<SavedCourseItem> filterSavedCoursesForPlatform(
    Iterable<SavedCourseItem> items,
  ) {
    if (!isIOSPlatform) return items.toList(growable: false);
    return items.where((i) => i.course.isFree).toList(growable: false);
  }

  static StudentDashboard filterDashboardForPlatform(
    StudentDashboard dashboard,
  ) {
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
