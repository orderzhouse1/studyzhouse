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

const _paidIapCourse = Course(
  id: "c-paid",
  title: "مدفوع",
  slug: "paid-course",
  pricingType: "PAID",
  priceAmount: "10",
  currency: "JOD",
  level: "BEGINNER",
  appleProductId: "studyzhouse_course_mswdh_kwrs_17",
  iosPurchasable: true,
);

const _paidUnmapped = Course(
  id: "c-paid-unmapped",
  title: "مدفوع بدون IAP",
  slug: "paid-unmapped",
  pricingType: "PAID",
  priceAmount: "10",
  currency: "JOD",
  level: "BEGINNER",
  iosPurchasable: false,
);

void main() {
  group("iOS Apple IAP marketplace policy", () {
    test("IAP-mapped paid courses are purchasable", () {
      expect(_paidIapCourse.isIosIapPurchasable, isTrue);
      expect(_paidUnmapped.isIosIapPurchasable, isFalse);
    });

    test("catalog visibility helpers", () {
      if (!IosCoursePolicy.isIOS) return;
      expect(IosCoursePolicy.isCourseVisibleOnIosCatalog(_freeCourse), isTrue);
      expect(
        IosCoursePolicy.isCourseVisibleOnIosCatalog(_paidIapCourse),
        isTrue,
      );
      expect(
        IosCoursePolicy.isCourseVisibleOnIosCatalog(_paidUnmapped),
        isFalse,
      );
    });

    test("detail allows IAP paid without enrollment on iOS", () {
      if (!IosCoursePolicy.isIOS) return;
      expect(
        IosCoursePolicy.isCourseDetailAllowedOnIOS(
          course: _paidIapCourse,
          isEnrolled: false,
        ),
        isTrue,
      );
      expect(
        IosCoursePolicy.isCourseDetailAllowedOnIOS(
          course: _paidUnmapped,
          isEnrolled: true,
        ),
        isFalse,
      );
    });

    test("my courses drops unmapped paid", () {
      final items = [
        MyCourseItem(
          kind: "enrolled",
          progressPercent: 10,
          completedLessons: 1,
          totalLessons: 5,
          course: _paidIapCourse,
        ),
        MyCourseItem(
          kind: "enrolled",
          progressPercent: 0,
          completedLessons: 0,
          totalLessons: 5,
          course: _paidUnmapped,
        ),
        MyCourseItem(
          kind: "pending_payment",
          paymentRequestId: "pr-1",
          progressPercent: 0,
          completedLessons: 0,
          totalLessons: 5,
          course: _paidIapCourse,
        ),
      ];
      final filtered = IosCoursePolicy.filterMyCourseItemsForPlatform(items);
      if (!IosCoursePolicy.isMobileReader) return;
      expect(filtered.every((i) => i.isEnrolled), isTrue);
      if (IosCoursePolicy.isIOS) {
        expect(
          filtered.every(
            (i) => i.course.isFree || i.course.isIosIapPurchasable,
          ),
          isTrue,
        );
      }
    });
  });

  group("PlatformPurchasePolicy", () {
    test("external payments stay disabled on mobile", () {
      if (!PlatformPurchasePolicy.isMobile) return;
      expect(PlatformPurchasePolicy.showExternalPaymentFlows, isFalse);
    });

    test("IAP enabled only on iOS", () {
      expect(
        PlatformPurchasePolicy.iapEnabled,
        PlatformPurchasePolicy.isIOS,
      );
    });
  });

  group("PurchaseCourseService", () {
    const service = PurchaseCourseService();

    test("store product id for IAP courses", () {
      if (!PlatformPurchasePolicy.isIOS) return;
      expect(service.canPurchaseInApp, isTrue);
      expect(
        service.storeProductIdForCourse(_paidIapCourse),
        "studyzhouse_course_mswdh_kwrs_17",
      );
      expect(service.storeProductIdForCourse(_paidUnmapped), isNull);
      expect(service.canUseExternalPayment, isFalse);
    });
  });
}
