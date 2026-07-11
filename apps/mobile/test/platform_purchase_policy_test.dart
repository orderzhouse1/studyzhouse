import "package:flutter_test/flutter_test.dart";
import "package:studyzhouse_mobile/src/core/platform/platform_purchase_policy.dart";
import "package:studyzhouse_mobile/src/features/courses/models/course.dart";
import "package:studyzhouse_mobile/src/features/purchases/purchase_course_service.dart";

const _paidCourse = Course(
  id: "c-paid",
  title: "مدفوع",
  slug: "paid-course",
  pricingType: "PAID",
  priceAmount: "10",
  currency: "JOD",
  level: "BEGINNER",
);

void main() {
  group("PlatformPurchasePolicy", () {
    test("iapEnabled is false", () {
      expect(PlatformPurchasePolicy.iapEnabled, isFalse);
    });
  });

  group("PurchaseCourseService", () {
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
        expect(
          service.paidCourseActionLabel(course: _paidCourse),
          "طلب تفعيل عبر CliQ",
        );
        expect(service.isPaidCourseActionEnabled(_paidCourse), isTrue);
      }
    });

    test("paid course unavailable on iOS host", () {
      if (PlatformPurchasePolicy.isIOS) {
        expect(
          service.paidCourseActionLabel(course: _paidCourse),
          PlatformPurchasePolicy.paidCourseIosUnavailableLabel,
        );
        expect(service.isPaidCourseActionEnabled(_paidCourse), isFalse);
        expect(service.canPurchaseInApp, isFalse);
      }
    });
  });
}
