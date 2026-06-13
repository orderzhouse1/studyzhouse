# STUDYZHOUSE Mobile (Flutter)

Student-only app. Uses existing API with Bearer token (no DB or server secrets in the client).

## Docs

- [Phase 1 — Scaffold](../../docs/MOBILE_FLUTTER_PHASE_1.md)
- [Phase 2 — Auth](../../docs/MOBILE_FLUTTER_PHASE_2.md)
- [Phase 3 — Home + Courses](../../docs/MOBILE_FLUTTER_PHASE_3.md)
- [Phase 4 — Learn Player](../../docs/MOBILE_FLUTTER_PHASE_4.md)
- [Phase 5 — Student Utilities](../../docs/MOBILE_FLUTTER_PHASE_5.md)
- [Phase 6 — QA & Release](../../docs/MOBILE_FLUTTER_PHASE_6.md)
- [Manual QA Checklist](../../docs/MOBILE_FLUTTER_PHASE_6_QA.md)
- [Release Readiness](../../docs/MOBILE_RELEASE_READINESS.md)
- [Android Release Signing](../../docs/ANDROID_RELEASE_SIGNING.md)
- [Google Play Internal Testing](../../docs/GOOGLE_PLAY_INTERNAL_TESTING.md)

## Environment

API URL (public, no secrets): edit **`apps/mobile/.env`** (copy from `.env.example`).

| Mode | Priority |
|------|----------|
| **Debug** (`flutter run`) | `.env` أولاً — يتجاهل `--dart-define` إن وُجد |
| **Release** | `--dart-define` → ثم الإنتاج الافتراضي |

| Environment | `.env` value |
|---------------|----------------|
| Local + Android emulator | `http://10.0.2.2:4000/api/v1` |
| Production | `https://studyzhouse.com/api/v1` |

```bash
cd apps/mobile
cp .env.example .env   # first time
flutter run -d emulator-5554
```

See [LOCAL_DEV_ANDROID.md](../../docs/LOCAL_DEV_ANDROID.md).

## Run

```bash
flutter pub get
flutter run --dart-define=API_BASE_URL=https://studyzhouse.com/api/v1
```

## Release builds

```bash
flutter build apk --release --dart-define=API_BASE_URL=https://studyzhouse.com/api/v1
flutter build appbundle --release --dart-define=API_BASE_URL=https://studyzhouse.com/api/v1
```

## App icon & splash

Source: `assets/branding/app_icon.png` (from web logo).

```bash
dart run flutter_launcher_icons
dart run flutter_native_splash:create
```

## Quality

```bash
dart format .
flutter analyze
flutter test
```

## Auth routes

`/splash` → `/login` | `/home` (session via `/auth/me`)  
`/signup` · `/forgot-password` · logout clears token locally

## Student utility routes

`/profile` (hub) · `/profile/edit` · `/redeem` · `/purchases` · `/notifications` · `/settings` · `/help`

## Android identity

- Display name: **STUDYZHOUSE**
- Application ID: `com.studyzhouse.app`
- Upload signing: see [Android Release Signing](../../docs/ANDROID_RELEASE_SIGNING.md) (`android/key.properties` + `upload-keystore.jks`, local only)

## iOS identity

- Display name: **STUDYZHOUSE**
- Bundle ID: configure in Xcode before App Store upload (`com.studyzhouse.app` recommended)
