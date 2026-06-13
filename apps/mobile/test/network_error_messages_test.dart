import "package:dio/dio.dart";
import "package:flutter_test/flutter_test.dart";
import "package:studyzhouse_mobile/src/core/utils/api_error_message.dart";

void main() {
  test("messageFromDioError maps connection error to Arabic", () {
    final msg = messageFromDioError(
      DioException(
        requestOptions: RequestOptions(path: "/test"),
        type: DioExceptionType.connectionError,
      ),
    );
    expect(msg, contains("الإنترنت"));
  });

  test("messageFromDioError maps 500 to Arabic", () {
    final msg = messageFromDioError(
      DioException(
        requestOptions: RequestOptions(path: "/test"),
        response: Response(
          requestOptions: RequestOptions(path: "/test"),
          statusCode: 500,
        ),
        type: DioExceptionType.badResponse,
      ),
    );
    expect(msg, contains("الخادم"));
  });

  test("messageFromDioError maps 401 to Arabic", () {
    final msg = messageFromDioError(
      DioException(
        requestOptions: RequestOptions(path: "/test"),
        response: Response(
          requestOptions: RequestOptions(path: "/test"),
          statusCode: 401,
        ),
        type: DioExceptionType.badResponse,
      ),
    );
    expect(msg, contains("تسجيل الدخول"));
  });

  test("codeToArabic maps enrollment forbidden", () {
    expect(codeToArabic("FORBIDDEN"), contains("مخصص"));
  });
}
