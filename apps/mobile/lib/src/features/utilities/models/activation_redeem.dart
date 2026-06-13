class ActivationRedeemResponse {
  const ActivationRedeemResponse({
    required this.course,
    required this.enrollment,
  });

  final RedeemCourse course;
  final RedeemEnrollment enrollment;

  factory ActivationRedeemResponse.fromEnvelope(Map<String, dynamic> json) {
    if (json["success"] != true) {
      throw const FormatException("Redeem failed");
    }
    final data = json["data"] as Map<String, dynamic>;
    return ActivationRedeemResponse(
      course: RedeemCourse.fromJson(data["course"] as Map<String, dynamic>),
      enrollment: RedeemEnrollment.fromJson(
        data["enrollment"] as Map<String, dynamic>,
      ),
    );
  }
}

class RedeemCourse {
  const RedeemCourse({
    required this.id,
    required this.title,
    required this.slug,
    required this.pricingType,
  });

  final String id;
  final String title;
  final String slug;
  final String pricingType;

  factory RedeemCourse.fromJson(Map<String, dynamic> json) {
    return RedeemCourse(
      id: json["id"] as String,
      title: json["title"] as String,
      slug: json["slug"] as String,
      pricingType: json["pricingType"] as String? ?? "PAID",
    );
  }
}

class RedeemEnrollment {
  const RedeemEnrollment({required this.id, required this.status});

  final String id;
  final String status;

  factory RedeemEnrollment.fromJson(Map<String, dynamic> json) {
    return RedeemEnrollment(
      id: json["id"] as String,
      status: json["status"] as String,
    );
  }
}
