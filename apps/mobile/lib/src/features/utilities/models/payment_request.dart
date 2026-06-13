class PaymentInfo {
  const PaymentInfo({required this.cliqAlias, required this.cliqInstructions});

  final String cliqAlias;
  final String cliqInstructions;

  factory PaymentInfo.fromEnvelope(Map<String, dynamic> json) {
    if (json["success"] != true) throw const FormatException();
    final data = json["data"] as Map<String, dynamic>? ?? {};
    return PaymentInfo(
      cliqAlias: data["cliqAlias"] as String? ?? "",
      cliqInstructions: data["cliqInstructions"] as String? ?? "",
    );
  }
}

class PaymentRequestItem {
  const PaymentRequestItem({
    required this.id,
    required this.status,
    required this.paidAmount,
    required this.currency,
    this.paymentReference,
    required this.course,
    required this.createdAt,
    this.reviewedAt,
    this.rejectionReason,
  });

  final String id;
  final String status;
  final String paidAmount;
  final String currency;
  final String? paymentReference;
  final PaymentRequestCourse course;
  final String createdAt;
  final String? reviewedAt;
  final String? rejectionReason;

  factory PaymentRequestItem.fromJson(Map<String, dynamic> json) {
    return PaymentRequestItem(
      id: json["id"] as String,
      status: json["status"] as String,
      paidAmount: json["paidAmount"]?.toString() ?? "",
      currency: json["currency"] as String? ?? "JOD",
      paymentReference: json["paymentReference"] as String?,
      course: PaymentRequestCourse.fromJson(
        json["course"] as Map<String, dynamic>,
      ),
      createdAt: json["createdAt"] as String,
      reviewedAt: json["reviewedAt"] as String?,
      rejectionReason: json["rejectionReason"] as String?,
    );
  }
}

class PaymentRequestCourse {
  const PaymentRequestCourse({
    required this.id,
    required this.title,
    required this.slug,
  });

  final String id;
  final String title;
  final String slug;

  factory PaymentRequestCourse.fromJson(Map<String, dynamic> json) {
    return PaymentRequestCourse(
      id: json["id"] as String,
      title: json["title"] as String,
      slug: json["slug"] as String,
    );
  }
}

class StudentPurchaseItem {
  const StudentPurchaseItem({
    required this.id,
    required this.source,
    required this.status,
    required this.course,
    this.amount,
    this.currency,
    this.transactionReference,
    required this.createdAt,
    this.reviewedAt,
    this.rejectionReason,
    required this.canLearn,
    this.learnUrl,
  });

  final String id;
  final String source;
  final String status;
  final StudentPurchaseCourse course;
  final String? amount;
  final String? currency;
  final String? transactionReference;
  final String createdAt;
  final String? reviewedAt;
  final String? rejectionReason;
  final bool canLearn;
  final String? learnUrl;

  factory StudentPurchaseItem.fromJson(Map<String, dynamic> json) {
    return StudentPurchaseItem(
      id: json["id"] as String,
      source: json["source"] as String? ?? "UNKNOWN",
      status: json["status"] as String,
      course: StudentPurchaseCourse.fromJson(
        json["course"] as Map<String, dynamic>,
      ),
      amount: json["amount"]?.toString(),
      currency: json["currency"] as String?,
      transactionReference: json["transactionReference"] as String?,
      createdAt: json["createdAt"] as String,
      reviewedAt: json["reviewedAt"] as String?,
      rejectionReason: json["rejectionReason"] as String?,
      canLearn: json["canLearn"] as bool? ?? false,
      learnUrl: json["learnUrl"] as String?,
    );
  }
}

class StudentPurchaseCourse {
  const StudentPurchaseCourse({
    required this.id,
    required this.title,
    required this.slug,
  });

  final String id;
  final String title;
  final String slug;

  factory StudentPurchaseCourse.fromJson(Map<String, dynamic> json) {
    return StudentPurchaseCourse(
      id: json["id"] as String,
      title: json["title"] as String,
      slug: json["slug"] as String,
    );
  }
}

String paymentStatusLabelAr(String status) {
  switch (status) {
    case "PENDING":
      return "قيد المراجعة";
    case "APPROVED":
      return "مقبول";
    case "REJECTED":
      return "مرفوض";
    case "ACTIVE":
      return "مفعّل";
    case "REVOKED":
      return "ملغى";
    case "COMPLETED":
      return "مكتمل";
    default:
      return status;
  }
}

String purchaseSourceLabelAr(String source) {
  switch (source) {
    case "CLIQ_PAYMENT":
      return "دفع CliQ";
    case "ACTIVATION_CODE":
      return "كود تفعيل";
    case "MANUAL_ADMIN":
      return "تسجيل إداري";
    case "FREE":
      return "مجاني";
    default:
      return "أخرى";
  }
}
