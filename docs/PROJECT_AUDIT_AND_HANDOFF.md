# تقرير تدقيق المشروع وتسليم المعرفة — Studyhouse  
**قبل المرحلة 10 (QA / الأمان / الإطلاق)**  
**تاريخ الإعداد:** وفق فحص المستودع الحالي (بدون تعديل الكود المصدري).

---

## أوامر التحقق المُنفَّذة ونتائجها

| الأمر | النتيجة | ملاحظات |
|--------|---------|---------|
| `pnpm typecheck` | نجاح (exit code 0) | المشاريع: `packages/shared`, `apps/api`, `apps/web` |
| `pnpm build` | نجاح (exit code 0) | `apps/api`: `tsc` — `apps/web`: `next build` (Next **15.5.18**) |
| اختبارات آلية (`*.test` / `*.spec`) | غير موجودة | لا ملفات اختبار في المستودع |
| `pnpm lint` (من الجذر) | يعادل `typecheck` حسب `package.json` | لا ESLint منفصل في الحزم |

**تحذيرات البناء (Next.js):** أثناء `next build` ظهرت رسائل `fetch failed` / `ECONNREFUSED 127.0.0.1:4000` — سببها محاولة جلب بيانات أثناء التوليد الثابت دون تشغيل خادم API على المنفذ 4000. انتهى البناء بنجاح رغم ذلك؛ يجب مراعاة ذلك في CI أو تشغيل API أثناء البناء أو جعل الصفحات التي تستدعي API ديناميكية فقط.

---

## 1. نظرة عامة على المشروع

**Studyhouse** منصة تعليمية (LMS) بالعربية مع واجهة RTL وتجربة «متميزة» من حيث الألوان والكثافة. المستودع **monorepo** يضم:

- **الواجهة:** Next.js (App Router) لعرض الكتالوج، لوحات الطالب/الإدارة/السوبر أدمن، والتعلّم.
- **الخلفية:** Express.js مع Prisma و PostgreSQL (Neon في الإعداد الافتراضي).

### الأدوار

| الدور | الوصف الوظيفي |
|--------|-----------------|
| **SUPER_ADMIN** | مالك المنصة: نظرة عامة، إدارة أدمنز المحتوى (ADMIN)، سجل العمليات، إعدادات المنصة (`AppSetting`). لا يُنشأ سوبر أدمن جديد من واجهة الحوكمة الحالية (محصور بإنشاء ADMIN). |
| **ADMIN** | إدارة المحتوى: كورسات، بناء المحتوى، تصنيفات، طلاب وتسجيلات، أكواد تفعيل، طلبات دفع CliQ اليدوية. |
| **STUDENT** | استكشاف الكورسات، تعلّم بعد التسجيل، استرداد أكواد التفعيل، تقديم طلبات دفع يدوية بعد CliQ. |

**المشكلة التي يحلها المنتج:** توحيد عرض كورسات عربية مع مسارات واضحة للتسجيل اليدوي، التفعيل بالكود، والدفع اليدوي عبر CliQ دون تكامل بنكي تلقائي في النطاق الحالي.

---

## 2. Tech Stack (من الكود والـ `package.json`)

| الطبقة | التقنية | الإصدار / الملاحظة |
|--------|---------|---------------------|
| الواجهة | **Next.js** (App Router) | **^15.3.2** — البناء يظهر **15.5.18** |
| | **React** | **^19.1.0** |
| | **TypeScript** | **~5.8.3** |
| | **Tailwind CSS** | **^3.4.17** |
| | مكوّنات | نمط **shadcn-like** (Button، Card، Badge، Input، إلخ) مع **Radix Slot**، **class-variance-authority**، **tailwind-merge** |
| الخلفية | **Express** | **^4.21.2**، `type: module` في `apps/api` |
| | **Prisma** | **6.19.3** |
| قاعدة البيانات | **PostgreSQL** | عبر `DATABASE_URL` (Neon في الوثائق) |
| مشترك | **Zod** | تحقق من المدخلات في API والـ shared |
| المصادقة | **JOSE** (`jose`) | JWT موقّع، يُخزَّن في **HttpOnly cookie** |
| كلمات المرور | **argon2** | تجزئة |
| الأمان HTTP | **helmet** | في `apps/api/src/app.ts` |
| CORS | **cors** | `credentials: true` مع `CLIENT_ORIGIN` |
| تحديد معدل | **express-rate-limit** | تسجيل الدخول؛ استرداد أكواد التفعيل |
| يوتيوب | **YouTube Data API v3** | مفتاح من البيئة في الخادم فقط لاستيراد قوائم التشغيل |
| Redis | **غير مفعّل فعليًا** | `createRedisClient` يعيد `null` أو stub — الـ `REDIS_URL` اختياري |
| أخرى | **slugify**، **cookie-parser** | — |

