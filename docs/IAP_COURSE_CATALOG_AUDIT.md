# Apple IAP Course Catalog Audit — STUDYZHOUSE

**Date:** 2026-09-07
**Scope:** Read-only audit of course/product catalog for Apple Non-Consumable IAP readiness.
**Environment inspected:** Database pointed to by local `DATABASE_URL` (Neon PostgreSQL). No production writes; no migrations applied; no app behavior changes.
**Companion CSV:** [`docs/iap_course_catalog_audit.csv`](./iap_course_catalog_audit.csv)

---

## Executive summary

| Metric | Count |
|--------|------:|
| Total courses | 26 |
| Paid courses | 25 |
| Free courses | 1 |
| Published courses | 25 |
| Paid + published (IAP candidates) | 25 |
| Free + published | 0 |
| Courses with `appleProductId` set | 0 |
| Courses with `iosPurchasable=true` | 0 |

**Verdict:** All **25 paid published courses** should become Apple **Non-Consumable** IAP products (one product per course). Free courses need no IAP. Today the mobile app is a **Reader / Learning Companion**: catalog is empty, purchase UI is off, and paid courses are only learnable if already enrolled (typically via web).

---

## 1. Course / product data model

**Source of truth:** `prisma/schema.prisma` → `Course`

| Field | Type | Role for IAP |
|-------|------|--------------|
| `id` | `String` (cuid) PK | **Internal mapping key** for enrollments / `AppleIapPurchase.courseId` |
| `slug` | `String` unique | Public/API routes; basis for recommended Product ID |
| `title` | `String` | Single display title (often AR+EN mixed). **No `titleAr` / `titleEn` columns** |
| `subtitle` | `String?` | API `shortDescription` |
| `description` | `String` | Long description |
| `status` | `DRAFT \| PUBLISHED \| ARCHIVED` | Published gate |
| `pricingType` | `FREE \| PAID` | Free/paid (no `isFree`/`isPaid` DB columns) |
| `price` | `Decimal?` | Amount; API exposes as `priceAmount` string |
| `currency` | `String` default `JOD` | Catalog currency (Apple uses its own price tiers) |
| `appleProductId` | `String?` unique | Exists; **all null in DB today** |
| `iosPurchasable` | `Boolean` default false | Exists; **all false in DB today** |
| `publishedAt` | `DateTime?` | Set on publish |

**Related:**
- `EnrollmentSource.APPLE_IAP` enum value exists
- `AppleIapPurchase` table exists (transaction → course unlock)
- Migration already present: `prisma/migrations/20260709120000_add_apple_iap_course_fields/`

**Identity recommendation:**
- **Map IAP → course via `Course.id` (cuid)** internally (enrollment + purchase records).
- **Store App Store Product ID in `Course.appleProductId`** (unique).
- Keep `slug` for URLs/API; do **not** use slug alone as the only join key for purchases.

---

## 2. API responses used by Flutter

Base: `/api/v1`. Mobile sends `X-Client-Platform: ios|android`.

| Endpoint | Purpose | Mobile behavior | Course fields Flutter parses |
|----------|---------|-----------------|------------------------------|
| `GET /courses` | Catalog list | Forced `pricingType=FREE`; Flutter then filters catalog to `[]` | `id, title, slug, shortDescription, description, thumbnailUrl, pricingType, priceAmount, currency, level, estimatedDurationMinutes, publishedAt, category, lessonCount, appleProductId, iosPurchasable` |
| `GET /courses/:slug` | Detail | Non-enrolled → 404 | Same public DTO |
| `GET /student/my-courses` | My courses | ACTIVE enrollments (paid+free); pending payments omitted | Nested course summary + progress |
| `GET /student/courses/:slug/access` | Access gate | Non-enrolled → 404; **strips** `appleProductId` / forces `iosPurchasable:false` | Access flags + course IAP fields |
| `GET /student/courses/:slug/learn` | Lessons | Requires active enrollment | Learn payload (sections/lessons/progress) |
| `POST /student/courses/:slug/enroll` | Free enroll | Rejected for mobile clients | — |
| `POST /student/iap/verify`, `/iap/restore` | Apple IAP | Stubbed: `isIosPurchasablePaidCourse()` **always returns false** | — |

Mapper: `apps/api/src/lib/courseMapper.ts` (public DTO includes `appleProductId`, `iosPurchasable`).

---

## 3. Flutter course UI

