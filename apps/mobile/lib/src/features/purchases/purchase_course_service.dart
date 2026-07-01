import "../../core/platform/platform_purchase_policy.dart";

/// Abstraction for unlocking paid courses per platform.
///
/// Android/web: external CliQ payment requests and activation codes.
/// iOS (future): Apple In-App Purchase via StoreKit product IDs.
class PurchaseCourseService {
  const PurchaseCourseService();

  bool get canUseExternalPayment => PlatformPurchasePolicy.showExternalPaymentFlows;

  bool get canPurchaseInApp =>
      PlatformPurchasePolicy.isIOS && PlatformPurchasePolicy.iapEnabled;

  bool get showPaidCoursePurchaseUnavailable =>
      PlatformPurchasePolicy.isIOS &&
      PlatformPurchasePolicy.iosExternalPaymentsDisabled &&
      !PlatformPurchasePolicy.iapEnabled;

  /// Primary CTA label on course detail when the course is paid and not enrolled.
  String paidCourseActionLabel() {
    if (canPurchaseInApp) {
      return "شراء الكورس";
    }
    if (showPaidCoursePurchaseUnavailable) {
      return PlatformPurchasePolicy.paidCourseIosUnavailableLabel;
    }
    return "طلب تفعيل عبر CliQ";
  }

  bool get isPaidCourseActionEnabled => canUseExternalPayment || canPurchaseInApp;

  /// StoreKit product identifier for [courseId], once configured server-side.
  String? storeProductIdForCourse(String courseId) {
    // TODO(iap): Map course IDs to App Store product IDs from API or local config.
    return null;
  }

  /// Initiates purchase for a paid course.
  Future<void> purchaseCourse({
    required String courseId,
    String? storeProductId,
  }) async {
    if (canPurchaseInApp) {
      // TODO(iap): Integrate in_app_purchase / StoreKit:
      // 1. Load products via storeProductIdForCourse(courseId)
      // 2. Present payment sheet
      // 3. Verify receipt server-side and refresh enrollment
      throw UnimplementedError("Apple In-App Purchase is not implemented yet.");
    }
    if (canUseExternalPayment) {
      // Navigation to /purchases is handled by the UI layer on Android.
      return;
    }
    throw StateError("Paid course purchase is not available on this platform.");
  }
}
