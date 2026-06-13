# STUDYZHOUSE Mobile — Release Readiness

Student Flutter app (`apps/mobile`). Phases 1–6 complete for feature scope; store submission requires real-device QA and signing accounts.

## What is ready

- **Auth:** login, signup OTP, forgot password, session via Bearer + secure storage, global 401 handling
- **Courses:** home dashboard, explore (search/category/pricing), detail, saved, my courses
- **Learning:** YouTube player, lesson nav, mark complete, progress UI
- **Utilities:** redeem, CliQ payment requests, purchases history, notifications, profile edit, settings, help
- **API:** production default `https://studyzhouse.com/api/v1` (no secrets in client)
- **Theme:** Arabic RTL, navy `#151F35`, orange `#FA812F`
- **Tests:** unit tests for config, errors, models, validators, learn helpers
- **Android:** `INTERNET` permission (release manifest), display name STUDYZHOUSE, navy native splash
- **iOS:** display name STUDYZHOUSE (bundle id unchanged — see identity doc below)

## Must test on real devices

Complete [MOBILE_FLUTTER_PHASE_6_QA.md](./MOBILE_FLUTTER_PHASE_6_QA.md) on physical Android and iPhone before store upload.

Priority:

1. Auth + session expiry  
2. Learn player + enrollment gate  
3. Redeem + payment request  
4. Notifications deep links  
5. Offline / slow network behavior  

## Required accounts (later)

| Platform | Account | Status |
|----------|---------|--------|
| Google Play Console | Developer account | Not configured in repo — see [GOOGLE_PLAY_INTERNAL_TESTING.md](./GOOGLE_PLAY_INTERNAL_TESTING.md) |
| Apple Developer Program | Team account | Not configured in repo |

## Store listing assets needed

| Asset | Notes |
|-------|--------|
| App name | STUDYZHOUSE or ستادي هاوس |
| Short description | ~80 chars, Arabic + English if needed |
| Full description | Features: courses, learn, redeem, CliQ |
| Screenshots | Phone 6–8 screens: home, explore, learn, profile, redeem |
| Feature graphic | Android 1024×500 |
| App icon | 512×512 — from `assets/branding/app_icon.png` |
| Privacy policy | https://studyzhouse.com/privacy-policy |
| Terms | https://studyzhouse.com/terms |
| Refund policy | https://studyzhouse.com/refund-policy |
| Support email | support@studyhouse.app |

## Known limitations (v1)

- No Google Sign-In on mobile  
- No push notifications (in-app notifications only)  
- No offline video downloads  
- CliQ payments are **manual review** only (no in-app payment gateway)  
- No watch-time sync beyond mark-lesson-complete  
- No admin / super-admin in mobile app  
- Play upload requires local **`upload-keystore.jks`** + **`key.properties`** (see signing doc); without them, release builds use debug signing only  

## Android identity (current)

| Field | Value |
|-------|--------|
| Display name | STUDYZHOUSE (`strings.xml`) |
| Application ID | `com.studyzhouse.app` |
| Release signing | [ANDROID_RELEASE_SIGNING.md](./ANDROID_RELEASE_SIGNING.md) |

Uninstall old `com.studyzhouse.studyzhouse_mobile` debug APKs on test devices before testing the new package.

## iOS identity (current)

| Field | Value |
|-------|--------|
| Display name | STUDYZHOUSE |
| Bundle ID | Flutter default (`com.studyzhouse.studyzhouseMobile` or project setting) |
| Recommended | `com.studyzhouse.app` |

### Apple setup (future)

1. Create App ID in Apple Developer portal  
2. Provisioning profiles + signing in Xcode  
3. App Store Connect app record  
4. Privacy nutrition labels (data: email, usage for learning)  
5. TestFlight internal testing  

## Build commands

```bash
cd apps/mobile
flutter pub get

# Development
flutter run --dart-define=API_BASE_URL=https://studyzhouse.com/api/v1

# Staging (when available)
flutter run --dart-define=API_BASE_URL=https://YOUR-STAGING/api/v1

# Release APK
flutter build apk --release --dart-define=API_BASE_URL=https://studyzhouse.com/api/v1

# Play Store bundle
flutter build appbundle --release --dart-define=API_BASE_URL=https://studyzhouse.com/api/v1
```

### App icon & splash generation

After updating `assets/branding/app_icon.png`:

```bash
dart run flutter_launcher_icons
dart run flutter_native_splash:create
```

## Blockers before store release

1. ☐ Manual QA sign-off on real devices  
2. ☐ Create upload keystore + `key.properties` (Android) — [ANDROID_RELEASE_SIGNING.md](./ANDROID_RELEASE_SIGNING.md); App Store signing (iOS)  
3. ☐ Final bundle / application ID decision  
4. ☐ Play Console internal testing — [GOOGLE_PLAY_INTERNAL_TESTING.md](./GOOGLE_PLAY_INTERNAL_TESTING.md)  
5. ☐ Privacy policy URL live and linked in store consoles  