| Area | Location | Behavior today |
|------|----------|----------------|
| Course listing | My Courses tab / Home | Enrolled courses only |
| Explore / catalog | `explore_courses_screen.dart` | Redirects away; catalog filter returns `[]` |
| Paid access check | `course_detail_screen.dart` + `courseAccessProvider` | Enrolled → content; else `IosPaidCourseBlockedView` |
| Prices / purchase UI | `PlatformPurchasePolicy`, `PurchaseCourseService` | Hidden / disabled (`iapEnabled = false`) |
| iOS vs Android | `IosCoursePolicy.isMobileReader` | Same reader policy on **both** iOS and Android |

**Currently visible on iOS:** no marketplace/catalog. Paid courses appear **only if the student is already enrolled**.

---

## 4. Database / API consistency answers

| Question | Answer |
|----------|--------|
| Unique identifiers? | Both: `id` (PK) and `slug` (unique). Optional unique `appleProductId`. |
| Internal IAP→course mapping? | **`Course.id`** + lookup by `appleProductId` |
| Paid + published now? | **25** courses (see table) |
| Safe to expose on iOS today? | **None of the paid courses** — IAP off, `iosPurchasable=false`, catalog hidden |
| Hide on iOS until Apple IAP? | **Yes — keep current reader policy** for any paid course without a live App Store product + `iosPurchasable=true` + policy unlock |

---

## 5. Recommended Product ID convention

```
studyzhouse_course_<clean_slug>
```

Rules applied: lowercase; hyphens → underscores; ASCII-only; stable; unique across catalog.

**Note:** Existing test seed used `com.studyzhouse.app.course.test1` — that is a **legacy/test** ID. This audit standardizes on `studyzhouse_course_*` going forward.

**IAP type:** Paid course = **Non-Consumable**. Free = **No IAP**.

---

## 6. Create first in App Store Connect (pilot)

Recommended pilot (highest active enrollments + flagship priced course):

| Priority | slug | Product ID | Price (catalog) | Active enrollments |
|----------|------|------------|----------------:|-------------------:|
| Pilot | `mswdh-kwrs-17` | `studyzhouse_course_mswdh_kwrs_17` | 70.00 JOD | 18 |
| Pilot | `mswdh-kwrs-18` | `studyzhouse_course_mswdh_kwrs_18` | 70.00 JOD | 13 |
| Pilot | `full-stack-with-ai-and-vibe-coding` | `studyzhouse_course_full_stack_with_ai_and_vibe_coding` | 300.00 JOD | 12 |
| Pilot | `mswdh-kwrs-16` | `studyzhouse_course_mswdh_kwrs_16` | 70.00 JOD | 4 |
| Pilot | `mswdh-kwrs-3` | `studyzhouse_course_mswdh_kwrs_3` | 70.00 JOD | 3 |

Then create the remaining **20** paid published Product IDs (full list below).

### Exact Product IDs to create (all paid published)

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

---

## 7. Full catalog table

Full-width columns also in CSV. Markdown below covers audit decision columns.

