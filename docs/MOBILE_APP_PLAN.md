# STUDYZHOUSE — Flutter Mobile App Plan (Student MVP)

**Status:** Planning doc for Flutter MVP; **mobile Bearer auth is implemented on the API** (see §12).  
**Date:** June 2026  
**Scope:** Android + iOS student app; admin remains web-only.

---

## 1. Architecture summary (current stack)

| Layer | Technology | Notes |
|--------|------------|--------|
| API | Express (`apps/api`) | `/api/v1/*`, JSON envelope `{ success, data?, meta?, error? }` |
| Web | Next.js 15 (`apps/web`) | Proxies `/api/v1` → `API_INTERNAL_URL`; uses **HttpOnly cookie** + `credentials: "include"` |
| DB | PostgreSQL (Prisma / Neon) | **Mobile must never connect directly** |
| Shared contracts | `packages/shared` | Zod schemas — mirror in Dart via hand-written models or OpenAPI later |
| Auth token | JWT in cookie `studyhouse_access` + **Bearer** header | Web: cookie; mobile: `Authorization: Bearer` (see §12) |
| Student guard | `requireAuth` + `requireRole([STUDENT])` on `/student/*` | |
| Public data | `/courses`, `/categories` | No auth |
| Uploads | Static `/api/v1/uploads/*` | Thumbnails often **relative paths** |

---

## 2. API inventory (student-relevant)

Base path: **`/api/v1`**. All authenticated student routes require **active STUDENT** user.

### 2.1 Standard response envelope

**Success**

```json
{
  "success": true,
  "data": { },
  "meta": { "page": 1, "pageSize": 20, "total": 100, "totalPages": 5 }
}
```

**Error**

```json
{
  "success": false,
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "…",
    "details": {}
  }
}
```

Pagination defaults: `page=1`, `pageSize=20`, max `pageSize=100` (`packages/shared`).

---

### 2.2 Health

| Method | Path | Auth | Body | Response `data` | Cookies | Mobile-ready |
|--------|------|------|------|-----------------|---------|--------------|
| GET | `/health` | No | — | Health status object | No | Yes — app startup / connectivity check |

---

### 2.3 Auth (public + session)

| Method | Path | Auth | Request body | Response `data` | Cookies | Mobile-ready |
|--------|------|------|--------------|-----------------|---------|--------------|
| POST | `/auth/login` | No | `{ email, password }` | `{ user: AuthUser }` | **Sets** `studyhouse_access` HttpOnly JWT | **Partial** — works only if cookie jar used; **no token in body today** |
| POST | `/auth/logout` | No* | — | `{ ok: true }` | Clears cookie | Partial (cookie) |
| GET | `/auth/me` | Yes | — | `{ user: AuthUser }` | Reads cookie | **No** without cookie/Bearer change |
| POST | `/auth/signup/request-otp` | No | `SignupBody`: fullName, email, password, confirmPassword, acceptTerms: true | challengeId, expiresAt, resendAvailableAt, message | No | Yes |
| POST | `/auth/signup/verify-otp` | No | `{ challengeId, code }` (6 digits) | `{ user, message }` — **creates user, no session cookie** | No | Yes — then **login** required |
| POST | `/auth/signup/resend-otp` | No | `{ challengeId }` | expiresAt, resendAvailableAt, message | No | Yes |
| POST | `/auth/forgot-password/request-otp` | No | `{ email }` | Generic success message (anti-enumeration) | No | Yes |
| POST | `/auth/forgot-password/resend-otp` | No | `{ challengeId, email }` | Same shape as signup resend | No | Yes |
| POST | `/auth/forgot-password/verify-otp` | No | challengeId, code, newPassword, confirmPassword | Success message — **no cookie** | No | Yes |
| GET | `/auth/google` | No | Query `next?` | 302 redirect to Google | No | **Web only** (browser) |
| GET | `/auth/google/callback` | No | OAuth query | 302 redirect to `CLIENT_ORIGIN` + cookie | Sets cookie | **Web only** |
| POST | `/auth/signup` | No | — | **410** `SIGNUP_REQUIRES_OTP` | No | Deprecated |