**CliQ:** تدفق **يدوي** فقط — الطالب يُدخل مرجع العملية؛ الإدارة تعتمد/ترفض؛ لا Stripe ولا API CliQ رسمي في الكود.

---

## 3. هيكل Monorepo

| المسار | المسؤولية |
|--------|------------|
| `apps/web` | تطبيق Next.js: الصفحات، الـ layouts، المكوّنات، الـ `middleware.ts`، إعادة الكتابة إلى Express (`/api/v1/*`). |
| `apps/api` | خادم Express: المسارات، المتحكمات، الخدمات، الوسطاء، Prisma Client. |
| `packages/shared` | ثوابت (`API_VERSION`, اسم التطبيق بالعربية)، مخططات Zod المشتركة، أنواع مساعدة، ثابت اسم الكوكي. |
| `prisma` | `schema.prisma`، `seed.ts` — مصدر الحقيقة لنموذج البيانات. |
| `docs` | التوثيق (هذا الملف). |

---

## 4. تدقيق مخطط قاعدة البيانات (Prisma)

### النماذج الرئيسية

| النموذج | الوظيفة |
|---------|---------|
| **User** | مستخدم بالبريد الفريد، `passwordHash`، `role`، `status`. علاقات: ملف أدمن، كورسات منشأة، تسجيلات، أكواد أنشأها، طلبات دفع، مراجعات طلبات، استرداد أكواد، تقدّم دروس، سجلات تدقيق. |
| **AdminProfile** | `userId` فريد، `jobTitle`، `permissionsJson` (JSON — للتوسع لاحقًا). |
| **Category** | تصنيف محتوى؛ `slug` فريد؛ `archivedAt` لأرشفة ناعمة. |
| **Course** | كورس؛ `slug` فريد؛ `status` (مسودة/منشور/مؤرشف)؛ `pricingType`؛ `price`؛ علاقات أقسام، دروس، تسجيلات، أكواد، طلبات دفع. فهارس على `status` و `createdById`. |
| **CourseSection** | وحدة داخل كورس مع `sortOrder`. |
| **Lesson** | درس؛ ربط بـ YouTube؛ `status` (مسودة/منشور)؛ معاينة/إلزامي. |
| **Enrollment** | تسجيل طالب في كورس؛ مصدر التسجيل `EnrollmentSource`؛ حالة `EnrollmentStatus`؛ تقدّم نسبة؛ `@@unique([studentId, courseId])`. |
| **LessonProgress** | تقدّم على مستوى الدرس لكل تسجيل؛ `@@unique([enrollmentId, lessonId])`. |
| **ActivationCode** | `codeHash` **فريد** (لا يُخزَّن الكود الصريح)؛ `codePrefix` للعرض؛ حد استخدام؛ صلاحية؛ حالة. |
| **CodeRedemption** | سجل استرداد طالب لكود؛ يمنع التكرار لنفس الطالب/الكود ضمن منطق التطبيق. |
| **PaymentRequest** | طلب دفع يدوي CliQ؛ مبلغ؛ مرجع؛ ملاحظات؛ مراجع؛ سبب رفض؛ **لا يوجد تكامل دفع آلي**. |
| **AuditLog** | أحداث؛ `metadataJson`؛ مرتبط بمستخدم مُنفِّذ اختياري. |
| **AppSetting** | إعدادات عامة كـ `key` فريد + `valueJson` — يُستخدم مثلًا لمفتاح `platform_governance` في المرحلة 9. |

### التعدادات (Enums)

- **UserRole:** `SUPER_ADMIN` \| `ADMIN` \| `STUDENT`
- **UserStatus:** `ACTIVE` \| `SUSPENDED` \| `DELETED`
- **CourseStatus:** `DRAFT` \| `PUBLISHED` \| `ARCHIVED`
- **PricingType:** `FREE` \| `PAID`
- **CourseLevel:** `BEGINNER` \| `INTERMEDIATE` \| `ADVANCED` \| `ALL_LEVELS`
- **LessonStatus:** `DRAFT` \| `PUBLISHED`
- **EnrollmentSource:** يشمل `MANUAL`، `MANUAL_ADMIN`، `ACTIVATION_CODE`، `PAYMENT`، `CLIQ_PAYMENT`، `FREE`
- **EnrollmentStatus:** `ACTIVE` \| `REVOKED` \| `COMPLETED`
- **ActivationCodeStatus:** `ACTIVE` \| `DISABLED` \| `EXPIRED`
- **PaymentRequestStatus:** `PENDING` \| `APPROVED` \| `REJECTED`
- **PaymentMethod:** `CLIQ` حاليًا

### قيود وأمان

- **فريد:** `User.email`، `Course.slug`، `Category.slug`، `ActivationCode.codeHash`، `Enrollment(studentId,courseId)`، `LessonProgress(enrollmentId,lessonId)`، `AppSetting.key`
- **حقول حساسة:** `passwordHash`، `ActivationCode.codeHash` — لا يُعادان في استجابات عامة؛ التدقيق يصفّي metadata في سوبر أدمن.

