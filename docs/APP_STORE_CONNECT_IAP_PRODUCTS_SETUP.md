# App Store Connect IAP Products Setup — STUDYZHOUSE

**Date:** 2026-09-07
**Purpose:** Final human-reviewed sheet for creating Apple **Non-Consumable** In-App Purchases in App Store Connect.
**Sources:** `docs/IAP_COURSE_CATALOG_AUDIT.md`, `docs/iap_course_catalog_audit.csv`, read-only paid+published DB snapshot.
**Companion CSV:** [`docs/app_store_connect_iap_products_setup.csv`](./app_store_connect_iap_products_setup.csv)

## Status

- **Products to create:** 25
- **Type for all:** Non-Consumable
- **Product ID convention:** `studyzhouse_course_<clean_slug>` (final / stable)
- **Duplicate Product IDs:** none
- **Display Name length:** ≤ 30 characters (ASC)
- **Description length:** ≤ 45 characters (ASC)
- **Code / DB / app changes in this task:** none

## Safe to create in App Store Connect?

**Yes — safe to create these Product IDs and metadata in App Store Connect now**, with conditions:

1. ASC product creation does **not** change the live app (IAP remains disabled in code).
2. Keep products **unavailable / not purchasable in-app** until Flutter + API IAP is implemented and each course has `appleProductId` + `iosPurchasable=true`.
3. Resolve **unclear / duplicate / short-course / price-gap** flags before marking those products Ready for Sale (creating them as Unavailable is fine).
4. Map catalog **70.00 JOD** and **300.00 JOD** to Apple price tiers carefully (not 1:1).

## Exact Product IDs (create these)

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

## Unclear courses / prices (review before Ready for Sale)

| slug | Product ID | issue |
|------|------------|-------|
| `full-stack-with-ai-and-vibe-coding` | `studyzhouse_course_full_stack_with_ai_and_vibe_coding` | UNCLEAR PRICE: 300 JOD vs 70 JOD peers. Informal DB title casing. DB description is only 'vibe coding' — improve marketing copy outside ASC if needed. |
| `mharh-altqryr` | `studyzhouse_course_mharh_altqryr` | UNCLEAR CONTENT NOTE: DB description mentions merged videos for minute coverage — review before App Review. |
| `mswdh-kwrs-1` | `studyzhouse_course_mswdh_kwrs_1` | UNCLEAR / DUPLICATE TITLE with mswdh-kwrs-17 (same Arabic DB title; both 55 lessons). Confirm they are distinct SKUs before creating both. Differentiated as (1) vs (2) in ASC names. 0 enrollments. |
| `mswdh-kwrs-12` | `studyzhouse_course_mswdh_kwrs_12` | UNCLEAR READINESS: only 3 lessons at 70 JOD. |
| `mswdh-kwrs-14` | `studyzhouse_course_mswdh_kwrs_14` | DB title has decorative letter spacing; cleaned for ASC. UNCLEAR READINESS: only 3 lessons. |
| `mswdh-kwrs-15` | `studyzhouse_course_mswdh_kwrs_15` | UNCLEAR VALUE / PRICE: only 2 lessons at 70 JOD — review before creating or keep Ready to Submit delayed. |
| `mswdh-kwrs-16` | `studyzhouse_course_mswdh_kwrs_16` | UNCLEAR PRICE GAP vs full-stack-with-ai-and-vibe-coding (70 vs 300 JOD). |
| `mswdh-kwrs-17` | `studyzhouse_course_mswdh_kwrs_17` | UNCLEAR / DUPLICATE TITLE with mswdh-kwrs-1. Differentiated as (2) for ASC; confirm with stakeholders before creation. |
| `mswdh-kwrs-18` | `studyzhouse_course_mswdh_kwrs_18` | Year in title (2024) may look dated — confirm keep or rename. |
| `mswdh-kwrs-5` | `studyzhouse_course_mswdh_kwrs_5` | UNCLEAR PRICE vs VALUE: 72 lessons at same 70 JOD as much shorter courses — confirm pricing intent. |
| `mswdh-kwrs-7` | `studyzhouse_course_mswdh_kwrs_7` | UNCLEAR READINESS: only 3 lessons at 70 JOD. |

