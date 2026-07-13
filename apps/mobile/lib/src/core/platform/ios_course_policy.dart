import "package:flutter/foundation.dart";

import "../../features/courses/models/course.dart";
import "../../features/courses/models/my_course_item.dart";
import "../../features/courses/models/saved_course.dart";
import "../../features/courses/models/student_dashboard.dart";

/// Mobile Reader / Learning Companion policy (iOS + Android).
///
/// No course marketplace. Students only continue learning from courses
/// already enrolled in their account (including web purchases).
abstract final class IosCoursePolicy {
  static bool get isIOS =>
      !kIsWeb && defaultTargetPlatform == TargetPlatform.iOS;

  static bool get isAndroid =>
      !kIsWeb && defaultTargetPlatform == TargetPlatform.android;

  /// True on native iOS and Android builds.
  static bool get isMobileReader => isIOS || isAndroid;

  /// @deprecated Prefer [isMobileReader] — kept for call-site compatibility.
  static bool get isIOSPlatform => isMobileReader;

  /// Explore / catalog tab and marketplace UI are hidden on mobile.
  static bool get showExploreCatalog => !isMobileReader;

  /// Post-login / session restore landing route.
  static String get postLoginLocation =>
      isMobileReader ? "/my-courses" : "/home";

  static const String paidCourseBlockedMessage =
      "هذا الكورس غير متاح داخل التطبيق.";

  static const String paidCourseBlockedTitle = "غير متاح حاليًا";

  static const String emptyMyCoursesTitle = "لا توجد كورسات في حسابك حاليًا.";

  static const String emptyMyCoursesDescription =
      "عند توفّر كورسات في حسابك ستظهر هنا لمتابعة التعلّم.";

  static bool isPaidCoursePricingType(String pricingType) =>
      pricingType != "FREE";

  static bool isPaidCourse(Course course) => !course.isFree;

  static bool isPaidSavedCourse(SavedCourseItem item) => !item.course.isFree;

  /// Public catalog is not used on mobile (no marketplace).
  static bool isCourseVisibleOnIosCatalog(Course course) => false;

  /// Course detail without enrollment: nothing from catalog on mobile.
  static bool isCourseAllowedOnIOS({
    Course? course,
    String? pricingType,
    bool? isFree,
  }) {
    if (!isMobileReader) return true;
    return false;
  }

  /// Course detail: enrolled courses only on mobile (paid or free).
  static bool isCourseDetailAllowedOnIOS({
    required Course course,
    required bool isEnrolled,
  }) {
    if (!isMobileReader) return true;
    return isEnrolled;
  }

  static bool get showPricesOnPlatform => !isMobileReader;

  static bool get showPurchaseOrPaymentUi => !isMobileReader;

  static List<Course> filterCoursesForPlatform(Iterable<Course> courses) {
    return filterCoursesForCatalog(courses);
  }

  /// Mobile never requests a marketplace catalog.
  static String? effectiveListPricingType(String? pricingType) {
    if (!isMobileReader) return pricingType;
    return "FREE";
  }

  static List<Course> filterCoursesForCatalog(
    Iterable<Course> courses, {
    String? pricingType,
    bool apiIncludesIapFields = true,
  }) {
    if (!isMobileReader) {
      if (pricingType == "FREE") {
        return courses.where((c) => c.isFree).toList(growable: false);
      }
      if (pricingType == "PAID") {
        return courses.where((c) => !c.isFree).toList(growable: false);
      }
      return courses.toList(growable: false);
    }
    // Strict reader mode: no catalog items on mobile.
    return const [];
  }

  /// My Courses: enrolled only (paid + free); hide pending payment.
  static List<MyCourseItem> filterMyCourseItemsForPlatform(
    Iterable<MyCourseItem> items,
  ) {
    if (!isMobileReader) return items.toList(growable: false);
    return items.where((i) => i.isEnrolled).toList(growable: false);
  }

  /// Saved: enrolled courses only on mobile.
  static List<SavedCourseItem> filterSavedCoursesForPlatform(
    Iterable<SavedCourseItem> items,
  ) {
    if (!isMobileReader) return items.toList(growable: false);
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
    if (!isMobileReader) return courseIds.toSet();
    return <String>{};
  }

  /// Maps bottom-nav UI index → shell branch index (skips Courses).
  static int shellBranchForNavIndex(int navIndex) {
    if (!isMobileReader) return navIndex;
    // UI: 0 Home, 1 My Courses, 2 Profile → branches 0, 1, 3
    const map = [0, 1, 3];
    if (navIndex < 0 || navIndex >= map.length) return 0;
    return map[navIndex];
  }

  /// Maps shell branch index → bottom-nav UI index.
  static int navIndexForShellBranch(int branchIndex) {
    if (!isMobileReader) return branchIndex;
    return switch (branchIndex) {
      0 => 0,
      1 => 1,
      3 => 2,
      _ => 1, // Courses branch or unknown → highlight My Courses
    };
  }
}