---

## 5. المصادقة وتدفق الجلسة

1. **تسجيل الدخول:** `POST /api/v1/auth/login` — جسم يمر عبر `loginBodySchema`؛ **loginRateLimiter** (نافذة 15 دقيقة، حدّ مرتفع نسبيًا).
2. **كلمة المرور:** مقارنة عبر **argon2** مع `passwordHash` في قاعدة البيانات.
3. **JWT:** يُوقَّع بـ **HS256** (`jose`)؛ مدة من `JWT_EXPIRES_IN`؛ الحمولة تحوي `role`؛ **المستخدم الفعلي للصلاحية يُحمَّل من قاعدة البيانات في `requireAuth`** وليس الاعتماد على دور JWT القديم فقط عند اتخاذ قرار الصلاحية (`req.auth.role` من صف المستخدم الحالي).
4. **الكوكي:** اسم ثابت من الحزمة المشتركة **`studyhouse_access`** (`AUTH_ACCESS_COOKIE_NAME`)؛ خيارات من `authCookieOptions`: **HttpOnly**، **Secure** في الإنتاج، **SameSite: lax**، مسار `/`.
5. **تسجيل الخروج:** `POST /api/v1/auth/logout` — مسح الكوكي.
6. **من أنا:** `GET /api/v1/auth/me` — يتطلب `requireAuth`؛ يعيد مستخدمًا عامًا بدون سرّ.
7. **Next.js middleware:** يحمي مسارات `/student`، `/learn`، `/admin`، `/super-admin` عبر طلب `GET /api/v1/auth/me` مع تمرير الكوكي؛ إعادة توجيه لـ `/login` أو `/` حسب الدور.

### قيود معروفة

- **لا يوجد refresh token** منطقي في مسار الإنتاج الحالي؛ `JWT_REFRESH_SECRET` في `.env.example` **غير مستخدم** في `loadEnv()` للـ API.
- **إبطال الجلسات:** لا قائمة كيانات للجلسات؛ إيقاف المستخدم (`SUSPENDED`) يمنع الدخول عند التحقق من قاعدة البيانات في `requireAuth`.
- **CSRF:** لا توكن CSRF منفصل؛ الاعتماد على **SameSite** + عدم استخدام الكوكي لطلبات عبر مواقع ضارة بسياق معقول؛ للعمليات الحساسة قد تُضاف حماية إضافية في الإنتاج.
- **rate limiting:** في الذاكرة الافتراضية لـ `express-rate-limit` (لا Redis حقيقي).

---

## 6. RBAC ومصفوفة الوصول

### حماية المسارات (Next middleware)

| البادئة | الأدوار المسموحة |
|---------|------------------|
| `/student`، `/learn/*` | `STUDENT` فقط |
| `/admin/*` | `ADMIN` **أو** `SUPER_ADMIN` |
| `/super-admin/*` | `SUPER_ADMIN` فقط |

### حماية API (Express)

| المجموعة | الوسطاء |
|-----------|---------|
| مسارات عامة | بدون توكن (صحة، فئات عامة، كورسات منشورة) |
| `requireAuth` | كوكي JWT صالح + مستخدم `ACTIVE` |
| `requireRole([ADMIN, SUPER_ADMIN])` | لوحات الإدارة |
| `requireRole([STUDENT])` | مسار `/student/*` |
| `requireRole([SUPER_ADMIN])` | `/super-admin/*` |

### ملخص وظيفي

| المنطقة | من يصل |
|---------|--------|
| عام | الصفحة الرئيسية، `/courses`، `/courses/[slug]`، تسجيل الدخول |
| STUDENT | لوحة الطالب، كورساتي، استكشاف، تفعيل، مدفوعات، التعلّم |
| ADMIN | كل ما سبق للإدارة + لا يصل `/super-admin` |
| SUPER_ADMIN | كل ما يصل إليه ADMIN **إن كان middleware يسمح** + `/super-admin` + APIs السوبر أدمن |

---

## 7. جرد مسارات API (ضمن `/api/v1`)

**أساس المسار:** `apiBasePath("v1")` → `/api/v1`.

### Auth
| الطريقة | المسار | الدور | الغرض |
|---------|--------|-------|--------|
| POST | `/auth/login` | عام | تسجيل الدخول؛ تحديد معدل |
| POST | `/auth/logout` | عام (يزيل الكوكي) | خروج |
| GET | `/auth/me` | مسجّل | بيانات المستخدم |

### فئات وكورسات عامة
| الطريقة | المسار | الدور | الغرض |
|---------|--------|-------|--------|
| GET | `/categories` | عام | قائمة تصنيفات للكتالوج |
| GET | `/courses` | عام | كورسات منشورة مع ترقيم |
| GET | `/courses/:slug` | عام | تفاصيل كورس منشور |

