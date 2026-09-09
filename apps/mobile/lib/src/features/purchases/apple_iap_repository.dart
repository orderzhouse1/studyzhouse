import "package:dio/dio.dart";
import "package:flutter_riverpod/flutter_riverpod.dart";

import "../../core/network/api_client.dart";
import "../../core/network/api_envelope.dart";
import "../../core/utils/api_error_message.dart";

class AppleIapVerifyResult {
  const AppleIapVerifyResult({
    required this.courseId,
    required this.courseSlug,
    required this.alreadyUnlocked,
  });

  final String courseId;
  final String courseSlug;
  final bool alreadyUnlocked;

  factory AppleIapVerifyResult.fromJson(Map<String, dynamic> json) {
    final data = requireSuccessData(json);
    return AppleIapVerifyResult(
      courseId: data["courseId"] as String,
      courseSlug: data["courseSlug"] as String? ?? "",
      alreadyUnlocked: data["alreadyUnlocked"] as bool? ?? false,
    );
  }
}

class AppleIapRestoreResult {
  const AppleIapRestoreResult({
    required this.restoredCourseIds,
    required this.skippedProductIds,
  });

  final List<String> restoredCourseIds;
  final List<String> skippedProductIds;

  factory AppleIapRestoreResult.fromJson(Map<String, dynamic> json) {
    final data = requireSuccessData(json);
    return AppleIapRestoreResult(
      restoredCourseIds: (data["restoredCourseIds"] as List? ?? const [])
          .map((e) => e.toString())
          .toList(growable: false),
      skippedProductIds: (data["skippedProductIds"] as List? ?? const [])
          .map((e) => e.toString())
          .toList(growable: false),
    );
  }
}

class AppleIapRepository {
  AppleIapRepository(this._client);

  final ApiClient _client;

  Future<AppleIapVerifyResult> verifyPurchase({
    required String productId,
    required String transactionId,
    required String verificationData,
    String? courseId,
    String? purchaseDate,
    String? environment,
  }) async {
    try {
      final response = await _client.post<Map<String, dynamic>>(
        "/mobile/iap/apple/course/verify",
        data: {
          "courseId": ?courseId,
          "productId": productId,
          "transactionId": transactionId,
          "verificationData": verificationData,
          "purchaseDate": ?purchaseDate,
          "environment": ?environment,
        },
      );
      return AppleIapVerifyResult.fromJson(response.data!);
    } on DioException catch (e) {
      throw apiExceptionFromDio(e);
    }
  }

  Future<AppleIapRestoreResult> restorePurchases(
    List<Map<String, dynamic>> purchases,
  ) async {
    try {
      final response = await _client.post<Map<String, dynamic>>(
        "/mobile/iap/apple/restore",
        data: {"purchases": purchases},
      );
      return AppleIapRestoreResult.fromJson(response.data!);
    } on DioException catch (e) {
      throw apiExceptionFromDio(e);
    }
  }
}

final appleIapRepositoryProvider = Provider<AppleIapRepository>((ref) {
  return AppleIapRepository(ref.watch(apiClientProvider));
});
