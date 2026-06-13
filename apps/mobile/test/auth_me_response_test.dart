import "package:flutter_test/flutter_test.dart";
import "package:studyzhouse_mobile/src/features/auth/models/auth_me_response.dart";

void main() {
  test("parses auth me envelope", () {
    final r = AuthMeResponse.fromEnvelope({
      "success": true,
      "data": {
        "user": {
          "id": "u1",
          "fullName": "طالب",
          "email": "s@example.com",
          "role": "STUDENT",
          "status": "ACTIVE",
          "avatarUrl": null,
        },
      },
    });
    expect(r.user.isStudent, isTrue);
    expect(r.user.status, "ACTIVE");
  });
}
