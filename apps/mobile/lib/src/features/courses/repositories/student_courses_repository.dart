import "package:dio/dio.dart";
import "package:flutter_riverpod/flutter_riverpod.dart";

import "../../../core/network/api_client.dart";
import "../../../core/utils/api_error_message.dart";
import "../models/my_course_item.dart";
import "../models/saved_course.dart";
import "../models/student_dashboard.dart";

class StudentCoursesRepository {
  StudentCoursesRepository(this._client);

  final ApiClient _client;

  Future<StudentDashboard> getDashboard() async {
    try {
      final response = await _client.get<Map<String, dynamic>>(
        "/student/dashboard",
      );
      return StudentDashboard.fromEnvelope(response.data ?? {});
    } on DioException catch (e) {
      throw apiExceptionFromDio(e);
    }
  }

  Future<MyCoursesResponse> getMyCourses() async {
    try {
      final response = await _client.get<Map<String, dynamic>>(
        "/student/my-courses",
      );
      return MyCoursesResponse.fromEnvelope(response.data ?? {});
    } on DioException catch (e) {
      throw apiExceptionFromDio(e);
    }
  }

  Future<SavedCoursesResponse> getSavedCourses() async {
    try {
      final response = await _client.get<Map<String, dynamic>>(
        "/student/saved-courses",
      );
      return SavedCoursesResponse.fromEnvelope(response.data ?? {});
    } on DioException catch (e) {
      throw apiExceptionFromDio(e);
    }
  }

  Future<Set<String>> getSavedCourseIds() async {
    try {
      final response = await _client.get<Map<String, dynamic>>(
        "/student/saved-courses/ids",
      );
      return SavedCourseIdsResponse.fromEnvelope(response.data ?? {}).courseIds;
    } on DioException catch (e) {
      throw apiExceptionFromDio(e);
    }
  }

  Future<void> saveCourse(String courseId) async {
    try {
      await _client.post<Map<String, dynamic>>(
        "/student/courses/$courseId/save",
      );
    } on DioException catch (e) {
      throw apiExceptionFromDio(e);
    }
  }

  Future<void> unsaveCourse(String courseId) async {
    try {
      await _client.delete<Map<String, dynamic>>(
        "/student/courses/$courseId/save",
      );
    } on DioException catch (e) {
      throw apiExceptionFromDio(e);
    }
  }
}

final studentCoursesRepositoryProvider = Provider<StudentCoursesRepository>((
  ref,
) {
  return StudentCoursesRepository(ref.watch(apiClientProvider));
});
