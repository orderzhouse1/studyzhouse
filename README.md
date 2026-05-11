# Studyhouse — منصة كورسات عربية

Monorepo للواجهة (Next.js App Router) والـ API (Express) مع Prisma و Postgres.

## المتطلبات

- [Node.js](https://nodejs.org/) 20+
- [pnpm](https://pnpm.io/) 9+
- حساب [Neon](https://neon.tech/) (أو Postgres محلي)

## الإعداد السريع

1. انسخ المتغيرات البيئية:

   ```bash
   cp .env.example .env
   ```

2. عدّل `.env` — راجع جدول [المتغيرات البيئية](#المتغيرات-البيئية) أدناه. **ولّد أسرارك بنفسك**؛ القيم في `.env.example` placeholder فقط.

3. ثبّت الحزم ثم ولّد عميل Prisma:

   ```bash
   pnpm install
   pnpm db:generate
   ```

4. طبّق المخطط على قاعدة البيانات:

   ```bash
   pnpm db:push
   ```

   أو أنشئ ترحيلات (محلي):

   ```bash
   pnpm db:migrate
   ```
   (`db:migrate` = `prisma migrate dev` — انظر `package.json`.)

   للإنتاج بعد بناء الصور/النشر استخدم **`pnpm db:migrate:deploy`** (أو `pnpm exec prisma migrate deploy`) — **لا** تستخدم `db push` على قاعدة الإنتاج طويلة الأمد. التفاصيل في `docs/PRODUCTION_READINESS_CHECKLIST.md`.

5. زرع مستخدمي التجربة (محلي فقط — كلمات المرور مكشوفة في `prisma/seed.ts`، **لا تُستخدم في الإنتاج**):

   ```bash
   pnpm db:seed
   ```

   بيانات الدخول الافتراضية للتجربة المحلية: `super@example.com` / `SuperAdmin123!`، `admin@example.com` / `Admin123456!`، `student@example.com` / `Student123!` (نفس كلمة الطالب لـ `student2@example.com`).

## التشغيل للتطوير

```bash
pnpm dev
```

أو كل جزء على حدة:

```bash
pnpm dev:web   # Next.js — http://localhost:3000
pnpm dev:api   # Express — http://localhost:4000
```

### المسارات المحمية (Phase 2)

- المتصفح يستدعي الواجهة عبر `http://localhost:3000/api/v1/...` — تعيد Next توجيه الطلب إلى Express بحيث تُضبط ملفات تعريف الارتباط على نفس منشأ الواجهة.
- **لوحة الطالب:** `/student`
- **لوحة الإدارة:** `/admin` (يدخلها `ADMIN` و `SUPER_ADMIN`)
- **لوحة المدير الأعلى:** `/super-admin` (`SUPER_ADMIN` فقط)

### فحص صحة الـ API

```bash
curl http://localhost:4000/api/v1/health
```

## أوامر مفيدة

| الأمر | الوصف |
|--------|--------|
| `pnpm typecheck` | فحص TypeScript في كل الحزم |
| `pnpm build` | بناء الواجهة والـ API |
| `pnpm test` / `pnpm test:api` | اختبارات تكامل Vitest لـ `apps/api` (انظر أدناه) |
| `pnpm db:generate` | إعادة توليد Prisma Client بعد تعديل `schema.prisma` |
| `pnpm db:migrate` | إنشاء/تطبيق ترحيلات محليًا (`migrate dev`) |
| `pnpm db:migrate:deploy` | تطبيق ترحيلات على الإنتاج (`migrate deploy`) |
| ملاحظة Prisma | تحذير إهلاك لـ `package.json#prisma` غير حاجز — يُعالَج لاحقًا بنقل الإعداد إلى `prisma.config.ts` عند الترقية؛ انظر `docs/PRODUCTION_READINESS_CHECKLIST.md`. |
| `pnpm db:seed` | إعادة زرع مستخدمي التجربة |
| `pnpm db:studio` | واجهة Prisma Studio |

### اختبارات التكامل (API) — Phase 10B / 10B.1

- تُنفَّذ عبر **Vitest** و **Supertest** في `apps/api` (`src/integration/critical-flows.integration.test.ts`).
- **التحقق المكتمل (Phase 10B.1):** تم تشغيل الحزمة بنجاح ضد قاعدة Neon معزولة عبر **`TEST_DATABASE_URL`**: **21** ناجح، **0** متخطّى، **0** فاشل (دمج مع إصلاح تمرير أخطاء async في Express).
- **إلزام دائم:** كل تشغيل لـ `pnpm test:api` يجب أن يستخدم قاعدة Postgres **مخصّصة للاختبار فقط** عبر **`TEST_DATABASE_URL`** — **ممنوع** استخدام عنوان **`DATABASE_URL` للإنتاج** أو بيانات حرجة. أثناء التشغيل يضبط الاختبار `DATABASE_URL` من `TEST_DATABASE_URL` داخل عملية Vitest فقط.
- **بدون `TEST_DATABASE_URL` في الطرفية:** يُتخطّى **21** اختبارًا تكامليًا — هذا **ليس** دليل نجاح كامل؛ صِغ خط CI أو شغّل يدويًا قبل الإصدار.
- **تحضير قاعدة الاختبار** (مرة واحدة لكل قاعدة فارغة):

  **PowerShell (Windows):**

  ```powershell
  $env:TEST_DATABASE_URL = "postgresql://USER:PASSWORD@HOST/dbname?sslmode=require"
  pnpm db:generate
  $env:DATABASE_URL = $env:TEST_DATABASE_URL
  pnpm exec prisma db push
  pnpm test:api
  ```

  **bash (Linux / macOS / Git Bash):**

  ```bash
  export TEST_DATABASE_URL="postgresql://USER:PASSWORD@HOST/dbname?sslmode=require"
  pnpm db:generate
  DATABASE_URL="$TEST_DATABASE_URL" pnpm exec prisma db push
  pnpm test:api
  ```

  **ملاحظة:** Vitest لا يحمّل `.env` تلقائيًا — يجب تصدير المتغير في الطرفية نفسها.

- **بيانات الاختبار:** بريد `@studyhouse-integration.test`؛ تُنظَّف في `afterAll`.
- **من الجذر:** `pnpm test` يستدعي `pnpm test:api`.

### توثيق الإنتاج والـ QA اليدوي (Phase 10C)

- **`docs/PRODUCTION_READINESS_CHECKLIST.md`** — متغيرات البيئة، Prisma، الأمان، النسخ الاحتياطي، النشر، القيود المعروفة.
- **`docs/MANUAL_QA_CHECKLIST.md`** — سيناريوهات يدوية حسب الدور (عام، طالب، أدمن، سوبر أدمن، أمان).

## هيكل المستودع

```txt
apps/web      — Next.js (واجهة عربية RTL، ثيم فاتح)
apps/api      — Express REST تحت /api/v1
packages/shared — ثوابت، أنماط، ومخططات Zod مشتركة
prisma/       — schema.prisma و seed.ts في جذر المشروع
```

## استيراد قوائم YouTube (Phase 4B)

1. في [Google Cloud Console](https://console.cloud.google.com/) فعّل **YouTube Data API v3** وأنشئ مفتاح API.
2. أضف `YOUTUBE_API_KEY=...` إلى `.env` **للخادم** (نفس الملف أو بيئة تشغيل `apps/api`). بدون مفتاح، تظهر رسالة واضحة في واجهة «استيراد من قائمة YouTube» بأن الميزة غير مضبوطة.
3. ليست هناك حاجة لأي مفتاح في `NEXT_PUBLIC_*` — المفتاح يبقى في Express فقط.

## المتغيرات البيئية

| المتغير | مطلوب؟ | أين يُستخدم | ملاحظات |
|---------|--------|-------------|---------|
| `NODE_ENV` | يُفضّل | API + Next | `production` يفعّل كوكي `Secure` وسلوك الإنتاج. |
| `DATABASE_URL` | **نعم** | API (`loadEnv`) | Prisma. |
| `CLIENT_ORIGIN` | **نعم** | API | **CORS** + يجب أن يطابق أصل المتصفح (مثال: `https://app.example.com`). |
| `JWT_ACCESS_SECRET` | **نعم** | API | ≥32 حرفًا، عشوائي قوي. |
| `JWT_EXPIRES_IN` | لا | API | افتراضي `12h`. |
| `ACTIVATION_CODE_PEPPER` | لا | API | ≥32 حرفًا إن وُجد؛ **إن تغيّرت بعد إنشاء أكواد فعلية، تتوقف المطابقة للـ hash القديم** — أعد إصدار الأكواد أو احتفظ بنسخة احتياطية من القيمة. |
| `API_PORT` | لا | API | افتراضي 4000. |
| `API_INTERNAL_URL` | لا (للتطوير) | **Next** فقط (`next.config` rewrites + `server-api`) | عنوان Express من وجهة نظر خادم Next. في الإنتاج يجب أن يصل Next إلى API داخليًا. |
| `NEXT_PUBLIC_APP_URL` | لا | **حاليًا** لا يُقرأ في كود الواجهة | للروابط المطلقة المستقبلية. |
| `YOUTUBE_API_KEY` | لا | **API فقط** (خادم) | استيراد قوائم YouTube — **لا يُعرض في المتصفح**. |
| `REDIS_URL` | لا | API (stub) | غير موصول — للمراحل اللاحقة أو حدود معدل موزعة. |
| `COOKIE_DOMAIN` | لا | غير مُحمَّل في `loadEnv` ولا يُستخدم في `cookieAuth` حاليًا | مثال معلّق في `.env.example` للمراحل اللاحقة. |
| `SESSION_SECRET`، `JWT_REFRESH_SECRET` | — | **غير مستخدمة** في `apps/api/src/config/env.ts` | مذكورة في `.env.example` كتعليق «غير مستخدمة». |
| `TEST_DATABASE_URL` | لاختبارات التكامل فقط | shell عند تشغيل Vitest | يُعرَّض إلى العملية كـ **`DATABASE_URL`** داخل الاختبارات — استخدم **قاعدة Postgres منفصلة**؛ **لا تستخدم** عنوان الإنتاج أو بيانات حقيقية. |

**مصدر تعليمات CliQ في الواجهة:** الإعدادات المحفوظة في لوحة **السوبر أدمن** (`AppSetting` / مفتاح `platform_governance`)، وليس متغيرات بيئة CLIQ منفصلة — لا توجد في `.env.example`.

---

### الحماية الحالية و CSRF (ملخص)

- المصادقة عبر JWT في كوكي **HttpOnly** مع **SameSite=Lax**؛ طلبات الواجهة إلى `/api/v1` على نفس المنشأ عبر **rewrites** في Next.
- **لا يوجد توكن CSRF صريح** حاليًا. قبل الإنتاج الصارم، راجع إضافة حماية للعمليات الحساسة التي تعتمد على الكوكي (أو سياسات SameSite إضافية).

---

### Redis ومحدودية المعدل (rate limit)

- حاليًا **express-rate-limit** يعمل في **ذاكرة العملية**. في عدة نسخ API خلف موازن تحميل يكون الحد **لكل نسخة** وليس عالميًا.
- لتوحيد الحدود في الإنتاج يُفضّل لاحقًا تخزين Redis حقيقي وتمريره إلى مكتبة التقييد — `REDIS_URL` غير مفعّل في الكود بعد.

---

## قائمة تحقق الإنتاج (Production checklist)

قائمة موسّعة: **`docs/PRODUCTION_READINESS_CHECKLIST.md`** — وسيناريوهات QA يدوية في **`docs/MANUAL_QA_CHECKLIST.md`**.

- [ ] توليد أسرار قوية (`JWT_ACCESS_SECRET`، `ACTIVATION_CODE_PEPPER`) وتخزينها في مدير أسرار، وليس في Git.
- [ ] `NODE_ENV=production`.
- [ ] `DATABASE_URL` لبيئة الإنتاج مع TLS مناسب.
- [ ] `CLIENT_ORIGIN` = عنوان الواجهة الفعلي مع HTTPS.
- [ ] `API_INTERNAL_URL` يشير إلى خدمة Express الداخلية التي يصل إليها Next (شبكة/Kubernetes داخلية).
- [ ] `YOUTUBE_API_KEY` إذا كان استيراد قائمة التشغيل مطلوبًا.
- [ ] قاعدة البيانات: استخدام **`prisma migrate deploy`** (أو مسار migrations المعتمد)، وليس **`db push`** للإنتاج طويل الأمد.
- [ ] الإصدارات المحلية والتجربة: `db push` مقبول لتطوير سريع.
- [ ] مراجعة **CORS** و**الكوكي** (`Secure` مع HTTPS) و**Helmet** بعد النشر خلف reverse proxy.
- [ ] مراقبة أخطاء (مثل Sentry) إن رُبطت المتغيرات لاحقًا.
- [ ] تشغيل **`pnpm typecheck`** و **`pnpm build`** قبل النشر.
- [ ] تشغيل **`pnpm test:api`** مع **`TEST_DATABASE_URL`** على قاعدة Postgres **معزولة** — التحقق الكامل يعني **0** اختبار متخطّى؛ **لا** تستخدم قاعدة الإنتاج (انظر قسم اختبارات التكامل أعلاه).
- [ ] عدم استخدام كلمات مرور **`pnpm db:seed`** في الإنتاج.

---

## المرحلة الحالية (ملخص)

المنتج يشمل مسارات الطالب والإدارة والسوبر أدمن، الكورسات، البناء، استيراد يوتيوب، التعلّم، الطلاب والتسجيل، أكواد التفعيل، طلبات الدفع اليدوية CliQ، وحوكمة السوبر أدمن. راجع `docs/PROJECT_AUDIT_AND_HANDOFF.md` للتفاصيل التقنية.

راجع `PROJECT_BRIEF_FOR_CURSOR.md` للسياق الكامل للمنتج.
