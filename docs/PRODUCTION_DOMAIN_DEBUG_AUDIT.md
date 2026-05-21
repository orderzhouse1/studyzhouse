# تدقيق نطاق الإنتاج — studyzhouse.com

**النطاق:** https://studyzhouse.com  
**التاريخ:** 2026-05-21  
**الحالة:** تحليل فقط — **لم يُنفَّذ إصلاح كود** في هذه الجلسة.

> **ملاحظة عن لقطات الشاشة:** لم تُرفق الصور في سياق هذه الجلسة للوكيل؛ الاستنتاجات أدناه مبنية على **فحص الكود** + **طلبات HTTP مباشرة للإنتاج** (بديل موثّق للأدلة البصرية).

---

## ملخص تنفيذي

| العرض | السبب الجذقي (مرتّب) |
|--------|----------------------|
| `/` و `/courses` فارغان | **فشل جلب SSR** عبر `API_INTERNAL_URL` + **إخفاء الخطأ** (`fetchPublicApiMaybe` → `[]` / `total: 0`)؛ **ليس** لأن API العام فارغ |
| `/student` يعرض كورسات وتصنيفات | **جلب عميل** `fetch('/api/v1/...')` عبر **rewrite** من المتصفح — **يعمل** |
| `/student/courses/mswdh-kwrs-9` → 404 | نفس فشل SSR في `getPublicCourseBySlug` → `notFound()`؛ الكورس **موجود** في API |
| `/courses/mswdh-kwrs-9` | «كورس غير موجود» — نفس فشل SSR (وليس غياب مسار) |

**الخلاصة:** انقسام **مسارين للبيانات** — المتصفح/rewrite ✅ — خادم Next/SSR ❌ (على الأرجح `API_INTERNAL_URL` خاطئ أو غير قابل للوصول من عملية Next، مع كاش ISR يعمّق فراغ الصفحة الرئيسية).

---

## الجزء 1 — خريطة مصادر بيانات الكورسات والتصنيفات

### صفحات عامة (Server — `API_INTERNAL_URL` مباشرة)

| الموقع | الملف | Endpoint | آلية | كاش | عند الفشل | PUBLISHED فقط |
|--------|------|----------|------|-----|-----------|---------------|
| `/` | `app/page.tsx` → `home-page-data.ts` | `GET /api/v1/courses?page=1&pageSize=4` | SSR `fetchPublicApiMaybe` | `revalidate: 300` | `[]` | نعم |
| `/` | نفس | `GET /api/v1/categories?page=1&pageSize=12` | SSR | 300 | `[]` | غير مؤرشف |
| `/` | نفس | `GET /api/v1/courses?categorySlug=…` (×3) | SSR متوازي | 300 | `[]` | نعم |
| `/courses` | `courses-catalog.tsx` | `GET /api/v1/courses?…` | SSR | 300 | `items: []`, `total: 0` | نعم |
| `/courses` | نفس | `GET /api/v1/categories?page=1&pageSize=40` | SSR | 300 | `[]` → **لا قسم تصنيفات** | غير مؤرشف |
| `/courses/[slug]` | `public-course-data.ts` | `GET /api/v1/courses/:slug` | SSR + `cache()` | 300 | `notFound()` | نعم |
| نفس التصنيف | `same-category-courses.ts` | `GET /api/v1/courses?categorySlug=…` | SSR Suspense | 300 | قسم مخفي | نعم |

**لا يستخدمون** `cookies` ولا enrollment.

### صفحات طالب — مساران مختلفان

| الموقع | الملف | Endpoint | آلية | enrollment |
|--------|------|----------|------|------------|
| `/student` (لوحة) | `student-dashboard.tsx` (**عميل**) | `/auth/me`, `/student/dashboard`, `/student/my-courses`, **`/courses?page=1&pageSize=48`**, **`/categories?…`** | `studentFetchJsonCached` → **`fetch('/api/v1…')`** same-origin | لا للكتالوج |
| `/student/explore` | `CoursesCatalog` (**خادم**) | نفس `/courses` + `/categories` | SSR `fetchPublicApiMaybe` | لا |
| `/student/courses/[slug]` | `student/courses/[slug]/page.tsx` | `GET /api/v1/courses/:slug` | SSR `getPublicCourseBySlug` | لا (تفاصيل عامة) |
| `/learn/[courseSlug]` | `learn-course-client.tsx` | `GET /student/courses/:slug/learn` | **عميل** + auth | **نعم** |

