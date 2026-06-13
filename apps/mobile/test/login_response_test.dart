import "package:flutter_test/flutter_test.dart";
import "package:studyzhouse_mobile/src/features/auth/models/login_response.dart";

void main() {
  test("parses login envelope", () {
    final response = LoginResponse.fromEnvelope({
      "success": true,
      "data": {
        "accessToken": "jwt-token-example",
        "user": {
          "id": "u1",
          "fullName": "طالب",
          "email": "student@example.com",
          "role": "STUDENT",
          "status": "ACTIVE",
          "avatarUrl": null,
        },
      },
    });

    expect(response.accessToken, "jwt-token-example");
    expect(response.user.isStudent, isTrue);
  });
}
