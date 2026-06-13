import "../../courses/models/category.dart";

class LessonProgress {
  const LessonProgress({
    required this.watchedSeconds,
    required this.isCompleted,
    this.completedAt,
    this.lastAccessedAt,
  });

  final int watchedSeconds;
  final bool isCompleted;
  final String? completedAt;
  final String? lastAccessedAt;

  factory LessonProgress.fromJson(Map<String, dynamic>? json) {
    if (json == null) {
      return const LessonProgress(watchedSeconds: 0, isCompleted: false);
    }
    return LessonProgress(
      watchedSeconds: (json["watchedSeconds"] as num?)?.toInt() ?? 0,
      isCompleted: json["isCompleted"] as bool? ?? false,
      completedAt: json["completedAt"] as String?,
      lastAccessedAt: json["lastAccessedAt"] as String?,
    );
  }

  LessonProgress copyWith({
    int? watchedSeconds,
    bool? isCompleted,
    String? completedAt,
    String? lastAccessedAt,
  }) {
    return LessonProgress(
      watchedSeconds: watchedSeconds ?? this.watchedSeconds,
      isCompleted: isCompleted ?? this.isCompleted,
      completedAt: completedAt ?? this.completedAt,
      lastAccessedAt: lastAccessedAt ?? this.lastAccessedAt,
    );
  }
}

class LearnLesson {
  const LearnLesson({
    required this.id,
    required this.title,
    this.description,
    this.youtubeVideoId,
    this.youtubeUrl,
    required this.sortOrder,
    required this.isPreview,
    this.durationSeconds,
    required this.progress,
    this.sectionTitle,
  });

  final String id;
  final String title;
  final String? description;
  final String? youtubeVideoId;
  final String? youtubeUrl;
  final int sortOrder;
  final bool isPreview;
  final int? durationSeconds;
  final LessonProgress progress;
  final String? sectionTitle;

  String? get effectiveYoutubeVideoId {
    final id = youtubeVideoId?.trim();
    if (id != null && id.isNotEmpty) return id;
    return extractYoutubeId(youtubeUrl);
  }

  static String? extractYoutubeId(String? url) {
    if (url == null || url.trim().isEmpty) return null;
    final u = url.trim();
    final patterns = [
      RegExp(r"youtu\.be/([a-zA-Z0-9_-]{11})"),
      RegExp(r"v=([a-zA-Z0-9_-]{11})"),
      RegExp(r"embed/([a-zA-Z0-9_-]{11})"),
    ];
    for (final p in patterns) {
      final m = p.firstMatch(u);
      if (m != null) return m.group(1);
    }
    return null;
  }

  factory LearnLesson.fromJson(
    Map<String, dynamic> json, {
    String? sectionTitle,
  }) {
    return LearnLesson(
      id: json["id"] as String,
      title: json["title"] as String,
      description: json["description"] as String?,
      youtubeVideoId: json["youtubeVideoId"] as String?,
      youtubeUrl: json["youtubeUrl"] as String?,
      sortOrder: (json["sortOrder"] as num?)?.toInt() ?? 0,
      isPreview: json["isPreview"] as bool? ?? false,
      durationSeconds: (json["durationSeconds"] as num?)?.toInt(),
      progress: LessonProgress.fromJson(
        json["progress"] as Map<String, dynamic>?,
      ),
      sectionTitle: sectionTitle,
    );
  }

  LearnLesson copyWithProgress(LessonProgress progress) {
    return LearnLesson(
      id: id,
      title: title,
      description: description,
      youtubeVideoId: youtubeVideoId,
      youtubeUrl: youtubeUrl,
      sortOrder: sortOrder,
      isPreview: isPreview,
      durationSeconds: durationSeconds,
      progress: progress,
      sectionTitle: sectionTitle,
    );
  }
}

class LearnSection {
  const LearnSection({
    required this.id,
    required this.title,
    required this.sortOrder,
    required this.lessons,
  });

  final String id;
  final String title;
  final int sortOrder;
  final List<LearnLesson> lessons;

