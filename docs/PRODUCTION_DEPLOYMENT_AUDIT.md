# تدقيق جاهزية النشر للإنتاج (Google) — Studyhouse

**التاريخ:** 2026-05-19  
**النطاق:** مشاكل ملاحظة بعد النشر على Google — كورسات فارغة، Google OAuth يعيد إلى localhost، جاهزية الإنتاج.  
**تحديث P0:** وُثّقت البيئة في `.env.example` و README، وأُضيفت سجلات تشخيص في `fetchPublicApiMaybe`، وقائمة تحقق يدوية في `docs/PRODUCTION_DEPLOY_VERIFY.md`.

---

## ملخص تنفيذي

| المشكلة | السبب الأرجح | الأولوية |
|---------|--------------|----------|
| لا كورسات في `/` و `/courses` | **بيئة/بيانات/كاش** — غالبًا `API_INTERNAL_URL` خاطئ، أو قاعدة بلا كورسات `PUBLISHED`، أو كاش ISR فارغ؛ الكود يخفي فشل API ويعرض `[]` | P0 |
| Google → localhost | **`GOOGLE_REDIRECT_URI` و/أو `CLIENT_ORIGIN`** ما زالا قيم التطوير في أسرار الإنتاج + Google Cloud Console | P0 |
| تسجيل بريد/كلمة مرور يعمل | يؤكد أن **المتصفح → Next rewrites → API** و **`DATABASE_URL`** يعملان جزئيًا | — |

**هل الموقع جاهز للإنتاج؟** **لا — ليس بعد.** يوجد على الأقل عطلان P0 (محتوى عام فارغ + OAuth) يجب إصلاحهما في **متغيرات النشر** و**Google Cloud Console** و**قاعدة البيانات** قبل اعتبار النشر ناجحًا.

---

## 1. الكورسات العامة غير الظاهرة (`/` و `/courses`)

### كيف يعمل المسار تقنيًا

```
المتصفح (عميل)
  └─ fetch /api/v1/...  ──►  Next (نفس المنشأ)
         └─ rewrite (next.config) ──►  API_INTERNAL_URL + /api/v1/...

خادم Next (SSR — RSC)
  └─ fetchPublicApiMaybe(API_INTERNAL_URL + /api/v1/courses...)
         └─ اتصال مباشر بـ Express (لا يمر عبر rewrite)
```

| ملف | دور |
|-----|-----|
| `apps/web/src/lib/server-api.ts` | `getInternalApiOrigin()` = `API_INTERNAL_URL` أو **`http://127.0.0.1:4000`** |
| `apps/web/next.config.ts` | rewrites `/api/v1/*` → نفس `API_INTERNAL_URL` |
| `apps/web/src/lib/home-page-data.ts` | جلب كورسات/تصنيفات؛ عند الفشل → **`[]`** |
| `apps/web/src/components/courses/courses-catalog.tsx` | نفس النمط؛ فشل → كتالوج فارغ |
| `apps/api/.../course.controller.ts` | `listCoursesPublic`: **`status: PUBLISHED` فقط** |

### `fetchPublicApiMaybe` — إخفاء الأخطاء

```ts
// عند ECONNREFUSED / fetch failed → null (بدون log)
// عند !res.ok (غير 404) → throw
// في home-page-data: null أو شكل غير متوقع → []
```

**النتيجة للمستخدم:** صفحة «سليمة» لكن **فارغة** — لا رسالة خطأ، لا Sentry افتراضي.

### الأسباب المحتملة (مرتبة حسب الاحتمال مع سيناريو Google)

#### أ) متغيرات بيئة (الأرجح إذا كان API منفصلًا عن Next)

| المتغير | خطأ شائع | الأثر |
|---------|----------|--------|
| `API_INTERNAL_URL` | `http://127.0.0.1:4000` بينما API على خدمة أخرى | **SSR فقط** يفشل → `[]` على `/` و `/courses` |
| | غير مضبوط على الإطلاق في خدمة Next | نفس الافتراضي `127.0.0.1:4000` |

**لماذا قد يعمل تسجيل الدخول مع ذلك؟**  
إذا نُشر **حاوية واحدة** تشغّل Next + API على `4000` محليًا، يعمل الاثنان. إذا نُشرت خدمتان منفصلتان و`API_INTERNAL_URL` لم يُحدَّث، يفترض أن **كل** طلبات `/api/v1` من Next تفشل — إلا إذا كان هناك بروكسي خارجي لا نراه في الكود.

**تشخيص إلزامي من بيئة الإنتاج (خادم Next):**

