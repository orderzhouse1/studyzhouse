import "dart:io";

import "package:dio/dio.dart";
import "package:flutter_riverpod/flutter_riverpod.dart";

import "../network/api_client.dart";
import "../network/api_envelope.dart";
import "../utils/api_error_message.dart";

class MobilePushRepository {
  MobilePushRepository(this._client);

  final ApiClient _client;

  Future<void> registerToken({
    required String token,
    required String platform,
    String? deviceInfo,
  }) async {
    try {
      final response = await _client.post<Map<String, dynamic>>(
        "/mobile/push-tokens",
        data: {
          "token": token,
          "platform": platform,
          if (deviceInfo != null && deviceInfo.isNotEmpty)
            "deviceInfo": deviceInfo,
        },
      );
      requireSuccessData(
        Map<String, dynamic>.from(response.data ?? const {}),
      );
    } on DioException catch (e) {
      throw apiExceptionFromDio(e);
    }
  }

  Future<void> deleteToken(String token) async {
    try {
      // Let Dio encode the path once; do not pre-encode (avoids %25 double-encoding).
      final response = await _client.delete<Map<String, dynamic>>(
        "/mobile/push-tokens/$token",
      );
      requireSuccessData(
        Map<String, dynamic>.from(response.data ?? const {}),
      );
    } on DioException catch (e) {
      throw apiExceptionFromDio(e);
    }
  }

  Future<MobilePushTestResult> sendTest() async {
    try {
      final response = await _client.post<Map<String, dynamic>>(
        "/mobile/push-test",
      );
      final data = requireSuccessData(
        Map<String, dynamic>.from(response.data ?? const {}),
      );
      return MobilePushTestResult(
        sent: data["sent"] == true,
        configured: data["configured"] == true,
        messageId: data["messageId"] as String?,
        reason: data["reason"] as String?,
      );
    } on DioException catch (e) {
      throw apiExceptionFromDio(e);
    }
  }
}

class MobilePushTestResult {
  const MobilePushTestResult({
    required this.sent,
    required this.configured,
    this.messageId,
    this.reason,
  });

  final bool sent;
  final bool configured;
  final String? messageId;
  final String? reason;
}

final mobilePushRepositoryProvider = Provider<MobilePushRepository>((ref) {
  return MobilePushRepository(ref.watch(apiClientProvider));
});

String mobilePushPlatformName() {
  if (Platform.isIOS) return "ios";
  if (Platform.isAndroid) return "android";
  return Platform.operatingSystem;
}
