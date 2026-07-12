# App Store Review Notes — STUDYZHOUSE iOS

Use this text in **App Review Information → Notes**.

## iOS is a learning companion / reader-style app

The iOS app is a **learning companion for existing students**. It lets signed-in students continue learning from courses **already available in their account**.

- **Not a course marketplace** — there is no Explore / Courses catalog on iOS.
- **No purchase flow** inside the iOS app (no Apple IAP, no Stripe, no CliQ, no payment proof, no activation/redeem codes, no “buy on website” CTAs or external purchase links).
- **No prices** are shown on iOS.
- After login, students land on **My Courses / Continue Learning**.
- **Only enrolled courses** appear (including paid courses purchased on web/Android, and free courses already in the account).
- Direct links to courses the user is **not** enrolled in show a neutral “غير متاح” message with no lesson content and no purchase options.

## What reviewers can test

1. Log in with the test account.
2. Confirm bottom navigation has **Home / My Courses / Profile** only — no Explore / Courses catalog tab.
3. Open **My Courses** — enrolled courses open for learning; lessons track progress.
4. Confirm Home is learning-focused (Continue Learning, My Courses, progress) with no marketplace sections or prices.
5. Attempt a direct link to a paid course the account does **not** own — neutral unavailable message, no buy/pay CTAs.
6. Confirm empty My Courses (if applicable) shows only: «لا توجد كورسات في حسابك حاليًا.» with no purchase link.
7. **Settings → حذف الحساب والبيانات** — account deactivation with confirmation.

## Test account

Provide a reviewer account with:

- At least one **already enrolled** course (free and/or paid entitlement created on web/admin) so lessons can be opened and progress tracked.

New paid enrollments and marketplace browsing are **not** offered inside the iOS app.

## Technical

- Client sends `X-Client-Platform: ios` on API requests.
- Public `/courses` catalog for iOS does not return paid marketplace items (free-only or empty).
- `/student/my-courses` returns enrolled courses, including paid entitlements from web/Android.
- `/student/courses/:slug/learn` requires enrollment.
- Non-enrolled course detail/access is blocked for iOS clients.
- Backend: `https://studyzhouse.com/api/v1`
- Account deletion: `https://studyzhouse.com/account-deletion`

## Android / web

Paid course purchase (CliQ, activation codes, payment proof, catalog with prices) remains on **Android** and **web** only.