  factory LearnSection.fromJson(Map<String, dynamic> json) {
    final title = json["title"] as String;
    final list = json["lessons"] as List<dynamic>? ?? [];
    return LearnSection(
      id: json["id"] as String,
      title: title,
      sortOrder: (json["sortOrder"] as num?)?.toInt() ?? 0,
      lessons: list
          .whereType<Map<String, dynamic>>()
          .map((l) => LearnLesson.fromJson(l, sectionTitle: title))
          .toList(),
    );
  }
}

class LearnNavigation {
  const LearnNavigation({
    required this.currentLessonId,
    this.previousLessonId,
    this.nextLessonId,
  });

  final String currentLessonId;
  final String? previousLessonId;
  final String? nextLessonId;

  factory LearnNavigation.fromJson(Map<String, dynamic> json) {
    return LearnNavigation(
      currentLessonId: json["currentLessonId"] as String,
      previousLessonId: json["previousLessonId"] as String?,
      nextLessonId: json["nextLessonId"] as String?,
    );
  }
}

class LearnCourse {
  const LearnCourse({
    required this.id,
    required this.title,
    required this.slug,
    this.shortDescription,
    this.description,
    this.thumbnailUrl,
    required this.level,
    this.estimatedDurationMinutes,
    this.category,
    required this.pricingType,
    required this.progressPercent,
  });

  final String id;
  final String title;
  final String slug;
  final String? shortDescription;
  final String? description;
  final String? thumbnailUrl;
  final String level;
  final int? estimatedDurationMinutes;
  final Category? category;
  final String pricingType;
  final int progressPercent;

  factory LearnCourse.fromJson(Map<String, dynamic> json) {
    final cat = json["category"];
    return LearnCourse(
      id: json["id"] as String,
      title: json["title"] as String,
      slug: json["slug"] as String,
      shortDescription: json["shortDescription"] as String?,
      description: json["description"] as String?,
      thumbnailUrl: json["thumbnailUrl"] as String?,
      level: json["level"] as String? ?? "ALL_LEVELS",
      estimatedDurationMinutes: (json["estimatedDurationMinutes"] as num?)
          ?.toInt(),
      category: cat is Map<String, dynamic> ? Category.fromJson(cat) : null,
      pricingType: json["pricingType"] as String? ?? "FREE",
      progressPercent: (json["progressPercent"] as num?)?.toInt() ?? 0,
    );
  }

  LearnCourse copyWithProgressPercent(int percent) {
    return LearnCourse(
      id: id,
      title: title,
      slug: slug,
      shortDescription: shortDescription,
      description: description,
      thumbnailUrl: thumbnailUrl,
      level: level,
      estimatedDurationMinutes: estimatedDurationMinutes,
      category: category,
      pricingType: pricingType,
      progressPercent: percent,
    );
  }
}

class LearnStats {
  const LearnStats({
    required this.completedLessons,
    required this.totalLessons,
    required this.progressPercent,
  });

  final int completedLessons;
  final int totalLessons;
  final int progressPercent;

  factory LearnStats.fromJson(Map<String, dynamic> json) {
    return LearnStats(
      completedLessons: (json["completedLessons"] as num?)?.toInt() ?? 0,
      totalLessons: (json["totalLessons"] as num?)?.toInt() ?? 0,
      progressPercent: (json["progressPercent"] as num?)?.toInt() ?? 0,
    );
  }

  LearnStats copyWith({
    int? completedLessons,
    int? totalLessons,
    int? progressPercent,
  }) {
    return LearnStats(
      completedLessons: completedLessons ?? this.completedLessons,
      totalLessons: totalLessons ?? this.totalLessons,
      progressPercent: progressPercent ?? this.progressPercent,
    );
  }
}

class LearnCourseResponse {
  const LearnCourseResponse({
    required this.course,
    required this.sections,
    required this.navigation,
    required this.currentLesson,
    required this.stats,
  });

  final LearnCourse course;
  final List<LearnSection> sections;
  final LearnNavigation navigation;
  final LearnLesson currentLesson;
  final LearnStats stats;

