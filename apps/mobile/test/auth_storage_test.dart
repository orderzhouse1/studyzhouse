import "dart:convert";

import "package:flutter_test/flutter_test.dart";
import "package:studyzhouse_mobile/src/core/storage/auth_storage.dart";
import "package:studyzhouse_mobile/src/core/utils/jwt_utils.dart";
import "package:studyzhouse_mobile/src/features/auth/models/auth_user.dart";

const _testUser = AuthUser(
  id: "u1",
  fullName: "طالب",
  email: "s@example.com",
  role: "STUDENT",
  status: "ACTIVE",
);

void main() {
  group("AuthStorage", () {
    late InMemorySecureStorageBackend backend;
    late AuthStorage storage;

    setUp(() {
      backend = InMemorySecureStorageBackend();
      storage = AuthStorage(backend: backend);
    });

    test("saveSession persists access token and cached user", () async {
      await storage.saveSession(accessToken: "token-abc", user: _testUser);

      expect(await storage.readAccessToken(), "token-abc");
      expect((await storage.readCachedUser())?.email, _testUser.email);
      expect(await storage.hasAccessToken(), isTrue);
    });

    test("clearSession removes token and cached user", () async {
      await storage.saveSession(accessToken: "token-abc", user: _testUser);
      await storage.clearSession();

      expect(await storage.readAccessToken(), isNull);
      expect(await storage.readCachedUser(), isNull);
      expect(await storage.hasAccessToken(), isFalse);
    });

    test("logout path clears all session keys", () async {
      await storage.saveSession(
        accessToken: "token-abc",
        user: _testUser,
        refreshToken: "refresh-xyz",
      );
      await storage.clearSession();

      expect(backend.data, isEmpty);
    });
  });

  group("JwtUtils", () {
    test("detects expired token from exp claim", () {
      final expired = _jwt(
        exp: DateTime.now().toUtc().subtract(const Duration(hours: 1)),
      );
      expect(JwtUtils.isExpired(expired), isTrue);
    });

    test("accepts valid future token", () {
      final valid = _jwt(
        exp: DateTime.now().toUtc().add(const Duration(hours: 2)),
      );
      expect(JwtUtils.isExpired(valid), isFalse);
    });
  });
}

String _jwt({required DateTime exp}) {
  final header = base64Url
      .encode(utf8.encode('{"alg":"HS256"}'))
      .replaceAll("=", "");
  final payload = base64Url
      .encode(
        utf8.encode(
          jsonEncode({"exp": exp.millisecondsSinceEpoch ~/ 1000}),
        ),
      )
      .replaceAll("=", "");
  return "$header.$payload.signature";
}
