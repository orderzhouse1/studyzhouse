import "package:flutter_test/flutter_test.dart";
import "package:studyzhouse_mobile/src/core/platform/ios_course_policy.dart";
import "package:studyzhouse_mobile/src/core/platform/platform_purchase_policy.dart";
import "package:studyzhouse_mobile/src/features/courses/models/course.dart";
import "package:studyzhouse_mobile/src/features/courses/models/my_course_item.dart";
import "package:studyzhouse_mobile/src/features/purchases/purchase_course_service.dart";

const _freeCourse = Course(
  id: "c-free",
  title: "مجاني",
  slug: "free-course",
  pricingType: "FREE",
  currency: "JOD",
  level: "BEGINNER",
);

const _paidCourse = Course(
  id: "c-paid",
  title: "مدفوع",
  slug: "paid-course",
  pricingType: "PAID",
  priceAmount: "10",
  currency: "JOD",
  level: "BEGINNER",
  appleProductId: "com.studyzhouse.app.course.test1",
  iosPurchasable: true,
);

void main() {
  group("strict reader mode (no IAP)", () {
    test("catalog empty on mobile — no marketplace", () {
      expect(IosCoursePolicy.isCourseVisibleOnIosCatalog(_freeCourse), isFalse);
      expect(IosCoursePolicy.isCourseVisibleOnIosCatalog(_paidCourse), isFalse);
      if (!IosCoursePolicy.isMobileReader) return;
      expect(
        IosCoursePolicy.filterCoursesForCatalog([_freeCourse, _paidCourse]),
        isEmpty,
      );
    });

    test("enrolled paid allowed; non-enrolled blocked", () {
      expect(
        IosCoursePolicy.isCourseDetailAllowedOnIOS(
          course: _paidCourse,
          isEnrolled: true,
        ),
        isTrue,
      );
      if (!IosCoursePolicy.isMobileReader) return;
      expect(
        IosCoursePolicy.isCourseDetailAllowedOnIOS(
          course: _paidCourse,
          isEnrolled: false,
        ),
        isFalse,
      );
    });

    test("my courses keeps enrolled paid, drops pending", () {
      final items = [
        MyCourseItem(
          kind: "enrolled",
          progressPercent: 10,
          completedLessons: 1,
          totalLessons: 5,
          course: _paidCourse,
        ),
        MyCourseItem(
          kind: "pending_payment",
          paymentRequestId: "pr-1",
          progressPercent: 0,
          completedLessons: 0,
          totalLessons: 5,
          course: _paidCourse,
        ),
      ];
      final filtered = IosCoursePolicy.filterMyCourseItemsForPlatform(items);
      if (!IosCoursePolicy.isMobileReader) return;
      expect(filtered.length, 1);
      expect(filtered.first.isEnrolled, isTrue);
    });

    test("prices and IAP hidden on mobile", () {
      expect(PlatformPurchasePolicy.iapEnabled, isFalse);
      if (!IosCoursePolicy.isMobileReader) return;
      expect(IosCoursePolicy.showPricesOnPlatform, isFalse);
      expect(IosCoursePolicy.showPurchaseOrPaymentUi, isFalse);
    });
  });

  group("PurchaseCourseService", () {
    const service = PurchaseCourseService();

    test("no IAP or CliQ on mobile", () {
      expect(PlatformPurchasePolicy.iapEnabled, isFalse);
      expect(service.canPurchaseInApp, isFalse);
      if (!PlatformPurchasePolicy.isMobile) return;
      expect(service.canUseExternalPayment, isFalse);
      expect(service.isPaidCourseActionEnabled(_paidCourse), isFalse);
      expect(service.storeProductIdForCourse(_paidCourse), isNull);
    });
  });
}
