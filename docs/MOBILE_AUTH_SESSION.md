# Mobile auth session persistence

## Current behavior

- **Access token** is stored in `flutter_secure_storage` (Android encrypted shared preferences; iOS Keychain with `first_unlock_this_device`).
- **Cached user** JSON is stored alongside the token after login and after a successful `/auth/me` restore.
- **Passwords are never stored locally.**
- App startup runs `SplashScreen` → `AuthSessionRepository.validateSession()` → `/auth/me` when a token exists.

## Backend token lifetime

Production API issues JWT access tokens with `JWT_EXPIRES_IN` default **`12h`** (`apps/api/src/config/env.ts`).

There is **no refresh-token endpoint** in the API today. The mobile app:

- Keeps the user signed in while the JWT is valid.
- Clears secure storage and routes to login on **401/403** from protected routes.
- Does **not** fake a login or silently extend expired sessions.

## Follow-up (recommended)

Add a backend **refresh token** flow if sessions should last longer than 12 hours without re-login. Wire `AuthStorage.refreshTokenKey` and a single-attempt refresh in the Dio interceptor once `/auth/refresh` exists.

## Transient errors

If `/auth/me` fails due to network/timeout during startup, the stored token is **preserved** and splash shows retry (user stays signed in once connectivity returns).
