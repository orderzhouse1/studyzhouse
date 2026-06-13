import "package:dio/dio.dart";
import "package:flutter_riverpod/flutter_riverpod.dart";

import "../../core/auth/auth_messages.dart";
import "../../core/network/api_client.dart";
import "../../core/network/api_envelope.dart";
import "../../core/network/api_exception.dart";
import "../../core/storage/auth_storage.dart";
import "../../core/utils/api_error_message.dart";
import "../../core/auth/current_user_provider.dart";
import "models/login_response.dart";
import "models/otp_challenge_response.dart";

class AuthRepository {
  AuthRepository(this._client, this._storage, this._ref);

  final ApiClient _client;
  final AuthStorage _storage;
  final Ref _ref;

  Future<LoginResponse> login({
    required String email,
    required String password,
  }) async {
    try {
      final response = await _client.post<Map<String, dynamic>>(
        "/auth/login",
        data: {"email": email.trim().toLowerCase(), "password": password},
      );

      final body = response.data;
      if (body == null) {
        throw ApiException(message: "استجابة فارغة من الخادم.");
      }

      final login = LoginResponse.fromEnvelope(body);

      if (!login.user.isStudent) {
        await _storage.clearAccessToken();
        throw ApiException(
          message: AuthMessages.studentOnly,
          code: "STUDENT_ONLY",
        );
      }

      if (login.user.status != "ACTIVE") {
        await _storage.clearAccessToken();
        throw ApiException(
          message: codeToArabic("ACCOUNT_NOT_ACTIVE"),
          code: "ACCOUNT_NOT_ACTIVE",
        );
      }

      await _storage.saveAccessToken(login.accessToken);
      _ref.read(currentUserProvider.notifier).state = login.user;
      return login;
    } on DioException catch (e) {
      throw apiExceptionFromDio(e);
    } on ApiException {
      rethrow;
    } catch (_) {
      throw ApiException(message: "تعذّر تسجيل الدخول.");
    }
  }

  Future<OtpChallengeResponse> requestSignupOtp({
    required String fullName,
    required String email,
    required String password,
    required String confirmPassword,
    required bool acceptTerms,
  }) async {
    try {
      final response = await _client.post<Map<String, dynamic>>(
        "/auth/signup/request-otp",
        data: {
          "fullName": fullName.trim(),
          "email": email.trim().toLowerCase(),
          "password": password,
          "confirmPassword": confirmPassword,
          "acceptTerms": acceptTerms,
        },
      );
      final data = requireSuccessData(response.data ?? {});
      return OtpChallengeResponse.fromJson(data);
    } on DioException catch (e) {
      throw apiExceptionFromDio(e);
    }
  }

  Future<MessageResponse> verifySignupOtp({
    required String challengeId,
    required String code,
  }) async {
    try {
      final response = await _client.post<Map<String, dynamic>>(
        "/auth/signup/verify-otp",
        data: {"challengeId": challengeId, "code": code.trim()},
      );
      final data = requireSuccessData(response.data ?? {});
      return MessageResponse.fromJson(data);
    } on DioException catch (e) {
      throw apiExceptionFromDio(e);
    }
  }

  Future<OtpResendResponse> resendSignupOtp({
    required String challengeId,
  }) async {
    try {
      final response = await _client.post<Map<String, dynamic>>(
        "/auth/signup/resend-otp",
        data: {"challengeId": challengeId},
      );
      final data = requireSuccessData(response.data ?? {});
      return OtpResendResponse.fromJson(data);
    } on DioException catch (e) {
      throw apiExceptionFromDio(e);
    }
  }

  Future<ForgotPasswordRequestResponse> requestForgotPasswordOtp({
    required String email,
  }) async {
    try {
      final response = await _client.post<Map<String, dynamic>>(
        "/auth/forgot-password/request-otp",
        data: {"email": email.trim().toLowerCase()},
      );
      final data = requireSuccessData(response.data ?? {});
      return ForgotPasswordRequestResponse.fromJson(data);
    } on DioException catch (e) {
      throw apiExceptionFromDio(e);
    }
  }

  Future<OtpResendResponse> resendForgotPasswordOtp({
    required String challengeId,
    required String email,
  }) async {
    try {
      final response = await _client.post<Map<String, dynamic>>(
        "/auth/forgot-password/resend-otp",
        data: {"challengeId": challengeId, "email": email.trim().toLowerCase()},
      );
      final data = requireSuccessData(response.data ?? {});
      return OtpResendResponse.fromJson(data);
    } on DioException catch (e) {
      throw apiExceptionFromDio(e);
    }
  }

  Future<MessageResponse> verifyForgotPasswordOtp({
    required String challengeId,
    required String code,
    required String newPassword,
    required String confirmPassword,
  }) async {
    try {
      final response = await _client.post<Map<String, dynamic>>(
        "/auth/forgot-password/verify-otp",
        data: {
          "challengeId": challengeId,
          "code": code.trim(),
          "newPassword": newPassword,
          "confirmPassword": confirmPassword,
        },
      );
      final data = requireSuccessData(response.data ?? {});
      return MessageResponse.fromJson(data);
    } on DioException catch (e) {
      throw apiExceptionFromDio(e);
    }
  }

  Future<void> logout() async {
    await _storage.clearAccessToken();
    _ref.read(currentUserProvider.notifier).state = null;
  }

  Future<bool> hasStoredToken() => _storage.hasAccessToken();
}

final authRepositoryProvider = Provider<AuthRepository>((ref) {
  return AuthRepository(
    ref.watch(apiClientProvider),
    ref.watch(authStorageProvider),
    ref,
  );
});
