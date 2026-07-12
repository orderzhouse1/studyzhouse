import "package:flutter/foundation.dart";

import "../../features/courses/models/course.dart";
import "../../features/courses/models/my_course_item.dart";
import "../../features/courses/models/saved_course.dart";
import "../../features/courses/models/student_dashboard.dart";

/// iOS App Store compliance — strict Reader / Learning Companion mode.
///
/// No course marketplace on iOS. Students only continue learning from
/// courses already enrolled in their account (including web/Android purchases).
abstract final class IosCoursePolicy {
  static bool get isIOSPlatform =>
      !kIsWeb && defaultTargetPlatform == TargetPlatform.iOS;

  /// Explore / catalog tab and marketplace UI are hidden on iOS.
  static bool get showExploreCatalog => !isIOSPlatform;

  /// Post-login / session restore landing route.
  static String get postLoginLocation =>
      isIOSPlatform ? "/my-courses" : "/home";

  static const String paidCourseBlockedMessage =
      "هذا الكورس غير متاح داخل تطبيق iOS.";

  static const String paidCourseBlockedTitle = "غير متاح حاليًا";

  static const String emptyMyCoursesTitle = "لا توجد كورسات في حسابك حاليًا.";

  static const String emptyMyCoursesDescription =
      "عند توفّر كورسات في حسابك ستظهر هنا لمتابعة التعلّم.";

  static bool isPaidCoursePricingType(String pricingType) =>
      pricingType != "FREE";

  static bool isPaidCourse(Course course) => !course.isFree;

  static bool isPaidSavedCourse(SavedCourseItem item) => !item.course.isFree;

  /// Public catalog is not used on iOS (no marketplace).
  static bool isCourseVisibleOnIosCatalog(Course course) => false;

  /// Course detail without enrollment: nothing from catalog on iOS.
  static bool isCourseAllowedOnIOS({
    Course? course,
    String? pricingType,
    bool? isFree,
  }) {
    if (!isIOSPlatform) return true;
    // Free enroll from catalog is removed; only enrolled access via My Courses.
    return false;
  }

  /// Course detail with enrollment: enrolled courses only on iOS.
  static bool isCourseDetailAllowedOnIOS({
    required Course course,
    required bool isEnrolled,
  }) {
    if (!isIOSPlatform) return true;
    return isEnrolled;
  }

  static bool get showPricesOnPlatform => !isIOSPlatform;

  static bool get showPurchaseOrPaymentUi => !isIOSPlatform;

  static List<Course> filterCoursesForPlatform(Iterable<Course> courses) {
    return filterCoursesForCatalog(courses);
  }

  /// iOS never requests a marketplace catalog (returns empty client-side).
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
      if (pricingType == "FREE") {
        return courses.where((c) => c.isFree).toList(growable: false);
      }
      if (pricingType == "PAID") {
        return courses.where((c) => !c.isFree).toList(growable: false);
      }
      return courses.toList(growable: false);
    }
    // Strict reader mode: no catalog items on iOS.
    return const [];
  }

  /// My Courses: enrolled only; hide pending payment.
  static List<MyCourseItem> filterMyCourseItemsForPlatform(
    Iterable<MyCourseItem> items,
  ) {
    if (!isIOSPlatform) return items.toList(growable: false);
    return items.where((i) => i.isEnrolled).toList(growable: false);
  }

  /// Saved: enrolled courses only on iOS (no marketplace bookmarks).
  static List<SavedCourseItem> filterSavedCoursesForPlatform(
    Iterable<SavedCourseItem> items,
  ) {
    if (!isIOSPlatform) return items.toList(growable: false);
    return items.where((i) => i.isEnrolled).toList(growable: false);
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
    // Without enrollment map, keep none from pricing-only filter.
    return <String>{};
  }

  /// Maps bottom-nav UI index → shell branch index on iOS (skips Courses).
  static int shellBranchForNavIndex(int navIndex) {
    if (!isIOSPlatform) return navIndex;
    // UI: 0 Home, 1 My Courses, 2 Profile → branches 0, 1, 3
    const map = [0, 1, 3];
    if (navIndex < 0 || navIndex >= map.length) return 0;
    return map[navIndex];
  }

  /// Maps shell branch index → bottom-nav UI index on iOS.
  static int navIndexForShellBranch(int branchIndex) {
    if (!isIOSPlatform) return branchIndex;
    return switch (branchIndex) {
      0 => 0,
      1 => 1,
      3 => 2,
      _ => 1, // Courses branch or unknown → highlight My Courses
    };
  }
}
