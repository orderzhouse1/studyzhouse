import "../../core/platform/platform_purchase_policy.dart";
import "../courses/models/course.dart";

/// Abstraction for unlocking paid courses per platform.
///
/// Android/web: external CliQ payment requests and activation codes.
/// iOS: no purchase — learning companion for enrolled / free courses only.
class PurchaseCourseService {
  const PurchaseCourseService();

  bool get canUseExternalPayment => PlatformPurchasePolicy.showExternalPaymentFlows;

  bool get canPurchaseInApp => false;

  bool get showPaidCoursePurchaseUnavailable =>
      PlatformPurchasePolicy.isIOS &&
      PlatformPurchasePolicy.iosExternalPaymentsDisabled;

  String paidCourseActionLabel({Course? course}) {
    if (showPaidCoursePurchaseUnavailable) {
      return PlatformPurchasePolicy.paidCourseIosUnavailableLabel;
    }
    return "طلب تفعيل عبر CliQ";
  }

  bool isPaidCourseActionEnabled(Course course) {
    if (canUseExternalPayment) return true;
    return false;
  }

  String? storeProductIdForCourse(Course course) => null;

  Future<void> purchaseCourse({
    required Course course,
  }) async {
    if (canUseExternalPayment) {
      // Navigation to /purchases is handled by the UI layer on Android.
      return;
    }
    throw StateError("Paid course purchase is not available on this platform.");
  }
}