### إدارة التصنيفات
| الطريقة | المسار | الدور | الغرض |
|---------|--------|-------|--------|
| GET | `/admin/categories` | ADMIN+ | قائمة إدارية |
| POST | `/admin/categories` | ADMIN+ | إنشاء |
| PATCH | `/admin/categories/:id` | ADMIN+ | تحديث |
| DELETE | `/admin/categories/:id` | ADMIN+ | أرشفة |

### إدارة الكورسات وبناء المحتوى ويوتيوب
| الطريقة | المسار | الدور | ملاحظات |
|---------|--------|-------|-----------|
| GET | `/admin/courses` | ADMIN+ | فلترة حسب الحالة إلخ |
| POST | `/admin/courses` | ADMIN+ | إنشاء كورس |
| GET | `/admin/courses/:courseId/structure` | ADMIN+ | الأقسام والدروس |
| POST | `/admin/courses/:courseId/youtube-playlist/preview` | ADMIN+ | يتطلب مفتاح يوتيوب في الخادم |
| POST | `/admin/courses/:courseId/youtube-playlist/import` | ADMIN+ | استيراد |
| POST | `/admin/courses/:courseId/sections/reorder` | ADMIN+ | — |
| POST | `/admin/courses/:courseId/sections` | ADMIN+ | قسم جديد |
| PATCH | `/admin/courses/:courseId/sections/:sectionId` | ADMIN+ | — |
| DELETE | `/admin/courses/:courseId/sections/:sectionId` | ADMIN+ | — |
| POST | `/admin/courses/:courseId/sections/:sectionId/lessons` | ADMIN+ | درس جديد |
| POST | `/admin/courses/:courseId/lessons/reorder` | ADMIN+ | — |
| PATCH | `/admin/courses/:courseId/lessons/:lessonId` | ADMIN+ | — |
| DELETE | `/admin/courses/:courseId/lessons/:lessonId` | ADMIN+ | — |
| GET | `/admin/courses/:id` | ADMIN+ | تفاصيل إدارية |
| PATCH | `/admin/courses/:id` | ADMIN+ | تحديث بيانات الكورس |
| POST | `/admin/courses/:id/publish` | ADMIN+ | نشر + حراسة الجاهزية |
| POST | `/admin/courses/:id/archive` | ADMIN+ | أرشفة |

### الطلاب والتسجيلات (إدارة)
| الطريقة | المسار | الدور |
|---------|--------|-------|
| GET | `/admin/students` | ADMIN+ |
| POST | `/admin/students` | ADMIN+ إنشاء طالب |
| GET | `/admin/students/:studentId` | ADMIN+ |
| PATCH | `/admin/students/:studentId` | ADMIN+ |
| POST | `/admin/students/:studentId/enrollments` | ADMIN+ تسجيل يدوي |
| DELETE | `/admin/students/:studentId/enrollments/:enrollmentId` | ADMIN+ إلغاء |

### أكواد التفعيل (إدارة)
| الطريقة | المسار | الدور |
|---------|--------|-------|
| GET | `/admin/activation-codes` | ADMIN+ |
| POST | `/admin/activation-codes` | ADMIN+ إنشاء (الكود الصريح مرة واحدة) |
| POST | `/admin/activation-codes/:codeId/disable` | ADMIN+ |
| GET | `/admin/activation-codes/:codeId` | ADMIN+ |
| PATCH | `/admin/activation-codes/:codeId` | ADMIN+ |

### طلبات الدفع (إدارة)
| الطريقة | المسار | الدور |
|---------|--------|-------|
| GET | `/admin/payment-requests` | ADMIN+ |
| POST | `/admin/payment-requests/:paymentRequestId/approve` | ADMIN+ قبول + تسجيل |
| POST | `/admin/payment-requests/:paymentRequestId/reject` | ADMIN+ |
| GET | `/admin/payment-requests/:paymentRequestId` | ADMIN+ |

### الطالب (مسار `/student` تحت `/api/v1/student`)
**كلها تتطلب دور STUDENT.**

| الطريقة | المسار | الغرض |
|---------|--------|--------|
| POST | `/student/activation-codes/redeem` | استرداد كود؛ تحديد معدل |
| POST | `/student/payment-requests` | إنشاء طلب CliQ يدوي |
| GET | `/student/payment-requests` | قائمة الطلبات |
| GET | `/student/dashboard` | لوحة |
| GET | `/student/my-courses` | كورسات مسجّلة |
| GET | `/student/courses/:courseSlug/learn` | صفحة التعلّم |
| POST | `/student/lessons/:lessonId/progress` | تحديث التقدّم |
| POST | `/student/lessons/:lessonId/complete` | إكمال درس |

### السوبر أدمن (مسار `/api/v1/super-admin`) — **SUPER_ADMIN فقط**

