# Apple IAP Implementation — STUDYZHOUSE

**Date:** 2026-09-09  
**Scope:** Non-Consumable Apple IAP for all 25 paid published courses.

## What changed

### Data mapping
- Script: `prisma/map-apple-iap-products-from-csv.ts`
- Source: `docs/app_store_connect_iap_products_setup.csv`
- Sets `Course.appleProductId` + `iosPurchasable=true` for all 25 paid published courses
- Migration: `prisma/migrations/20260909120000_apple_iap_purchase_status/` adds purchase `status`, `revokedAt`, `rawSignedTransaction`, `updatedAt`

### Backend
- Real App Store Server API verification (`apps/api/src/lib/appleAppStoreServer.ts`)
- Unlock only after server verification; refuses unlock if Apple env missing
- Endpoints:
  - `POST /api/v1/mobile/iap/apple/course/verify` (auth student)
  - `POST /api/v1/mobile/iap/apple/restore` (auth student)
  - `POST /api/v1/mobile/iap/apple/notifications` (App Store Server Notifications V2)
  - `GET /api/v1/student/course-entitlements` (auth student)
  - Legacy aliases kept: `POST /api/v1/student/iap/verify`, `/iap/restore`
- iOS catalog: free + IAP-mapped paid
- Android reader behavior unchanged (free catalog / enrolled-only)
- iOS learn: paid courses require Apple IAP mapping even if enrolled via web

### Flutter (iOS)
- Dependency: `in_app_purchase`
- StoreKit query / purchase / restore + server verify
- Course detail shows Apple price + «شراء الكورس عبر Apple» + «استعادة المشتريات»
- No Stripe / CliQ / bank / proof / activation / promo / external links on iOS
- Android remains reader companion (no IAP marketplace)

## Required env vars (API)

```bash
APPLE_BUNDLE_ID=com.studyzhouse.app
APPLE_APP_APPLE_ID=<numeric App Store Connect app id>
APPLE_IAP_ISSUER_ID=<App Store Connect API issuer UUID>
APPLE_IAP_KEY_ID=<In-App Purchase key id>
APPLE_IAP_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
APPLE_IAP_ENVIRONMENT=sandbox   # or production
```

- API boots without these vars.
- Purchase verify/restore returns `APPLE_IAP_NOT_CONFIGURED` (503) and never unlocks.

## Configure Apple server key

1. App Store Connect → Users and Access → Integrations → In-App Purchase
2. Create key → download `.p8` once
3. Set `APPLE_IAP_KEY_ID`, `APPLE_IAP_ISSUER_ID`, paste PEM into `APPLE_IAP_PRIVATE_KEY` (use `\n` for newlines in env)
4. Set `APPLE_BUNDLE_ID=com.studyzhouse.app`
5. Set `APPLE_APP_APPLE_ID` from App Information → Apple ID
6. Sandbox: `APPLE_IAP_ENVIRONMENT=sandbox`
7. Configure Server Notifications URL:
   `https://studyzhouse.com/api/v1/mobile/iap/apple/notifications`

## Mapped Product IDs (25)

```
studyzhouse_course_full_stack_with_ai_and_vibe_coding
studyzhouse_course_mharh_altqryr
studyzhouse_course_mharh_altqryr_albhth_alaam
studyzhouse_course_mharh_altqryr_albhth_alamyq
studyzhouse_course_mharh_altqryr_drash_alhalh
studyzhouse_course_mharh_altqryr_drash_aljdwa
studyzhouse_course_mswdh_kwrs
studyzhouse_course_mswdh_kwrs_1
studyzhouse_course_mswdh_kwrs_10
studyzhouse_course_mswdh_kwrs_11
studyzhouse_course_mswdh_kwrs_12
studyzhouse_course_mswdh_kwrs_13
studyzhouse_course_mswdh_kwrs_14
studyzhouse_course_mswdh_kwrs_15
studyzhouse_course_mswdh_kwrs_16
studyzhouse_course_mswdh_kwrs_17
studyzhouse_course_mswdh_kwrs_18
studyzhouse_course_mswdh_kwrs_2
studyzhouse_course_mswdh_kwrs_3
studyzhouse_course_mswdh_kwrs_4
studyzhouse_course_mswdh_kwrs_5
studyzhouse_course_mswdh_kwrs_6
studyzhouse_course_mswdh_kwrs_7
studyzhouse_course_mswdh_kwrs_8
studyzhouse_course_mswdh_kwrs_9
```

## Sandbox / TestFlight testing

1. Set API env to sandbox + deploy API
2. Create Sandbox Apple ID in App Store Connect
3. On device: Settings → App Store → Sandbox Account
4. Run iOS build (dev / TestFlight)
5. Open a paid course → confirm StoreKit price loads
6. Purchase → confirm enrollment unlocks only that course
7. Restore purchases on a second account/device after login
8. Open learn URL for non-entitled course → blocked
9. Confirm free course enroll still works on iOS
10. Confirm Android build still has no Apple purchase UI / no CliQ

## App Store Connect submission steps

1. Keep the 25 IAP products in Draft until the new iOS build is ready
2. Attach all IAP products to the app version when submitting the build
3. Do **not** submit IAPs alone before the build
4. First IAP review goes **with** the new app binary
5. After approval, set `APPLE_IAP_ENVIRONMENT=production` on the server

## App Review Notes (paste into ASC)

```
STUDYZHOUSE iOS sells digital course access via Apple In-App Purchase only (Non-Consumable, one product per course).

There is no Stripe, CliQ, bank transfer, payment-proof upload, activation-code purchase, promo-code purchase, or external “buy on website” flow inside the iOS app.

Free courses can be enrolled in-app. Paid courses show Apple price and “شراء الكورس عبر Apple”. Users can restore purchases with “استعادة المشتريات”.

Sandbox test:
1. Sign in with the provided student account.
2. Open الكورسات → any paid course.
3. Tap شراء الكورس عبر Apple and complete Sandbox purchase.
4. Confirm the course unlocks in دوراتي / learn.
5. Tap استعادة المشتريات to restore.
```

## Re-map products (if needed)

```bash
pnpm exec tsx prisma/map-apple-iap-products-from-csv.ts --dry-run
pnpm exec tsx prisma/map-apple-iap-products-from-csv.ts
```
