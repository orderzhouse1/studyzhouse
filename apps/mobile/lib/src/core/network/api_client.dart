import "package:dio/dio.dart";
import "package:flutter_riverpod/flutter_riverpod.dart";

import "../auth/current_user_provider.dart";
import "../auth/session_expired_provider.dart";
import "../config/app_config.dart";
import "../storage/auth_storage.dart";
import "auth_interceptor.dart";
import "unauthorized_interceptor.dart";
import "../platform/platform_client_interceptor.dart";

class ApiClient {
  ApiClient(this._dio);

  final Dio _dio;

  Dio get dio => _dio;

  Future<Response<T>> get<T>(
    String path, {
    Map<String, dynamic>? queryParameters,
  }) {
    return _dio.get<T>(path, queryParameters: queryParameters);
  }

  Future<Response<T>> post<T>(
    String path, {
    Object? data,
    Map<String, dynamic>? queryParameters,
  }) {
    return _dio.post<T>(path, data: data, queryParameters: queryParameters);
  }

  Future<Response<T>> delete<T>(
    String path, {
    Map<String, dynamic>? queryParameters,
  }) {
    return _dio.delete<T>(path, queryParameters: queryParameters);
  }

  Future<Response<T>> patch<T>(
    String path, {
    Object? data,
    Map<String, dynamic>? queryParameters,
  }) {
    return _dio.patch<T>(path, data: data, queryParameters: queryParameters);
  }
}

final authStorageProvider = Provider<AuthStorage>((ref) => AuthStorage());

final dioProvider = Provider<Dio>((ref) {
  final config = ref.watch(appConfigProvider);
  final storage = ref.watch(authStorageProvider);

  final dio = Dio(
    BaseOptions(
      baseUrl: config.apiBaseUrl,
      connectTimeout: const Duration(seconds: 20),
      receiveTimeout: const Duration(seconds: 30),
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
      },
    ),
  );

  dio.interceptors.add(PlatformClientInterceptor());
  dio.interceptors.add(authInterceptorFromStorage(storage));
  dio.interceptors.add(
    UnauthorizedInterceptor(
      onUnauthorized: () async {
        await storage.clearSession();
        ref.read(currentUserProvider.notifier).state = null;
        ref.read(sessionExpiredProvider.notifier).state = true;
      },
    ),
  );

  return dio;
});

final apiClientProvider = Provider<ApiClient>(
  (ref) => ApiClient(ref.watch(dioProvider)),
);