| internalCourseId | slug | displayTitle | price | currency | isFree | isPaid | isPublished | visibleOnIOS | accessOnIOS | appleProductId | iosPurchasable | recommendedAppleProductId | IAP type | priority | notes |
|---|---|---|---:|---|---|---|---|---|---|---|---|---|---|---|---|
| cmph4fsji006rtu0zytxzs8yn | full-stack-with-ai-and-vibe-coding | Full-Stack-With-AI & vibe coding | 300.00 | JOD | false | true | true | No (catalog); enrolled-only | Hidden unless enrolled; no IAP buy path | null | false | studyzhouse_course_full_stack_with_ai_and_vibe_coding | Non-Consumable | P1 — high price / flagship | High price relative to catalog; confirm App Store price tier vs JOD 300; appleProductId currently null; iosPurchasable=false; Safe to expose on iOS only after IAP product created + iosPurchasable=true + policy flags enabled; lessons=10; activeEnrollments=12 |
| cmptnzw1x0122s30yl43vbb9t | mharh-altqryr | مهارة التقرير | 70.00 | JOD | false | true | true | No (catalog); enrolled-only | Hidden unless enrolled; no IAP buy path | null | false | studyzhouse_course_mharh_altqryr | Non-Consumable | P2 — report-skill series | Part of مهارة التقرير series; consider bundle later (not in this audit); appleProductId currently null; iosPurchasable=false; Safe to expose on iOS only after IAP product created + iosPurchasable=true + policy flags enabled; 0 active enrollments; lessons=15; activeEnrollments=0 |
| cmptovnbg015ys30ylojbe1km | mharh-altqryr-albhth-alaam | مهارة التقرير البحث العام | 70.00 | JOD | false | true | true | No (catalog); enrolled-only | Hidden unless enrolled; no IAP buy path | null | false | studyzhouse_course_mharh_altqryr_albhth_alaam | Non-Consumable | P2 — report-skill series | Part of مهارة التقرير series; consider bundle later (not in this audit); appleProductId currently null; iosPurchasable=false; Safe to expose on iOS only after IAP product created + iosPurchasable=true + policy flags enabled; 0 active enrollments; lessons=16; activeEnrollments=0 |
| cmptogpkq0140s30yh8e0w758 | mharh-altqryr-albhth-alamyq | مهارة التقرير البحث العميق | 70.00 | JOD | false | true | true | No (catalog); enrolled-only | Hidden unless enrolled; no IAP buy path | null | false | studyzhouse_course_mharh_altqryr_albhth_alamyq | Non-Consumable | P2 — report-skill series | Part of مهارة التقرير series; consider bundle later (not in this audit); appleProductId currently null; iosPurchasable=false; Safe to expose on iOS only after IAP product created + iosPurchasable=true + policy flags enabled; lessons=15; activeEnrollments=2 |
| cmptp5jfw0180s30yarlcnt7b | mharh-altqryr-drash-alhalh | مهارة التقرير دراسة الحالة | 70.00 | JOD | false | true | true | No (catalog); enrolled-only | Hidden unless enrolled; no IAP buy path | null | false | studyzhouse_course_mharh_altqryr_drash_alhalh | Non-Consumable | P2 — report-skill series | Part of مهارة التقرير series; consider bundle later (not in this audit); appleProductId currently null; iosPurchasable=false; Safe to expose on iOS only after IAP product created + iosPurchasable=true + policy flags enabled; 0 active enrollments; lessons=17; activeEnrollments=0 |
| cmptpmai301acs30y6ln6qjmm | mharh-altqryr-drash-aljdwa | مهارة التقرير دراسة الجدوى | 70.00 | JOD | false | true | true | No (catalog); enrolled-only | Hidden unless enrolled; no IAP buy path | null | false | studyzhouse_course_mharh_altqryr_drash_aljdwa | Non-Consumable | P2 — report-skill series | Part of مهارة التقرير series; consider bundle later (not in this audit); appleProductId currently null; iosPurchasable=false; Safe to expose on iOS only after IAP product created + iosPurchasable=true + policy flags enabled; 0 active enrollments; lessons=24; activeEnrollments=0 |
| cmpe4yx9l0005qx0yqbgn2ydj | mswdh-kwrs | يلا • AI | 70.00 | JOD | false | true | true | No (catalog); enrolled-only | Hidden unless enrolled; no IAP buy path | null | false | studyzhouse_course_mswdh_kwrs | Non-Consumable | P1 — core paid catalog | appleProductId currently null; iosPurchasable=false; Safe to expose on iOS only after IAP product created + iosPurchasable=true + policy flags enabled; 0 active enrollments; lessons=10; activeEnrollments=0 |
| cmpe5bg9j001pqx0y20nv2obq | mswdh-kwrs-1 | دورة احتراف كتابة المحتوى بالذكاء الاصطناعي | 70.00 | JOD | false | true | true | No (catalog); enrolled-only | Hidden unless enrolled; no IAP buy path | null | false | studyzhouse_course_mswdh_kwrs_1 | Non-Consumable | P1 — core paid catalog | Near-duplicate titles with mswdh-kwrs-1 and mswdh-kwrs-17 — verify they are distinct products before App Store listing; appleProductId currently null; iosPurchasable=false; Safe to expose on iOS only after IAP product created + iosPurchasable=true + policy flags enabled; 0 active enrollments; lessons=55; activeEnrollments=0 |
| cmpe69t9x00s9qx0y5rskcibs | mswdh-kwrs-10 | المسار السريع لتعلم فلاتر: من المنطق البرمجي إلى واجهة المستخدم / Flutter Fast Track: From Logic to UI | 70.00 | JOD | false | true | true | No (catalog); enrolled-only | Hidden unless enrolled; no IAP buy path | null | false | studyzhouse_course_mswdh_kwrs_10 | Non-Consumable | P1 — core paid catalog | appleProductId currently null; iosPurchasable=false; Safe to expose on iOS only after IAP product created + iosPurchasable=true + policy flags enabled; 0 active enrollments; lessons=5; activeEnrollments=0 |
| cmpe6bgxl00t7qx0y8clmmtuv | mswdh-kwrs-11 | Photoshop Mastery Essentials / أساسيات احتراف الفوتوشوب | 70.00 | JOD | false | true | true | No (catalog); enrolled-only | Hidden unless enrolled; no IAP buy path | null | false | studyzhouse_course_mswdh_kwrs_11 | Non-Consumable | P1 — core paid catalog | appleProductId currently null; iosPurchasable=false; Safe to expose on iOS only after IAP product created + iosPurchasable=true + policy flags enabled; 0 active enrollments; lessons=8; activeEnrollments=0 |
| cmpe6ew0b00uhqx0y636zvmm7 | mswdh-kwrs-12 | Dev Tools Sprint / حقيبة المطور السريعة | 70.00 | JOD | false | true | true | No (catalog); enrolled-only | Hidden unless enrolled; no IAP buy path | null | false | studyzhouse_course_mswdh_kwrs_12 | Non-Consumable | P1 — core paid catalog | appleProductId currently null; iosPurchasable=false; Safe to expose on iOS only after IAP product created + iosPurchasable=true + policy flags enabled; 0 active enrollments; lessons=3; activeEnrollments=0 |
| cmpf9iykj000jmi0yw2u7ses0 | mswdh-kwrs-13 | دورة SPSS: احتراف التحليل الإحصائي | 70.00 | JOD | false | true | true | No (catalog); enrolled-only | Hidden unless enrolled; no IAP buy path | null | false | studyzhouse_course_mswdh_kwrs_13 | Non-Consumable | P1 — core paid catalog | appleProductId currently null; iosPurchasable=false; Safe to expose on iOS only after IAP product created + iosPurchasable=true + policy flags enabled; 0 active enrollments; lessons=4; activeEnrollments=0 |
| cmpf9khwo001fmi0yjj1gm06b | mswdh-kwrs-14 | احــتــــراف الكــتــــابة الــذّكــــية بالــلــغــــة الإنــجــلــــيزيــــة / Smart English Writing Mastery | 70.00 | JOD | false | true | true | No (catalog); enrolled-only | Hidden unless enrolled; no IAP buy path | null | false | studyzhouse_course_mswdh_kwrs_14 | Non-Consumable | P1 — core paid catalog | appleProductId currently null; iosPurchasable=false; Safe to expose on iOS only after IAP product created + iosPurchasable=true + policy flags enabled; 0 active enrollments; lessons=3; activeEnrollments=0 |
| cmpf9uu3y002bmi0yol17b94f | mswdh-kwrs-15 | كتابة المحتوى الذكية – 90 دقيقة | 70.00 | JOD | false | true | true | No (catalog); enrolled-only | Hidden unless enrolled; no IAP buy path | null | false | studyzhouse_course_mswdh_kwrs_15 | Non-Consumable | P1 — core paid catalog | appleProductId currently null; iosPurchasable=false; Safe to expose on iOS only after IAP product created + iosPurchasable=true + policy flags enabled; 0 active enrollments; lessons=2; activeEnrollments=0 |
| cmpf9zjbv002xmi0yvn0wogpu | mswdh-kwrs-16 | معسكر تدريب BatTechno - Full Stack | 70.00 | JOD | false | true | true | No (catalog); enrolled-only | Hidden unless enrolled; no IAP buy path | null | false | studyzhouse_course_mswdh_kwrs_16 | Non-Consumable | P1 — core paid catalog | appleProductId currently null; iosPurchasable=false; Safe to expose on iOS only after IAP product created + iosPurchasable=true + policy flags enabled; lessons=30; activeEnrollments=4 |
| cmpi2bb350021r00y9ep7infm | mswdh-kwrs-17 | دورة احتراف كتابة المحتوى بالذكاء الاصطناعي | 70.00 | JOD | false | true | true | No (catalog); enrolled-only | Hidden unless enrolled; no IAP buy path | null | false | studyzhouse_course_mswdh_kwrs_17 | Non-Consumable | P1 — core paid catalog | Near-duplicate titles with mswdh-kwrs-1 and mswdh-kwrs-17 — verify they are distinct products before App Store listing; appleProductId currently null; iosPurchasable=false; Safe to expose on iOS only after IAP product created + iosPurchasable=true + policy flags enabled; lessons=55; activeEnrollments=18 |
| cmpi2fjew008jr00yye5pqi3x | mswdh-kwrs-18 | دورة  2024 - كتابة المحتوى باللغة العربية | 70.00 | JOD | false | true | true | No (catalog); enrolled-only | Hidden unless enrolled; no IAP buy path | null | false | studyzhouse_course_mswdh_kwrs_18 | Non-Consumable | P1 — core paid catalog | appleProductId currently null; iosPurchasable=false; Safe to expose on iOS only after IAP product created + iosPurchasable=true + policy flags enabled; lessons=93; activeEnrollments=13 |
| cmpe5gbbw0087qx0yfa7qdgrx | mswdh-kwrs-2 | دورة "بوستك بتسويه بإيدك" | 70.00 | JOD | false | true | true | No (catalog); enrolled-only | Hidden unless enrolled; no IAP buy path | null | false | studyzhouse_course_mswdh_kwrs_2 | Non-Consumable | P1 — core paid catalog | appleProductId currently null; iosPurchasable=false; Safe to expose on iOS only after IAP product created + iosPurchasable=true + policy flags enabled; 0 active enrollments; lessons=6; activeEnrollments=0 |
| cmpe5i6m30099qx0yzf3k10l6 | mswdh-kwrs-3 | التجارة الإلكترونية على eBay: من الصفر حتى البيع | 70.00 | JOD | false | true | true | No (catalog); enrolled-only | Hidden unless enrolled; no IAP buy path | null | false | studyzhouse_course_mswdh_kwrs_3 | Non-Consumable | P1 — core paid catalog | appleProductId currently null; iosPurchasable=false; Safe to expose on iOS only after IAP product created + iosPurchasable=true + policy flags enabled; lessons=6; activeEnrollments=3 |
| cmpe5jydm00abqx0ydcd0pggp | mswdh-kwrs-4 | دورة - خارطة التفوق الدراسي: أسرار النجاح من الألف إلى الياء | 70.00 | JOD | false | true | true | No (catalog); enrolled-only | Hidden unless enrolled; no IAP buy path | null | false | studyzhouse_course_mswdh_kwrs_4 | Non-Consumable | P1 — core paid catalog | appleProductId currently null; iosPurchasable=false; Safe to expose on iOS only after IAP product created + iosPurchasable=true + policy flags enabled; 0 active enrollments; lessons=11; activeEnrollments=0 |
| cmpe5n8iy00bxqx0y6525r7a5 | mswdh-kwrs-5 | دورة استقبال وسكرتارية / Receptionist and Secretary | 70.00 | JOD | false | true | true | No (catalog); enrolled-only | Hidden unless enrolled; no IAP buy path | null | false | studyzhouse_course_mswdh_kwrs_5 | Non-Consumable | P1 — core paid catalog | appleProductId currently null; iosPurchasable=false; Safe to expose on iOS only after IAP product created + iosPurchasable=true + policy flags enabled; 0 active enrollments; lessons=72; activeEnrollments=0 |
| cmpe618na00khqx0yx5ipcdd4 | mswdh-kwrs-6 | دورة تعلم أساسيات برمجة مواقع الويب - FULL-STACK DEVELOPMENT COURSE | 70.00 | JOD | false | true | true | No (catalog); enrolled-only | Hidden unless enrolled; no IAP buy path | null | false | studyzhouse_course_mswdh_kwrs_6 | Non-Consumable | P1 — core paid catalog | appleProductId currently null; iosPurchasable=false; Safe to expose on iOS only after IAP product created + iosPurchasable=true + policy flags enabled; 0 active enrollments; lessons=26; activeEnrollments=0 |
| cmpe64mrc00nrqx0ynq6dr832 | mswdh-kwrs-7 | Illustrator Planet Course / دورة كوكب إلستريتور | 70.00 | JOD | false | true | true | No (catalog); enrolled-only | Hidden unless enrolled; no IAP buy path | null | false | studyzhouse_course_mswdh_kwrs_7 | Non-Consumable | P1 — core paid catalog | appleProductId currently null; iosPurchasable=false; Safe to expose on iOS only after IAP product created + iosPurchasable=true + policy flags enabled; 0 active enrollments; lessons=3; activeEnrollments=0 |
| cmpe66c7f00ohqx0yn5d9eitr | mswdh-kwrs-8 | ساعة احتراف في كتابة المحتوى! | 70.00 | JOD | false | true | true | No (catalog); enrolled-only | Hidden unless enrolled; no IAP buy path | null | false | studyzhouse_course_mswdh_kwrs_8 | Non-Consumable | P1 — core paid catalog | appleProductId currently null; iosPurchasable=false; Safe to expose on iOS only after IAP product created + iosPurchasable=true + policy flags enabled; 0 active enrollments; lessons=19; activeEnrollments=0 |
| cmpe68hl200qzqx0y9x18tfh2 | mswdh-kwrs-9 | دورة - برمجة تطبيقات الويب بالذكاء الاصطناعي | 70.00 | JOD | false | true | true | No (catalog); enrolled-only | Hidden unless enrolled; no IAP buy path | null | false | studyzhouse_course_mswdh_kwrs_9 | Non-Consumable | P1 — core paid catalog | appleProductId currently null; iosPurchasable=false; Safe to expose on iOS only after IAP product created + iosPurchasable=true + policy flags enabled; 0 active enrollments; lessons=8; activeEnrollments=0 |
| cmqcgu4oa000buvwgbr1agprz | shared-workspace-course-sharedmqcgtz1k3a6f | Shared workspace course sharedmqcgtz1k3a6f | — | JOD | true | false | false | No (catalog); enrolled-only | Archived free | null | false | — | No IAP needed | Skip (free) | Free course — no Apple IAP product needed; appleProductId currently null; iosPurchasable=false; lessons=1; activeEnrollments=0 |

