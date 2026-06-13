import "package:dio/dio.dart";

import "auth_paths.dart";
import "../storage/auth_storage.dart";

/// Attaches Bearer token when present. Skips public auth routes.
class AuthInterceptor extends Interceptor {
  AuthInterceptor(this._readToken);

  final Future<String?> Function() _readToken;

  @override
  Future<void> onRequest(
    RequestOptions options,
    RequestInterceptorHandler handler,
  ) async {
    if (isPublicAuthPath(options.path)) {
      handler.next(options);
      return;
    }
    final token = await _readToken();
    if (token != null && token.isNotEmpty) {
      options.headers["Authorization"] = "Bearer $token";
    }
    handler.next(options);
  }
}

AuthInterceptor authInterceptorFromStorage(AuthStorage storage) {
  return AuthInterceptor(storage.readAccessToken);
}