**AuthUser:** `id`, `fullName`, `email`, `role`, `avatarUrl`, `status`.

**Rate limits:** signup, login, forgot-password, activation redeem — mobile must handle **429** with Arabic messages.

---

### 2.4 Public catalog

| Method | Path | Auth | Query | Response `data` | Cookies | Mobile-ready |
|--------|------|------|-------|-----------------|---------|--------------|
| GET | `/categories` | No | page, pageSize | `{ items: Category[] }` + meta | No | Yes |
| GET | `/courses` | No | page, pageSize, categorySlug?, search?, pricingType?, sort? | `{ items: PublicCourseDto[] }` + meta | No | Yes — **resolve thumbnail URLs** client-side |
| GET | `/courses/:slug` | No | — | Full public course detail (sections/lessons preview per controller) | No | Yes |

**PublicCourseDto (list/card):** id, title, slug, shortDescription, description, thumbnailUrl, pricingType, priceAmount, currency, level, estimatedDurationMinutes, publishedAt, category, lessonCount.

**thumbnailUrl:** Often relative e.g. `/api/v1/uploads/course-thumbnails/{file}.png` — prepend `API_PUBLIC_BASE_URL`.

---

### 2.5 Student — dashboard & courses

| Method | Path | Auth | Body / query | Response `data` (summary) | Cookies | Mobile-ready |
|--------|------|------|--------------|---------------------------|---------|--------------|
| GET | `/student/dashboard` | STUDENT | — | enrolledCoursesCount, completedLessonsCount, inProgressCoursesCount, overallProgressPercent, continueLearning? | Cookie only | After Bearer |
| GET | `/student/my-courses` | STUDENT | — | `{ items: enrolled \| pending_payment rows }` | Cookie only | After Bearer |
| GET | `/student/courses/:courseSlug/access` | STUDENT | — | courseId, isEnrolled, enrollmentId, progressPercent, pendingPaymentRequest, canEnrollFree | Cookie only | After Bearer |
| POST | `/student/courses/:courseSlug/enroll` | STUDENT | `{}` | Free enrollment result | Cookie only | After Bearer |
| GET | `/student/courses/:courseSlug/learn` | STUDENT | `lessonId?` | course, sections[], navigation, currentLesson, stats | Cookie only | After Bearer |
| POST | `/student/lessons/:lessonId/progress` | STUDENT | `{ watchedSeconds? }` | lessonProgress, enrollment.progressPercent | Cookie only | After Bearer |
| POST | `/student/lessons/:lessonId/complete` | STUDENT | `{}` | lessonProgress, enrollment.progressPercent | Cookie only | After Bearer |

**Learn payload highlights**

- `currentLesson`: youtubeVideoId, youtubeUrl, durationSeconds, progress (watchedSeconds, isCompleted, …)
- `sections[].lessons[]`: same video fields + progress per lesson
- Mobile player: **youtube_player_iframe** or **webview_flutter** using `youtubeVideoId`

---

### 2.6 Student — activation & payments

| Method | Path | Auth | Body | Response `data` | Cookies | Mobile-ready |
|--------|------|------|------|-----------------|---------|--------------|
| POST | `/student/activation-codes/redeem` | STUDENT | `{ code, courseId? }` | course, enrollment | Cookie only | After Bearer |
| GET | `/student/payment-info` | STUDENT | — | cliqAlias, cliqInstructions | Cookie only | After Bearer |
| POST | `/student/payment-requests` | STUDENT | courseId, paidAmount, paymentReference?, payerName?, payerPhone?, note?, proofImageBase64? | Created request | Cookie only | After Bearer — image picker → base64 |
| GET | `/student/payment-requests` | STUDENT | — | List of student's requests | Cookie only | After Bearer |
| GET | `/student/purchases` | STUDENT | — | `{ items: StudentPurchaseItem[] }` | Cookie only | After Bearer |

---

### 2.7 Student — profile & onboarding

