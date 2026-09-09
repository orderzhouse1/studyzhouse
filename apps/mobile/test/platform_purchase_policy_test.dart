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
  appleProductId: "studyzhouse_course_test",
  iosPurchasable: true,
);

void main() {
  group("PlatformPurchasePolicy", () {
    test("iapEnabled matches iOS only", () {
      expect(
        PlatformPurchasePolicy.iapEnabled,
        PlatformPurchasePolicy.isIOS,
      );
    });

    test("mobile disables external payment flows", () {
      if (!PlatformPurchasePolicy.isMobile) return;
      expect(PlatformPurchasePolicy.showExternalPaymentFlows, isFalse);
      expect(PlatformPurchasePolicy.mobileExternalPaymentsDisabled, isTrue);
    });
  });

  group("PurchaseCourseService", () {
    const service = PurchaseCourseService();

    test("no CliQ on mobile", () {
      if (!PlatformPurchasePolicy.isMobile) return;
      expect(service.canUseExternalPayment, isFalse);
      expect(service.paidCourseActionLabel(course: _paidCourse).contains("CliQ"), isFalse);
    });
  });
}
