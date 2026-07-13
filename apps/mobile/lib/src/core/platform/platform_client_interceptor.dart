import "package:dio/dio.dart";
import "package:flutter/foundation.dart";

/// Sends `X-Client-Platform` so the API applies mobile reader filtering.
class PlatformClientInterceptor extends Interceptor {
  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) {
    if (!kIsWeb && defaultTargetPlatform == TargetPlatform.iOS) {
      options.headers["X-Client-Platform"] = "ios";
    } else if (!kIsWeb && defaultTargetPlatform == TargetPlatform.android) {
      options.headers["X-Client-Platform"] = "android";
    }
    handler.next(options);
  }
}
