import "../network/api_exception.dart";

/// Maps errors to safe Arabic user messages — never exposes tokens or stack traces.
String userFacingErrorMessage(Object? error, {required String fallback}) {
  if (error is ApiException) return error.message;
  return fallback;
}
