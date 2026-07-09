# App Store Review Notes — STUDYZHOUSE iOS

Use this text in **App Review Information → Notes**.

## iOS is a free-courses-only app

The iOS app is **limited to free digital courses only** to comply with App Store Guideline 3.1.1.

- **No paid courses** appear in catalog, search, home, My Courses, saved courses, or course detail.
- **No access to paid lesson content** on iOS — even if the student enrolled on web or Android.
- **No external payment** flows: no CliQ, payment proof upload, activation-code unlock, or purchase CTAs.
- **No Apple In-App Purchase** in this build (planned for a future phase).

## What reviewers can test

1. Log in with the test account.
2. Browse **Courses** — only free courses are listed.
3. Enroll in a **free** course and open lessons.
4. Open **My Courses** — only free enrollments appear.
5. Attempt a direct link to a paid course slug (if provided) — neutral “غير متاح” message, no lesson content.
6. **Settings → حذف الحساب والبيانات** — account deactivation with confirmation.

## Test account

Provide a reviewer account with at least one **free** course available for enrollment.

Do **not** rely on paid-course entitlements for iOS review — they are intentionally hidden and blocked.

## Technical

- Client sends `X-Client-Platform: ios` on API requests.
- API filters paid courses and denies paid learn/access endpoints for iOS clients.
- Backend: `https://studyzhouse.com/api/v1`
- Account deletion: `https://studyzhouse.com/account-deletion`

## Android / web

Paid course purchase (CliQ, activation codes) remains on **Android** and **web** only.
