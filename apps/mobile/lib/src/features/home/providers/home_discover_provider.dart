import "package:flutter_riverpod/flutter_riverpod.dart";

import "../../../core/network/pagination_meta.dart";
import "../../courses/models/category.dart";
import "../../courses/models/course.dart";
import "../../courses/repositories/course_repository.dart";
import "../../utilities/repositories/student_utilities_repository.dart";

class HomeDiscoverCatalog {
  const HomeDiscoverCatalog({
    required this.categories,
    required this.courses,
    required this.interests,
  });

  final List<Category> categories;
  final List<Course> courses;
  final List<String> interests;
}

final homeDiscoverProvider = FutureProvider.autoDispose<HomeDiscoverCatalog>((
  ref,
) async {
  final courseRepo = ref.read(courseRepositoryProvider);
  final utilities = ref.read(studentUtilitiesRepositoryProvider);

  final results = await Future.wait([
    courseRepo.listCategories(),
    courseRepo.listCourses(page: 1, pageSize: 48),
  ]);

  var interests = <String>[];
  try {
    final profile = await utilities.getProfile();
    interests = profile.profile.interests;
  } catch (_) {}

  return HomeDiscoverCatalog(
    categories: results[0] as List<Category>,
    courses: (results[1] as PaginatedResult<Course>).items,
    interests: interests,
  );
});