| Method | Path | Auth | Body | Response `data` | Cookies | Mobile-ready |
|--------|------|------|------|-----------------|---------|--------------|
| GET | `/student/profile` | STUDENT | — | `{ account, profile }` — needsOnboarding, interests, goals, etc. | Cookie only | After Bearer |
| PATCH | `/student/profile` | STUDENT | Partial profile fields + fullName? | Updated profile page DTO | Cookie only | After Bearer |
| POST | `/student/onboarding/complete` | STUDENT | level, goals, interests, optional demographics | Profile DTO | Cookie only | After Bearer |
| POST | `/student/onboarding/skip` | STUDENT | `{}` | Profile DTO | Cookie only | After Bearer |

Option IDs: `STUDENT_INTEREST_IDS`, `STUDENT_LEARNING_GOAL_IDS` in `studentProfile.ts` — ship as constants in Flutter.

---

### 2.8 Student — notifications & saved

| Method | Path | Auth | Query / body | Response `data` | Cookies | Mobile-ready |
|--------|------|------|--------------|-----------------|---------|--------------|
| GET | `/student/notifications` | STUDENT | page, pageSize | items[], unreadCount (in list schema) | Cookie only | After Bearer |
| GET | `/student/notifications/unread-count` | STUDENT | — | `{ unreadCount }` | Cookie only | After Bearer |
| POST | `/student/notifications/read-all` | STUDENT | `{}` | — | Cookie only | After Bearer |
| POST | `/student/notifications/:notificationId/read` | STUDENT | `{}` | — | Cookie only | After Bearer |
| GET | `/student/saved-courses` | STUDENT | — | `{ items: saved + course card }` | Cookie only | After Bearer |
| GET | `/student/saved-courses/ids` | STUDENT | — | `{ courseIds: string[] }` | Cookie only | After Bearer — sync explore bookmarks |
| POST | `/student/courses/:courseId/save` | STUDENT | `{}` | `{ saved: true }` | Cookie only | After Bearer |
| DELETE | `/student/courses/:courseId/save` | STUDENT | — | `{ saved: false }` | Cookie only | After Bearer |

**notification `actionUrl`:** Web paths like `/learn/{slug}` — map to mobile deep routes in app router.

---

### 2.9 Not used in student MVP (reference only)

Admin (`/admin/*`), super-admin (`/super-admin/*`), uploads POST (admin-only). Legal content: **static web pages** — no API; open via `url_launcher`:

- `/privacy-policy`
- `/terms`
- `/refund-policy`

Help: compose from existing copy + links to legal URLs on production domain.

---

## 3. Auth strategy for mobile (recommendation)

### 3.1 Current behavior

| Step | Behavior |
|------|----------|
| Login | JWT signed → **HttpOnly cookie** `studyhouse_access`; JSON returns `user` only |
| `requireAuth` | **Only** `req.cookies[studyhouse_access]` — no `Authorization` header |
| Signup verify | Creates user — **no cookie**; user must login |
| Google OAuth | Browser redirect flow → cookie on callback to `CLIENT_ORIGIN` |
| Logout | Clears cookie; **no auth required** on route |
| CORS | Single `CLIENT_ORIGIN` + `credentials: true` (web) |

### 3.2 Options evaluated

| Option | Description | Pros | Cons |
|--------|-------------|------|------|
| **A** Cookie jar (Dio + `CookieManager`) | Mobile mimics browser | No API change | Fragile: domain, HTTPS, SameSite, no cookie after signup verify, Google OAuth unusable, hard to debug |
| **B** **Bearer JWT + keep web cookies** | Extend `requireAuth`; login returns `accessToken` in JSON | Web unchanged; secure storage on mobile; standard pattern | Small API change; must not log token |
| **C** Separate `/mobile/auth/*` | Duplicate endpoints | Isolation | Duplication, drift, unnecessary |

### 3.3 Recommended: **Option B** — **implemented on API**

See **§12 Mobile Auth Readiness Implemented** for what shipped.

Remaining for later:

- **Google Sign-In (mobile)** — `POST /auth/google/mobile` with `{ idToken }` (not implemented yet).
- Signup/forgot OTP verify still **do not** issue tokens — mobile must call `POST /auth/login` after verify.

**Flutter storage:** `flutter_secure_storage` for `accessToken` only — never `DATABASE_URL`, JWT secrets, or Resend keys in the app.