### Recommended App Store metadata (paid published)

| Product ID | Reference name | AR display | EN display | AR description | EN description |
|---|---|---|---|---|---|
| `studyzhouse_course_full_stack_with_ai_and_vibe_coding` | Full-Stack-With-AI & vibe coding | Full-Stack-With-AI & vibe coding | Full-Stack-With-AI & vibe coding | vibe coding | vibe coding |
| `studyzhouse_course_mharh_altqryr` | Report Writing Skill | مهارة التقرير | Report Writing Skill | هذه الفيديوهات مدموجة يعني تقرير ومقال من اجل تغطية الدقائق | Unlock permanent access to: Report Writing Skill. Full course content for enrolled students. |
| `studyzhouse_course_mharh_altqryr_albhth_alaam` | General Research Report Skill | مهارة التقرير البحث العام | General Research Report Skill | هذه الفيديوهات مدموجة يعني بحث بسيط والواجب من اجل تغطية الدقائق | Unlock permanent access to: General Research Report Skill. Full course content for enrolled students. |
| `studyzhouse_course_mharh_altqryr_albhth_alamyq` | Deep Research Report Skill | مهارة التقرير البحث العميق | Deep Research Report Skill | مهارة البحث العميق | Unlock permanent access to: Deep Research Report Skill. Full course content for enrolled students. |
| `studyzhouse_course_mharh_altqryr_drash_alhalh` | Case Study Report Skill | مهارة التقرير دراسة الحالة | Case Study Report Skill | مهارة دراسة الحالة | Unlock permanent access to: Case Study Report Skill. Full course content for enrolled students. |
| `studyzhouse_course_mharh_altqryr_drash_aljdwa` | Feasibility Study Report Skill | مهارة التقرير دراسة الجدوى | Feasibility Study Report Skill | دراسة الجدوى | Unlock permanent access to: Feasibility Study Report Skill. Full course content for enrolled students. |
| `studyzhouse_course_mswdh_kwrs` | Yalla AI Course | يلا • AI | Yalla AI Course | تعلم الذكاء الاصطناعي | Unlock permanent access to: Yalla AI Course. Full course content for enrolled students. |
| `studyzhouse_course_mswdh_kwrs_1` | AI Content Writing Mastery | دورة احتراف كتابة المحتوى بالذكاء الاصطناعي | AI Content Writing Mastery | تعلم كتابة المحتوى بأحترافية | Unlock permanent access to: AI Content Writing Mastery. Full course content for enrolled students. |
| `studyzhouse_course_mswdh_kwrs_10` | Flutter Fast Track: From Logic to UI | المسار السريع لتعلم فلاتر: من المنطق البرمجي إلى… | Flutter Fast Track: From Logic to UI | تعلم برمجة التطبيقات Flutter | تعلم برمجة التطبيقات Flutter |
| `studyzhouse_course_mswdh_kwrs_11` | Photoshop Mastery Essentials | أساسيات احتراف الفوتوشوب | Photoshop Mastery Essentials | احترف التصميم على الفوتوشوب | Unlock permanent access to: Photoshop Mastery Essentials. Full course content for enrolled students. |
| `studyzhouse_course_mswdh_kwrs_12` | Dev Tools Sprint | حقيبة المطور السريعة | Dev Tools Sprint | ادوات تساعدك في البرمجة | Unlock permanent access to: Dev Tools Sprint. Full course content for enrolled students. |
| `studyzhouse_course_mswdh_kwrs_13` | SPSS Statistical Analysis Mastery | دورة SPSS: احتراف التحليل الإحصائي | SPSS Statistical Analysis Mastery | احتراف التحليل الإحصائي | Unlock permanent access to: SPSS Statistical Analysis Mastery. Full course content for enrolled students. |
| `studyzhouse_course_mswdh_kwrs_14` | Smart English Writing Mastery | احــتــــراف الكــتــــابة الــذّكــــية بالــلــ… | Smart English Writing Mastery | احــتــــراف الكــتــــابة الــذّكــــية بالــلــغــــة الإنــجــلــــيزيــــة | Unlock permanent access to: Smart English Writing Mastery. Full course content for enrolled students. |
| `studyzhouse_course_mswdh_kwrs_15` | Smart Content Writing 90 Minutes | كتابة المحتوى الذكية – 90 دقيقة | Smart Content Writing – 90 Minutes | تعلم كتابة المحتوى الذكية | Unlock permanent access to: Smart Content Writing – 90 Minutes. Full course content for enrolled students. |
| `studyzhouse_course_mswdh_kwrs_16` | BatTechno Full Stack Bootcamp | معسكر تدريب BatTechno - Full Stack | BatTechno Full Stack Bootcamp | ابني موقعك من الصفر | Unlock permanent access to: BatTechno Full Stack Bootcamp. Full course content for enrolled students. |
| `studyzhouse_course_mswdh_kwrs_17` | AI Content Writing Mastery | دورة احتراف كتابة المحتوى بالذكاء الاصطناعي | AI Content Writing Mastery | دورة احتراف كتابة المحتوى بالذكاء الاصطناعي | Unlock permanent access to: AI Content Writing Mastery. Full course content for enrolled students. |
| `studyzhouse_course_mswdh_kwrs_18` | Arabic Content Writing Course 2024 | دورة 2024 - كتابة المحتوى باللغة العربية | Arabic Content Writing Course 2024 | دورة 2024 - كتابة المحتوى باللغة العربية | Unlock permanent access to: Arabic Content Writing Course 2024. Full course content for enrolled students. |
| `studyzhouse_course_mswdh_kwrs_2` | Design Your Own Posts | دورة "بوستك بتسويه بإيدك" | Design Your Own Posts | تعلم عمل البوستات بطريقة احترافية | Unlock permanent access to: Design Your Own Posts. Full course content for enrolled students. |
| `studyzhouse_course_mswdh_kwrs_3` | eBay Ecommerce From Zero to Sale | التجارة الإلكترونية على eBay: من الصفر حتى البيع | eBay Ecommerce From Zero to Sale | تعلم التجارة الالكترونية على eBay | تعلم التجارة الالكترونية على eBay |
| `studyzhouse_course_mswdh_kwrs_4` | Academic Excellence Roadmap | دورة - خارطة التفوق الدراسي: أسرار النجاح من الأل… | Academic Excellence Roadmap | كيف تصبح ناجح بحياتك | Unlock permanent access to: Academic Excellence Roadmap. Full course content for enrolled students. |
| `studyzhouse_course_mswdh_kwrs_5` | Receptionist and Secretary | دورة استقبال وسكرتارية | Receptionist and Secretary | كيف تصبحي سكرتيرة ذكية وتديري المكتب بشكل مناسب | Unlock permanent access to: Receptionist and Secretary. Full course content for enrolled students. |
| `studyzhouse_course_mswdh_kwrs_6` | Full-Stack Web Development Basics | دورة تعلم أساسيات برمجة مواقع الويب - FULL-STACK… | Full-Stack Web Development Basics | تعلم اساسيات برمجة الويب بسهولة | Unlock permanent access to: Full-Stack Web Development Basics. Full course content for enrolled students. |
| `studyzhouse_course_mswdh_kwrs_7` | Illustrator Planet Course | دورة كوكب إلستريتور | Illustrator Planet Course | احترف الستريتور من الصفر للاحتراف | Unlock permanent access to: Illustrator Planet Course. Full course content for enrolled students. |
| `studyzhouse_course_mswdh_kwrs_8` | One-Hour Content Writing Mastery | ساعة احتراف في كتابة المحتوى! | One-Hour Content Writing Mastery | تعلم كتابة المحتوى | Unlock permanent access to: One-Hour Content Writing Mastery. Full course content for enrolled students. |
| `studyzhouse_course_mswdh_kwrs_9` | AI Web App Development Course | دورة - برمجة تطبيقات الويب بالذكاء الاصطناعي | AI Web App Development Course | تعلم برمجة الويب بالذكاء الاصطناعي | Unlock permanent access to: AI Web App Development Course. Full course content for enrolled students. |

