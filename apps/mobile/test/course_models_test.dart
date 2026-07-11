import "package:flutter_test/flutter_test.dart";
import "package:studyzhouse_mobile/src/core/network/pagination_meta.dart";
import "package:studyzhouse_mobile/src/features/courses/models/course.dart";
import "package:studyzhouse_mobile/src/features/courses/models/saved_course.dart";
import "package:studyzhouse_mobile/src/features/courses/models/student_dashboard.dart";

void main() {
    test("Course.fromJson parses IAP fields", () {
      final c = Course.fromJson({
        "id": "c1",
        "title": "IAP",
        "slug": "iap",
        "pricingType": "PAID",
        "currency": "JOD",
        "level": "BEGINNER",
        "appleProductId": "com.studyzhouse.app.course.test1",
        "iosPurchasable": true,
      });
      expect(c.isIosIapPurchasable, isTrue);
      expect(c.appleProductId, "com.studyzhouse.app.course.test1");
    });

    test("Course.fromJson parses list item", () {
    final c = Course.fromJson({
      "id": "c1",
      "title": "كورس",
      "slug": "kors",
      "pricingType": "FREE",
      "currency": "JOD",
      "level": "BEGINNER",
      "lessonCount": 5,
      "thumbnailUrl": "/api/v1/uploads/x.png",
      "category": {"id": "cat", "name": "برمجة", "slug": "code"},
    });
    expect(c.isFree, isTrue);
    expect(c.lessonCount, 5);
    expect(c.category?.name, "برمجة");
  });

  test("StudentDashboard.fromEnvelope", () {
    final d = StudentDashboard.fromEnvelope({
      "success": true,
      "data": {
        "enrolledCoursesCount": 2,
        "completedLessonsCount": 10,
        "inProgressCoursesCount": 1,
        "overallProgressPercent": 40,
        "continueLearning": {
          "courseTitle": "A",
          "courseSlug": "a",
          "lessonId": "l1",
          "lessonTitle": "L1",
        },
      },
    });
    expect(d.enrolledCoursesCount, 2);
    expect(d.continueLearning?.courseSlug, "a");
  });

  test("SavedCourseIdsResponse.fromEnvelope", () {
    final r = SavedCourseIdsResponse.fromEnvelope({
      "success": true,
      "data": {
        "courseIds": ["id1", "id2"],
      },
    });
    expect(r.courseIds, {"id1", "id2"});
  });

  test("PaginationMeta.hasMore", () {
    const meta = PaginationMeta(
      page: 1,
      pageSize: 10,
      total: 25,
      totalPages: 3,
    );
    expect(meta.hasMore, isTrue);
  });
}
