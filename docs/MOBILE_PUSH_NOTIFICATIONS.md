# Mobile push notifications (FCM)

Phone-level push for the Flutter app (`apps/mobile`) using **Firebase Cloud Messaging**. This is separate from in-app notifications and from **web push** (VAPID).

## Status

Code and API endpoints are implemented. **Tray push is not verified** until:

1. Firebase Android/iOS apps are created and config files are installed
2. APNs key is uploaded to Firebase (iOS)
3. Backend Firebase Admin credentials are set
4. Migration `MobilePushToken` is applied
5. Real-device tests pass (Android + iPhone; **not** iOS Simulator)

## Manual Firebase / Apple / Android setup

### 1. Firebase Console

1. Create (or reuse) a Firebase project.
2. Add Android app with package `com.studyzhouse.app`.
3. Download `google-services.json` → place at:
   `apps/mobile/android/app/google-services.json`
4. Add iOS app with bundle id `com.studyzhouse.app`.
5. Download `GoogleService-Info.plist` → place at:
   `apps/mobile/ios/Runner/GoogleService-Info.plist`
6. (Optional) Run FlutterFire CLI to generate `firebase_options.dart` if you prefer explicit options; native plist/json alone is enough for `Firebase.initializeApp()`.

Do **not** commit service-account private keys. Config files with client IDs are usually OK; keep service accounts server-only.

### 2. APNs (required for real iOS push)

1. In Apple Developer → Keys → create an **APNs** key (.p8).
2. Firebase Console → Project settings → Cloud Messaging → Apple app configuration → upload the APNs auth key (Key ID + Team ID).
3. In Xcode (Runner target):
   - Signing & Capabilities → **Push Notifications**
   - **Background Modes** → enable **Background fetch** and **Remote notifications**
4. `Runner/Runner.entitlements` already includes `aps-environment` (development). For App Store / TestFlight, Xcode Automatic signing typically switches to production when the Push capability is enabled.
5. **Test on a physical iPhone only.** The iOS Simulator does not receive real remote push.

### 3. Backend env vars

Set **one** of:

| Variable | Description |
|----------|-------------|
| `FIREBASE_SERVICE_ACCOUNT_JSON` | Full service-account JSON as a single string (escape newlines in `private_key` as `\n`) |
| `FIREBASE_SERVICE_ACCOUNT_PATH` | Path to the service-account JSON file on the API host |

If neither is set, the API starts normally and logs that FCM is disabled. Token register/delete still work; `POST /mobile/push-test` returns `configured: false`.

Create the service account in Firebase Console → Project settings → Service accounts → Generate new private key. **Never** put this JSON in the Flutter app.

### 4. Database

Apply Prisma migration:

```bash
pnpm db:migrate:deploy
# or locally: pnpm db:migrate:dev
```

Creates table `MobilePushToken`.

## API endpoints (authenticated student)

Base: `/api/v1/mobile`

| Method | Path | Purpose |
|--------|------|---------|
| `POST` | `/push-tokens` | Register/update FCM token `{ token, platform: "android"\|"ios", deviceInfo? }` |
| `DELETE` | `/push-tokens/:token` | Deactivate token for the current user (URL-encode the token) |
| `POST` | `/push-test` | Send a test notification **only** to the current user's tokens |

In-app `createNotification` also attempts FCM delivery when Admin is configured.

## Flutter diagnostics

Settings → **تشخيص الإشعارات** (`/settings/push-diagnostics`):

- platform, permission, FCM token yes/no (masked), APNs yes/no (iOS)
- backend registration status
- last foreground / opened timestamps
- **إرسال إشعار تجريبي** (uses `/mobile/push-test`)

## Device test plan

### Android (physical device)

1. Install a build that includes `google-services.json`.
2. Log in → open **تشخيص الإشعارات** → confirm permission + FCM token + `registered`.
3. Tap **إرسال إشعار تجريبي** (or send from Firebase Console to the copied token).
4. **Foreground:** local notification / in-app handling.
5. **Background:** press Home → send again → tray notification appears.
6. **Terminated:** force-stop app → send again → tray notification → tap opens app; diagnostics “آخر فتح من إشعار” updates.

### iOS (physical iPhone)

Same as Android. Confirm APNs token exists in diagnostics. Simulator is **not** valid for this test.

## Release builds

- Android release receives FCM when `google-services.json` is present and Google Play services are available on the device.
- iOS release needs production APNs via the uploaded key and a properly signed build with Push capability.
