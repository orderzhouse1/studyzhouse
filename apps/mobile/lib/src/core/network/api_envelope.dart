import "api_exception.dart";

Map<String, dynamic> requireSuccessData(Map<String, dynamic> envelope) {
  if (envelope["success"] != true) {
    throw ApiException(message: "فشل الطلب.");
  }
  final data = envelope["data"];
  if (data is! Map<String, dynamic>) {
    throw const FormatException("Missing response data.");
  }
  return data;
}
