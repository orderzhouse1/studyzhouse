import "package:flutter_test/flutter_test.dart";
import "package:studyzhouse_mobile/src/features/auth/models/otp_challenge_response.dart";

void main() {
  test("OtpChallengeResponse parses challenge", () {
    final r = OtpChallengeResponse.fromJson({
      "challengeId": "clxyz123",
      "expiresAt": "2026-06-01T12:00:00.000Z",
      "resendAvailableAt": "2026-06-01T12:01:00.000Z",
      "message": "sent",
    });
    expect(r.challengeId, "clxyz123");
    expect(r.expiresAt, isNotNull);
  });

  test("ForgotPasswordRequestResponse without challengeId", () {
    final r = ForgotPasswordRequestResponse.fromJson({"message": "generic"});
    expect(r.hasChallenge, isFalse);
  });

  test("ForgotPasswordRequestResponse with challengeId", () {
    final r = ForgotPasswordRequestResponse.fromJson({
      "message": "generic",
      "challengeId": "abc",
    });
    expect(r.hasChallenge, isTrue);
  });
}
