import "package:flutter_test/flutter_test.dart";
import "package:studyzhouse_mobile/src/core/utils/auth_validators.dart";

void main() {
  test("validateEmail rejects invalid", () {
    expect(validateEmail(""), isNotNull);
    expect(validateEmail("bad"), isNotNull);
    expect(validateEmail("a@b.com"), isNull);
  });

  test("validatePassword requires letter and digit", () {
    expect(validatePassword("short"), isNotNull);
    expect(validatePassword("abcdefgh"), isNotNull);
    expect(validatePassword("abc12345"), isNull);
  });

  test("validateOtpCode requires 6 digits", () {
    expect(validateOtpCode("123"), isNotNull);
    expect(validateOtpCode("123456"), isNull);
  });
}
