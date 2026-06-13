import "package:dio/dio.dart";

import "auth_paths.dart";

/// Clears session on 401 from protected routes — never logs tokens.
class UnauthorizedInterceptor extends Interceptor {
  UnauthorizedInterceptor({required this.onUnauthorized});

  final Future<void> Function() onUnauthorized;

  bool _handling = false;

  @override
  Future<void> onError(
    DioException err,
    ErrorInterceptorHandler handler,
  ) async {
    final path = err.requestOptions.path;
    if (shouldHandleUnauthorized401(path, err.response?.statusCode) &&
        !_handling) {
      _handling = true;
      try {
        await onUnauthorized();
      } finally {
        _handling = false;
      }
    }
    handler.next(err);
  }
}
