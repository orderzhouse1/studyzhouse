import "package:dio/dio.dart";
import "package:flutter_riverpod/flutter_riverpod.dart";

import "../../../core/network/api_client.dart";
import "../../../core/network/api_envelope.dart";
import "../../../core/utils/api_error_message.dart";
import "../models/activation_redeem.dart";
import "../models/notification_item.dart";
import "../models/payment_request.dart";
import "../models/student_profile_page.dart";

class StudentUtilitiesRepository {
  StudentUtilitiesRepository(this._client);

  final ApiClient _client;

  Future<ActivationRedeemResponse> redeemActivationCode(String code) async {
    try {
      final response = await _client.post<Map<String, dynamic>>(
        "/student/activation-codes/redeem",
        data: {"code": code.trim()},
      );
      return ActivationRedeemResponse.fromEnvelope(response.data ?? {});
    } on DioException catch (e) {
      throw apiExceptionFromDio(e);
    }
  }

  Future<PaymentInfo> getPaymentInfo() async {
    try {
      final response = await _client.get<Map<String, dynamic>>(
        "/student/payment-info",
      );
      return PaymentInfo.fromEnvelope(response.data ?? {});
    } on DioException catch (e) {
      throw apiExceptionFromDio(e);
    }
  }

  Future<List<PaymentRequestItem>> listPaymentRequests() async {
    try {
      final response = await _client.get<Map<String, dynamic>>(
        "/student/payment-requests",
      );
      final data = requireSuccessData(response.data ?? {});
      final list = data["items"] as List<dynamic>? ?? [];
      return list
          .whereType<Map<String, dynamic>>()
          .map(PaymentRequestItem.fromJson)
          .toList();
    } on DioException catch (e) {
      throw apiExceptionFromDio(e);
    }
  }

  Future<PaymentRequestItem> createPaymentRequest({
    required String courseId,
    required String paidAmount,
    String? paymentReference,
    String? payerName,
    String? payerPhone,
    String? note,
  }) async {
    try {
      final response = await _client.post<Map<String, dynamic>>(
        "/student/payment-requests",
        data: {
          "courseId": courseId,
          "paidAmount": paidAmount,
          if (paymentReference != null && paymentReference.isNotEmpty)
            "paymentReference": paymentReference,
          if (payerName != null && payerName.isNotEmpty) "payerName": payerName,
          if (payerPhone != null && payerPhone.isNotEmpty)
            "payerPhone": payerPhone,
          if (note != null && note.isNotEmpty) "note": note,
        },
      );
      final data = requireSuccessData(response.data ?? {});
      return PaymentRequestItem.fromJson(data);
    } on DioException catch (e) {
      throw apiExceptionFromDio(e);
    }
  }

  Future<List<StudentPurchaseItem>> listPurchases() async {
    try {
      final response = await _client.get<Map<String, dynamic>>(
        "/student/purchases",
      );
      final data = requireSuccessData(response.data ?? {});
      final list = data["items"] as List<dynamic>? ?? [];
      return list
          .whereType<Map<String, dynamic>>()
          .map(StudentPurchaseItem.fromJson)
          .toList();
    } on DioException catch (e) {
      throw apiExceptionFromDio(e);
    }
  }

  Future<NotificationsListResult> listNotifications({
    int page = 1,
    int pageSize = 40,
  }) async {
    try {
      final response = await _client.get<Map<String, dynamic>>(
        "/student/notifications",
        queryParameters: {"page": page, "pageSize": pageSize},
      );
      return NotificationsListResult.fromEnvelope(response.data ?? {});
    } on DioException catch (e) {
      throw apiExceptionFromDio(e);
    }
  }

  Future<int> getUnreadNotificationsCount() async {
    try {
      final response = await _client.get<Map<String, dynamic>>(
        "/student/notifications/unread-count",
      );
      if (response.data?["success"] != true) return 0;
      final data = response.data!["data"] as Map<String, dynamic>? ?? {};
      return (data["unreadCount"] as num?)?.toInt() ?? 0;
    } on DioException catch (e) {
      throw apiExceptionFromDio(e);
    }
  }

  Future<void> markNotificationRead(String notificationId) async {
    try {
      await _client.post<Map<String, dynamic>>(
        "/student/notifications/$notificationId/read",
        data: <String, dynamic>{},
      );
    } on DioException catch (e) {
      throw apiExceptionFromDio(e);
    }
  }

  Future<void> markAllNotificationsRead() async {
    try {
      await _client.post<Map<String, dynamic>>(
        "/student/notifications/read-all",
        data: <String, dynamic>{},
      );
    } on DioException catch (e) {
      throw apiExceptionFromDio(e);
    }
  }

  Future<StudentProfilePage> getProfile() async {
    try {
      final response = await _client.get<Map<String, dynamic>>(
        "/student/profile",
      );
      return StudentProfilePage.fromEnvelope(response.data ?? {});
    } on DioException catch (e) {
      throw apiExceptionFromDio(e);
    }
  }

  Future<StudentProfilePage> patchProfile(Map<String, dynamic> body) async {
    try {
      final response = await _client.patch<Map<String, dynamic>>(
        "/student/profile",
        data: body,
      );
      return StudentProfilePage.fromEnvelope(response.data ?? {});
    } on DioException catch (e) {
      throw apiExceptionFromDio(e);
    }
  }
}

final studentUtilitiesRepositoryProvider = Provider<StudentUtilitiesRepository>(
  (ref) {
    return StudentUtilitiesRepository(ref.watch(apiClientProvider));
  },
);

final notificationsUnreadProvider = FutureProvider.autoDispose<int>((
  ref,
) async {
  return ref
      .read(studentUtilitiesRepositoryProvider)
      .getUnreadNotificationsCount();
});
