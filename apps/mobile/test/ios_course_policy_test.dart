import "package:flutter_test/flutter_test.dart";
import "package:studyzhouse_mobile/src/core/platform/ios_course_policy.dart";
import "package:studyzhouse_mobile/src/features/courses/models/course.dart";
import "package:studyzhouse_mobile/src/features/courses/models/my_course_item.dart";

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
);

void main() {
  test("isPaidCourse detects paid pricing", () {
    expect(IosCoursePolicy.isPaidCourse(_paidCourse), isTrue);
    expect(IosCoursePolicy.isPaidCourse(_freeCourse), isFalse);
  });

  test("catalog is empty on iOS host (no marketplace)", () {
    final input = [_freeCourse, _paidCourse];
    final filtered = IosCoursePolicy.filterCoursesForCatalog(input);
    if (IosCoursePolicy.isIOSPlatform) {
      expect(filtered, isEmpty);
      expect(IosCoursePolicy.showExploreCatalog, isFalse);
      expect(IosCoursePolicy.postLoginLocation, "/my-courses");
    } else {
      expect(filtered, input);
      expect(IosCoursePolicy.showExploreCatalog, isTrue);
      expect(IosCoursePolicy.postLoginLocation, "/home");
    }
  });

  test("filterMyCourseItemsForPlatform keeps enrolled paid on iOS host", () {
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
    if (IosCoursePolicy.isIOSPlatform) {
      expect(filtered.length, 2);
      expect(filtered.every((i) => i.isEnrolled), isTrue);
    } else {
      expect(filtered.length, 3);
    }
  });

  test("non-enrolled paid course detail is blocked on iOS host", () {
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
      expect(
        IosCoursePolicy.isCourseDetailAllowedOnIOS(
          course: _freeCourse,
          isEnrolled: false,
        ),
        isFalse,
      );
    }
  });

  test("prices and purchase UI hidden on iOS host", () {
    if (IosCoursePolicy.isIOSPlatform) {
      expect(IosCoursePolicy.showPricesOnPlatform, isFalse);
      expect(IosCoursePolicy.showPurchaseOrPaymentUi, isFalse);
    } else {
      expect(IosCoursePolicy.showPricesOnPlatform, isTrue);
      expect(IosCoursePolicy.showPurchaseOrPaymentUi, isTrue);
    }
  });

  test("empty My Courses copy has no purchase CTA", () {
    expect(IosCoursePolicy.emptyMyCoursesTitle, "لا توجد كورسات في حسابك حاليًا.");
    expect(IosCoursePolicy.emptyMyCoursesTitle.contains("شراء"), isFalse);
    expect(IosCoursePolicy.emptyMyCoursesDescription.contains("شراء"), isFalse);
    expect(IosCoursePolicy.emptyMyCoursesDescription.contains("اشتر"), isFalse);
  });

  test("iOS nav index skips Explore/Courses branch", () {
    if (!IosCoursePolicy.isIOSPlatform) return;
    expect(IosCoursePolicy.shellBranchForNavIndex(0), 0);
    expect(IosCoursePolicy.shellBranchForNavIndex(1), 1);
    expect(IosCoursePolicy.shellBranchForNavIndex(2), 3);
    expect(IosCoursePolicy.navIndexForShellBranch(3), 2);
    expect(IosCoursePolicy.navIndexForShellBranch(2), 1);
  });
}
