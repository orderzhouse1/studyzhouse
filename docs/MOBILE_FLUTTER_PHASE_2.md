# STUDYZHOUSE — Flutter Phase 2 (Auth)

**Scope:** Full student auth UX — session validation, signup OTP, forgot password, global 401. No Google mobile, no admin, no course features yet.

---

## Routes

| Route | Screen |
|-------|--------|
| `/splash` | Token + `GET /auth/me` validation |
| `/login` | Login (`?message=` flash from splash / 401) |
| `/signup` | Signup step 1 (account) + step 2 (OTP) + success |
| `/forgot-password` | Email → OTP + new password → success |
| `/home`, `/courses`, `/profile` | Placeholders (unchanged) |

---

## Session validation (splash)

1. Read `studyhouse_access_token` from `flutter_secure_storage`.
2. No token → `/login`.
3. Token present → `GET /auth/me` with Bearer.
4. Active **STUDENT** → set `currentUserProvider` → `/home`.
5. 401 / invalid → clear token → `/login`.
6. ADMIN / SUPER_ADMIN → clear token → `/login?message=هذا التطبيق مخصص للطلاب فقط.`
7. Non-ACTIVE status → clear token → `/login` with Arabic API message when available.

---

## Global 401

`UnauthorizedInterceptor` on Dio:

- Applies only to **non-public** auth paths (not login/signup/forgot).
- Clears secure storage + `currentUserProvider`.
- Sets `sessionExpiredProvider` → app listens → `/login?message=انتهت جلستك…`
- Does not log tokens.

Public paths skip Bearer attachment (`auth_interceptor.dart`).

---

## Signup OTP

1. **Step 1:** `POST /auth/signup/request-otp` — fullName, email, password, confirmPassword, acceptTerms.
2. Show: «أرسلنا رمز التحقق إلى بريدك الإلكتروني.»
3. **Step 2:** 6-digit OTP + resend (`POST /auth/signup/resend-otp`) with cooldown from `resendAvailableAt`.
4. **Verify:** `POST /auth/signup/verify-otp` → success message → `/login` (no auto-login).

Terms/privacy open in browser via `url_launcher`:

- https://studyzhouse.com/terms
- https://studyzhouse.com/privacy-policy

---

## Forgot password

1. **Step 1:** `POST /auth/forgot-password/request-otp` — always show generic copy when no challenge.
2. If `challengeId` returned → step 2 (OTP + new password + resend).
3. **Verify:** `POST /auth/forgot-password/verify-otp` → success → `/login`.

Resend: `POST /auth/forgot-password/resend-otp` with `challengeId` + `email`.

---

## Run

```bash
cd apps/mobile
flutter pub get
flutter run --dart-define=API_BASE_URL=https://studyzhouse.com/api/v1
```

Local API example: `--dart-define=API_BASE_URL=http://10.0.2.2:4000/api/v1`

---

## Packages added (Phase 2)

- `url_launcher` — legal links on signup

---

## Error codes (Arabic)

Handled in `api_error_message.dart`: `VALIDATION_ERROR`, `OTP_*`, `DUPLICATE_EMAIL`, `RATE_LIMITED`, `EMAIL_NOT_CONFIGURED`, `ACCOUNT_*`, etc.

---

## After Phase 2 (Phase 3)

- Student dashboard API
- Explore / my courses / course detail
- Thumbnails (`cached_network_image`)
- See `docs/MOBILE_APP_PLAN.md`

---

## Related

- Phase 1: `docs/MOBILE_FLUTTER_PHASE_1.md`
- Backend Bearer: `docs/MOBILE_APP_PLAN.md` §12