## ASC creation checklist (per product)

1. App Store Connect → Your App → Monetization → In-App Purchases → Create
2. Type: **Non-Consumable**
3. Reference Name = `recommendedAppleReferenceName`
4. Product ID = `recommendedAppleProductId` (**exact**, cannot change later)
5. Localizations: Arabic + English display name + description from this sheet
6. Price tier from `suggestedAppStoreConnectPriceNote`
7. Add review information / screenshot as required
8. Leave unpurchasable in app until backend mapping exists

## Full setup table

| # | internalCourseId | slug | exact DB title | price (JOD) | Product ID | Reference Name | AR Display | EN Display | AR Description | EN Description | IAP type | ASC price note | iOS visibility | risk notes |
|--:|---|---|---|---:|---|---|---|---|---|---|---|---|---|---|
| 1 | cmph4fsji006rtu0zytxzs8yn | `full-stack-with-ai-and-vibe-coding` | Full-Stack-With-AI & vibe coding | 300.00 | `studyzhouse_course_full_stack_with_ai_and_vibe_coding` | Full-Stack With AI and Vibe Coding | Full-Stack AI و Vibe Coding | Full-Stack AI & Vibe Coding | يفتح كورس Full-Stack AI في STUDYZHOUSE. | Unlocks Full-Stack AI course in STUDYZHOUSE. | Non-Consumable | Catalog 300.00 JOD (flagship) → ASC tier closest to ~300 JOD (~USD 420). Verify Jordan/storefront tiers carefully. | Do not expose for iOS purchase until IAP wiring for this Product ID is complete. Create Product ID now; gate visibility carefully. | UNCLEAR PRICE: 300 JOD vs 70 JOD peers. Informal DB title casing. DB description is only 'vibe coding' — improve marketing copy outside ASC if needed. |
| 2 | cmptnzw1x0122s30yl43vbb9t | `mharh-altqryr` | مهارة التقرير | 70.00 | `studyzhouse_course_mharh_altqryr` | Report Writing Skill Course | مهارة التقرير | Report Writing Skill | يفتح كورس مهارة التقرير في STUDYZHOUSE. | Unlocks Report Writing Skill in STUDYZHOUSE. | Non-Consumable | Catalog 70.00 JOD → ASC tier ~70 JOD (~USD 99). | Do not expose for iOS purchase until IAP wiring for this Product ID is complete. | UNCLEAR CONTENT NOTE: DB description mentions merged videos for minute coverage — review before App Review. |
| 3 | cmptovnbg015ys30ylojbe1km | `mharh-altqryr-albhth-alaam` | مهارة التقرير البحث العام | 70.00 | `studyzhouse_course_mharh_altqryr_albhth_alaam` | General Research Report Skill | مهارة التقرير: البحث العام | General Research Report | يفتح كورس التقرير (بحث عام) دائمًا. | Unlocks General Research Report in STUDYZHOUS | Non-Consumable | Catalog 70.00 JOD → ASC tier ~70 JOD (~USD 99). | Do not expose for iOS purchase until IAP wiring for this Product ID is complete. | Report-skill series; DB description mentions merged videos/assignments for duration. |
| 4 | cmptogpkq0140s30yh8e0w758 | `mharh-altqryr-albhth-alamyq` | مهارة التقرير البحث العميق | 70.00 | `studyzhouse_course_mharh_altqryr_albhth_alamyq` | Deep Research Report Skill | مهارة التقرير: البحث العميق | Deep Research Report | يفتح كورس التقرير (بحث عميق) دائمًا. | Unlocks Deep Research Report in STUDYZHOUSE. | Non-Consumable | Catalog 70.00 JOD → ASC tier ~70 JOD (~USD 99). | Do not expose for iOS purchase until IAP wiring for this Product ID is complete. | Report-skill series. |
| 5 | cmptp5jfw0180s30yarlcnt7b | `mharh-altqryr-drash-alhalh` | مهارة التقرير دراسة الحالة | 70.00 | `studyzhouse_course_mharh_altqryr_drash_alhalh` | Case Study Report Skill | مهارة التقرير: دراسة الحالة | Case Study Report Skill | يفتح كورس دراسة الحالة في STUDYZHOUSE. | Unlocks Case Study Report in STUDYZHOUSE. | Non-Consumable | Catalog 70.00 JOD → ASC tier ~70 JOD (~USD 99). | Do not expose for iOS purchase until IAP wiring for this Product ID is complete. | Report-skill series. |
| 6 | cmptpmai301acs30y6ln6qjmm | `mharh-altqryr-drash-aljdwa` | مهارة التقرير دراسة الجدوى | 70.00 | `studyzhouse_course_mharh_altqryr_drash_aljdwa` | Feasibility Study Report Skill | مهارة التقرير: دراسة الجدوى | Feasibility Study Report | يفتح كورس دراسة الجدوى في STUDYZHOUSE. | Unlocks Feasibility Study in STUDYZHOUSE. | Non-Consumable | Catalog 70.00 JOD → ASC tier ~70 JOD (~USD 99). | Do not expose for iOS purchase until IAP wiring for this Product ID is complete. | Report-skill series. |
| 7 | cmpe4yx9l0005qx0yqbgn2ydj | `mswdh-kwrs` | يلا • AI | 70.00 | `studyzhouse_course_mswdh_kwrs` | Yalla AI Course | يلا • AI | Yalla AI Course | يفتح كورس يلا AI في STUDYZHOUSE دائمًا. | Unlocks Yalla AI permanently in STUDYZHOUSE. | Non-Consumable | Catalog 70.00 JOD → choose ASC price tier closest to ~70 JOD (~USD 99). Confirm Jordan/storefront pricing. | Do not expose for iOS purchase until Product ID is created, Course.appleProductId is set, iosPurchasable=true, and app IAP is enabled. | Short brand-style DB title; subject is AI learning. |
| 8 | cmpe5bg9j001pqx0y20nv2obq | `mswdh-kwrs-1` | دورة احتراف كتابة المحتوى بالذكاء الاصطناعي | 70.00 | `studyzhouse_course_mswdh_kwrs_1` | AI Content Writing Mastery (v1) | كتابة محتوى بالذكاء (1) | AI Content Writing (1) | يفتح كورس كتابة المحتوى (1) في STUDYZHOUSE. | Unlocks AI Content Writing 1 in STUDYZHOUSE. | Non-Consumable | Catalog 70.00 JOD → ASC tier ~70 JOD (~USD 99). | Do not expose for iOS purchase until IAP wiring for this Product ID is complete. | UNCLEAR / DUPLICATE TITLE with mswdh-kwrs-17 (same Arabic DB title; both 55 lessons). Confirm they are distinct SKUs before creating both. Differentiated as (1) vs (2) in ASC names. 0 enrollments. |
| 9 | cmpe69t9x00s9qx0y5rskcibs | `mswdh-kwrs-10` | المسار السريع لتعلم فلاتر: من المنطق البرمجي إلى واجهة المستخدم / Flutter Fast Track: From Logic to UI | 70.00 | `studyzhouse_course_mswdh_kwrs_10` | Flutter Fast Track Logic to UI | المسار السريع لتعلم فلاتر | Flutter Fast Track | يفتح كورس Flutter Fast Track دائمًا. | Unlocks Flutter Fast Track in STUDYZHOUSE. | Non-Consumable | Catalog 70.00 JOD → ASC tier ~70 JOD (~USD 99). | Do not expose for iOS purchase until IAP wiring for this Product ID is complete. | Short course (5 lessons) at 70 JOD — confirm readiness. |
| 10 | cmpe6bgxl00t7qx0y8clmmtuv | `mswdh-kwrs-11` | Photoshop Mastery Essentials / أساسيات احتراف الفوتوشوب | 70.00 | `studyzhouse_course_mswdh_kwrs_11` | Photoshop Mastery Essentials | أساسيات احتراف الفوتوشوب | Photoshop Mastery Essentials | يفتح كورس أساسيات الفوتوشوب دائمًا. | Unlocks Photoshop Essentials in STUDYZHOUSE. | Non-Consumable | Catalog 70.00 JOD → ASC tier ~70 JOD (~USD 99). | Do not expose for iOS purchase until IAP wiring for this Product ID is complete. | None major. EN display name is 28 chars. |
| 11 | cmpe6ew0b00uhqx0y636zvmm7 | `mswdh-kwrs-12` | Dev Tools Sprint / حقيبة المطور السريعة | 70.00 | `studyzhouse_course_mswdh_kwrs_12` | Dev Tools Sprint Course | حقيبة المطور السريعة | Dev Tools Sprint | يفتح كورس حقيبة المطور السريعة دائمًا. | Unlocks Dev Tools Sprint in STUDYZHOUSE. | Non-Consumable | Catalog 70.00 JOD → ASC tier ~70 JOD (~USD 99). | Do not expose for iOS purchase until IAP wiring for this Product ID is complete. | UNCLEAR READINESS: only 3 lessons at 70 JOD. |
| 12 | cmpf9iykj000jmi0yw2u7ses0 | `mswdh-kwrs-13` | دورة SPSS: احتراف التحليل الإحصائي | 70.00 | `studyzhouse_course_mswdh_kwrs_13` | SPSS Statistical Analysis Mastery | دورة SPSS للتحليل الإحصائي | SPSS Analysis Mastery | يفتح كورس SPSS داخل STUDYZHOUSE دائمًا. | Unlocks SPSS Analysis Mastery in STUDYZHOUSE. | Non-Consumable | Catalog 70.00 JOD → ASC tier ~70 JOD (~USD 99). | Do not expose for iOS purchase until IAP wiring for this Product ID is complete. | Short course (4 lessons) at 70 JOD — confirm readiness. |
| 13 | cmpf9khwo001fmi0yjj1gm06b | `mswdh-kwrs-14` | احــتــــراف الكــتــــابة الــذّكــــية بالــلــغــــة الإنــجــلــــيزيــــة / Smart English Writing Mastery | 70.00 | `studyzhouse_course_mswdh_kwrs_14` | Smart English Writing Mastery | الكتابة الذكية بالإنجليزية | Smart English Writing | يفتح كورس الكتابة الذكية بالإنجليزية دائمًا. | Unlocks Smart English Writing in STUDYZHOUSE. | Non-Consumable | Catalog 70.00 JOD → ASC tier ~70 JOD (~USD 99). | Do not expose for iOS purchase until IAP wiring for this Product ID is complete. | DB title has decorative letter spacing; cleaned for ASC. UNCLEAR READINESS: only 3 lessons. |
| 14 | cmpf9uu3y002bmi0yol17b94f | `mswdh-kwrs-15` | كتابة المحتوى الذكية – 90 دقيقة | 70.00 | `studyzhouse_course_mswdh_kwrs_15` | Smart Content Writing 90 Minutes | كتابة المحتوى الذكية 90د | Smart Content Writing 90m | يفتح كورس كتابة المحتوى الذكية دائمًا. | Unlocks Smart Content Writing in STUDYZHOUSE. | Non-Consumable | Catalog 70.00 JOD → ASC tier ~70 JOD (~USD 99). | Do not expose for iOS purchase until IAP wiring for this Product ID is complete. | UNCLEAR VALUE / PRICE: only 2 lessons at 70 JOD — review before creating or keep Ready to Submit delayed. |
| 15 | cmpf9zjbv002xmi0yvn0wogpu | `mswdh-kwrs-16` | معسكر تدريب BatTechno - Full Stack | 70.00 | `studyzhouse_course_mswdh_kwrs_16` | BatTechno Full Stack Bootcamp | معسكر BatTechno Full Stack | BatTechno Full Stack | يفتح معسكر BatTechno Full Stack دائمًا. | Unlocks BatTechno Full Stack in STUDYZHOUSE. | Non-Consumable | Catalog 70.00 JOD → ASC tier ~70 JOD (~USD 99). Flagship Full-Stack AI is 300 JOD — confirm intentional price gap. | Do not expose for iOS purchase until IAP wiring for this Product ID is complete. | UNCLEAR PRICE GAP vs full-stack-with-ai-and-vibe-coding (70 vs 300 JOD). |
| 16 | cmpi2bb350021r00y9ep7infm | `mswdh-kwrs-17` | دورة احتراف كتابة المحتوى بالذكاء الاصطناعي | 70.00 | `studyzhouse_course_mswdh_kwrs_17` | AI Content Writing Mastery (v2) | كتابة محتوى بالذكاء (2) | AI Content Writing (2) | يفتح كورس كتابة المحتوى (2) في STUDYZHOUSE. | Unlocks AI Content Writing 2 in STUDYZHOUSE. | Non-Consumable | Catalog 70.00 JOD → ASC tier ~70 JOD (~USD 99). | Do not expose for iOS purchase until IAP wiring for this Product ID is complete. Strong pilot candidate (highest enrollments). | UNCLEAR / DUPLICATE TITLE with mswdh-kwrs-1. Differentiated as (2) for ASC; confirm with stakeholders before creation. |
| 17 | cmpi2fjew008jr00yye5pqi3x | `mswdh-kwrs-18` | دورة  2024 - كتابة المحتوى باللغة العربية | 70.00 | `studyzhouse_course_mswdh_kwrs_18` | Arabic Content Writing Course 2024 | كتابة المحتوى بالعربية 2024 | Arabic Content Writing 2024 | يفتح كورس كتابة المحتوى بالعربية دائمًا. | Unlocks Arabic Writing course in STUDYZHOUSE. | Non-Consumable | Catalog 70.00 JOD → ASC tier ~70 JOD (~USD 99). | Do not expose for iOS purchase until IAP wiring for this Product ID is complete. | Year in title (2024) may look dated — confirm keep or rename. |
| 18 | cmpe5gbbw0087qx0yfa7qdgrx | `mswdh-kwrs-2` | دورة "بوستك بتسويه بإيدك" | 70.00 | `studyzhouse_course_mswdh_kwrs_2` | Design Your Own Posts Course | بوستك بتسويه بإيدك | Design Your Own Posts | يفتح كورس بوستك بتسويه بإيدك دائمًا. | Unlocks Design Your Own Posts in STUDYZHOUSE. | Non-Consumable | Catalog 70.00 JOD → ASC tier ~70 JOD (~USD 99). | Do not expose for iOS purchase until IAP wiring for this Product ID is complete. | Colloquial Arabic title in DB quotes; cleaned for ASC. |
| 19 | cmpe5i6m30099qx0yzf3k10l6 | `mswdh-kwrs-3` | التجارة الإلكترونية على eBay: من الصفر حتى البيع | 70.00 | `studyzhouse_course_mswdh_kwrs_3` | eBay Ecommerce From Zero to Sale | التجارة الإلكترونية eBay | eBay Ecommerce Course | يفتح كورس eBay داخل STUDYZHOUSE دائمًا. | Unlocks eBay Ecommerce course in STUDYZHOUSE. | Non-Consumable | Catalog 70.00 JOD → ASC tier ~70 JOD (~USD 99). | Do not expose for iOS purchase until IAP wiring for this Product ID is complete. | None major. |
| 20 | cmpe5jydm00abqx0ydcd0pggp | `mswdh-kwrs-4` | دورة - خارطة التفوق الدراسي: أسرار النجاح من الألف إلى الياء | 70.00 | `studyzhouse_course_mswdh_kwrs_4` | Academic Excellence Roadmap | خارطة التفوق الدراسي | Academic Excellence Roadmap | يفتح كورس التفوق الدراسي في STUDYZHOUSE. | Unlocks Academic Excellence in STUDYZHOUSE. | Non-Consumable | Catalog 70.00 JOD → ASC tier ~70 JOD (~USD 99). | Do not expose for iOS purchase until IAP wiring for this Product ID is complete. | DB subtitle is vague (كيف تصبح ناجح بحياتك); ASC name kept study-focused. |
| 21 | cmpe5n8iy00bxqx0y6525r7a5 | `mswdh-kwrs-5` | دورة استقبال وسكرتارية / Receptionist and Secretary | 70.00 | `studyzhouse_course_mswdh_kwrs_5` | Receptionist and Secretary Course | دورة استقبال وسكرتارية | Receptionist & Secretary | يفتح كورس الاستقبال والسكرتارية دائمًا. | Unlocks Receptionist course in STUDYZHOUSE. | Non-Consumable | Catalog 70.00 JOD → ASC tier ~70 JOD (~USD 99). | Do not expose for iOS purchase until IAP wiring for this Product ID is complete. | UNCLEAR PRICE vs VALUE: 72 lessons at same 70 JOD as much shorter courses — confirm pricing intent. |
| 22 | cmpe618na00khqx0yx5ipcdd4 | `mswdh-kwrs-6` | دورة تعلم أساسيات برمجة مواقع الويب - FULL-STACK DEVELOPMENT COURSE | 70.00 | `studyzhouse_course_mswdh_kwrs_6` | Full-Stack Web Development Basics | أساسيات برمجة مواقع الويب | Full-Stack Web Basics | يفتح كورس أساسيات Full-Stack دائمًا. | Unlocks Full-Stack Web Basics in STUDYZHOUSE. | Non-Consumable | Catalog 70.00 JOD → ASC tier ~70 JOD (~USD 99). | Do not expose for iOS purchase until IAP wiring for this Product ID is complete. | Thematic overlap with BatTechno Full Stack and Full-Stack AI flagship — keep names distinct. |
| 23 | cmpe64mrc00nrqx0ynq6dr832 | `mswdh-kwrs-7` | Illustrator Planet Course / دورة كوكب إلستريتور | 70.00 | `studyzhouse_course_mswdh_kwrs_7` | Illustrator Planet Course | دورة كوكب إلستريتور | Illustrator Planet Course | يفتح كورس Illustrator في STUDYZHOUSE. | Unlocks Illustrator Planet in STUDYZHOUSE. | Non-Consumable | Catalog 70.00 JOD → ASC tier ~70 JOD (~USD 99). | Do not expose for iOS purchase until IAP wiring for this Product ID is complete. | UNCLEAR READINESS: only 3 lessons at 70 JOD. |
| 24 | cmpe66c7f00ohqx0yn5d9eitr | `mswdh-kwrs-8` | ساعة احتراف في كتابة المحتوى! | 70.00 | `studyzhouse_course_mswdh_kwrs_8` | One-Hour Content Writing Mastery | ساعة احتراف كتابة المحتوى | 1-Hour Content Writing | يفتح كورس ساعة كتابة المحتوى دائمًا. | Unlocks 1-Hour Writing course in STUDYZHOUSE. | Non-Consumable | Catalog 70.00 JOD → ASC tier ~70 JOD (~USD 99). | Do not expose for iOS purchase until IAP wiring for this Product ID is complete. | Overlaps content-writing cluster (kwrs-1 / 8 / 15 / 17 / 18). |
| 25 | cmpe68hl200qzqx0y9x18tfh2 | `mswdh-kwrs-9` | دورة - برمجة تطبيقات الويب بالذكاء الاصطناعي | 70.00 | `studyzhouse_course_mswdh_kwrs_9` | AI Web App Development Course | برمجة الويب بالذكاء الاصطناعي | AI Web App Development | يفتح كورس برمجة الويب بالذكاء دائمًا. | Unlocks AI Web App course in STUDYZHOUSE. | Non-Consumable | Catalog 70.00 JOD → ASC tier ~70 JOD (~USD 99). | Do not expose for iOS purchase until IAP wiring for this Product ID is complete. | None major. |

## Suggested next prompt

> After creating these Non-Consumable products in App Store Connect, implement Apple IAP Phase 1 for pilot `mswdh-kwrs-17` (`studyzhouse_course_mswdh_kwrs_17`): map Product ID → Course.id, set appleProductId/iosPurchasable for the pilot only, enable API purchasable gate + Flutter StoreKit verify/restore, keep all other paid courses hidden from iOS purchase.

## Related docs

- [`IAP_COURSE_CATALOG_AUDIT.md`](./IAP_COURSE_CATALOG_AUDIT.md)
- [`iap_course_catalog_audit.csv`](./iap_course_catalog_audit.csv)
