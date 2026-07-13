# Google Play Release Checklist — STUDYZHOUSE (Android)

Student-only Flutter app · Package **`com.studyzhouse.app`** · Display name **STUDYZHOUSE**

**Reader / Learning Companion mode:** the Android app does **not** sell courses. Students sign in and continue learning from courses already in their account. No CliQ, redeem, prices, or Play Billing in-app. See `docs/GOOGLE_PLAY_READER_NOTES.md`.

This is the consolidated release-candidate checklist. Mark each item as you complete it.
**Do not commit keystores, passwords, or test credentials.** Fill secret/account values directly in Play Console, not in this repo.

Status legend: ✅ ready · ⚠️ action needed · ❌ missing/blocking

---

## 1. Build status (verified)

| Item | Result | Status |
|------|--------|--------|
| `flutter analyze` | No issues found | ✅ |
| `flutter test` | 49 tests passed | ✅ |
| `flutter build appbundle --release` | Built successfully | ✅ |
| AAB path | `apps/mobile/build/app/outputs/bundle/release/app-release.aab` | ✅ |
| AAB size | 43.43 MB (45,543,297 bytes) | ✅ |
| `compileSdk` | 36 | ✅ |
| `targetSdk` | 36 (≥ API 35 required) | ✅ |
| `minSdk` | 24 (Android 7.0) | ✅ |
| Release API URL | `https://studyzhouse.com/api/v1` (production HTTPS) | ✅ |
| No localhost/emulator URL in release | Confirmed (release ignores `.env`, uses dart-define/default) | ✅ |
| `.env` bundled in AAB | None found | ✅ |
| `usesCleartextTraffic` (release manifest) | `false` | ✅ |
| Release signing | Debug-signed (no upload keystore present) | ❌ |

> The only build-level blocker for **production** is release signing — see §2.

---

## 2. Release signing (action required before upload)

**Current state:** `android/key.properties` does **not** exist and no `KEYSTORE_*` env vars are set, so the release AAB is currently signed with the **debug** key. Gradle config already supports an upload keystore via `key.properties` or environment variables — only the keystore + properties file are missing.

`.gitignore` exclusions (verified in `apps/mobile/android/.gitignore`):

```
key.properties      ✅
**/*.keystore       ✅
**/*.jks            ✅
```

### Generate an upload keystore (run locally; never commit output)

```bash
keytool -genkey -v \
  -keystore upload-keystore.jks \
  -storetype JKS \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000 \
  -alias upload
```

Store `upload-keystore.jks` **outside** the repo (or in an ignored path) and back it up securely.

### `android/key.properties` template (no real passwords here)

```properties
storePassword=CHANGE_ME
keyPassword=CHANGE_ME
keyAlias=upload
storeFile=C:/secure/keystores/upload-keystore.jks
```

Then rebuild:

```bash
cd apps/mobile
flutter build appbundle --release --dart-define=API_BASE_URL=https://studyzhouse.com/api/v1
```

Full guide: [ANDROID_RELEASE_SIGNING.md](./ANDROID_RELEASE_SIGNING.md).

| Signing task | Status |
|--------------|--------|
| Upload keystore generated locally | ☐ |
| `key.properties` created (not committed) | ☐ |
| AAB rebuilt and signed with upload key | ☐ |
| Keystore + passwords backed up in a secure vault | ☐ |
| Enroll in Play App Signing on first upload | ☐ |

---

## 3. Store listing — text

| Field | Value / source | Status |
|-------|----------------|--------|
| App name | `STUDYZHOUSE` | ✅ |
| Default language | Arabic (العربية), RTL | ✅ |
| Short description (AR/EN) | Drafted in [GOOGLE_PLAY_INTERNAL_TESTING.md](./GOOGLE_PLAY_INTERNAL_TESTING.md) §6 | ✅ draft |
| Full description (AR/EN) | Drafted in [GOOGLE_PLAY_INTERNAL_TESTING.md](./GOOGLE_PLAY_INTERNAL_TESTING.md) §6 | ✅ draft |
| App category | **Education** | ✅ |
| Support email | `support@studyhouse.app` — confirm inbox monitored | ⚠️ verify |
| Privacy policy URL | `https://studyzhouse.com/privacy-policy` — confirm page is live | ⚠️ verify |
| Terms URL | `https://studyzhouse.com/terms` — confirm page is live | ⚠️ verify |
| Refund policy URL (if selling) | `https://studyzhouse.com/refund-policy` — only if monetizing | ⚠️ verify if needed |

---

## 4. Store listing — graphics/assets

