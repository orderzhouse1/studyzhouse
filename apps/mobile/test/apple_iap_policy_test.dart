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
  group("IosCoursePolicy learning companion", () {
    test("catalog shows free only", () {
      expect(IosCoursePolicy.isCourseVisibleOnIosCatalog(_freeCourse), isTrue);
      expect(IosCoursePolicy.isCourseVisibleOnIosCatalog(_paidCourse), isFalse);
    });

    test("effectiveListPricingType forces FREE on iOS host", () {
      if (IosCoursePolicy.isIOSPlatform) {
        expect(IosCoursePolicy.effectiveListPricingType(null), "FREE");
        expect(IosCoursePolicy.effectiveListPricingType("PAID"), "FREE");
      } else {
        expect(IosCoursePolicy.effectiveListPricingType(null), isNull);
        expect(IosCoursePolicy.effectiveListPricingType("PAID"), "PAID");
      }
    });

    test("filterCoursesForCatalog keeps free only on iOS host", () {
      final filtered = IosCoursePolicy.filterCoursesForCatalog([
        _freeCourse,
        _paidCourse,
      ]);
      if (IosCoursePolicy.isIOSPlatform) {
        expect(filtered, [_freeCourse]);
      } else {
        expect(filtered, [_freeCourse, _paidCourse]);
      }
    });

    test("enrolled paid course allowed on detail", () {
      expect(
        IosCoursePolicy.isCourseDetailAllowedOnIOS(
          course: _paidCourse,
          isEnrolled: true,
        ),
        isTrue,
      );
      if (IosCoursePolicy.isIOSPlatform) {
        expect(
          IosCoursePolicy.isCourseDetailAllowedOnIOS(
            course: _paidCourse,
            isEnrolled: false,
          ),
          isFalse,
        );
      }
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
      if (IosCoursePolicy.isIOSPlatform) {
        expect(filtered.length, 1);
        expect(filtered.first.isEnrolled, isTrue);
      } else {
        expect(filtered.length, 2);
      }
    });

    test("prices hidden on iOS host", () {
      if (IosCoursePolicy.isIOSPlatform) {
        expect(IosCoursePolicy.showPricesOnPlatform, isFalse);
      } else {
        expect(IosCoursePolicy.showPricesOnPlatform, isTrue);
      }
    });
  });

  group("PurchaseCourseService", () {
    const service = PurchaseCourseService();

    test("iapEnabled is false", () {
      expect(PlatformPurchasePolicy.iapEnabled, isFalse);
      expect(service.canPurchaseInApp, isFalse);
    });

    test("Android behavior unchanged", () {
      if (!PlatformPurchasePolicy.isIOS) {
        expect(
          service.paidCourseActionLabel(course: _paidCourse),
          "طلب تفعيل عبر CliQ",
        );
        expect(service.canUseExternalPayment, isTrue);
        expect(service.isPaidCourseActionEnabled(_paidCourse), isTrue);
      }
    });

    test("iOS has no purchase action", () {
      if (PlatformPurchasePolicy.isIOS) {
        expect(service.canUseExternalPayment, isFalse);
        expect(service.isPaidCourseActionEnabled(_paidCourse), isFalse);
        expect(service.storeProductIdForCourse(_paidCourse), isNull);
      }
    });
  });
}
