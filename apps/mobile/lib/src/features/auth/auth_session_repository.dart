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

typedef FetchMeFn = Future<AuthUser> Function();

class AuthSessionRepository {
  AuthSessionRepository(
    this._client,
    this._storage, {
    FetchMeFn? fetchMe,
  }) : _fetchMe = fetchMe;

  final ApiClient _client;
  final AuthStorage _storage;
  final FetchMeFn? _fetchMe;

  /// Restores session from secure storage + `/auth/me`.
  ///
  /// Clears storage only when the token is missing, locally expired, or the
  /// backend rejects the session (401/403). Transient network errors keep the
  /// stored token so the user can retry without logging in again.
  Future<SessionValidationResult> validateSession() async {
    final hasToken = await _storage.hasAccessToken();
    if (!hasToken) return const SessionNoToken();

    if (await _storage.isAccessTokenExpired()) {
      await _storage.clearSession();
      return const SessionInvalid(message: AuthMessages.sessionExpired);
    }

    try {
      final user = await _loadMe();
      final result = _validateUser(user);
      if (result is SessionValid) {
        await _storage.saveCachedUser(user);
        return result;
      }
      await _storage.clearSession();
      return result;
    } on DioException catch (e) {
      if (_shouldClearSessionForStatus(e.response?.statusCode)) {
        await _storage.clearSession();
        final parsed = parseApiErrorEnvelope(e.response?.data);
        return SessionInvalid(
          message: parsed?.message ?? messageFromDioError(e),
        );
      }
      return SessionRestoreFailed(message: messageFromDioError(e));
    } on ApiException catch (e) {
      if (_shouldClearSessionForStatus(e.statusCode)) {
        await _storage.clearSession();
        return SessionInvalid(message: e.message);
      }
      return SessionRestoreFailed(message: e.message);
    } catch (_) {
      return const SessionRestoreFailed();
    }
  }

  Future<AuthUser> _loadMe() => _fetchMe?.call() ?? fetchMe();

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

  Future<void> clearSession() => _storage.clearSession();

  static String messageForLoginRedirect(SessionValidationResult result) {
    return switch (result) {
      SessionNotStudent() => AuthMessages.studentOnly,
      SessionNotActive(:final message) => message,
      SessionInvalid(:final message) => message ?? AuthMessages.sessionExpired,
      _ => "",
    };
  }

  static bool _shouldClearSessionForStatus(int? statusCode) {
    return statusCode == 401 || statusCode == 403;
  }
}

final authSessionRepositoryProvider = Provider<AuthSessionRepository>((ref) {
  return AuthSessionRepository(
    ref.watch(apiClientProvider),
    ref.watch(authStorageProvider),
  );
});
