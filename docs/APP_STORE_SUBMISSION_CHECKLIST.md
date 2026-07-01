# App Store Submission Checklist — STUDYZHOUSE iOS

Flutter app path: `apps/mobile`  
Bundle display name: **STUDYZHOUSE**  
Primary category: **Education**

---

## Pre-submission code gates (done in app)

- [x] iOS hides external payment flows (CliQ, proof upload, activation-code redeem UI)
- [x] iOS hides purchases/redeem navigation entry points
- [x] Paid course CTA on iOS: disabled «هذا الكورس غير متاح داخل iOS حاليًا»
- [x] Free enrollment + already-enrolled learning work on iOS
- [x] In-app account deletion in Settings (two-step, type «حذف»)
- [x] Production API: `https://studyzhouse.com/api/v1` (HTTPS)
- [ ] Apple In-App Purchase — **not implemented** (future phase; not required for first submission if paid courses show unavailable state only)

---

## App Store Connect metadata

| Field | Value |
|--------|--------|
| **App name** | STUDYZHOUSE |
| **Subtitle** | منصة تعليمية للطلاب (or English subtitle if listing is EN) |
| **Primary category** | Education |
| **Support URL** | `https://studyzhouse.com` (or dedicated support page) |
| **Privacy Policy URL** | `https://studyzhouse.com/privacy-policy` |
| **Account deletion URL** | `https://studyzhouse.com/account-deletion` |
| **Marketing URL** (optional) | `https://studyzhouse.com` |

### Paid courses (reviewer note)

> On iOS, the app does **not** expose external payments. Students can browse courses, enroll in **free** courses, and continue **already-enrolled** courses. New paid course purchase is **not available on iOS** in this release; Apple In-App Purchase is planned for a future phase.

---

## App Privacy (App Store Connect questionnaire)

Declare based on actual app behavior:

| Data type | Collected | Linked to user | Used for |
|-----------|-----------|--------------|----------|
| Email address | Yes | Yes | Account, login |
| Name | Yes | Yes | Profile |
| User ID | Yes | Yes | Account |
| Product interaction (course progress) | Yes | Yes | Learning |
| Crash data | If Firebase/Crashlytics added later — **not in current Flutter app** | — | — |
| Photos | **No on iOS** (image picker only on Android purchases flow) | — | — |
| Location | No | — | — |
| Contacts | No | — | — |
| Tracking / IDFA | No | — | — |

Tracking: **No** (no `NSUserTrackingUsageDescription`, no ad SDKs).

---

## Age rating

- Educational content; no gambling, unrestricted web, or mature themes in-app.
- Expect **4+** or regional equivalent unless App Store questionnaire flags user-generated content (none in student app).

---

## Screenshots (suggested set)

Capture on iPhone 6.7" and 6.5" (required sizes per App Store Connect):

1. **Home** — dashboard with quick actions (no redeem/purchases on iOS)
2. **Course catalog** — browse courses
3. **Course detail — free** — «التسجيل مجانًا»
4. **Course detail — paid locked** — «هذا الكورس غير متاح داخل iOS حاليًا»
5. **My Courses** — enrolled course with progress
6. **Lesson player** — video/lesson in progress
7. **Settings** — account section showing «حذف الحساب والبيانات»

---

## Review test account

Create a dedicated reviewer account on production (or staging if review build points there):

| Field | Placeholder |
|--------|-------------|
| Email | `appstore.review@studyhouse.app` |
| Password | `[SET_SECURE_PASSWORD_BEFORE_SUBMISSION]` |

Account should have:

1. At least one **free** course not yet enrolled
2. At least one **paid** course **already enrolled** (learning access)
3. At least one **paid** course **not enrolled** (disabled CTA)

---

## App Review notes (paste into App Store Connect)

```
STUDYZHOUSE — Student learning app (Arabic, RTL).

TEST ACCOUNT
Email: appstore.review@studyhouse.app
Password: [SET_SECURE_PASSWORD_BEFORE_SUBMISSION]

HOW TO TEST
1. Log in with the test account.
2. Browse courses from the Courses tab.
3. Open a FREE course → tap «التسجيل مجانًا» → confirm enrollment.
4. Open My Courses → open an enrolled course → tap «متابعة التعلّم» → start a lesson and mark progress.
5. Open a PAID course the account does NOT own → primary button is disabled with «هذا الكورس غير متاح داخل iOS حاليًا» (no external payment or website instructions).
6. Account deletion: Profile → Settings → «حذف الحساب والبيانات» → «حذف الحساب» → confirm → type «حذف» → account is deactivated and user is signed out.

PAYMENTS (iOS)
- External payment flows are NOT available on iOS: no CliQ, bank transfer, payment proof upload, or activation-code unlock in the app.
- CliQ and activation-code flows exist on Android/web only.
- iOS supports free course enrollment and access to courses already enrolled on the account (from web, Android, or admin).
- Paid in-app purchase via Apple IAP is planned for a future release; not included in this build.

TECHNICAL
- No special hardware required.
- Backend API (live): https://studyzhouse.com/api/v1
- Account deletion policy: https://studyzhouse.com/account-deletion
```

---

## iOS build (Mac required)

Windows/Linux cannot produce an iOS release binary. On a Mac with Xcode:

```bash
cd apps/mobile
flutter clean
flutter pub get
flutter analyze
flutter test
flutter build ios --release --dart-define=API_BASE_URL=https://studyzhouse.com/api/v1
```

Then in Xcode: open `ios/Runner.xcworkspace` → select **Any iOS Device** → **Product → Archive** → upload to App Store Connect / TestFlight.

---

## Info.plist / permissions audit

| Permission | Status | Notes |
|------------|--------|-------|
| Photo Library | **Not declared** | Correct — `image_picker` is only used on Android purchases screen; iOS payment UI is blocked before picker runs |
| Camera | Not declared | Not used |
| Microphone | Not declared | Not used |
| Location | Not declared | Not used |
| User Tracking (IDFA) | Not declared | Not used |
| ATS arbitrary loads | **Not enabled** | Default ATS applies; production API is HTTPS |

---

## Account deletion compliance

| Requirement | Status |
|-------------|--------|
| In-app deletion in Settings | Yes — «حذف الحساب والبيانات» |
| Confirmation dialog | Yes — two steps |
| Type «حذف» to confirm | Yes |
| API `POST /student/account/deactivate` | Yes |
| Logout + token cleared | Yes — `authRepository.logout()` after deactivate |
| Deleted account cannot log in | Yes — `403` + `ACCOUNT_DELETED` |
| Admin restore | Yes — admin can set student status back to `ACTIVE` |
| Public URL documents behavior | Yes — https://studyzhouse.com/account-deletion |

---

## TestFlight readiness

| Item | Ready? |
|------|--------|
| iOS payment policy in Flutter | Yes |
| Account deletion | Yes |
| Info.plist minimal permissions | Yes |
| Release build on Mac | **Pending** — run archive on Mac |
| App Store Connect app record | **Pending** — create app + metadata |
| Review test account on production API | **Pending** — create before submit |
| Screenshots | **Pending** |
| Privacy questionnaire | **Pending** — fill in Connect |

**Blockers before TestFlight:** Mac/Xcode archive upload, App Store Connect app setup, reviewer test account, screenshots, privacy labels.
