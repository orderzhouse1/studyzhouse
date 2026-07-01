# App Store Review Notes — STUDYZHOUSE iOS

Use this text in **App Review Information → Notes** (and adjust if IAP ships before submission).

## Payments and digital course access (iOS)

- The iOS app **does not offer external payment** for digital courses (no CliQ, bank transfer, WhatsApp, website checkout, or activation-code unlock in the UI).
- Students can:
  - **Browse** the course catalog
  - **Enroll in free courses** inside the app
  - **Continue learning** courses already enrolled via web, Android, or admin activation (existing entitlements are honored)
- **Paid courses not yet enrolled** show a neutral disabled state: «هذا الكورس غير متاح داخل iOS حاليًا» — no link or instruction to pay outside the app.
- **Apple In-App Purchase** for paid digital courses is planned for a future release (`iapEnabled` flag + `PurchaseCourseService` stub in the Flutter app). Until then, new paid enrollments on iOS are not sold in-app.

## Account deletion

- Signed-in students can **delete/deactivate their account in-app** from **Settings → حذف الحساب والبيانات**, with a two-step confirmation (type «حذف»).
- Deactivation calls `POST /api/v1/student/account/deactivate` and signs the user out.

## Test account

Provide a sandbox reviewer account with at least:

1. One **free** course available for enrollment
2. One **paid** course the account is **already enrolled** in (to verify learning access)
3. One **paid** course the account is **not** enrolled in (to verify the disabled purchase state)

## Platform parity

- **Android** continues to support CliQ payment requests, payment proof upload, and activation-code redeem (unchanged).
- **Web** student flows are unchanged.
