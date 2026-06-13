import "package:dio/dio.dart";
import "package:flutter_riverpod/flutter_riverpod.dart";

import "../../../core/network/api_client.dart";
import "../../../core/network/api_envelope.dart";
import "../../../core/utils/api_error_message.dart";
import "../models/learn_course.dart";

class CourseAccessInfo {
  const CourseAccessInfo({
    required this.courseId,
    required this.isEnrolled,
    required this.progressPercent,
  });

  final String courseId;
  final bool isEnrolled;
  final int progressPercent;

  factory CourseAccessInfo.fromEnvelope(Map<String, dynamic> json) {
    if (json["success"] != true) {
      throw const FormatException("Access response not successful.");
    }
    final data = json["data"] as Map<String, dynamic>? ?? {};
    return CourseAccessInfo(
      courseId: data["courseId"] as String,
      isEnrolled: data["isEnrolled"] as bool? ?? false,
      progressPercent: (data["progressPercent"] as num?)?.toInt() ?? 0,
    );
  }
}

class LessonCompleteResult {
  const LessonCompleteResult({
    required this.lessonProgress,
    required this.enrollmentProgressPercent,
  });

  final LessonProgress lessonProgress;
  final int enrollmentProgressPercent;

  factory LessonCompleteResult.fromEnvelope(Map<String, dynamic> json) {
    final data = requireSuccessData(json);
    final lp = data["lessonProgress"] as Map<String, dynamic>;
    final enrollment = data["enrollment"] as Map<String, dynamic>? ?? {};
    return LessonCompleteResult(
      lessonProgress: LessonProgress.fromJson(lp),
      enrollmentProgressPercent:
          (enrollment["progressPercent"] as num?)?.toInt() ?? 0,
    );
  }
}

class LearningRepository {
  LearningRepository(this._client);

  final ApiClient _client;

  Future<LearnCourseResponse> getLearnCourse(
    String slug, {
    String? lessonId,
  }) async {
    try {
      final response = await _client.get<Map<String, dynamic>>(
        "/student/courses/$slug/learn",
        queryParameters: lessonId != null ? {"lessonId": lessonId} : null,
      );
      return LearnCourseResponse.fromEnvelope(response.data ?? {});
    } on DioException catch (e) {
      throw apiExceptionFromDio(e);
    }
  }

  Future<CourseAccessInfo> getCourseAccess(String slug) async {
    try {
      final response = await _client.get<Map<String, dynamic>>(
        "/student/courses/$slug/access",
      );
      return CourseAccessInfo.fromEnvelope(response.data ?? {});
    } on DioException catch (e) {
      throw apiExceptionFromDio(e);
    }
  }

  Future<LessonCompleteResult> markLessonComplete(String lessonId) async {
    try {
      final response = await _client.post<Map<String, dynamic>>(
        "/student/lessons/$lessonId/complete",
        data: <String, dynamic>{},
      );
      return LessonCompleteResult.fromEnvelope(response.data ?? {});
    } on DioException catch (e) {
      throw apiExceptionFromDio(e);
    }
  }

  Future<LessonCompleteResult> updateLessonProgress(
    String lessonId, {
    int? watchedSeconds,
  }) async {
    try {
      final response = await _client.post<Map<String, dynamic>>(
        "/student/lessons/$lessonId/progress",
        data: watchedSeconds != null
            ? {"watchedSeconds": watchedSeconds}
            : <String, dynamic>{},
      );
      return LessonCompleteResult.fromEnvelope(response.data ?? {});
    } on DioException catch (e) {
      throw apiExceptionFromDio(e);
    }
  }
}

final learningRepositoryProvider = Provider<LearningRepository>((ref) {
  return LearningRepository(ref.watch(apiClientProvider));
});