### API (Express)

| Endpoint | Controller | فلتر |
|----------|------------|------|
| `GET /api/v1/courses` | `listCoursesPublic` | `status: PUBLISHED` |
| `GET /api/v1/courses/:slug` | `getCourseBySlugPublic` | `PUBLISHED` فقط |
| `GET /api/v1/categories` | `listCategoriesPublic` | `archivedAt: null` |
| `GET /student/dashboard` | `student.controller` | مستخدم مسجّل |
| `GET /student/courses/:slug/learn` | student routes | مسجّل + enrollment |

### Middleware

- طالب على `/courses/:slug` → **إعادة توجيه** إلى `/student/courses/:slug` (`middleware.ts`).
- `/student/*` و `/learn/*` تتطلب JWT.

---

## الجزء 2 — لماذا `/` و `/courses` فارغان؟

### أدلة الإنتاج (2026-05-21)

| الطلب | النتيجة |
|--------|---------|
| `https://studyzhouse.com/api/v1/health` | ✅ `status: ok` |
| `https://studyzhouse.com/api/v1/courses?page=1&pageSize=4` | ✅ **13** كورسًا منشورًا (مثال: `mswdh-kwrs-9`) |
| `https://studyzhouse.com/api/v1/categories?page=1&pageSize=12` | ✅ **10** تصنيفات |
| `https://studyzhouse.com/api/v1/courses/mswdh-kwrs-9` | ✅ JSON كامل للكورس |
| `https://studyzhouse.com/` (HTML) | هيرو + **FAQ فقط** — لا أقسام كورسات/تصنيفات |
| `https://studyzhouse.com/courses` (HTML) | **«إجمالي 0 كورسات»** — شريط جانبي **سعر فقط** (بدون تصنيفات) |
| `https://studyzhouse.com/courses/mswdh-kwrs-9` | **«كورس غير موجود»** |

### تفسير متسق مع الكود

1. **API والبيانات سليمة** — 13 كورس `PUBLISHED`، تصنيفات موجودة؛ **ليس** فرضية «قاعدة فارغة» ولا «كلها DRAFT».
2. **المتصفح يصل للـ API** عبر `https://studyzhouse.com/api/v1/...` (rewrite على Next).
3. **خادم Next (SSR)** عند `fetchPublicApiMaybe(API_INTERNAL_URL + path)` يفشل أو يُرجع `null` → واجهة **فارغة بصمت**.
4. **الصفحة الرئيسية:** `revalidate = 300` — قد تكون **خُزّنت فارغة** عند build/أول طلب فاشل؛ يفسر بقاء FAQ/هيرو (ثابت) وغياب الأقسام الشرطية `{featured.length > 0}`.
5. **`/courses`:** ديناميكية لكن نفس جلب SSR → `meta.total: 0` و `loadCategories` → `[]` → **يظهر فلتر السعر فقط** (يطابق وصفك البصري).

### فرضيات مرفوضة أو ثانوية

| # | فرضية | الحكم |
|---|--------|--------|
| 1 | API_INTERNAL_URL خاطئ لـ SSR | **الأرجح** — انقسام rewrite ✅ / SSR ❌ |
| 2 | fetchPublicApiMaybe يخفي الفشل | **مؤكد** — سلوك مقصود |
| 3 | لا كورسات PUBLISHED | **مرفوض** — API يعيد 13 |
| 4 | ISR كاش فارغ | **مساهم** على `/`؛ `/courses` يظهر 0 حيًا أيضًا |
| 5 | API يعمل من المتصفح لا من SSR | **مؤكد** |
| 6 | DB مختلفة للطالب | **مرفوض** — نفس `/api/v1/courses` للوحة (عميل) |
| 7 | بيانات وهمية للطالب | **مرفوض** — `studentFetchJsonCached('/courses?…')` |
| 8 | فلاتر تخفي الكل | **مرفوض** بدون query — القائمة العامة فارغة من SSR |