---

## 8. Missing fields / gaps in data model

| Gap | Severity | Notes |
|-----|----------|-------|
| No separate `titleAr` / `titleEn` | Medium | Single `title` often mixes AR/EN; App Store needs curated localized names (proposed above) |
| No separate localized short description fields for Apple | Medium | Use `subtitle`/`description` as draft only; edit in App Store Connect |
| `appleProductId` unset on all courses | Blocker for go-live | Must be populated after ASC product creation |
| `iosPurchasable` false on all courses | Blocker for go-live | Gate for which paid courses are buyable on iOS |
| Catalog currency `JOD` vs Apple price tiers | High | Apple does not sell in arbitrary JOD amounts the same way; map 70 JOD / 300 JOD to ASC tiers carefully |
| No `isFree`/`isPaid` columns | Low | Derived from `pricingType` — fine |

**No schema migration required for this audit.** Fields `appleProductId` and `iosPurchasable` already exist.

---

## 9. Blockers before implementing IAP

1. **Product policy:** App is currently submitted/positioned as a learning companion without IAP (`docs/APP_STORE_SUBMISSION_CHECKLIST.md`). Enabling IAP changes review posture (digital goods must use IAP).
2. **Runtime kill-switches still on:**
   - Flutter: `PlatformPurchasePolicy.iapEnabled = false`; `PurchaseCourseService.canPurchaseInApp = false`
   - API: `isIosPurchasablePaidCourse()` always returns `false` → verify/restore always `COURSE_NOT_IAP`
   - Mobile catalog forced FREE / empty; access response nulls IAP fields
