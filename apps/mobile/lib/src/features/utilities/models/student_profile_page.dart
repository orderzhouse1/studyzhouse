class StudentProfilePage {
  const StudentProfilePage({required this.account, required this.profile});

  final StudentAccount account;
  final StudentProfileDto profile;

  factory StudentProfilePage.fromEnvelope(Map<String, dynamic> json) {
    if (json["success"] != true) throw const FormatException();
    final data = json["data"] as Map<String, dynamic>;
    return StudentProfilePage(
      account: StudentAccount.fromJson(data["account"] as Map<String, dynamic>),
      profile: StudentProfileDto.fromJson(
        data["profile"] as Map<String, dynamic>,
      ),
    );
  }
}

class StudentAccount {
  const StudentAccount({
    required this.fullName,
    required this.email,
    required this.status,
    required this.hasGoogleLogin,
  });

  final String fullName;
  final String email;
  final String status;
  final bool hasGoogleLogin;

  factory StudentAccount.fromJson(Map<String, dynamic> json) {
    return StudentAccount(
      fullName: json["fullName"] as String,
      email: json["email"] as String,
      status: json["status"] as String? ?? "ACTIVE",
      hasGoogleLogin: json["hasGoogleLogin"] as bool? ?? false,
    );
  }
}

class StudentProfileDto {
  const StudentProfileDto({
    this.country,
    this.phone,
    this.gender,
    this.birthYear,
    this.currentLevel,
    required this.learningGoals,
    required this.interests,
    this.weeklyStudyTime,
    this.preferredLearningStyle,
    this.onboardingCompletedAt,
    this.needsOnboarding = false,
  });

  final String? country;
  final String? phone;
  final String? gender;
  final int? birthYear;
  final String? currentLevel;
  final List<String> learningGoals;
  final List<String> interests;
  final String? weeklyStudyTime;
  final String? preferredLearningStyle;
  final String? onboardingCompletedAt;
  final bool needsOnboarding;

  factory StudentProfileDto.fromJson(Map<String, dynamic> json) {
    return StudentProfileDto(
      country: json["country"] as String?,
      phone: json["phone"] as String?,
      gender: json["gender"] as String?,
      birthYear: (json["birthYear"] as num?)?.toInt(),
      currentLevel: json["currentLevel"] as String?,
      learningGoals: (json["learningGoals"] as List<dynamic>? ?? [])
          .map((e) => e.toString())
          .toList(),
      interests: (json["interests"] as List<dynamic>? ?? [])
          .map((e) => e.toString())
          .toList(),
      weeklyStudyTime: json["weeklyStudyTime"] as String?,
      preferredLearningStyle: json["preferredLearningStyle"] as String?,
      onboardingCompletedAt: json["onboardingCompletedAt"] as String?,
      needsOnboarding: json["needsOnboarding"] as bool? ?? false,
    );
  }
}
