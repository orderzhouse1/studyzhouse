import "package:flutter_test/flutter_test.dart";
import "package:studyzhouse_mobile/src/core/network/api_exception.dart";
import "package:studyzhouse_mobile/src/core/utils/friendly_error_message.dart";

void main() {
  test("returns ApiException message", () {
    expect(
      userFacingErrorMessage(
        ApiException(message: "رسالة عربية"),
        fallback: "احتياطي",
      ),
      "رسالة عربية",
    );
  });

  test("returns fallback for unknown errors", () {
    expect(
      userFacingErrorMessage(Exception("secret"), fallback: "احتياطي"),
      "احتياطي",
    );
  });
}
