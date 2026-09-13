import "../../core/platform/platform_purchase_policy.dart";
import "../courses/models/course.dart";

/// Purchase abstraction for the Flutter student app.
///
/// iOS uses Apple IAP via [AppleIapService]. External CliQ/redeem stay off
/// on mobile. Web marketplace payments remain outside this app.
class PurchaseCourseService {
  const PurchaseCourseService();

  bool get canUseExternalPayment =>
      PlatformPurchasePolicy.showExternalPaymentFlows;

  bool get canPurchaseInApp => PlatformPurchasePolicy.iapEnabled;

  bool get showPaidCoursePurchaseUnavailable =>
      PlatformPurchasePolicy.isAndroid &&
      PlatformPurchasePolicy.mobileExternalPaymentsDisabled;

  String paidCourseActionLabel({Course? course}) {
    if (canPurchaseInApp && course != null && course.isIosIapPurchasable) {
      return PlatformPurchasePolicy.applePurchaseButtonLabel;
    }
    if (showPaidCoursePurchaseUnavailable) {
      return PlatformPurchasePolicy.paidCourseUnavailableLabel;
    }
    return "طلب تفعيل عبر CliQ";
  }

  bool isPaidCourseActionEnabled(Course course) {
    if (canPurchaseInApp) return course.isIosIapPurchasable;
    if (canUseExternalPayment) return true;
    return false;
  }

  String? storeProductIdForCourse(Course course) {
    if (!canPurchaseInApp) return null;
    if (!course.isIosIapPurchasable) return null;
    return course.appleProductId;
  }

  Future<void> purchaseCourse({
    required Course course,
  }) async {
    if (canPurchaseInApp) {
      throw StateError(
        "Use AppleIapService.buyCourse for iOS In-App Purchase.",
      );
    }
    if (canUseExternalPayment) {
      return;
    }
    throw StateError("Paid course purchase is not available on this platform.");
  }
}
