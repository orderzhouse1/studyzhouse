# Android Release Signing — STUDYZHOUSE Mobile

Production application ID: **`com.studyzhouse.app`**

Display name: **STUDYZHOUSE** (unchanged)

> **Never commit** `upload-keystore.jks`, `key.properties`, or passwords to Git.

---

## 1. Generate upload keystore (one-time, on your machine)

From any directory (keystore stays local):

```bash
keytool -genkey -pairalg RSA -keysize 2048 -sigalg SHA256withRSA \
  -keystore upload-keystore.jks \
  -alias upload \
  -validity 10000
```

You will be prompted for:

- Keystore password (store password)
- Key password (can match store password)
- Name / organization (for certificate DN)

Move the file to:

```
apps/mobile/android/upload-keystore.jks
```

Back up `upload-keystore.jks` and passwords in a **password manager** or secure vault. Loss blocks Play Store updates for the same app id.

---

## 2. Create `key.properties` (local only)

Copy the template:

```bash
cd apps/mobile/android
cp key.properties.example key.properties
```

Edit `apps/mobile/android/key.properties`:

```properties
storePassword=YOUR_STORE_PASSWORD
keyPassword=YOUR_KEY_PASSWORD
keyAlias=upload
storeFile=upload-keystore.jks
```

`storeFile` is relative to `apps/mobile/android/`.

Confirm both are ignored by Git:

- `android/key.properties`
- `android/**/*.jks`

---

## 3. Gradle configuration (already in repo)

File: `apps/mobile/android/app/build.gradle.kts`

- `applicationId` / `namespace`: `com.studyzhouse.app`
- Release signing uses `key.properties` when present
- **Fallback:** if no keystore, release builds use **debug** signing so local `flutter build` still works
- **CI alternative:** environment variables (no `key.properties` file on disk):

| Variable | Description |
|----------|-------------|
| `KEYSTORE_PATH` | Absolute path to `.jks` |
| `KEY_ALIAS` | e.g. `upload` |
| `STORE_PASSWORD` | Keystore password |
| `KEY_PASSWORD` | Key password (optional; defaults to store password) |

---

## 4. Build release APK (optional smoke test)

```bash
cd apps/mobile
flutter pub get
flutter build apk --release --dart-define=API_BASE_URL=https://studyzhouse.com/api/v1
```

Output: `build/app/outputs/flutter-apk/app-release.apk`

---

## 5. Build Play Store App Bundle (required for Play Console)

```bash
cd apps/mobile
flutter build appbundle --release --dart-define=API_BASE_URL=https://studyzhouse.com/api/v1
```

Verify output exists:

```
apps/mobile/build/app/outputs/bundle/release/app-release.aab
```

Upload **`app-release.aab`** in [Google Play Console](https://play.google.com/console) → Internal testing. Step-by-step: [GOOGLE_PLAY_INTERNAL_TESTING.md](./GOOGLE_PLAY_INTERNAL_TESTING.md).

---

## 6. Package rename note (first upload only)

| | Before | After |
|---|--------|--------|
| applicationId | `com.studyzhouse.studyzhouse_mobile` | `com.studyzhouse.app` |

Safe because the app was **not** published to Play yet. After publishing `com.studyzhouse.app`, the application id cannot change.

Uninstall old debug APKs with the previous package name from test devices before installing the new id.

---

## 7. Warnings

- **Never** commit `upload-keystore.jks`, `key.properties`, or passwords.
- Do not put signing secrets in `dart-define` or Flutter code.
- Play App Signing: Google may re-sign with an app signing key; keep your upload key safe.
- Release builds without `key.properties` are signed with debug keys — **not** for Play upload.

---

## 8. Quality checks before upload

```bash
cd apps/mobile
dart format .
flutter analyze
flutter test
flutter build appbundle --release --dart-define=API_BASE_URL=https://studyzhouse.com/api/v1
```

---

## Related docs

- [MOBILE_RELEASE_READINESS.md](./MOBILE_RELEASE_READINESS.md)
- [MOBILE_FLUTTER_PHASE_6_QA.md](./MOBILE_FLUTTER_PHASE_6_QA.md)
- [apps/mobile/README.md](../apps/mobile/README.md)
