# App Store Review Notes — STUDYZHOUSE iOS

Use this text in **App Review Information → Notes**.

## iOS is a learning companion (no in-app purchases)

The iOS app is a **reader / course viewer for existing students**, similar to apps that let users access content they already own.

- **No purchase flow** inside the iOS app (no Apple IAP, no Stripe, no CliQ, no payment proof, no activation/redeem codes, no “buy on website” CTAs).
- **No prices** are shown on iOS.
- **Catalog / Explore / Home discover** list **free courses only**.
- **Enrolled paid courses** (purchased or activated on web/Android) appear in **My Courses** and **Continue Learning** so students can watch lessons — they are **not** offered as purchasable marketplace items.
- Direct links to paid courses the user is **not** enrolled in show a neutral “غير متاح” message with no lesson content.

## What reviewers can test

1. Log in with the test account.
2. Browse **Courses** — only free courses are listed; no prices or buy buttons.
3. Enroll in a **free** course and open lessons.
4. Open **My Courses** — enrolled courses (including any enrolled paid entitlements on the test account) open for learning.
5. Attempt a direct link to a paid course the account does **not** own — neutral unavailable message.
6. **Settings → حذف الحساب والبيانات** — account deactivation with confirmation.

## Test account

Provide a reviewer account with:

- At least one **free** course available for enrollment.
- Optionally one **already enrolled** paid course (entitlement created on web/admin) to demonstrate My Courses learning access.

Payments and new paid enrollments are **not** offered inside the iOS app.

## Technical

- Client sends `X-Client-Platform: ios` on API requests.
- API returns free courses only in public catalog for iOS; enrolled paid courses remain available via My Courses / learn / access.
- Backend: `https://studyzhouse.com/api/v1`
- Account deletion: `https://studyzhouse.com/account-deletion`

## Android / web

Paid course purchase (CliQ, activation codes) remains on **Android** and **web** only.