| الطريقة | المسار |
|---------|--------|
| GET | `/super-admin/overview` |
| GET | `/super-admin/admins` |
| POST | `/super-admin/admins` |
| POST | `/super-admin/admins/:adminId/disable` |
| POST | `/super-admin/admins/:adminId/enable` |
| GET | `/super-admin/admins/:adminId` |
| PATCH | `/super-admin/admins/:adminId` |
| GET | `/super-admin/audit-logs` |
| GET | `/super-admin/settings` |
| PATCH | `/super-admin/settings` |

### الصحة
| الطريقة | المسار |
|---------|--------|
| GET | `/health` |

*(التفاصيل الدقيقة للتحقق والتدقيق والـ audit موثّقة في المتحكمات؛ معظم الإجراءات الحساسة تكتب `AuditLog` حيث طُبّق ذلك في الكود.)*

---

## 8. جرد مسارات الواجهة (Next.js App Router)

جميع المسارات المطلوبة في الطلب **موجودة** في المستودع:

| المسار | الحالة |
|--------|--------|
| `/` | موجود |
| `/login` | موجود |
| `/courses` | موجود |
| `/courses/[slug]` | موجود |
| `/student` | موجود |
| `/student/my-courses` | موجود |
| `/student/explore` | موجود |
| `/student/redeem` | موجود |
| `/student/payments` | موجود |
| `/learn/[courseSlug]` | موجود |
| `/admin` | موجود |
| `/admin/courses` | موجود |
| `/admin/courses/new` | موجود |
| `/admin/courses/[id]` | موجود |
| `/admin/courses/[id]/builder` | موجود |
| `/admin/categories` | موجود |
| `/admin/students` | موجود |
| `/admin/students/new` | موجود |
| `/admin/students/[id]` | موجود |
| `/admin/activation-codes` | موجود |
| `/admin/activation-codes/new` | موجود |
| `/admin/payment-requests` | موجود |
| `/admin/payment-requests/[id]` | موجود |
| `/super-admin` | موجود |
| `/super-admin/admins` | موجود |
| `/super-admin/admins/new` | موجود |
| `/super-admin/admins/[id]` | موجود |
| `/super-admin/audit-logs` | موجود |
| `/super-admin/settings` | موجود |

**Layouts:** `student/layout.tsx`، تخطيط الإدارة مع الشريط الجانبي، `super-admin/layout.tsx` مع الصدفة الخاصة.

---

## 9. التدفقات الرئيسية للمنتج (E2E منظور)

لكل تدفق: الصفحات ← API ← نماذج ← تدقيق/أمان.

**A. إنشاء كورس:** `/admin/courses/new` ← `POST /admin/courses` ← `Course`، `CourseSection` لاحقًا ← audit عند الإنشاء إن وُجد.

**B. بناء يدوي:** `/admin/courses/[id]/builder` ← هيكل الأقسام/الدروس ← `CourseSection`، `Lesson`.

**C. استيراد يوتيوب:** نفس البناء ← `preview`/`import` ← يتطلب `YOUTUBE_API_KEY`.

**D. النشر:** زر نشر ← `POST .../publish` ← فحص الجاهزية ← `Course.status = PUBLISHED`.

**E. تعلّم الطالب:** مسجّل ونشط ← `/learn/[slug]` ← `GET /student/courses/:slug/learn`، تقدّم، إكمال.

**F. تسجيل يدوي من الإدارة:** `/admin/students` ← `POST enrollments` ← `Enrollment` مصدر `MANUAL_ADMIN` أو ما يعادله في المنطق.

**G. استرداد كود:** `/student/redeem` ← `POST .../activation-codes/redeem` ← مقارنة hash، حدود استخدام، `CodeRedemption`، تسجيل بمصدر `ACTIVATION_CODE`؛ تحديد معدل؛ طالب مسجّل.

**H. طلب دفع CliQ:** `/student/payments` ← `POST /student/payment-requests` ← `PaymentRequest` حالة `PENDING`.

**I. اعتماد/رفض:** `/admin/payment-requests/[id]` ← approve/reject ← تسجيل بـ `CLIQ_PAYMENT` عند الموافقة.

**J. سوبر أدمن يدير أدمنز:** `/super-admin/admins` ← CRUD محصور بـ `ADMIN` ← audits `ADMIN_*`.

**K. سجلات وإعدادات:** `/super-admin/audit-logs`، `/super-admin/settings` ← APIs السوبر أدمن؛ الإعدادات في `AppSetting`.

---

## 10. تدقيق نظام التصميم

