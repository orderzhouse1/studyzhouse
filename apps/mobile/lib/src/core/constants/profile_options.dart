/// Mirrors `packages/shared/src/studentProfileOptions.ts` labels for mobile UI.
class ProfileOption {
  const ProfileOption(this.id, this.labelAr);
  final String id;
  final String labelAr;
}

abstract final class ProfileOptions {
  static const levels = [
    ProfileOption("BEGINNER", "مبتدئ"),
    ProfileOption("INTERMEDIATE", "متوسط"),
    ProfileOption("ADVANCED", "متقدّم"),
  ];

  static const genders = [
    ProfileOption("MALE", "ذكر"),
    ProfileOption("FEMALE", "أنثى"),
    ProfileOption("PREFER_NOT_TO_SAY", "أفضّل عدم الإفصاح"),
    ProfileOption("OTHER", "آخر"),
  ];

  static const weeklyStudy = [
    ProfileOption("UNDER_2H", "أقل من ساعتين أسبوعيًا"),
    ProfileOption("HOURS_2_5", "2–5 ساعات أسبوعيًا"),
    ProfileOption("HOURS_5_10", "5–10 ساعات أسبوعيًا"),
    ProfileOption("OVER_10H", "أكثر من 10 ساعات أسبوعيًا"),
  ];

  static const learningStyles = [
    ProfileOption("VIDEO", "فيديو وشرح مرئي"),
    ProfileOption("READING", "قراءة وملخصات"),
    ProfileOption("PRACTICE", "تمارين عملية"),
    ProfileOption("MIXED", "مزيج من الأساليب"),
  ];

  static const interests = [
    ProfileOption("programming", "برمجة وتقنية"),
    ProfileOption("design", "تصميم وإبداع"),
    ProfileOption("business", "أعمال وريادة"),
    ProfileOption("languages", "لغات"),
    ProfileOption("university", "جامعة ودراسة"),
    ProfileOption("marketing", "تسويق رقمي"),
    ProfileOption("finance", "مالية ومحاسبة"),
    ProfileOption("personal_development", "تطوير ذاتي"),
  ];

  static const learningGoals = [
    ProfileOption("career", "تطوير مهني"),
    ProfileOption("university", "النجاح الجامعي"),
    ProfileOption("skill", "مهارة جديدة"),
    ProfileOption("certificate", "شهادة أو اعتماد"),
    ProfileOption("hobby", "هواية وتعلّم ممتع"),
  ];
}
