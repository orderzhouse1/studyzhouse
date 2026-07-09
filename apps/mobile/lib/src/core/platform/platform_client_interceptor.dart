import "package:dio/dio.dart";
import "package:flutter/foundation.dart";

import "ios_course_policy.dart";

/// Sends `X-Client-Platform` so the API can apply iOS-only course filtering.
class PlatformClientInterceptor extends Interceptor {
  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) {
    if (IosCoursePolicy.isIOSPlatform) {
      options.headers["X-Client-Platform"] = "ios";
    } else if (!kIsWeb &&
        defaultTargetPlatform == TargetPlatform.android) {
      options.headers["X-Client-Platform"] = "android";
    }
    handler.next(options);
  }
}
