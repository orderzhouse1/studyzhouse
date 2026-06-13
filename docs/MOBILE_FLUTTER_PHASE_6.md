# Flutter Phase 6 — QA, Polish, and Release Preparation

No major new student features. Focus: stability, polish, documentation, release readiness.

## Deliverables

| Part | Artifact |
|------|----------|
| QA checklist | [MOBILE_FLUTTER_PHASE_6_QA.md](./MOBILE_FLUTTER_PHASE_6_QA.md) |
| Release readiness | [MOBILE_RELEASE_READINESS.md](./MOBILE_RELEASE_READINESS.md) |
| App config | `AppConfig` — production HTTPS default, empty URL fallback |
| Android | `INTERNET` in main manifest, `STUDYZHOUSE` label, navy splash `#151F35` |
| iOS | `CFBundleDisplayName` = STUDYZHOUSE |
| Icon/splash tooling | `flutter_launcher_icons`, `flutter_native_splash`, `assets/branding/app_icon.png` |
| Error polish | `userFacingErrorMessage`, `ErrorState` on utilities screens |
| Tests | config, network errors, friendly error helper |

## Run & build

See [apps/mobile/README.md](../apps/mobile/README.md).

## Icon source

Brand icon copied from `apps/web/public/logo.png` → `apps/mobile/assets/branding/app_icon.png`.

Regenerate platform icons:

```bash
cd apps/mobile
dart run flutter_launcher_icons
dart run flutter_native_splash:create
```

## Package name note

Android application ID updated to `com.studyzhouse.app` in Phase 7. See [ANDROID_RELEASE_SIGNING.md](./ANDROID_RELEASE_SIGNING.md).

## Next

Execute full QA checklist on devices → configure release signing → store listings → TestFlight / internal testing track.
