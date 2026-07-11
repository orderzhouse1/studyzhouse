import "category.dart";

class Course {
  const Course({
    required this.id,
    required this.title,
    required this.slug,
    this.shortDescription,
    this.description,
    this.thumbnailUrl,
    required this.pricingType,
    this.priceAmount,
    required this.currency,
    required this.level,
    this.estimatedDurationMinutes,
    this.publishedAt,
    this.category,
    this.lessonCount = 0,
    this.appleProductId,
    this.iosPurchasable = false,
    this.apiIncludesIapFields = false,
  });

  final String id;
  final String title;
  final String slug;
  final String? shortDescription;
  final String? description;
  final String? thumbnailUrl;
  final String pricingType;
  final String? priceAmount;
  final String currency;
  final String level;
  final int? estimatedDurationMinutes;
  final String? publishedAt;
  final Category? category;
  final int lessonCount;
  final String? appleProductId;
  final bool iosPurchasable;
  final bool apiIncludesIapFields;

  bool get isFree => pricingType == "FREE";

  bool get isIosIapPurchasable =>
      !isFree &&
      iosPurchasable &&
      (appleProductId?.trim().isNotEmpty ?? false);

  String get priceLabel => isFree ? "مجاني" : "${priceAmount ?? "—"} $currency";

  String get levelLabel => switch (level) {
    "BEGINNER" => "مبتدئ",
    "INTERMEDIATE" => "متوسط",
    "ADVANCED" => "متقدم",
    _ => "جميع المستويات",
  };

  factory Course.fromJson(Map<String, dynamic> json) {
    final cat = json["category"];
    return Course(
      id: json["id"] as String,
      title: json["title"] as String,
      slug: json["slug"] as String,
      shortDescription: json["shortDescription"] as String?,
      description: json["description"] as String?,
      thumbnailUrl: json["thumbnailUrl"] as String?,
      pricingType: json["pricingType"] as String? ?? "FREE",
      priceAmount: json["priceAmount"]?.toString(),
      currency: json["currency"] as String? ?? "JOD",
      level: json["level"] as String? ?? "ALL_LEVELS",
      estimatedDurationMinutes: (json["estimatedDurationMinutes"] as num?)
          ?.toInt(),
      publishedAt: json["publishedAt"] as String?,
      category: cat is Map<String, dynamic> ? Category.fromJson(cat) : null,
      lessonCount: (json["lessonCount"] as num?)?.toInt() ?? 0,
      appleProductId: json["appleProductId"] as String?,
      iosPurchasable: json["iosPurchasable"] as bool? ?? false,
      apiIncludesIapFields:
          json.containsKey("iosPurchasable") ||
          json.containsKey("appleProductId"),
    );
  }
}
