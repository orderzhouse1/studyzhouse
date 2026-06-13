import "course.dart";

class MyCourseItem {
  const MyCourseItem({
    required this.kind,
    this.enrollmentId,
    this.paymentRequestId,
    required this.progressPercent,
    required this.completedLessons,
    required this.totalLessons,
    this.lastAccessedLesson,
    required this.course,
  });

  final String kind;
  final String? enrollmentId;
  final String? paymentRequestId;
  final int progressPercent;
  final int completedLessons;
  final int totalLessons;
  final LastAccessedLesson? lastAccessedLesson;
  final Course course;

  bool get isEnrolled => kind == "enrolled";
  bool get isPendingPayment => kind == "pending_payment";

  factory MyCourseItem.fromJson(Map<String, dynamic> json) {
    final last = json["lastAccessedLesson"];
    return MyCourseItem(
      kind: json["kind"] as String? ?? "enrolled",
      enrollmentId: json["enrollmentId"] as String?,
      paymentRequestId: json["paymentRequestId"] as String?,
      progressPercent: (json["progressPercent"] as num?)?.toInt() ?? 0,
      completedLessons: (json["completedLessons"] as num?)?.toInt() ?? 0,
      totalLessons: (json["totalLessons"] as num?)?.toInt() ?? 0,
      lastAccessedLesson: last is Map<String, dynamic>
          ? LastAccessedLesson.fromJson(last)
          : null,
      course: Course.fromJson(json["course"] as Map<String, dynamic>),
    );
  }
}

class LastAccessedLesson {
  const LastAccessedLesson({required this.id, required this.title});

  final String id;
  final String title;

  factory LastAccessedLesson.fromJson(Map<String, dynamic> json) {
    return LastAccessedLesson(
      id: json["id"] as String,
      title: json["title"] as String,
    );
  }
}

class MyCoursesResponse {
  const MyCoursesResponse({required this.items});

  final List<MyCourseItem> items;

  int get pendingPaymentsCount => items.where((i) => i.isPendingPayment).length;

  factory MyCoursesResponse.fromEnvelope(Map<String, dynamic> json) {
    if (json["success"] != true) {
      throw const FormatException("My courses response not successful.");
    }
    final data = json["data"] as Map<String, dynamic>? ?? {};
    final list = data["items"] as List<dynamic>? ?? [];
    return MyCoursesResponse(
      items: list
          .whereType<Map<String, dynamic>>()
          .map(MyCourseItem.fromJson)
          .toList(),
    );
  }
}
