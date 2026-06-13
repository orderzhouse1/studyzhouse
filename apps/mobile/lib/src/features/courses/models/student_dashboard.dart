class ContinueLearning {
  const ContinueLearning({
    required this.courseTitle,
    required this.courseSlug,
    this.courseCoverUrl,
    required this.lessonId,
    required this.lessonTitle,
  });

  final String courseTitle;
  final String courseSlug;
  final String? courseCoverUrl;
  final String lessonId;
  final String lessonTitle;

  factory ContinueLearning.fromJson(Map<String, dynamic> json) {
    return ContinueLearning(
      courseTitle: json["courseTitle"] as String,
      courseSlug: json["courseSlug"] as String,
      courseCoverUrl: json["courseCoverUrl"] as String?,
      lessonId: json["lessonId"] as String,
      lessonTitle: json["lessonTitle"] as String,
    );
  }
}

class StudentDashboard {
  const StudentDashboard({
    required this.enrolledCoursesCount,
    required this.completedLessonsCount,
    required this.inProgressCoursesCount,
    required this.overallProgressPercent,
    this.continueLearning,
  });

  final int enrolledCoursesCount;
  final int completedLessonsCount;
  final int inProgressCoursesCount;
  final int overallProgressPercent;
  final ContinueLearning? continueLearning;

  factory StudentDashboard.fromEnvelope(Map<String, dynamic> json) {
    if (json["success"] != true) {
      throw const FormatException("Dashboard response not successful.");
    }
    final data = json["data"] as Map<String, dynamic>? ?? {};
    final cont = data["continueLearning"];
    return StudentDashboard(
      enrolledCoursesCount:
          (data["enrolledCoursesCount"] as num?)?.toInt() ?? 0,
      completedLessonsCount:
          (data["completedLessonsCount"] as num?)?.toInt() ?? 0,
      inProgressCoursesCount:
          (data["inProgressCoursesCount"] as num?)?.toInt() ?? 0,
      overallProgressPercent:
          (data["overallProgressPercent"] as num?)?.toInt() ?? 0,
      continueLearning: cont is Map<String, dynamic>
          ? ContinueLearning.fromJson(cont)
          : null,
    );
  }
}
