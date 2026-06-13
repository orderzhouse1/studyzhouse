import "category.dart";

class SavedCourseItem {
  const SavedCourseItem({
    required this.id,
    required this.courseId,
    required this.savedAt,
    required this.course,
    required this.isEnrolled,
    required this.canLearn,
    this.learnUrl,
  });

  final String id;
  final String courseId;
  final String savedAt;
  final SavedCourseSummary course;
  final bool isEnrolled;
  final bool canLearn;
  final String? learnUrl;

  factory SavedCourseItem.fromJson(Map<String, dynamic> json) {
    return SavedCourseItem(
      id: json["id"] as String,
      courseId: json["courseId"] as String,
      savedAt: json["savedAt"] as String,
      course: SavedCourseSummary.fromJson(
        json["course"] as Map<String, dynamic>,
      ),
      isEnrolled: json["isEnrolled"] as bool? ?? false,
      canLearn: json["canLearn"] as bool? ?? false,
      learnUrl: json["learnUrl"] as String?,
    );
  }
}

class SavedCourseSummary {
  const SavedCourseSummary({
    required this.id,
    required this.title,
    required this.slug,
    this.thumbnailUrl,
    required this.pricingType,
    this.priceAmount,
    required this.currency,
    required this.level,
    this.category,
  });

  final String id;
  final String title;
  final String slug;
  final String? thumbnailUrl;
  final String pricingType;
  final String? priceAmount;
  final String currency;
  final String level;
  final Category? category;

  bool get isFree => pricingType == "FREE";

  factory SavedCourseSummary.fromJson(Map<String, dynamic> json) {
    final cat = json["category"];
    return SavedCourseSummary(
      id: json["id"] as String,
      title: json["title"] as String,
      slug: json["slug"] as String,
      thumbnailUrl: json["thumbnailUrl"] as String?,
      pricingType: json["pricingType"] as String? ?? "FREE",
      priceAmount: json["priceAmount"]?.toString(),
      currency: json["currency"] as String? ?? "JOD",
      level: json["level"] as String? ?? "ALL_LEVELS",
      category: cat is Map<String, dynamic> ? Category.fromJson(cat) : null,
    );
  }
}

class SavedCoursesResponse {
  const SavedCoursesResponse({required this.items});

  final List<SavedCourseItem> items;

  factory SavedCoursesResponse.fromEnvelope(Map<String, dynamic> json) {
    if (json["success"] != true) {
      throw const FormatException("Saved courses response not successful.");
    }
    final data = json["data"] as Map<String, dynamic>? ?? {};
    final list = data["items"] as List<dynamic>? ?? [];
    return SavedCoursesResponse(
      items: list
          .whereType<Map<String, dynamic>>()
          .map(SavedCourseItem.fromJson)
          .toList(),
    );
  }
}

class SavedCourseIdsResponse {
  const SavedCourseIdsResponse({required this.courseIds});

  final Set<String> courseIds;

  factory SavedCourseIdsResponse.fromEnvelope(Map<String, dynamic> json) {
    if (json["success"] != true) {
      throw const FormatException("Saved IDs response not successful.");
    }
    final data = json["data"] as Map<String, dynamic>? ?? {};
    final list = data["courseIds"] as List<dynamic>? ?? [];
    return SavedCourseIdsResponse(
      courseIds: list.map((e) => e.toString()).toSet(),
    );
  }
}
