import "package:flutter_riverpod/flutter_riverpod.dart";

import "../repositories/student_courses_repository.dart";

final savedCourseIdsProvider =
    AsyncNotifierProvider<SavedCourseIdsNotifier, Set<String>>(
      SavedCourseIdsNotifier.new,
    );

class SavedCourseIdsNotifier extends AsyncNotifier<Set<String>> {
  @override
  Future<Set<String>> build() async {
    return ref.read(studentCoursesRepositoryProvider).getSavedCourseIds();
  }

  Future<void> refresh() async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(() => build());
  }

  Future<bool> toggleSave(String courseId) async {
    final current = state.value ?? {};
    final wasSaved = current.contains(courseId);
    final next = Set<String>.from(current);
    if (wasSaved) {
      next.remove(courseId);
    } else {
      next.add(courseId);
    }
    state = AsyncData(next);

    try {
      final repo = ref.read(studentCoursesRepositoryProvider);
      if (wasSaved) {
        await repo.unsaveCourse(courseId);
      } else {
        await repo.saveCourse(courseId);
      }
      return !wasSaved;
    } catch (e) {
      state = AsyncData(current);
      rethrow;
    }
  }
}