- **ألوان CSS Variables:** خلفية دافئة، **برتقالي primary** للـ CTA، **سماوي secondary** للأسطح التعليمية، **بنفسجي accent**، ظلال بطاقات (`shadow-card`, `shadow-brand`).
- **الطباعة:** `text-sm` أساسًا على `body`؛ عناوين `text-heading`.
- **البطاقات:** زوايا كبيرة (`--radius`)، ظلال خفيفة.
- **RTL:** واجهات عربية؛ صدفات الطالب/الإدارة/السوبر أدمن مهيأة للاتجاه.
- **الكثافة:** تصميم مضغوط نسبيًا (Phase 4A.3 في السجل التاريخي للمشروع).
- **صلاحية «premium LMS»:** من الوصف البصري والتوكنات — لا يوجد اختبار مستخدم آلي هنا.

---

## 11. تدقيق أمان

### موجود

- **argon2** لتخزين كلمات المرور.
- **JWT في HttpOnly cookie**؛ لا تخزين توكن في localStorage للمسار الرئيسي.
- **Helmet** و **CORS** مقيد بـ `CLIENT_ORIGIN`.
- **تفعيل الأكواد:** HMAC-SHA256 مع **pepper** (`ACTIVATION_CODE_PEPPER` أو احتياطي `JWT_ACCESS_SECRET`).
- **Zod** على مدخلات API الرئيسية.
- **RBAC** على المسارات الحساسة.
- **تحديد معدل:** تسجيل الدخول؛ استرداد الأكواد (مع مفتاح مستخدم/IP).
- **Audit logs** لأحداث متعددة؛ تصفية metadata في سوبر أدمن.
- **مفتاح يوتيوب** لا يُعرض للمتصفح — قراءة خادمية فقط.

### فجوات / TODO مقترحة

- **CSRF** صريح للعمليات POST الحساسة خلف الجلسة.
- **Refresh tokens** وإبطال جلسات منتشرة.
- **Redis** حقيقي لمعدلات موحّدة متعددة النسخ.
- **Cookie domain / Secure / SameSite=None** حسب نشر النطاق الفرعي.
- **CSP** صارمة في Next.
- **اختبارات تكامل API** — موجودة في `apps/api/src/integration/critical-flows.integration.test.ts` (Vitest + Supertest). **Phase 10B.1:** تمرير ناجح موثّق ضد قاعدة Neon معزولة بـ `TEST_DATABASE_URL` (21 اختبارًا، 0 تخطٍ). يجب على المطوّرين/CI الاستمرار باستخدام قاعدة اختبار فقط — **لا** تستخدم `DATABASE_URL` للإنتاج.
- **اختبارات أمان مُستقلة (pen test / SAST تلقائية)** — خارج نطاق المستودع الحالي.
- **تغطية audit** قد لا تشمل كل مسار حساس — مراجعة يدوية.

---

## 12. المتغيرات البيئية

| المتغير | مطلوب؟ | الاستخدام | ملاحظات إنتاج |
|---------|--------|------------|----------------|
| `DATABASE_URL` | نعم (API) | Prisma | Neon أو Postgres مع SSL |
| `CLIENT_ORIGIN` | نعم (API) | CORS | يجب أن يطابق أصل الواجهة |
| `JWT_ACCESS_SECRET` | نعم (API) | ≥32 حرفًا | سر قوي فريد |
| `JWT_EXPIRES_IN` | اختياري | مدة JWT | افتراضي `12h` |
| `ACTIVATION_CODE_PEPPER` | اختياري | ≥32 إن وُجد | يُفضّل سر مستقل عن JWT |
| `API_PORT` | اختياري | منفذ Express | 4000 افتراضيًا |
| `NODE_ENV` | — | سلوك الكوكي والـ helmet | — |
| `NEXT_PUBLIC_APP_URL` | للواجهة | روابط عامة إن استُخدمت | — |
| `API_INTERNAL_URL` | للواجهة (Next rewrites) | بروكسي إلى Express | يجب أن يكون قابلاً للوصول من خادم Next أثناء الطلبات والبناء إن لزم |
| `REDIS_URL` | لا | stub حاليًا | — |
| `YOUTUBE_API_KEY` | لا | استيراد القوائم | سر خادم فقط |
| `JWT_REFRESH_SECRET`، `SESSION_SECRET` | في المثال | **غير مستخدمة في `loadEnv` الحالي للـ API** | تجنّب الاعتماد عليها حتى يُربط الكود |
| `CLIQ_*` في `.env.example` | — | **ليست مصدر الحقيقة للواجهة الحالية**؛ الإعدادات المنصة في `AppSetting` للسوبر أدمن | تجنب ازدواجية دون توثيق |
| Cloudinary / Sentry | اختياري | جاهزية لاحقة | — |

**ملاحظة تدقيق حرجة:** ملف `.env.example` يحتوي قيمة طويلة لـ **`ACTIVATION_CODE_PEPPER`** — إن كانت حقيقية في المستودع فهذا **خطر تسريب سر**؛ يُفضّل أن يكون placeholder فقط في الأمثلة العامة.

---

## 13. تدقيق البذرة `prisma/seed.ts`

