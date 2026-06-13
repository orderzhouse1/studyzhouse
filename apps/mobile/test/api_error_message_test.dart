import "package:flutter_test/flutter_test.dart";
import "package:studyzhouse_mobile/src/core/utils/api_error_message.dart";

void main() {
  test("codeToArabic maps OTP and duplicate codes", () {
    expect(codeToArabic("OTP_INVALID"), contains("غير صحيح"));
    expect(codeToArabic("DUPLICATE_EMAIL"), contains("مسجّل"));
    expect(codeToArabic("RATE_LIMITED"), contains("انتظر"));
  });

  test("parseApiErrorEnvelope reads field errors", () {
    final parsed = parseApiErrorEnvelope({
      "success": false,
      "error": {
        "code": "VALIDATION_ERROR",
        "message": "بيانات غير صالحة.",
        "details": {
          "fieldErrors": {
            "email": ["البريد الإلكتروني غير صالح."],
          },
        },
      },
    });

    expect(parsed?.code, "VALIDATION_ERROR");
    expect(parsed?.fieldErrors?["email"]?.first, contains("البريد"));
  });

  test("firstFieldError returns first message", () {
    expect(
      firstFieldError({
        "email": ["خطأ"],
      }, "email"),
      "خطأ",
    );
  });
}
