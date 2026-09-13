import "package:flutter/foundation.dart";

import "../../features/courses/models/course.dart";
import "../../features/courses/models/my_course_item.dart";
import "../../features/courses/models/saved_course.dart";
import "../../features/courses/models/student_dashboard.dart";
import "platform_purchase_policy.dart";

/// Course visibility / navigation policy.
///
/// - **iOS:** marketplace of free + Apple-IAP mapped paid courses.
/// - **Android:** Reader / Learning Companion (enrolled-only; no marketplace).
abstract final class IosCoursePolicy {
  static bool get isIOS =>
      !kIsWeb && defaultTargetPlatform == TargetPlatform.iOS;

  static bool get isAndroid =>
      !kIsWeb && defaultTargetPlatform == TargetPlatform.android;

  /// True on native iOS and Android builds.
  static bool get isMobileReader => isIOS || isAndroid;

  /// @deprecated Prefer [isIOS] / [isAndroid] / [isMobileReader].
  static bool get isIOSPlatform => isMobileReader;

  /// Explore / catalog: enabled on iOS (IAP marketplace), hidden on Android.
  static bool get showExploreCatalog => isIOS || !isMobileReader;

  /// Post-login / session restore landing route.
  static String get postLoginLocation =>
      isAndroid ? "/my-courses" : "/home";

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

  static bool isCourseVisibleOnIosCatalog(Course course) {
    if (!isIOS) {
      // Non-iOS mobile (Android): no catalog marketplace.
      if (isAndroid) return false;
      return true;
    }
    if (course.isFree) return true;
    return course.isIosIapPurchasable;
  }

  /// Course detail without enrollment: iOS allows IAP-mapped paid; Android none.
  static bool isCourseAllowedOnIOS({
    Course? course,
    String? pricingType,
    bool? isFree,
  }) {
    if (isAndroid) return false;
    if (!isIOS) return true;
    if (course != null) {
      if (course.isFree) return true;
      return course.isIosIapPurchasable;
    }
    if (isFree == true) return true;
    if (pricingType == "FREE") return true;
    return false;
  }

  /// Course detail: iOS enrolled OR IAP-purchasable; Android enrolled-only.
  static bool isCourseDetailAllowedOnIOS({
    required Course course,
    required bool isEnrolled,
  }) {
    if (isAndroid) return isEnrolled;
    if (!isIOS) return true;
    if (course.isFree) return true;
    if (course.isIosIapPurchasable) return true;
    return false;
  }

  /// Show DB price chips only off mobile; iOS shows StoreKit price in IAP UI.
  static bool get showPricesOnPlatform => !isMobileReader;

  static bool get showPurchaseOrPaymentUi =>
      PlatformPurchasePolicy.showExternalPaymentFlows;

  static bool get showAppleIapPurchaseUi => PlatformPurchasePolicy.iapEnabled;

  static List<Course> filterCoursesForPlatform(Iterable<Course> courses) {
    return filterCoursesForCatalog(courses);
  }

  static String? effectiveListPricingType(String? pricingType) {
    if (isAndroid) return "FREE";
    return pricingType;
  }

  static List<Course> filterCoursesForCatalog(
    Iterable<Course> courses, {
    String? pricingType,
    bool apiIncludesIapFields = true,
  }) {
    if (isAndroid) return const [];
    if (!isIOS) {
      if (pricingType == "FREE") {
        return courses.where((c) => c.isFree).toList(growable: false);
      }
      if (pricingType == "PAID") {
        return courses.where((c) => !c.isFree).toList(growable: false);
      }
      return courses.toList(growable: false);
    }

    var list = courses.where(isCourseVisibleOnIosCatalog);
    if (pricingType == "FREE") {
      list = list.where((c) => c.isFree);
    } else if (pricingType == "PAID") {
      list = list.where((c) => !c.isFree && c.isIosIapPurchasable);
    }
    return list.toList(growable: false);
  }

  /// My Courses: enrolled only; hide pending payment on mobile.
  static List<MyCourseItem> filterMyCourseItemsForPlatform(
    Iterable<MyCourseItem> items,
  ) {
    if (!isMobileReader) return items.toList(growable: false);
    return items.where((i) {
      if (!i.isEnrolled) return false;
      // iOS: paid courses must also be Apple-IAP mapped to appear/learn.
      if (isIOS && !i.course.isFree && !i.course.isIosIapPurchasable) {
        return false;
      }
      return true;
    }).toList(growable: false);
  }

  static List<SavedCourseItem> filterSavedCoursesForPlatform(
    Iterable<SavedCourseItem> items,
  ) {
    if (isAndroid) {
      return items.where((i) => i.isEnrolled).toList(growable: false);
    }
    if (!isIOS) return items.toList(growable: false);
    return items.where((i) {
      if (i.course.isFree) return true;
      return i.course.isIosIapPurchasable;
    }).toList(growable: false);
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
    if (isAndroid) return <String>{};
    return courseIds.toSet();
  }

  /// Maps bottom-nav UI index → shell branch index.
  /// iOS UI: Home / Courses / My Courses / Profile → branches 0, 2, 1, 3
  /// Android UI: Home / My Courses / Profile → branches 0, 1, 3
  static int shellBranchForNavIndex(int navIndex) {
    if (!isMobileReader) return navIndex;
    if (isIOS) {
      const map = [0, 2, 1, 3];
      if (navIndex < 0 || navIndex >= map.length) return 0;
      return map[navIndex];
    }
    // Android
    const map = [0, 1, 3];
    if (navIndex < 0 || navIndex >= map.length) return 0;
    return map[navIndex];
  }

  static int navIndexForShellBranch(int branchIndex) {
    if (!isMobileReader) return branchIndex;
    if (isIOS) {
      return switch (branchIndex) {
        0 => 0,
        2 => 1,
        1 => 2,
        3 => 3,
        _ => 0,
      };
    }
    return switch (branchIndex) {
      0 => 0,
      1 => 1,
      3 => 2,
      _ => 1,
    };
  }
}