```bash
# من shell خدمة الويب أو job CI بنفس الشبكة
curl -sS "$API_INTERNAL_URL/api/v1/health"
curl -sS "$API_INTERNAL_URL/api/v1/courses?page=1&pageSize=4"
curl -sS "$API_INTERNAL_URL/api/v1/categories?page=1&pageSize=12"
```

#### ب) بيانات قاعدة الإنتاج (احتمال عالٍ جدًا)

| الحالة | الأثر |
|--------|--------|
| لا كورسات | `items: []` |
| كورسات `DRAFT` / `ARCHIVED` فقط | **لا تظهر** في API العام |
| كورسات منشورة لكن بدون دروس منشورة | تظهر في القائمة (العدد 0 دروس) — **ليست** سبب إخفاء كامل |
| `pnpm db:clear-courses` على إنتاج بالخطأ | فارغ |
| `DATABASE_URL` يشير لقاعدة تطوير فارغة | فارغ |

**تشخيص SQL (Neon / psql):**

```sql
SELECT status, COUNT(*) FROM "Course" GROUP BY status;
SELECT COUNT(*) FROM "Course" WHERE status = 'PUBLISHED';
SELECT COUNT(*) FROM "Category" WHERE "archivedAt" IS NULL;
```

**النشر:** يتطلب `POST .../admin/courses/:id/publish` بعد استيفاء readiness (وصف، دروس، إلخ) — انظر `publishCourseAdmin` + `enforcePublishReadinessForAdminCourse`.

#### ج) كاش ISR (`revalidate = 300`)

| صفحة | سلوك البناء |
|------|-------------|
| `/` | static + revalidate 5m — إن بُنيت والـ API غير متاح → قد **تُخزَّن أقسام فارغة** حتى 5 دقائق |
| `/courses` | dynamic + fetch cache 300s — نفس المفتاح لنفس query |

**الإصلاح المؤقت:** redeploy بعد إصلاح API/البيانات، أو انتظار 5 دقائق، أو purge كاش المنصة إن وُجد.

#### د) فلاتر الواجهة

- الفلاتر **لا** تخفي كل الكورسات افتراضيًا (بدون `categorySlug` يُرجع كل المنشور).
- قسم «اللغة» كان وهميًا — **لا يؤثر** على API.

#### هـ) CORS

- CORS للمتصفح: `CLIENT_ORIGIN` فقط — **لا يؤثر** على SSR الداخلي.
- فشل CORS يظهر في console المتصفح لطلبات العميل، وليس سببًا شائعًا لفراغ SSR.

#### و) الصور

- `thumbnailUrl` = `CLIENT_ORIGIN + /api/v1/uploads/...`
- إذا `CLIENT_ORIGIN` = localhost في الإنتاج: صور مكسورة لكن **عناوين الكورسات تبقى في JSON**.
- الملفات على قرص API (`uploads/course-thumbnails`) — **ephemeral** على Cloud Run بدون volume مشترك.

### الحكم: نوع المشكلة

| إذا | فئة السبب |
|-----|-----------|
| `curl` من Next إلى `API_INTERNAL_URL` يفشل | **env / بنية نشر** |
| `curl` يرجع `items: []` | **بيانات / publish** |
| `curl` يرجع كورسات والموقع فارغ | **كاش ISR** أو نشر ويب قديم |
| يعمل محليًا ويفشل على Google فقط | **أسرار Google Cloud ≠ .env المحلي** |

### إصلاح P0 مقترح (بدون تغيير عقد API)

1. ضبط `API_INTERNAL_URL` على عنوان API **القابل للوصول من خادم Next** (مثال: `http://api:4000` داخل Docker، أو URL داخلي لـ Cloud Run).
2. التحقق من `DATABASE_URL` الإنتاج + وجود كورسات `PUBLISHED`.
3. نشر كورس تجريبي من `/admin/courses` → Publish → التحقق من `GET /api/v1/courses`.
4. إعادة نشر Next بعد إصلاح البيانات/البيئة.
5. (P1 لاحقًا) تسجيل `console.warn` عند `fetchPublicApiMaybe === null` في الإنتاج فقط.

---

## 2. Google OAuth يعيد إلى localhost

### المسار في الكود

```
المتصفح: GET https://DOMAIN/api/v1/auth/google
  → rewrite → Express startGoogleAuth
  → redirect إلى accounts.google.com
       redirect_uri = env.GOOGLE_REDIRECT_URI  ← من loadEnv()
  → Google يعيد المستخدم إلى redirect_uri
  → GET .../api/v1/auth/google/callback
  → res.redirect(CLIENT_ORIGIN + redirectPath)  ← googleAuth.controller.ts:151
```

