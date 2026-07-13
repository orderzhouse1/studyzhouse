import "../../core/platform/platform_purchase_policy.dart";
import "../courses/models/course.dart";

/// Purchase abstraction — disabled on mobile Reader builds.
///
/// Web marketplace payments remain outside this Flutter app.
class PurchaseCourseService {
  const PurchaseCourseService();

  bool get canUseExternalPayment =>
      PlatformPurchasePolicy.showExternalPaymentFlows;

  bool get canPurchaseInApp => false;

  bool get showPaidCoursePurchaseUnavailable =>
      PlatformPurchasePolicy.isMobile &&
      PlatformPurchasePolicy.mobileExternalPaymentsDisabled;

  String paidCourseActionLabel({Course? course}) {
    if (showPaidCoursePurchaseUnavailable) {
      return PlatformPurchasePolicy.paidCourseUnavailableLabel;
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
      return;
    }
    throw StateError("Paid course purchase is not available on this platform.");
  }
}