### ماذا تتوقع في سجلات Cloud Run (Next)؟

بعد إضافة P0 logging:

```text
[studyhouse/web] Public API fetch failed for /api/v1/courses?... (api host: ..., network) — ...
```

راجع `api host` — إن كان `127.0.0.1:4000` بينما API على خدمة منفصلة → هذا السبب.

---

## الجزء 3 — `/student/courses/[slug]` و 404

### هل المسار موجود في المصدر؟

**نعم:** `apps/web/src/app/student/courses/[slug]/page.tsx`  
**Git:** مُتتبَّع (آخر commit يمس الملف: `bee809b`).

**Build محلي سابق:** `ƒ /student/courses/[slug]` — المسار مُولَّد.

### ماذا يحدث عند `mswdh-kwrs-9`؟

| الحالة | السلوك |
|--------|--------|
| API عبر المتصفح | ✅ `GET /api/v1/courses/mswdh-kwrs-9` يعيد الكورس |
| SSR `getPublicCourseBySlug` | على الأرجح `null` → **`notFound()`** → 404 أو «غير موجود» |
| زائر غير مسجّل | middleware → **تسجيل دخول** (ليس 404) |
| طالب مسجّل | يصل للصفحة → **404** إن SSR فشل |

**الـ 404 ليس بالضرورة «ملف الصفحة غير منشور»** — الأرجح **`notFound()` بسبب فشل جلب الخادم** (نفس سبب `/courses/[slug]` العام).

### من أين يأتي الرابط `/student/courses/...`؟

| المكوّن | الرابط |
|---------|--------|
| `catalog-course-card.tsx` | `detailBasePath` + `/${slug}` — افتراضي `/courses` |
| `student-dashboard.tsx` | **`detailBasePath="/student/courses"`** |
| `student-interest-courses.tsx` | `/student/courses` |
| `courses-catalog.tsx` (explore) | `basePath=/student/explore` → **`/student/courses`** |
| `middleware.ts` | طالب على `/courses/:slug` → **`/student/courses/:slug`** |

**النية المعمارية:** نسخة طالب من `CoursePublicDetail` على `/student/courses/[slug]` — **صحيحة إذا SSR يعمل**. المشكلة الحالية **اتصال SSR** وليس اسم المسار فقط.

### السلوك الموصى به (بعد إصلاح P0 env)

| CTA | المسار |
|-----|--------|
| عرض الكورس (استكشاف) | `/courses/[slug]` أو `/student/courses/[slug]` بعد إصلاح SSR |
| ابدأ التعلم (مسجّل + enrollment) | `/learn/[courseSlug]` |
| كورساتي / قيد الانتظار | `/learn/...` أو تفاصيل حسب الحالة |

**لا تربط «عرض الكورس» بـ `/student/courses/[slug]` فقط** ما لم يُصلَح `API_INTERNAL_URL` — أو استخدم `/courses/[slug]` للاستكشاف حتى يثبت SSR.

---

## الجزء 4 — البيئة والنطاق studyzhouse.com

### قيم مطلوبة (بدون hardcode في الكود)

| المتغير | القيمة المتوقعة |
|---------|-----------------|
| `CLIENT_ORIGIN` | `https://studyzhouse.com` |
| `GOOGLE_REDIRECT_URI` | `https://studyzhouse.com/api/v1/auth/google/callback` |
| `API_INTERNAL_URL` (خدمة **Next**) | عنوان يصل **من عملية Next** إلى Express — انظر أدناه |
| `DATABASE_URL` | Postgres إنتاج (نفس ما يخدم API الذي يجيب على `/api/v1/courses`) |
| `JWT_ACCESS_SECRET` | **متطابق** API + Next |
| `NODE_ENV` | `production` |

### `API_INTERNAL_URL` — السيناريوهات

| بنية النشر | القيمة الصحيحة |
|-----------|----------------|
| **حاوية واحدة** (Next + API معًا) | `http://127.0.0.1:4000` |
| **خدمتان** (Cloud Run / Railway منفصلتان) | URL **خدمة API** (مثال `https://studyhouse-api-….run.app`) — **ليس** `localhost` |
| **موجّه على مستوى المنصة** يوجّه `/api/v1` مباشرة لـ API | SSR ما زال يحتاج URL يصل من **عملية Next** — غالبًا URL عام لخدمة API أو `http://127.0.0.1:4000` داخل شبكة داخلية |

