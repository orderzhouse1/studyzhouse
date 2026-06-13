# Flutter Phase 5 — Student Utilities

Student account utilities wired to the existing Express API (`/api/v1/student/*`). Arabic RTL, navy `#151F35` and orange `#FA812F`. No admin, Google mobile sign-in, push notifications, WebSockets, or offline downloads.

## Routes

| Route | Screen |
|-------|--------|
| `/profile` | Account hub (حسابي) |
| `/profile/edit` | Profile editing |
| `/redeem` | Activation code redeem |
| `/purchases` | CliQ payment requests + purchase history |
| `/notifications` | In-app notifications list |
| `/settings` | Account info, password link, legal links, logout |
| `/help` | Help center FAQ |

## API endpoints

| Feature | Method | Path |
|---------|--------|------|
| Redeem | POST | `/student/activation-codes/redeem` `{ code }` |
| Payment info | GET | `/student/payment-info` |
| Payment requests | GET, POST | `/student/payment-requests` |
| Purchases | GET | `/student/purchases` |
| Notifications | GET | `/student/notifications` |
| Unread count | GET | `/student/notifications/unread-count` |
| Mark read | POST | `/student/notifications/:id/read` |
| Mark all read | POST | `/student/notifications/read-all` |
| Profile | GET, PATCH | `/student/profile` |
| Paid courses (form) | GET | `/courses?pricingType=PAID` |

## Legal URLs

- https://studyzhouse.com/privacy-policy
- https://studyzhouse.com/terms
- https://studyzhouse.com/refund-policy

## Architecture

```
lib/src/features/utilities/
  models/          # activation, payments, notifications, profile
  repositories/    # student_utilities_repository.dart
  redeem_screen.dart
  purchases_screen.dart
  notifications_screen.dart
  profile_edit_screen.dart
  settings_screen.dart
  help_screen.dart
lib/src/core/utils/action_url_mapper.dart
lib/src/core/constants/legal_urls.dart
lib/src/core/constants/profile_options.dart
```

## Behavior notes

- **Redeem:** Maps API error codes (`INVALID_CODE`, `CODE_EXPIRED`, etc.) via `codeToArabic`. Success navigates to `/learn/:slug`.
- **Purchases:** Manual CliQ review copy; create uses `paidAmount`, `paymentReference`, `note` (API field names). Shows request history badges and purchase list.
- **Notifications:** Unread styling; `mapActionUrlToMobileRoute` for `/learn/:slug`, `/my-courses`, `/purchases`, `/saved`. External URLs open in browser.
- **Profile:** PATCH safe fields only; email read-only.
- **Settings:** `/forgot-password` for password change; legal links; logout.
- **Help:** Static Arabic FAQ cards + support email.

## Tests

`test/phase5_utilities_test.dart` — model parsing, `action_url_mapper`, validators, activation error codes.

## Quality

```bash
cd apps/mobile
flutter pub get
dart format .
flutter analyze
flutter test
```

## Next

Phase 6 — QA and release preparation (device matrix, env configs, store assets, E2E smoke).
