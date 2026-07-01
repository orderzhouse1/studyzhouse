import "package:flutter_test/flutter_test.dart";
import "package:studyzhouse_mobile/src/core/platform/platform_purchase_policy.dart";
import "package:studyzhouse_mobile/src/features/purchases/purchase_course_service.dart";

void main() {
  group("PlatformPurchasePolicy", () {
    test("iapEnabled is false until StoreKit ships", () {
      expect(PlatformPurchasePolicy.iapEnabled, isFalse);
    });

    test("paid course ios label is purchase-neutral", () {
      expect(
        PlatformPurchasePolicy.paidCourseIosUnavailableLabel,
        "هذا الكورس غير متاح داخل iOS حاليًا",
      );
    });
  });

  group("PurchaseCourseService on non-iOS test host", () {
    const service = PurchaseCourseService();

    test("external payment available when not on gated iOS", () {
      if (PlatformPurchasePolicy.isIOS) {
        expect(service.canUseExternalPayment, isFalse);
      } else {
        expect(service.canUseExternalPayment, isTrue);
      }
    });

    test("paid course label on Android-style host", () {
      if (!PlatformPurchasePolicy.isIOS) {
        expect(service.paidCourseActionLabel(), "طلب تفعيل عبر CliQ");
        expect(service.isPaidCourseActionEnabled, isTrue);
      }
    });

    test("paid course label on iOS host", () {
      if (PlatformPurchasePolicy.isIOS) {
        expect(
          service.paidCourseActionLabel(),
          PlatformPurchasePolicy.paidCourseIosUnavailableLabel,
        );
        expect(service.isPaidCourseActionEnabled, isFalse);
        expect(service.showPaidCoursePurchaseUnavailable, isTrue);
      }
    });

    test("store product id not mapped yet", () {
      expect(service.storeProductIdForCourse("course-1"), isNull);
    });
  });
}