| المتغير | الاستخدام |
|---------|-----------|
| `GOOGLE_REDIRECT_URI` | يُرسل لـ Google في `buildGoogleAuthorizationUrl` و `exchangeGoogleCode` |
| `CLIENT_ORIGIN` | إعادة التوجيه النهائية بعد النجاح + أخطاء OAuth إلى `/login?...` |
| `GOOGLE_CLIENT_ID` / `SECRET` | مطلوبان |

**لا يوجد** `localhost` مُثبَّت في `googleOAuth.service.ts` — القيمة **100% من البيئة**.

### السبب الجذري المتوقع

1. **`GOOGLE_REDIRECT_URI`** في أسرار الإنتاج =  
   `http://localhost:3000/api/v1/auth/google/callback`
2. **`CLIENT_ORIGIN`** = `http://localhost:3000` → بعد OAuth النجاح يُوجَّه المستخدم إلى localhost.
3. **Google Cloud Console** — Authorized redirect URIs / JavaScript origins لا تتضمن النطاق الإنتاجي (أو العكس: Console صحيح لكن السر خاطئ).

`.env.example` **لا يذكر** `GOOGLE_*` — خطر نسيان ضبطها عند النشر.

### الإعداد الصحيح للإنتاج

استبدل `YOUR_PRODUCTION_DOMAIN` بالنطاق الفعلي (مثال: `https://studyhouse.example.com`):

| المكان | القيمة |
|--------|--------|
| Secret: `CLIENT_ORIGIN` | `https://YOUR_PRODUCTION_DOMAIN` |
| Secret: `GOOGLE_REDIRECT_URI` | `https://YOUR_PRODUCTION_DOMAIN/api/v1/auth/google/callback` |
| Google Console → JavaScript origins | `https://YOUR_PRODUCTION_DOMAIN` |
| Google Console → Redirect URIs | `https://YOUR_PRODUCTION_DOMAIN/api/v1/auth/google/callback` |
| **احذف أو لا تعتمد على** | `http://localhost:3000/...` في إنتاج |

### الكوكي بعد OAuth

- `authCookieOptions`: `secure: true` عند `NODE_ENV=production` → **يتطلب HTTPS**.
- `sameSite: lax`، `path: /`، بدون `domain` مخصص — يعمل عندما API والواجهة **نفس المنشأ** عبر rewrite.
- إذا فصلت API على نطاق فرعي مختلف لاحقًا → تحتاج استراتيجية domain للكوكي (غير مُنفَّذة حاليًا).

### تشخيص سريع

1. من صفحة الإنتاج: انقر Google → قبل الموافقة انظر شريط العنوان عند Google: معامل `redirect_uri=` يجب أن يكون نطاق الإنتاج.
2. راجع أسرار Cloud Run / Secret Manager لـ API (و Next إن كان يشغّل OAuth عبر rewrite فقط — OAuth يُنفَّذ على API خلف rewrite).

---

## 3. متغيرات البيئة المطلوبة للإنتاج

### API (`apps/api/src/config/env.ts`)

| المتغير | مطلوب | قيمة إنتاج نموذجية |
|---------|--------|---------------------|
| `NODE_ENV` | نعم | `production` |
| `DATABASE_URL` | نعم | `postgresql://...neon...?sslmode=require` |
| `CLIENT_ORIGIN` | نعم | `https://YOUR_PRODUCTION_DOMAIN` |
| `JWT_ACCESS_SECRET` | نعم | ≥32 حرفًا عشوائي |
| `JWT_EXPIRES_IN` | لا | `12h` (افتراضي) |
| `ACTIVATION_CODE_PEPPER` | موصى | ≥32 حرفًا مستقل |
| `GOOGLE_CLIENT_ID` | لـ Google | من Console |
| `GOOGLE_CLIENT_SECRET` | لـ Google | من Console |
| `GOOGLE_REDIRECT_URI` | لـ Google | `https://DOMAIN/api/v1/auth/google/callback` |
| `RESEND_API_KEY` | OTP | مفتاح Resend |
| `EMAIL_FROM` | OTP | بريد مُتحقق في Resend |
| `YOUTUBE_API_KEY` | اختياري | استيراد قوائم |
| `API_PORT` | لا | `4000` |
| `REDIS_URL` | لا | stub |

### Next (`apps/web`)

| المتغير | مطلوب إنتاج | ملاحظات |
|---------|-------------|---------|
| `API_INTERNAL_URL` | **نعم عمليًا** | عنوان API من خادم Next — **ليس** localhost إلا إن كان API في نفس الحاوية |
| `JWT_ACCESS_SECRET` | نعم (middleware) | **نفس قيمة API** |
| `NEXT_PUBLIC_APP_URL` | لا | غير مستخدم في الكود حاليًا |

### غير موجود في `loadEnv` (لا تعتمد عليه)

