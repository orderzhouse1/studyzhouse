import "dart:convert";

import "package:flutter_secure_storage/flutter_secure_storage.dart";

import "../../features/auth/models/auth_user.dart";
import "../utils/jwt_utils.dart";

/// Abstraction for secure key-value persistence (testable).
abstract class SecureStorageBackend {
  Future<void> write({required String key, required String? value});
  Future<String?> read({required String key});
  Future<void> delete({required String key});
}

class FlutterSecureStorageBackend implements SecureStorageBackend {
  FlutterSecureStorageBackend(this._storage);

  final FlutterSecureStorage _storage;

  @override
  Future<void> write({required String key, required String? value}) {
    if (value == null) return _storage.delete(key: key);
    return _storage.write(key: key, value: value);
  }

  @override
  Future<String?> read({required String key}) => _storage.read(key: key);

  @override
  Future<void> delete({required String key}) => _storage.delete(key: key);
}

/// In-memory backend for unit tests — not used in production.
class InMemorySecureStorageBackend implements SecureStorageBackend {
  final Map<String, String> data = {};

  @override
  Future<void> delete({required String key}) async {
    data.remove(key);
  }

  @override
  Future<String?> read({required String key}) async => data[key];

  @override
  Future<void> write({required String key, required String? value}) async {
    if (value == null) {
      data.remove(key);
      return;
    }
    data[key] = value;
  }
}

/// Persists JWT and cached user for session restore — never store passwords.
class AuthStorage {
  AuthStorage({SecureStorageBackend? backend})
    : _backend =
          backend ??
          FlutterSecureStorageBackend(
            const FlutterSecureStorage(
              aOptions: AndroidOptions(encryptedSharedPreferences: true),
              iOptions: IOSOptions(
                accessibility: KeychainAccessibility.first_unlock_this_device,
              ),
            ),
          );

  static const String accessTokenKey = "studyhouse_access_token";
  static const String refreshTokenKey = "studyhouse_refresh_token";
  static const String cachedUserKey = "studyhouse_cached_user";
  static const String tokenExpiresAtKey = "studyhouse_token_expires_at";

  final SecureStorageBackend _backend;

  Future<void> saveAccessToken(String token) async {
    await _backend.write(key: accessTokenKey, value: token);
    final expiresAt = JwtUtils.expiresAt(token);
    if (expiresAt != null) {
      await _backend.write(
        key: tokenExpiresAtKey,
        value: expiresAt.toUtc().toIso8601String(),
      );
    } else {
      await _backend.delete(key: tokenExpiresAtKey);
    }
  }

  Future<void> saveRefreshToken(String token) =>
      _backend.write(key: refreshTokenKey, value: token);

  Future<String?> readAccessToken() => _backend.read(key: accessTokenKey);

  Future<String?> readRefreshToken() => _backend.read(key: refreshTokenKey);

  Future<bool> hasAccessToken() async {
    final token = await readAccessToken();
    return token != null && token.isNotEmpty;
  }

  Future<bool> isAccessTokenExpired() async {
    final stored = await _backend.read(key: tokenExpiresAtKey);
    if (stored != null) {
      final parsed = DateTime.tryParse(stored);
      if (parsed != null) {
        return DateTime.now().toUtc().isAfter(parsed);
      }
    }
    final token = await readAccessToken();
    if (token == null || token.isEmpty) return true;
    return JwtUtils.isExpired(token);
  }

  Future<void> saveCachedUser(AuthUser user) async {
    await _backend.write(
      key: cachedUserKey,
      value: jsonEncode(user.toJson()),
    );
  }

  Future<AuthUser?> readCachedUser() async {
    final raw = await _backend.read(key: cachedUserKey);
    if (raw == null || raw.isEmpty) return null;
    try {
      final json = jsonDecode(raw);
      if (json is! Map<String, dynamic>) return null;
      return AuthUser.fromJson(json);
    } catch (_) {
      return null;
    }
  }

  Future<void> saveSession({
    required String accessToken,
    required AuthUser user,
    String? refreshToken,
  }) async {
    await saveAccessToken(accessToken);
    await saveCachedUser(user);
    if (refreshToken != null && refreshToken.isNotEmpty) {
      await saveRefreshToken(refreshToken);
    }
  }

  Future<void> clearAccessToken() => _backend.delete(key: accessTokenKey);

  Future<void> clearSession() async {
    await Future.wait([
      _backend.delete(key: accessTokenKey),
      _backend.delete(key: refreshTokenKey),
      _backend.delete(key: cachedUserKey),
      _backend.delete(key: tokenExpiresAtKey),
    ]);
  }
}
