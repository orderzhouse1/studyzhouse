# STUDYZHOUSE — Flutter Phase 1 (Scaffold)

**Scope:** Student app foundation only — no admin, no direct DB, no server secrets in the client.

---

## Packages

| Package | Purpose |
|---------|---------|
| `flutter_riverpod` | State / DI |
| `go_router` | Navigation (`/splash`, `/login`, `/home`, `/courses`, `/profile`) |
| `dio` | HTTP client to existing API |
| `flutter_secure_storage` | JWT `accessToken` storage |
| `cached_network_image` | Ready for course thumbnails (Phase 3+) |
| `flutter_svg` | Vector assets |
| `intl` | Formatting / locale helpers |
| `freezed_annotation`, `json_annotation` | Prepared for codegen (Phase 2+) |
| `build_runner`, `freezed`, `json_serializable` | Dev — run when adding `@freezed` models |

---

## App structure

```
apps/mobile/
  lib/
    main.dart
    src/
      app/           app.dart, router.dart, student_shell.dart
      core/
        config/      app_config.dart
        network/     api_client.dart, auth_interceptor.dart
        storage/     auth_storage.dart
        theme/       app_colors.dart, app_theme.dart
        widgets/     AppButton, AppTextField, AppScreen, …
        utils/       api_error_message.dart
      features/
        splash/
        auth/        login + repository (wired to POST /auth/login)
        home/        placeholder + logout
        courses/     placeholder
        profile/     placeholder
```

Architecture: **feature-first** with shared `core/` for config, network, theme, and widgets.

---

## How to run

```bash
cd apps/mobile
flutter pub get
flutter run --dart-define=API_BASE_URL=https://studyzhouse.com/api/v1
```

**Local API** (if you expose it on LAN/emulator):

```bash
# Android emulator → host machine
flutter run --dart-define=API_BASE_URL=http://10.0.2.2:4000/api/v1

# iOS simulator
flutter run --dart-define=API_BASE_URL=http://127.0.0.1:4000/api/v1
```

Adjust port to match `apps/api` (`PORT` in `.env`).

---

## API_BASE_URL

- Not a secret — safe in `--dart-define`.
- Default: `https://studyzhouse.com/api/v1` (`AppConfig.defaultApiBaseUrl`).
- **Never** put `DATABASE_URL`, `JWT_ACCESS_SECRET`, Google, or Resend keys in Flutter.

---

## Auth token storage

| Step | Behavior |
|------|----------|
| Login | `POST /auth/login` → `data.accessToken` saved via `AuthStorage.saveAccessToken` |
| Requests | `AuthInterceptor` adds `Authorization: Bearer <token>` |
| Splash | If token exists → `/home`; else → `/login` (no `/auth/me` yet) |
| Logout | `clearAccessToken()` + `context.go('/login')` |
| Web | Unchanged — cookies only |

Key: `studyhouse_access_token` in `flutter_secure_storage`.

---

## Phase 1 screens

| Route | Screen | Status |
|-------|--------|--------|
| `/splash` | Brand splash + token check | Done |
| `/login` | Arabic login UI | **Wired** to API |
| `/home` | Student home placeholder + logout | Done |
| `/courses` | Empty placeholder | Done |
| `/profile` | Empty placeholder | Done |

Signup / forgot password links show snackbar — **Phase 2**.

---

## Quality commands

```bash
cd apps/mobile
flutter pub get
dart format .
flutter analyze
flutter test
```

---

## Next phases

### Phase 2 — Auth screens — **done**

See [MOBILE_FLUTTER_PHASE_2.md](./MOBILE_FLUTTER_PHASE_2.md).

### Phase 3 — Student home & courses

- Dashboard API, explore, my courses, course detail
- `cached_network_image` + absolute thumbnail URLs

### Phase 4+

- Purchases, redeem, notifications, profile settings (see `docs/MOBILE_APP_PLAN.md`)

---

## Related

- `docs/MOBILE_APP_PLAN.md` — full mobile API inventory
- Backend Bearer auth — §12 in mobile plan
