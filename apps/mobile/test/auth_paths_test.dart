import "package:flutter_test/flutter_test.dart";
import "package:studyzhouse_mobile/src/core/network/auth_paths.dart";

void main() {
  group("auth path helpers", () {
    test("protected 401 clears session", () {
      expect(shouldClearSessionOnAuthError("/auth/me", 401), isTrue);
    });

    test("protected 403 clears session", () {
      expect(shouldClearSessionOnAuthError("/student/courses", 403), isTrue);
    });

    test("public login 401 does not clear session", () {
      expect(shouldClearSessionOnAuthError("/auth/login", 401), isFalse);
    });

    test("network errors without status do not clear session", () {
      expect(shouldClearSessionOnAuthError("/auth/me", null), isFalse);
    });
  });
}
