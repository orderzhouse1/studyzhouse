class ApiException implements Exception {
  ApiException({
    required this.message,
    this.statusCode,
    this.code,
    this.fieldErrors,
  });

  final String message;
  final int? statusCode;
  final String? code;
  final Map<String, List<String>>? fieldErrors;

  @override
  String toString() => message;
}