- **مستخدمون:** `super@example.com` (SUPER_ADMIN)، `admin@example.com` (ADMIN)، `student@example.com`، `student2@example.com` (STUDENT) — كلمات المرور النصية في الكود للبذرة فقط: **SuperAdmin123!**، **Admin123456!**، **Student123!** (نفس الهاش للطالبين).
- **تصنيفات:** برمجة، تصميم.
- **كورس تجريبي منشور:** `arabic-web-basics` مع أقسام ودروس يوتيوب.
- **كورس مدفوع تجريبي:** `paid-activation-demo`.
- **كود تفعيل:** إذا كان الـ pepper ≥ 32 — يُنشأ hash + prefix؛ يُطبع **الكود الصريح مرة في console** (`console.log`).
- **طلب دفع معلّق:** لـ `student2@example.com` على الكورس المدفوع، مرجع `CLIQ-SEED-PENDING-001`.

لا يُزرع `AppSetting` افتراضيًا في البذرة الموضحة — الإعدادات تأتي من القيم الافتراضية في الكود عند أول قراءة.

---

## 14. حالة التنفيذ حسب المراحل (تقدير من الكود الحالي)

| المرحلة | الحالة |
|---------|--------|
| Phase 1 Foundation | منجز (monorepo، prisma، redis stub) |
| Phase 2 Auth & RBAC | منجز |
| Phase 3 Courses Core | منجز |
| Phase 3.5 Categories UI | منجز |
| Phase 4A Course Builder | منجز |
| Phase 4A.1 Publish Guard | منجز |
| Phase 4A.2 Theme Alignment | منجز ضمن التصميم الحالي |
| Phase 4A.3 Density Tuning | منجز ضمن الوصف |
| Phase 4B YouTube Playlist Import | منجز (يتطلب مفتاح API) |
| Phase 5 Student Learning | منجز |
| Phase 6 Admin Students & Enrollments | منجز |
| Phase 7 Activation Codes | منجز |
| Phase 8 CliQ Manual Payments | منجز |
| Phase 9 Super Admin Governance | منجز |
| Phase 10 QA / Security / Production Polish | **10A** إعدادات؛ **10B** تكامل Vitest؛ **10B.1** تنفيذ الاختبارات التكاملية بنجاح على DB معزول (`TEST_DATABASE_URL`) — 21 اختبارًا، 0 تخطٍ، 0 فشل؛ **10C** `docs/PRODUCTION_READINESS_CHECKLIST.md` + `docs/MANUAL_QA_CHECKLIST.md` |

---

## 14B. Phase 10A — قرارات أمان وتوثيق (ملخص)

- **`.env.example`:** placeholders صريحة لـ `JWT_ACCESS_SECRET` و`ACTIVATION_CODE_PEPPER`؛ لا أسرار طويلة تشبه الإنتاج؛ `SESSION_SECRET` / `JWT_REFRESH_SECRET` معلّقة كغير مستخدمة في `loadEnv`؛ لا متغيرات `CLIQ_*` — مصدر عرض تعليمات CliQ هو `AppSetting` (`platform_governance`) من لوحة السوبر أدمن.
- **بناء Next:** صفحات تعتمد على API علِّمت `force-dynamic` حيث يلزم؛ `fetchPublicApiMaybe` يتعامل مع أخطاء اتصال أثناء البناء دون إسقاط البناء — الهدف تقليل ضوضاء `ECONNREFUSED` في CI.
- **الكوكي / CORS:** توثيق في `cookieAuth` و`app.ts`؛ `Secure` في الإنتاج؛ CORS أصل واحد + credentials.
- **CSRF:** لا تنفيذ توكن في هذه المرحلة. الحماية الحالية: **SameSite=Lax** + طلبات `/api/v1` من نفس المنشأ عبر **rewrite** في Next. قبل إنتاج حساس، يُنصح بتقييم **CSRF صريح** للطلبات الحساسة المعتمدة على الكوكي (Phase 10B/C).
- **Redis / rate limit:** موثّق في README — الحدود في الذاكرة؛ `REDIS_URL` اختياري غير موصول؛ للنشر متعدد النسخ يُفضّل مستودع Redis لاحقًا.

---

## 14C. Phase 10B.1 — تنفيذ اختبارات التكامل على قاعدة معزولة

- **الحالة:** مكتمل بنجاح في جلسة تحقق يدوية باستخدام Neon كـ **`TEST_DATABASE_URL`** (قاعدة اختبار معزولة، ليست الإنتاج).
- **النتيجة:** **21** اختبار تكامل ناجح، **0** متخطّى، **0** فاشل؛ لا مهلات زمنية ولا رفض غير معالج بعد إصلاح تمرير أخطاء الـ async إلى `errorHandler` (`asyncHandler` على مسارات Express).
- **إلزام مستمر:** أي تشغيل مستقبلي لـ `pnpm test:api` يجب أن يستخدم **`TEST_DATABASE_URL`** لقاعدة Postgres مخصّصة للاختبار فقط — **ممنوع** توجيه الاختبارات إلى قاعدة الإنتاج أو بيانات حية.

