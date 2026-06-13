import "package:flutter_secure_storage/flutter_secure_storage.dart";

/// Persists JWT access token for Bearer auth — never store server secrets here.
class AuthStorage {
  AuthStorage({FlutterSecureStorage? storage})
    : _storage =
          storage ??
          const FlutterSecureStorage(
            aOptions: AndroidOptions(encryptedSharedPreferences: true),
          );

  static const String accessTokenKey = "studyhouse_access_token";

  final FlutterSecureStorage _storage;

  Future<void> saveAccessToken(String token) async {
    await _storage.write(key: accessTokenKey, value: token);
  }

  Future<String?> readAccessToken() => _storage.read(key: accessTokenKey);

  Future<bool> hasAccessToken() async {
    final token = await readAccessToken();
    return token != null && token.isNotEmpty;
  }

  Future<void> clearAccessToken() => _storage.delete(key: accessTokenKey);
}
