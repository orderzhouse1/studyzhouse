import "package:dio/dio.dart";
import "package:flutter_riverpod/flutter_riverpod.dart";

import "../../../core/network/api_client.dart";
import "../../../core/network/api_envelope.dart";
import "../../../core/network/pagination_meta.dart";
import "../../../core/platform/ios_course_policy.dart";
import "../../../core/utils/api_error_message.dart";
import "../models/category.dart";
import "../models/course.dart";

class CourseRepository {
  CourseRepository(this._client);

  final ApiClient _client;

  Future<PaginatedResult<Course>> listCourses({
    int page = 1,
    int pageSize = 12,
    String? categorySlug,
    String? search,
    String? pricingType,
    String? sort,
  }) async {
    try {
      final effectivePricingType = IosCoursePolicy.isIOSPlatform
          ? "FREE"
          : pricingType;
      final response = await _client.get<Map<String, dynamic>>(
        "/courses",
        queryParameters: {
          "page": page,
          "pageSize": pageSize,
          if (categorySlug != null && categorySlug.isNotEmpty)
            "categorySlug": categorySlug,
          if (search != null && search.trim().isNotEmpty)
            "search": search.trim(),
          "pricingType": ?effectivePricingType,
          "sort": ?sort,
        },
      );
      final body = response.data ?? {};
      final data = requireSuccessData(body);
      final items = (data["items"] as List<dynamic>? ?? [])
          .whereType<Map<String, dynamic>>()
          .map(Course.fromJson)
          .toList();
      return PaginatedResult(
        items: IosCoursePolicy.filterCoursesForPlatform(items),
        meta: PaginationMeta.fromJson(body["meta"] as Map<String, dynamic>?),
      );
    } on DioException catch (e) {
      throw apiExceptionFromDio(e);
    }
  }

  Future<List<Category>> listCategories({int pageSize = 50}) async {
    try {
      final response = await _client.get<Map<String, dynamic>>(
        "/categories",
        queryParameters: {"page": 1, "pageSize": pageSize},
      );
      final data = requireSuccessData(response.data ?? {});
      final items = (data["items"] as List<dynamic>? ?? [])
          .whereType<Map<String, dynamic>>()
          .map(Category.fromJson)
          .toList();
      return items;
    } on DioException catch (e) {
      throw apiExceptionFromDio(e);
    }
  }

  Future<Course> getCourseBySlug(String slug) async {
    try {
      final response = await _client.get<Map<String, dynamic>>(
        "/courses/$slug",
      );
      final data = requireSuccessData(response.data ?? {});
      final course = data["course"];
      if (course is! Map<String, dynamic>) {
        throw const FormatException("Missing course in response.");
      }
      return Course.fromJson(course);
    } on DioException catch (e) {
      throw apiExceptionFromDio(e);
    }
  }
}

final courseRepositoryProvider = Provider<CourseRepository>((ref) {
  return CourseRepository(ref.watch(apiClientProvider));
});