3. **No StoreKit client:** Flutter has no `in_app_purchase` / StoreKit integration yet.
4. **DB not wired:** all `appleProductId` null, all `iosPurchasable=false`.
5. **Apple receipt verification:** backend has routes/service skeleton; real App Store Server API / receipt validation + production secrets still need hardening before go-live.
6. **Duplicate-looking courses:** `mswdh-kwrs-1` and `mswdh-kwrs-17` share near-identical Arabic titles — confirm they are distinct sellable products.
7. **Pricing:** confirm App Store price for 70 JOD and 300 JOD courses; Apple takes commission.
8. **Android parity:** reader policy currently applies to Android too; decide Play Billing separately.

---

## 10. Courses to hide on iOS until IAP ready

**All 25 paid published courses** should remain hidden from iOS browse/purchase until each has:
1. App Store Connect Non-Consumable product created
2. `Course.appleProductId` set to that Product ID
3. `Course.iosPurchasable = true`
4. API + Flutter IAP policy flags enabled for that path

Enrolled students can continue learning those courses today (web entitlement) without IAP.

---

## 11. Non-candidates

- `shared-workspace-course-sharedmqcgtz1k3a6f` (`cmqcgu4oa000buvwgbr1agprz`) — No IAP needed; status=not published; pricing=FREE

---

## 12. Suggested next prompt

> Implement Apple IAP Phase 1 (no App Store Connect clicks): wire Non-Consumable purchase for a single pilot course (`mswdh-kwrs-17` → `studyzhouse_course_mswdh_kwrs_17`): enable API `isIosPurchasablePaidCourse` for `iosPurchasable` courses, stop stripping IAP fields on mobile access for purchasable courses, add Flutter StoreKit/`in_app_purchase` verify+restore against existing `/student/iap/*` endpoints, and keep catalog closed except the pilot purchasable course. Do not mutate other courses' `appleProductId` yet.

---

## Appendix — key file paths

- `prisma/schema.prisma` — Course + AppleIapPurchase
- `apps/api/src/lib/iosCourseAccess.ts` — mobile visibility / IAP gate
- `apps/api/src/lib/courseMapper.ts` — public course DTO
- `apps/api/src/services/appleIap.service.ts` — verify/restore unlock
- `apps/mobile/lib/src/core/platform/ios_course_policy.dart`
- `apps/mobile/lib/src/core/platform/platform_purchase_policy.dart`
- `apps/mobile/lib/src/features/courses/models/course.dart`
