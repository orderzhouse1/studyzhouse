import "package:dio/dio.dart";
import "package:flutter/foundation.dart" show debugPrint, kDebugMode;
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
      final effectivePricingType = IosCoursePolicy.effectiveListPricingType(
        pricingType,
      );
      final queryParameters = _buildCourseListQuery(
        page: page,
        pageSize: pageSize,
        categorySlug: categorySlug,
        search: search,
        pricingType: effectivePricingType,
        sort: sort,
      );

      if (kDebugMode) {
        debugPrint(
          "[CourseCatalog] GET /courses "
          "ios=${IosCoursePolicy.isIOSPlatform} "
          "params=$queryParameters",
        );
      }

      final response = await _client.get<Map<String, dynamic>>(
        "/courses",
        queryParameters: queryParameters,
      );
      final body = response.data ?? {};
      final data = requireSuccessData(body);
      final items = (data["items"] as List<dynamic>? ?? [])
          .whereType<Map<String, dynamic>>()
          .map(Course.fromJson)
          .toList();
      final filtered = IosCoursePolicy.filterCoursesForCatalog(
        items,
        pricingType: effectivePricingType,
      );

      if (kDebugMode) {
        debugPrint(
          "[CourseCatalog] api=${items.length} filtered=${filtered.length}",
        );
      }

      return PaginatedResult(
        items: filtered,
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

Map<String, dynamic> _buildCourseListQuery({
  required int page,
  required int pageSize,
  String? categorySlug,
  String? search,
  String? pricingType,
  String? sort,
}) {
  final params = <String, dynamic>{"page": page, "pageSize": pageSize};
  if (categorySlug != null && categorySlug.isNotEmpty) {
    params["categorySlug"] = categorySlug;
  }
  final trimmedSearch = search?.trim();
  if (trimmedSearch != null && trimmedSearch.isNotEmpty) {
    params["search"] = trimmedSearch;
  }
  if (pricingType != null) {
    params["pricingType"] = pricingType;
  }
  if (sort != null) {
    params["sort"] = sort;
  }
  return params;
}

final courseRepositoryProvider = Provider<CourseRepository>((ref) {
  return CourseRepository(ref.watch(apiClientProvider));
});
