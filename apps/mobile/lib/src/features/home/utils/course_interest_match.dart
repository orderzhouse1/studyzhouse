import "../../courses/models/course.dart";

/// Keyword hints aligned with `STUDENT_INTEREST_MATCH_HINTS` in `@studyhouse/shared`.
final Map<String, List<RegExp>> _interestMatchHints = {
  "programming": [
    RegExp(r"برمج", caseSensitive: false),
    RegExp(r"code", caseSensitive: false),
    RegExp(r"dev", caseSensitive: false),
    RegExp(r"تقني", caseSensitive: false),
    RegExp(r"حاسوب", caseSensitive: false),
    RegExp(r"python", caseSensitive: false),
    RegExp(r"جافا", caseSensitive: false),
  ],
  "design": [
    RegExp(r"تصميم", caseSensitive: false),
    RegExp(r"design", caseSensitive: false),
    RegExp(r"جرافيك", caseSensitive: false),
    RegExp(r"فوتوشوب", caseSensitive: false),
    RegExp(r"ui", caseSensitive: false),
    RegExp(r"ux", caseSensitive: false),
  ],
  "business": [
    RegExp(r"أعمال", caseSensitive: false),
    RegExp(r"ريادة", caseSensitive: false),
    RegExp(r"إدارة", caseSensitive: false),
    RegExp(r"business", caseSensitive: false),
    RegExp(r"startup", caseSensitive: false),
  ],
  "languages": [
    RegExp(r"لغة", caseSensitive: false),
    RegExp(r"english", caseSensitive: false),
    RegExp(r"إنجليز", caseSensitive: false),
    RegExp(r"فرنس", caseSensitive: false),
    RegExp(r"عرب", caseSensitive: false),
  ],
  "university": [
    RegExp(r"جامع", caseSensitive: false),
    RegExp(r"university", caseSensitive: false),
    RegExp(r"أكاديم", caseSensitive: false),
    RegExp(r"كلية", caseSensitive: false),
    RegExp(r"امتحان", caseSensitive: false),
  ],
  "marketing": [
    RegExp(r"تسويق", caseSensitive: false),
    RegExp(r"marketing", caseSensitive: false),
    RegExp(r"سوشيال", caseSensitive: false),
    RegExp(r"إعلان", caseSensitive: false),
  ],
  "finance": [
    RegExp(r"مالي", caseSensitive: false),
    RegExp(r"محاسب", caseSensitive: false),
    RegExp(r"finance", caseSensitive: false),
    RegExp(r"استثمار", caseSensitive: false),
  ],
  "personal_development": [
    RegExp(r"تطوير", caseSensitive: false),
    RegExp(r"ذاتي", caseSensitive: false),
    RegExp(r"تحفيز", caseSensitive: false),
    RegExp(r"قيادة", caseSensitive: false),
    RegExp(r"مهارات", caseSensitive: false),
  ],
};

bool courseMatchesInterests(Course course, List<String> interestIds) {
  if (interestIds.isEmpty) return false;
  final hay =
      "${course.title} ${course.category?.name ?? ""} ${course.category?.slug ?? ""}";
  for (final id in interestIds) {
    final patterns = _interestMatchHints[id];
    if (patterns == null) continue;
    if (patterns.any((re) => re.hasMatch(hay))) return true;
  }
  return false;
}

bool courseMatchesAiTopic(Course course) {
  if (course.category?.slug == "artificial-intelligence") return true;
  final hay =
      "${course.title} ${course.shortDescription ?? ""} ${course.category?.name ?? ""}";
  return RegExp(
    r"ذكاء|اصطناع|artificial|machine learning|تعلم آلي|نماذج",
    caseSensitive: false,
  ).hasMatch(hay);
}

bool isShortCourse(Course course) {
  final minutes = course.estimatedDurationMinutes;
  if (minutes != null && minutes <= 180) return true;
  return course.lessonCount > 0 && course.lessonCount <= 8;
}