`COOKIE_DOMAIN`, `SESSION_SECRET`, `CLOUDINARY_*`, `SENTRY_DSN` — معلّقة أو غير مدمجة.

---

## 4. عقد API العام (بدون تغيير مطلوب)

`GET /api/v1/courses` — `publicCoursesQuerySchema`:

- `page`, `pageSize`
- `categorySlug` — **نص واحد**
- `search`
- `pricingType` — `FREE` | `PAID`
- `sort` — `newest` | `price_asc` | `price_desc` | `title_asc`
- **لا** `language`، **لا** مصفوفات تصنيفات

`GET /api/v1/categories` — تصنيفات غير مؤرشفة (`archivedAt: null`).

---

## 5. قائمة جاهزية الإنتاج

| مجال | الحالة | ملاحظة |
|------|--------|--------|
| Build (`typecheck`, `build`) | ✅ محليًا | يجب في CI قبل كل نشر |
| `test:api` | ⚠️ | يحتاج `TEST_DATABASE_URL` معزولة |
| DB migrations | ⚠️ | `pnpm db:migrate:deploy` — ليس `db push` طويل الأمد |
| كورسات منشورة | ❌ مراقَب | سبب العرض الفارغ |
| Auth email | ✅ حسب الملاحظة | |
| Google OAuth | ❌ | localhost في البيئة |
| صفحات عامة | ❌ | فارغة |
| كاش 5 دقائق | ⚠️ | بعد publish قد يتأخر ظهور الكورس حتى 5 دقائق |
| رفع صور | ⚠️ | قرص محلي على API — خطر على serverless |
| أسرار في Git | ✅ | `.env.example` placeholders |

---

## 6. خطة إصلاح آمنة (أولويات)

### Priority 0 — قبل إعلان الإنتاج

1. **أسرار Google Cloud (API + Next حسب البنية):**
   - `CLIENT_ORIGIN=https://DOMAIN`
   - `GOOGLE_REDIRECT_URI=https://DOMAIN/api/v1/auth/google/callback`
   - `API_INTERNAL_URL=<عنوان API الداخلي الصحيح>`
   - `JWT_ACCESS_SECRET` متطابق بين API و Next
   - `DATABASE_URL` إنتاج
2. **Google Cloud Console:** origins + redirect URIs للنطاق الإنتاجي.
3. **تحقق API:** `health`, `courses`, `categories` من شبكة خادم Next.
4. **بيانات:** كورس واحد على الأقل `PUBLISHED` + تصنيفات.
5. **Redeploy** بعد التصحيح.

### Priority 1 — تشخيص أفضل (كود صغير لاحقًا)

- `console.warn`/`logger` عند فشل `fetchPublicApiMaybe` في `NODE_ENV=production`.
- توثيق `GOOGLE_*` في `.env.example`.
- تحقق post-deploy script (curl health + courses count).

### Priority 2 — لاحقًا

- `revalidatePath` عند publish/unpublish.
- تخزين ملفات سحابي (GCS) بدل `uploads/` المحلي.
- endpoint `/api/v1/home` اختياري.

---

## 7. ملفات مرجعية للتعديل لاحقًا (إن لزم)

| ملف | سبب محتمل |
|-----|-----------|
| `apps/web/src/lib/server-api.ts` | logging عند null |
| `apps/web/src/lib/home-page-data.ts` | logging |
| `.env.example` | إضافة GOOGLE_* |
| أسرار Google Cloud / Cloud Run YAML | **الإصلاح الفعلي لـ P0** |
| `docs/PRODUCTION_READINESS_CHECKLIST.md` | ربط Google OAuth |

**لا تغيير مطلوب الآن** لعقد `publicCoursesQuerySchema` أو منطق `listCoursesPublic`.

---

## 8. أوامر تحقق محلية (قبل/بعد إصلاح البيئة)

```bash
pnpm typecheck
pnpm build
# مع قاعدة معزولة:
# TEST_DATABASE_URL=... pnpm test:api
```

---

## 9. خلاصة للمطوّر / DevOps

1. **الكورسات الفارغة** ليست بالضرورة «كسر في الكود» — غالبًا **SSR لا يصل للـ API** أو **لا بيانات PUBLISHED** أو **كاش بناء فارغ**، والكود **يخفي** فشل الشبكة.
2. **Google → localhost** = **أسرار إنتاج خاطئة** (وغالبًا Console) — ليس bug في `googleOAuth.service.ts`.
3. الموقع **غير جاهز للإنتاج العام** حتى P0 يُغلق ويُختبر يدويًا: `/`, `/courses`, `/courses/[slug]`, Google login, publish → ظهور عام (خلال 5 دقائق كحد أقصى).
