import "dart:convert";

import "package:dio/dio.dart";
import "package:flutter_test/flutter_test.dart";
import "package:studyzhouse_mobile/src/core/network/api_client.dart";
import "package:studyzhouse_mobile/src/core/storage/auth_storage.dart";
import "package:studyzhouse_mobile/src/features/auth/auth_session_repository.dart";
import "package:studyzhouse_mobile/src/features/auth/models/auth_user.dart";
import "package:studyzhouse_mobile/src/features/auth/models/session_validation_result.dart";

const _testUser = AuthUser(
  id: "u1",
  fullName: "طالب",
  email: "s@example.com",
  role: "STUDENT",
  status: "ACTIVE",
);

void main() {
  group("AuthSessionRepository.validateSession", () {
    late InMemorySecureStorageBackend backend;
    late AuthStorage storage;
    late AuthSessionRepository repository;

    setUp(() {
      backend = InMemorySecureStorageBackend();
      storage = AuthStorage(backend: backend);
      repository = AuthSessionRepository(
        ApiClient(Dio()),
        storage,
      );
    });

    test("returns SessionNoToken when storage is empty", () async {
      final result = await repository.validateSession();
      expect(result, isA<SessionNoToken>());
    });

    test("restores session when token exists and /auth/me succeeds", () async {
      await storage.saveSession(
        accessToken: _validJwt(),
        user: _testUser,
      );

      final repo = AuthSessionRepository(
        ApiClient(Dio()),
        storage,
        fetchMe: () async => _testUser,
      );

      final result = await repo.validateSession();
      expect(result, isA<SessionValid>());
      expect((result as SessionValid).user.email, "s@example.com");
      expect((await storage.readCachedUser())?.email, _testUser.email);
    });

    test("clears session on 401 from /auth/me", () async {
      await storage.saveSession(accessToken: _validJwt(), user: _testUser);

      final repo = AuthSessionRepository(
        ApiClient(Dio()),
        storage,
        fetchMe: () async {
          throw DioException(
            requestOptions: RequestOptions(path: "/auth/me"),
            response: Response(
              requestOptions: RequestOptions(path: "/auth/me"),
              statusCode: 401,
            ),
            type: DioExceptionType.badResponse,
          );
        },
      );

      final result = await repo.validateSession();
      expect(result, isA<SessionInvalid>());
      expect(await storage.hasAccessToken(), isFalse);
    });

    test("keeps token on transient network error", () async {
      await storage.saveSession(accessToken: _validJwt(), user: _testUser);

      final repo = AuthSessionRepository(
        ApiClient(Dio()),
        storage,
        fetchMe: () async {
          throw DioException(
            requestOptions: RequestOptions(path: "/auth/me"),
            type: DioExceptionType.connectionError,
          );
        },
      );

      final result = await repo.validateSession();
      expect(result, isA<SessionRestoreFailed>());
      expect(await storage.hasAccessToken(), isTrue);
    });

    test("clears session when JWT is expired locally", () async {
      await storage.saveSession(
        accessToken: _jwt(
          exp: DateTime.now().toUtc().subtract(const Duration(hours: 1)),
        ),
        user: _testUser,
      );

      final result = await repository.validateSession();
      expect(result, isA<SessionInvalid>());
      expect(await storage.hasAccessToken(), isFalse);
    });
  });
}

String _validJwt() => _jwt(
  exp: DateTime.now().toUtc().add(const Duration(hours: 2)),
);

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