**علامة الخطأ الحالية:** `/api/v1/*` من الخارج يعمل بينما SSR فارغ → غالبًا **توجيه خارجي للـ API** + **`API_INTERNAL_URL=127.0.0.1:4000` بدون API على نفس الحاوية**.

### localhost في الإنتاج

إن بقيت:

```env
CLIENT_ORIGIN=http://localhost:3000
GOOGLE_REDIRECT_URI=http://localhost:3000/api/v1/auth/google/callback
```

→ Google OAuth يعيد localhost (مشكلة منفصلة عن الكورسات).

### Google Cloud Console

- Origins: `https://studyzhouse.com`
- Redirect: `https://studyzhouse.com/api/v1/auth/google/callback`

---

## الجزء 5 — اتساق النشر والبناء

| بند | الحالة |
|-----|--------|
| مسار `/student/courses/[slug]` في repo | ✅ موجود ومُلتزَم |
| Build يتضمن المسار | ✅ (محليًا `ƒ`) |
| إنتاج يعرض 404 للطالب | على الأرجح **SSR notFound** وليس بالضرورة نشر قديم |
| نشر قديم بدون commit الأخير | **تحقق:** هل آخر deploy = `bee809b` أو أحدث؟ |
| ISR فارغ على `/` | **محتمل** — redeploy بعد إصلاح env |

**تحقق DevOps:**

```bash
git log -1 --oneline
# قارن مع revision المنشور على Cloud Run / Railway
```

---

## الجزء 6 — خطة إصلاح آمنة (بدون تنفيذ كود هنا)

### Priority 0

1. **ضبط `API_INTERNAL_URL` على خدمة Next** ليطابق بنية النشر (URL خدمة API أو `127.0.0.1:4000` في monolith).
2. **`CLIENT_ORIGIN=https://studyzhouse.com`** و **`GOOGLE_REDIRECT_URI`** إنتاجي + Console.
3. **`JWT_ACCESS_SECRET`** متطابق.
4. **Redeploy** خدمة Next (ومزامنة API إن لزم).
5. **تحقق curl** من shell خدمة Next (ليس المتصفح فقط):

   ```bash
   curl -sS "$API_INTERNAL_URL/api/v1/courses?page=1&pageSize=4"
   ```

6. افتح `/`, `/courses`, `/courses/mswdh-kwrs-9`, `/student/courses/mswdh-kwrs-9` (مسجّل).
7. انتظر ≤5 دقائق أو purge cache للصفحة الرئيسية.

### Priority 1 (بعد موافقتك على كود)

- مراجعة سجلات `[studyhouse/web] Public API fetch failed`.
- (اختياري) روابط «عرض الكورس» → `/courses/[slug]` حتى يستقر SSR.
- `docs/PRODUCTION_DEPLOY_VERIFY.md` — checklist.

### Priority 2

- `revalidatePath` عند النشر من الأدمن.
- فصل CTA: عرض vs ابدأ التعلم.

---

## الجزء 7 — خطوات تحقق يدوية بعد الإصلاح

1. `curl https://studyzhouse.com/api/v1/courses?page=1&pageSize=4` → `total: 13` (أو أكثر).
2. من shell **خدمة الويب:** `curl $API_INTERNAL_URL/api/v1/courses?page=1&pageSize=4` → نفس النتيجة.
3. `/` → أقسام كورسات/تصنيفات (ليس FAQ فقط).
4. `/courses` → تصنيفات + «إجمالي N كورسات» حيث N > 0.
5. `/courses/mswdh-kwrs-9` → صفحة تفاصيل (مسجّل طالب قد يُحوَّل لـ `/student/courses/...`).
6. تسجيل دخول → «عرض الكورس» → **لا 404**.
7. كورس مسجّل فيه → «ابدأ التعلم» → `/learn/mswdh-kwrs-9`.

---

## مراجع

- `docs/PRODUCTION_DEPLOYMENT_AUDIT.md`
- `docs/PRODUCTION_DEPLOY_VERIFY.md`
- `apps/web/src/lib/server-api.ts`