  factory LearnCourseResponse.fromEnvelope(Map<String, dynamic> json) {
    if (json["success"] != true) {
      throw const FormatException("Learn response not successful.");
    }
    final data = json["data"] as Map<String, dynamic>? ?? {};
    final sections = (data["sections"] as List<dynamic>? ?? [])
        .whereType<Map<String, dynamic>>()
        .map(LearnSection.fromJson)
        .toList();
    return LearnCourseResponse(
      course: LearnCourse.fromJson(data["course"] as Map<String, dynamic>),
      sections: sections,
      navigation: LearnNavigation.fromJson(
        data["navigation"] as Map<String, dynamic>,
      ),
      currentLesson: () {
        final cl = data["currentLesson"] as Map<String, dynamic>;
        return LearnLesson.fromJson(
          cl,
          sectionTitle: cl["sectionTitle"] as String?,
        );
      }(),
      stats: LearnStats.fromJson(data["stats"] as Map<String, dynamic>),
    );
  }

  LearnCourseResponse withSelectedLesson(LearnLesson lesson) {
    final flat = flattenLearnLessons(sections);
    final neighbors = lessonNeighbors(flat, lesson.id);
    return LearnCourseResponse(
      course: course,
      sections: sections,
      navigation: LearnNavigation(
        currentLessonId: lesson.id,
        previousLessonId: neighbors.previous?.id,
        nextLessonId: neighbors.next?.id,
      ),
      currentLesson: lesson,
      stats: stats,
    );
  }

  LearnCourseResponse updateLessonProgress(
    String lessonId,
    LessonProgress progress, {
    int? enrollmentProgressPercent,
    bool incrementCompleted = false,
  }) {
    final updatedSections = sections
        .map(
          (sec) => LearnSection(
            id: sec.id,
            title: sec.title,
            sortOrder: sec.sortOrder,
            lessons: sec.lessons
                .map((l) => l.id == lessonId ? l.copyWithProgress(progress) : l)
                .toList(),
          ),
        )
        .toList();

    final current = currentLesson.id == lessonId
        ? currentLesson.copyWithProgress(progress)
        : currentLesson;

    var statsOut = stats;
    if (incrementCompleted && progress.isCompleted) {
      statsOut = statsOut.copyWith(
        completedLessons: stats.completedLessons + 1,
      );
    }
    if (enrollmentProgressPercent != null) {
      statsOut = statsOut.copyWith(progressPercent: enrollmentProgressPercent);
    }

    return LearnCourseResponse(
      course: enrollmentProgressPercent != null
          ? course.copyWithProgressPercent(enrollmentProgressPercent)
          : course,
      sections: updatedSections,
      navigation: navigation,
      currentLesson: current,
      stats: statsOut,
    );
  }
}

/// Flat ordered lesson list for navigation helpers.
List<LearnLesson> flattenLearnLessons(List<LearnSection> sections) {
  final out = <LearnLesson>[];
  final sorted = [...sections]
    ..sort((a, b) => a.sortOrder.compareTo(b.sortOrder));
  for (final sec in sorted) {
    final lessons = [...sec.lessons]
      ..sort((a, b) => a.sortOrder.compareTo(b.sortOrder));
    out.addAll(lessons);
  }
  return out;
}

class LessonNeighbors {
  const LessonNeighbors({this.previous, this.next});

  final LearnLesson? previous;
  final LearnLesson? next;
}

LessonNeighbors lessonNeighbors(List<LearnLesson> flat, String lessonId) {
  final index = flat.indexWhere((l) => l.id == lessonId);
  if (index < 0) return const LessonNeighbors();
  return LessonNeighbors(
    previous: index > 0 ? flat[index - 1] : null,
    next: index < flat.length - 1 ? flat[index + 1] : null,
  );
}

LearnLesson? findLearnLessonById(List<LearnSection> sections, String lessonId) {
  for (final sec in sections) {
    for (final l in sec.lessons) {
      if (l.id == lessonId) return l;
    }
  }
  return null;
}