---

## 15. الأخطاء والمخاطر والتناقضات

| البند | الخطورة | الوصف |
|-------|---------|--------|
| قيمة طويلة لـ `ACTIVATION_CODE_PEPPER` داخل `.env.example` | **مُعالَج في 10A** | استبدال بـ placeholder؛ تحذير في README بعدم تغيير الـ pepper بعد إنشاء أكواد حقيقية |
| بناء Next بدون API يُحدِث `ECONNREFUSED` | **مُخفَّض في 10A** | صفحات ديناميكية + جلب يتسامح مع فشل الاتصال؛ راقب ما إذا بقي أي مسار يطبع أخطاء |
| عدم وجود اختبارات آلية | **مُخفَّض جزئيًا** — توجد تكاملات API حرجة؛ تشغيل CI بدون `TEST_DATABASE_URL` لا يُنفّذها | تشغيل `pnpm test:api` مع قاعدة معزولة قبل كل إصدار؛ مراجعة تغطية مستمرة |
| `JWT_REFRESH_SECRET` في المثال دون استخدام في API | **مُعالَج في 10A** | معلّق في `.env.example` كـ غير مستخدم |
| إعدادات CliQ في `.env.example` مقابل `AppSetting` في التشغيل | **مُعالَج توثيقيًا في 10A** | إزالة `CLIQ_*` من المثال؛ README + تعليق في `superAdmin.controller` |
| Redis غير فعّال | **متوسطة** لمعدلات متعددة الخوادم | موثّق؛ حدود المعدل محلية للعملية |
| لا CSRF صريح | **متوسطة** حسب نموذج التهديد | موثّق في README و§14B؛ يعتمد على SameSite والسياسات |
| سوابق express-rate-limit (`limit` vs `max`) بين الملفات | **منخفضة** | مراجعة توافق الإصدارات لتجنب سلوك غير متوقع |

---

## 16. قائمة مقترحة للمرحلة 10

### تعزيز الأمان
- إزالة أي أسرار حقيقية من `.env.example`؛ استخدام placeholders فقط.
- مراجعة CSP، SameSite، Secure، Domain للإنتاج.
- تقييم CSRF أو استخدام أنماط طلبات أكثر أمانًا للعمليات الحساسة.

### الاختبار
- اختبارات تكامل API للمسارات الحرجة (auth، enroll، redeem، payment، super-admin).
- اختبارات واجهة اختيارية (Playwright) لتدفقات الطالب والإدارة.

### QA يدوي
- مسارات كل دور بعد النشر؛ CliQ يدوي؛ أكواد؛ سوبر أدمن.

### تحسين واجهة
- توحيد عرض إعدادات المنصة (CliQ) على صفحة مدفوعات الطالب من API الإعدادات إن رُغب بذلك.

### الأداء
- تقليل الجلب أثناء `next build` أو تشغيل API في CI.

### الإنتاج
- متغيرات بيئة على الخادم؛ ترحيلات Prisma مقابل `db push`؛ مراقبة أخطاء (Sentry جاهز كplaceholder).

### التوثيق
- توحيد README مع المتغيرات الفعلية في `loadEnv`.

### قاعدة البيانات
- اعتماد migrations للإصدارات بدلاً من `db push` في الإنتاج.

### المراقبة والسجلات
- ربط Sentry؛ سجلات هيكلية لـ API.

---

## 17. الخلاصة النهائية

- **جاهز لـ MVP تجريبي:** التدفقات الأساسية للكورسات، الطالب، الإدارة، الدفع اليدوي، الأكواد، والسوبر أدمن موجودة وتمر البناء والـ typecheck.
- **يجب معالجته قبل إنتاج جاد:** إزالة الأسرار من الأمثلة العامة؛ استراتيجية بناء CI تشمل تشغيل اختبارات التكامل مع `TEST_DATABASE_URL`؛ سياسات كوكي/CORS للنطاق الحقيقي؛ ترحيلات DB منظمة.
- **يمكن تأجيله بعد الإطلاق:** تحسينات UI طفيفة، Redis للكاش، refresh tokens، تعميق الاختبارات.

---

**مسار التقرير:** `docs/PROJECT_AUDIT_AND_HANDOFF.md`

---

## ملحق: أوامر التشغيل المسجّلة

```
pnpm typecheck  → نجاح (بعد Phase 10A)
pnpm build      → نجاح؛ لا ظهور ECONNREFUSED في سجل البناء الحالي
pnpm lint       → غير مطلوب كـ ESLint منفصل؛ الجذر يوجّه للـ typecheck
pnpm test:api   → مع TEST_DATABASE_URL على قاعدة معزولة: 21 تكامل ناجح، 0 تخطٍ (Phase 10B.1)
```
