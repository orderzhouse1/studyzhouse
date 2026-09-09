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
  appleProductId: "studyzhouse_course_mswdh_kwrs_17",
  iosPurchasable: true,
);

void main() {
  test("Android reader hides catalog and prices", () {
    if (!IosCoursePolicy.isAndroid) return;
    expect(IosCoursePolicy.showExploreCatalog, isFalse);
    expect(IosCoursePolicy.showPricesOnPlatform, isFalse);
    expect(IosCoursePolicy.showPurchaseOrPaymentUi, isFalse);
    expect(IosCoursePolicy.postLoginLocation, "/my-courses");
    expect(
      IosCoursePolicy.filterCoursesForCatalog([_freeCourse, _paidCourse]),
      isEmpty,
    );
    expect(PlatformPurchasePolicy.showExternalPaymentFlows, isFalse);
  });

  test("iOS marketplace shows explore catalog", () {
    if (!IosCoursePolicy.isIOS) return;
    expect(IosCoursePolicy.showExploreCatalog, isTrue);
    expect(IosCoursePolicy.showAppleIapPurchaseUi, isTrue);
    expect(
      IosCoursePolicy.filterCoursesForCatalog([_freeCourse, _paidCourse]),
      isNotEmpty,
    );
  });

  test("nav mapping for Android reader", () {
    if (!IosCoursePolicy.isAndroid) return;
    expect(IosCoursePolicy.shellBranchForNavIndex(0), 0);
    expect(IosCoursePolicy.shellBranchForNavIndex(1), 1);
    expect(IosCoursePolicy.shellBranchForNavIndex(2), 3);
    expect(IosCoursePolicy.navIndexForShellBranch(3), 2);
  });

  test("My Courses keeps enrolled; drops pending", () {
    final items = [
      MyCourseItem(
        kind: "enrolled",
        progressPercent: 0,
        completedLessons: 0,
        totalLessons: 1,
        course: _paidCourse,
      ),
      MyCourseItem(
        kind: "enrolled",
        progressPercent: 0,
        completedLessons: 0,
        totalLessons: 1,
        course: _freeCourse,
      ),
      MyCourseItem(
        kind: "pending_payment",
        paymentRequestId: "pr-1",
        progressPercent: 0,
        completedLessons: 0,
        totalLessons: 1,
        course: _paidCourse,
      ),
    ];
    final filtered = IosCoursePolicy.filterMyCourseItemsForPlatform(items);
    if (IosCoursePolicy.isMobileReader) {
      expect(filtered.length, 2);
      expect(filtered.every((i) => i.isEnrolled), isTrue);
    } else {
      expect(filtered.length, 3);
    }
  });

  test("empty My Courses copy has no CliQ CTA", () {
    expect(IosCoursePolicy.emptyMyCoursesTitle, "لا توجد كورسات في حسابك حاليًا.");
    expect(IosCoursePolicy.emptyMyCoursesDescription.contains("CliQ"), isFalse);
  });

  test("PurchaseCourseService: no external CliQ on mobile", () {
    const service = PurchaseCourseService();
    if (!PlatformPurchasePolicy.isMobile) return;
    expect(service.canUseExternalPayment, isFalse);
    expect(service.paidCourseActionLabel(course: _paidCourse).contains("CliQ"), isFalse);
  });
}
