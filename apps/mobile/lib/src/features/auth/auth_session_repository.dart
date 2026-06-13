import "package:dio/dio.dart";
import "package:flutter_riverpod/flutter_riverpod.dart";

import "../../core/auth/auth_messages.dart";
import "../../core/network/api_client.dart";
import "../../core/network/api_exception.dart";
import "../../core/storage/auth_storage.dart";
import "../../core/utils/api_error_message.dart";
import "models/auth_me_response.dart";
import "models/auth_user.dart";
import "models/session_validation_result.dart";

class AuthSessionRepository {
  AuthSessionRepository(this._client, this._storage);

  final ApiClient _client;
  final AuthStorage _storage;

  Future<SessionValidationResult> validateSession() async {
    final hasToken = await _storage.hasAccessToken();
    if (!hasToken) return const SessionNoToken();

    try {
      final user = await fetchMe();
      final result = _validateUser(user);
      if (result is SessionValid) {
        return result;
      }
      await _storage.clearAccessToken();
      return result;
    } on DioException catch (e) {
      if (e.response?.statusCode == 401) {
        await _storage.clearAccessToken();
        final parsed = parseApiErrorEnvelope(e.response?.data);
        return SessionInvalid(message: parsed?.message);
      }
      await _storage.clearAccessToken();
      return SessionInvalid(message: messageFromDioError(e));
    } on ApiException catch (e) {
      await _storage.clearAccessToken();
      return SessionInvalid(message: e.message);
    } catch (_) {
      await _storage.clearAccessToken();
      return const SessionInvalid();
    }
  }

  Future<AuthUser> fetchMe() async {
    final response = await _client.get<Map<String, dynamic>>("/auth/me");
    final body = response.data;
    if (body == null) {
      throw ApiException(message: "استجابة فارغة من الخادم.");
    }
    return AuthMeResponse.fromEnvelope(body).user;
  }

  SessionValidationResult _validateUser(AuthUser user) {
    if (!user.isStudent) {
      return const SessionNotStudent();
    }
    if (user.status != "ACTIVE") {
      return SessionNotActive(
        user.status == "SUSPENDED"
            ? "تم تعليق حسابك. تواصل مع الدعم."
            : "حسابك غير متاح.",
      );
    }
    return SessionValid(user);
  }

  Future<void> clearSession() => _storage.clearAccessToken();

  static String messageForLoginRedirect(SessionValidationResult result) {
    return switch (result) {
      SessionNotStudent() => AuthMessages.studentOnly,
      SessionNotActive(:final message) => message,
      SessionInvalid(:final message) => message ?? AuthMessages.sessionExpired,
      _ => "",
    };
  }
}

final authSessionRepositoryProvider = Provider<AuthSessionRepository>((ref) {
  return AuthSessionRepository(
    ref.watch(apiClientProvider),
    ref.watch(authStorageProvider),
  );
});
