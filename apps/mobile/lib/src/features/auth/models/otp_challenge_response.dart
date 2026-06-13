class OtpChallengeResponse {
  const OtpChallengeResponse({
    required this.challengeId,
    this.expiresAt,
    this.resendAvailableAt,
    this.message,
  });

  final String challengeId;
  final DateTime? expiresAt;
  final DateTime? resendAvailableAt;
  final String? message;

  factory OtpChallengeResponse.fromJson(Map<String, dynamic> json) {
    return OtpChallengeResponse(
      challengeId: json["challengeId"] as String,
      expiresAt: parseIsoDate(json["expiresAt"]),
      resendAvailableAt: parseIsoDate(json["resendAvailableAt"]),
      message: json["message"] as String?,
    );
  }

  static DateTime? parseIsoDate(Object? value) {
    if (value is! String || value.isEmpty) return null;
    return DateTime.tryParse(value);
  }
}

class OtpResendResponse {
  const OtpResendResponse({
    this.expiresAt,
    this.resendAvailableAt,
    this.message,
  });

  final DateTime? expiresAt;
  final DateTime? resendAvailableAt;
  final String? message;

  factory OtpResendResponse.fromJson(Map<String, dynamic> json) {
    return OtpResendResponse(
      expiresAt: OtpChallengeResponse.parseIsoDate(json["expiresAt"]),
      resendAvailableAt: OtpChallengeResponse.parseIsoDate(
        json["resendAvailableAt"],
      ),
      message: json["message"] as String?,
    );
  }
}

/// Forgot-password request may omit challengeId (unknown email).
class ForgotPasswordRequestResponse {
  const ForgotPasswordRequestResponse({
    required this.message,
    this.challengeId,
    this.expiresAt,
    this.resendAvailableAt,
  });

  final String message;
  final String? challengeId;
  final DateTime? expiresAt;
  final DateTime? resendAvailableAt;

  bool get hasChallenge => challengeId != null && challengeId!.isNotEmpty;

  factory ForgotPasswordRequestResponse.fromJson(Map<String, dynamic> json) {
    return ForgotPasswordRequestResponse(
      message: json["message"] as String? ?? "",
      challengeId: json["challengeId"] as String?,
      expiresAt: OtpChallengeResponse.parseIsoDate(json["expiresAt"]),
      resendAvailableAt: OtpChallengeResponse.parseIsoDate(
        json["resendAvailableAt"],
      ),
    );
  }
}

class MessageResponse {
  const MessageResponse({required this.message});

  final String message;

  factory MessageResponse.fromJson(Map<String, dynamic> json) {
    return MessageResponse(message: json["message"] as String? ?? "");
  }
}