**Why not A:** Native app is not a same-site browser session; OTP signup never sets cookie; OAuth is redirect-based for web only.

---

## 4. Mobile app scope (student MVP)

### 4.1 In scope — screens

| Screen | Purpose | Primary APIs |
|--------|---------|--------------|
| Splash | Brand, load token, route | `/health`, `/auth/me` |
| Onboarding intro | First launch + API `needsOnboarding` | `/student/profile` |
| Login | Email/password | `/auth/login` |
| Signup — account | Form | `/auth/signup/request-otp` |
| Signup — OTP | 6-digit verify | verify + resend |
| Forgot password | 3-step OTP flow | forgot-password/* |
| Student home | Dashboard stats + continue | `/student/dashboard` |
| My courses | Enrolled + pending payment | `/student/my-courses` |
| Explore | Catalog + filters | `/courses`, `/categories`, saved ids |
| Course detail | Public detail + access CTA | `/courses/:slug`, `/student/courses/:slug/access` |
| Learn player | YouTube + syllabus + progress | learn, progress, complete |
| Redeem code | Activation | `/student/activation-codes/redeem` |
| Payment — CliQ | Info + submit proof | payment-info, payment-requests POST |
| Purchases | History | `/student/purchases` |
| Notifications | List + mark read | notifications/* |
| Saved courses | List + unsave | saved-courses |
| Profile | View/edit | profile GET/PATCH |
| Settings | Logout, legal links, version | logout, url_launcher |
| Help center | FAQ static + contact mailto | Local + `LEGAL_SUPPORT_EMAIL` |
| Legal | In-app WebView or external browser | `https://{domain}/privacy-policy` etc. |

### 4.2 Out of scope (v1)

- Admin / super-admin panels
- Course creation / builder
- Automated payment gateways (Stripe, etc.)
- Push notifications (FCM) — later
- Offline video download
- In-app chat support
- Desktop/tablet-specific layouts (responsive phone-first only)

### 4.3 RTL & theme

- `Directionality(textDirection: TextDirection.rtl)` at app root
- Locale: `ar` only for MVP
- Colors: navy `#151F35`, orange `#FA812F`, light surfaces `#F8FAFC` / card white
- Match web: rounded cards, soft shadows, premium Arabic LMS feel

---

## 5. Recommended Flutter architecture

### 5.1 Project layout (feature-first)

```
mobile/
  lib/
    main.dart
    app.dart
    core/
      config/           # env: API_BASE_URL (dart-define / flavors)
      network/
        api_client.dart
        api_exception.dart
        auth_interceptor.dart
      router/
        app_router.dart
      theme/
        app_colors.dart
        app_theme.dart
        app_typography.dart
      storage/
        secure_token_storage.dart
      widgets/          # buttons, fields, cards, skeletons, empty/error
      utils/
        url_resolver.dart # relative → absolute media URLs
    features/
      auth/
        data/
        domain/
        presentation/
      home/
      courses/
      learning/
      payments/
      notifications/
      profile/
      saved/
      settings/
      help/
```

**Layers per feature:** `presentation` (widgets + Riverpod) → `data` (repositories, DTOs) → calls `core/network`. Optional `domain` entities if complexity grows.

### 5.2 Recommended packages

| Package | Role | Why |
|---------|------|-----|
| **flutter_riverpod** | State + DI | Testable, scales with features, async providers for API |
| **go_router** | Navigation | Declarative routes, deep links, auth redirect guard |
| **dio** | HTTP | Interceptors for Bearer + errors; multipart later if needed |
| **freezed** + **json_serializable** | Models | Immutable DTOs aligned with API |
| **flutter_secure_storage** | Token | Encrypted at rest for `accessToken` |
| **cached_network_image** | Thumbnails | Catalog / my courses grids |
| **flutter_svg** | Icons/assets | Crisp icons, logo |
| **intl** | Dates/numbers | Arabic formatting |
| **url_launcher** | Legal, mailto, CliQ copy | External legal pages, support email |
| **youtube_player_iframe** | Video | Matches `youtubeVideoId` from API; fallback **webview_flutter** if iframe limits on device |
| **image_picker** | Payment proof | Convert to data URL for `proofImageBase64` |
| **connectivity_plus** (optional) | Offline hint | Graceful message when no network |
| **firebase_crashlytics** (later) | Crash reporting | Post-MVP |

**Not in MVP:** drift/hive offline DB, get_it (Riverpod sufficient), bloc (overlap with Riverpod).

### 5.3 Config

```dart
// Build-time / flavors — NEVER secrets
const apiBaseUrl = String.fromEnvironment(
  'API_BASE_URL',
  defaultValue: 'https://studyzhouse.com',
);
```

- Dev: `http://10.0.2.2:4000` (Android emulator) / LAN IP for physical device
- Prod: `https://studyzhouse.com` or dedicated API host
- All paths: `$apiBaseUrl/api/v1/...`

---

## 6. Design system (Flutter)

| Token | Value |
|-------|--------|
| Primary navy | `#151F35` |
| Accent orange | `#FA812F` |
| Background | `#F1F5F9` / `#F8FAFC` |
| Card | `#FFFFFF` |
| Text primary | `#151F35` |
| Text muted | `#64748B` |
| Error | destructive red aligned with web |
| Radius sm/md/lg | 8 / 12 / 16 / 24 |
| Spacing | 4, 8, 12, 16, 24, 32 |

**Components:** Filled orange primary button, outlined secondary, navy app bars, input fields with RTL labels, course cards (thumbnail, title, category chip, price), skeleton loaders for lists, empty states with CTA to Explore.

**Typography:** Use **Cairo** (Google Fonts) to match web.

**Responsive:** Single-column phone layout; max content width ~600 on large phones; no tablet-specific split view in v1.

---

## 7. Backend readiness checklist (before / during mobile build)

| # | Item | Priority | Notes |
|---|------|----------|-------|
| 1 | **Bearer token in `requireAuth`** | **Done** | `apps/api/src/lib/authToken.ts` |
| 2 | **`accessToken` in login response** | **Done** | `loginResponseDataSchema` |
| 3 | **Google mobile auth endpoint** | P1 | If Google login required in v1 |
| 4 | **Absolute media URL helper** | P1 | Optional `PUBLIC_API_URL` field on course DTOs, or document client resolver |
| 5 | **CORS** | N/A native | No change for Flutter |
| 6 | **Error codes stable** | P2 | Already consistent `error.code` — map in app |
| 7 | **Pagination** | OK | Use meta on courses/notifications |
| 8 | **actionUrl mapping** | P2 | Document web → mobile route map |
| 9 | **Rate limit UX** | P2 | Show Arabic message + retry-after from 429 |
| 10 | **Signup OTP email** | Ops | Resend configured on API server |
| 11 | **Optional `GET /config/public`** | P3 | cliq alias, support email, legal URLs without auth |
| 12 | **App version header** | P3 | `X-App-Version` for future deprecation |
| 13 | **Refresh token** | P3 | JWT 12h — v1: re-login; later refresh flow |

**Do not add to Flutter:** `DATABASE_URL`, `JWT_ACCESS_SECRET`, `RESEND_API_KEY`, `ACTIVATION_CODE_PEPPER`, Google client secret.

---

## 8. Implementation phases

### Phase 1 — Scaffold + theme + router

**Create:** `mobile/` Flutter project, `core/theme`, `core/router`, `core/widgets`, splash shell, flavor config.

**Endpoints:** `GET /health` (optional).

**Acceptance criteria**

- App launches RTL Arabic with navy/orange theme
- Routes defined for all MVP screens (placeholders)
- `API_BASE_URL` documented for dev/prod

**Checks:** `flutter analyze`, run on emulator iOS/Android.

---

### Phase 2 — Auth

**Create:** `features/auth`, `core/network` + Dio + secure storage, auth guard in `go_router`.

**Endpoints:** login, logout, me, signup OTP×3, forgot-password×3.

**Depends on:** Backend Option B (Bearer + accessToken).

**Acceptance criteria**

- Login persists session across app restart
- Signup → OTP → success → login
- Forgot password completes
- 401 clears token → login screen
- Web regression: login still uses cookie (manual smoke)

**Checks:** Integration against local API; no token in logs.

---

### Phase 3 — Student home + courses

**Create:** `features/home`, `features/courses` (explore, detail, my courses), URL resolver for thumbnails.

**Endpoints:** dashboard, my-courses, categories, courses list/detail, access, enroll, saved ids/save/unsave.

**Acceptance criteria**

- Home shows stats and continue learning
- Explore filters by category/search
- Course detail shows enroll / pay / redeem CTAs from access endpoint
- Free enroll works
- Save/unsave from catalog

**Checks:** Pagination; empty states; relative image URLs resolve.

---

### Phase 4 — Learn player + progress

**Create:** `features/learning`, YouTube player screen, syllabus drawer.

**Endpoints:** learn, progress POST, complete POST.

**Acceptance criteria**

- Plays current lesson via youtubeVideoId
- Next/previous lesson navigation
- Progress updates and complete marks lesson
- Enrollment progressPercent updates on home/my courses

**Checks:** Background/foreground resume; lesson switch without crash.

---

### Phase 5 — Payments, notifications, profile, polish

**Create:** `features/payments`, `notifications`, `profile`, `settings`, `help`, legal links.

**Endpoints:** payment-info, payment-requests, purchases, notifications, profile, onboarding, redeem.

**Acceptance criteria**

- CliQ flow: show alias, submit reference + optional image
- Purchases list statuses
- Notifications list + unread badge + mark read
- Profile edit + onboarding gate after first login
- Redeem code enrolls course
- Settings: logout, open legal URLs

**Checks:** Large proof image size limit (7MB base64); permission prompts for gallery.

---

### Phase 6 — QA & release prep

**Create:** Store listings assets, privacy labels, ProGuard/R8 rules, iOS ATS exception only if needed for dev.

**Acceptance criteria**

- Test matrix: Android 10+, iOS 15+
- Production API smoke
- No secrets in APK/IPA (scan build artifacts)
- Crash-free core flows

**Checks:** `flutter test`, manual regression script, optional Firebase later.

---

## 9. Web compatibility guarantee

All proposed API changes for Option B are **additive**:

- Web continues `credentials: "include"` and HttpOnly cookie
- No removal of cookie-based auth
- No changes to admin routes
- Flutter-only consumers use Bearer header

---

## 10. Open questions for product owner

1. Is **Google Sign-In** required in mobile v1 or email-only first?
2. Production **API base URL** — same as web (`studyzhouse.com`) or separate API subdomain?
3. Legal pages — in-app WebView vs external browser?
4. Minimum OS versions for store submission?

---

## 11. Related docs

- `docs/PRODUCTION_DEPLOYMENT_AUDIT.md` — env / SSR / API URL
- `README.md` — Resend, JWT, CliQ via super-admin settings
- `packages/shared/src/schemas/*` — source of truth for request/response shapes

---

## 12. Mobile Auth Readiness Implemented

**Shipped in API** (web unchanged):

| Area | Behavior |
|------|----------|
| **Web** | `POST /auth/login` still sets HttpOnly cookie `studyhouse_access`; `credentials: "include"` on fetch; web client **does not** use `accessToken` from JSON |
| **Mobile (Flutter)** | After login, store `data.accessToken` in **`flutter_secure_storage`**; send `Authorization: Bearer <token>` on every authenticated request |
| **`requireAuth`** | Cookie first (if present), else `Authorization: Bearer`; same JWT verification and DB role/status checks |
| **Secrets** | Never put `DATABASE_URL`, `JWT_ACCESS_SECRET`, or Resend keys in Flutter — only the issued JWT |

**Login response** (`POST /api/v1/auth/login`):

```json
{
  "success": true,
  "data": {
    "user": { "id", "fullName", "email", "role", "avatarUrl", "status" },
    "accessToken": "<jwt>"
  }
}
```

**Tests:** `apps/api/src/integration/mobile-bearer-auth.integration.test.ts` (requires `TEST_DATABASE_URL`).

**Not in this phase:**

- Server-side token revocation on logout (mobile deletes token locally).
- Google OAuth for native (web redirect flow unchanged).
