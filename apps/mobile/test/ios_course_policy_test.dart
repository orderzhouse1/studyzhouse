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

  test("filterCoursesForPlatform keeps only free on iOS host", () {
    final input = [_freeCourse, _paidCourse];
    final filtered = IosCoursePolicy.filterCoursesForPlatform(input);
    if (IosCoursePolicy.isIOSPlatform) {
      expect(filtered, [_freeCourse]);
    } else {
      expect(filtered, input);
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
    ];
    final filtered = IosCoursePolicy.filterMyCourseItemsForPlatform(items);
    expect(filtered.length, 2);
  });
}