| Asset | Spec | In repo? | Status |
|-------|------|----------|--------|
| App icon (hi-res) | 512×512 PNG | Source `apps/mobile/assets/branding/app_icon.png` (export 512×512) | ⚠️ export |
| Feature graphic | 1024×500 PNG/JPG | Not in repo | ❌ create |
| Phone screenshots | Min 2 (recommend 4–8) | Not in repo | ❌ capture |
| 7"/10" tablet screenshots | Optional v1 | Not in repo | ☐ optional |

> Do not fabricate screenshots — capture them from a real device/emulator running the release build. Suggested set: Home, Explore, Course detail, Learn player, Profile.

---

## 5. Data Safety (answers to enter in Play Console)

Based on current app behavior, declare the following. **This is documentation only — do not submit the form here.**

| Data type | Collected? | Why | Shared? |
|-----------|-----------|-----|---------|
| Name | Yes | Account profile / signup | No |
| Email address | Yes | Account auth, login, password reset (OTP) | No |
| Phone number | Yes (if user provides) | Profile / CliQ payment context | No |
| User account info (student profile) | Yes | Core LMS account | No |
| Course progress / learning activity | Yes | Lesson completion, my courses | No |
| Payment request data (CliQ) | Yes | Manual payment-request review by admin | No |
| Payment proof image (uploaded receipt) | Yes | Verify CliQ payment | No |
| In-app notifications data | Yes | Deliver/read in-app notifications | No |
| Photos (image picker) | Yes (only chosen receipt image) | Attach payment proof | No |
| Precise/approximate location | No | — | — |
| Device identifiers / advertising ID | No | No ads, no analytics SDK detected | — |
| Crash logs / analytics SDK | No | None integrated in this build | — |

Additional Data Safety answers to set:

| Console question | Suggested answer |
|------------------|------------------|
| Is data encrypted in transit? | Yes (HTTPS only; cleartext disabled) |
| Can users request deletion? | Provide account/data deletion path per platform policy |
| Is all collected data required? | Mostly required for account; receipt image optional |

| Data Safety task | Status |
|------------------|--------|
| Map each API field to a Data Safety category | ☐ |
| Confirm no analytics/ads SDK ships in release | ☐ |
| Provide account-deletion method/URL | ☐ |

---

## 6. App content / policy declarations

| Item | Answer / action | Status |
|------|-----------------|--------|
| App access | Login required (student account) — provide test credentials (§7) | ☐ |
| Ads | No ads | ☐ |
| Content rating | Complete IARC questionnaire honestly (Education, no objectionable content) | ☐ |
| Target audience & age | Set accurate age bands matching studyzhouse.com signup rules | ☐ |
| News app? | No | ☐ |
| COVID-19 / government app? | No | ☐ |
| Data safety form | See §5 | ☐ |

---

## 7. Test account for Google review (do NOT store real password in repo)

Google reviewers and internal testers need a working **student** login.

| Field | Value | Status |
|-------|-------|--------|
| Test student email | _enter in Play Console only_ | ❌ provide |
| Test student password | _enter in Play Console only_ | ❌ provide |
| Account has enrolled + free + paid course visibility | Verify before submitting | ☐ |
| Notes for reviewer (Arabic UI, student-only) | Add in "App access" instructions | ☐ |

---

## 8. Testers & release notes

| Item | Value / action | Status |
|------|----------------|--------|
| Internal testing testers list | Add team Gmail addresses (≤ 100) in Play Console | ❌ provide |
| Opt-in link shared with testers | After rollout to internal track | ☐ |
| Production release notes (AR) | Draft in [GOOGLE_PLAY_INTERNAL_TESTING.md](./GOOGLE_PLAY_INTERNAL_TESTING.md) §4 | ✅ draft |

---

## 9. Final gate before each track

| Track | Requirements | Status |
|-------|--------------|--------|
| Internal testing | Signed AAB + testers list + minimal listing | ⚠️ needs signing |
| Production | All of the above + complete store listing + graphics + Data Safety + content rating + test account | ❌ not yet |

---

## Related docs

- [ANDROID_RELEASE_SIGNING.md](./ANDROID_RELEASE_SIGNING.md) — keystore + signing setup
- [GOOGLE_PLAY_INTERNAL_TESTING.md](./GOOGLE_PLAY_INTERNAL_TESTING.md) — full listing text + console walkthrough
- [MOBILE_FLUTTER_PHASE_6_QA.md](./MOBILE_FLUTTER_PHASE_6_QA.md) — real-device QA sign-off matrix
- [MOBILE_RELEASE_READINESS.md](./MOBILE_RELEASE_READINESS.md)
