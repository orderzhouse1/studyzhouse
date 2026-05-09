# PROJECT BRIEF FOR CURSOR

## اسم المشروع المؤقت
**منصة كورسات عربية احترافية**

> هذا الملف هو المصدر الأساسي الذي يجب على Cursor قراءته قبل كتابة أي كود.  
> الهدف: بناء منصة تعليم إلكتروني عربية، بتصميم Premium قوي جدًا، وأداء سريع، وأمان عالي، باستخدام Next.js للواجهة و Express.js للباك إند و Neon PostgreSQL للداتا بيس.

---

# 1. طريقة استخدام هذا الملف داخل Cursor

ضع هذا الملف في جذر المشروع باسم:

```txt
PROJECT_BRIEF_FOR_CURSOR.md
```

ثم افتح Cursor واكتب له:

```txt
Read PROJECT_BRIEF_FOR_CURSOR.md carefully.
Do not write code yet.
Create a technical implementation plan for the MVP.
Split the work into small safe phases.
For each phase, list the files you will create or modify.
Follow the design, security, database, and architecture rules in the brief.
```

بعد أن يعطيك الخطة، لا تجعله ينفذ كل شيء مرة واحدة. استخدم البرومبتات الموجودة في آخر الملف خطوة بخطوة.

---

# 2. وصف المشروع

نريد بناء منصة كورسات عربية احترافية. المنصة فيها ثلاثة أنواع رئيسية من المستخدمين:

1. **Super Admin**  
   صاحب المنصة أو المدير الأعلى. لديه صلاحيات كاملة على النظام.

2. **Admin / Employee**  
   موظف أو مدير محتوى. يستطيع إنشاء الكورسات وتعديلها وإدارة الطلاب والكورسات والأكواد والمدفوعات حسب الصلاحيات.

3. **Student**  
   الطالب. يستطيع تصفح الكورسات، الدخول إلى كورساته، مشاهدة الدروس داخل المنصة، تتبع تقدمه، واستخدام كود لتفعيل كورس مدفوع.

المنصة ستكون:

- باللغة العربية بالكامل.
- RTL بالكامل.
- بثيم فاتح.
- بتصميم قوي جدًا، حديث، نظيف، Premium، وليس تصميمًا عاديًا أو طفوليًا.
- الفيديوهات تأتي من YouTube وتعرض داخل المنصة.
- الدفع ليس Stripe. الدفع سيكون عبر **CliQ** بشكل مبدئي من خلال طلب دفع يدوي أو إدخال مرجع الدفع، ثم موافقة الأدمن.
- الكورسات المدفوعة يمكن تفعيلها أيضًا عن طريق أكواد يجهزها الأدمن.

---

# 3. الهدف من النسخة الأولى MVP

الهدف ليس بناء كل شيء دفعة واحدة. النسخة الأولى يجب أن تكون قوية ومنظمة وقابلة للتطوير.

## MVP يجب أن يحتوي على:

- تسجيل دخول آمن.
- أدوار وصلاحيات: Super Admin, Admin, Student.
- لوحة Super Admin.
- لوحة Admin.
- لوحة Student.
- إدارة الكورسات.
- إضافة كورس بطريقتين:
  - Easy Mode: من رابط YouTube playlist.
  - Custom Mode: إنشاء الدروس يدويًا وترتيبها.
- عرض الفيديوهات داخل المنصة.
- صفحة تعلم للطالب.
- تتبع تقدم الطالب في الدروس والكورسات.
- إدارة الطلاب من لوحة الأدمن.
- إضافة أو حذف كورسات من حساب طالب.
- إنشاء أكواد تفعيل للكورسات المدفوعة.
- صفحة للطالب لتفعيل الكود.
- نظام طلب دفع عبر CliQ بشكل يدوي.
- موافقة أو رفض طلبات الدفع من الأدمن.
- تصميم قوي جدًا، responsive، وRTL.
- حماية أساسية قوية: RBAC, input validation, rate limiting, secure cookies, audit logs.

---

# 4. Stack التقني المعتمد

## Editor

- Cursor

## Frontend

- Next.js App Router
- React
- TypeScript strict mode
- Tailwind CSS
- shadcn/ui
- Radix UI
- lucide-react icons
- Framer Motion للحركات الخفيفة
- React Hook Form للفورمات
- Zod للتحقق من البيانات
- TanStack Query للبيانات الديناميكية في لوحات التحكم
- dnd-kit لترتيب الدروس والسحب والإفلات
- sonner للتنبيهات Toasts

## Backend

- Express.js
- TypeScript
- REST API
- PostgreSQL على Neon
- Prisma ORM كخيار افتراضي
- Redis للكاش، الجلسات، rate limiting، والأكواد المؤقتة
- Zod للتحقق من request bodies و query params
- Helmet للأمان
- CORS مضبوط
- Cookie parser
- Rate limiting
- Pino أو Winston للـ logging

## Database

- Neon PostgreSQL
- Prisma migrations
- Seed script لإنشاء Super Admin وبيانات تجريبية نظيفة

## Auth

بسبب أن الباك إند سيكون Express.js، الافتراضي هو:

- Custom Express Auth
- HttpOnly Secure cookies
- Sessions أو refresh tokens مخزنة بطريقة آمنة
- Password hashing باستخدام Argon2id أو bcrypt
- RBAC واضح
- MFA لاحقًا للسوبر أدمن والأدمن

ممنوع وضع tokens في localStorage.

## Validation

- Zod في الواجهة والباك إند.
- يفضل وضع schemas مشتركة في package مشترك.

## Security

- Authorization على كل endpoint.
- Rate limiting.
- CSP headers.
- Input validation.
- Secrets في env فقط.
- WAF من Cloudflare عند النشر.
- Audit logs لكل عمليات الأدمن الحساسة.
- CSRF protection عند استخدام cookie-based auth.

## Performance

- Next.js Server Components قدر الإمكان.
- تقليل Client Components.
- Image optimization.
- CDN من Cloudflare.
- Caching باستخدام Redis.
- Pagination في الجداول.
- Debounced search.
- Lazy loading.
- Skeleton loading states.

## Quality

- ESLint
- Prettier
- TypeScript strict
- Vitest
- Playwright
- GitHub Actions
- Commit واضح بعد كل مرحلة

## Monitoring

- Sentry للأخطاء.
- Logs منظمة في الباك إند.
- Analytics لاحقًا.

---

# 5. قرار معماري مهم

هذا المشروع يستخدم **Next.js للواجهة** و **Express.js للباك إند**.

لذلك:

- لا تستخدم Next.js Server Actions كبديل للباك إند الأساسي.
- كل business logic المهم يكون في Express API.
- Next.js يتعامل مع الواجهة، SSR/Server Components، الحماية البصرية، وجلب البيانات من API.
- Express هو مصدر الحقيقة للـ auth, roles, courses, enrollments, codes, payments.
- لا تكرر نفس المنطق في Next.js و Express.

يمكن استخدام Route Handlers في Next.js فقط لأشياء بسيطة مثل proxy أو health أو metadata، وليس كطبقة backend رئيسية.

---

# 6. بنية المشروع المقترحة

استخدم Monorepo منظم:

```txt
course-platform/
  apps/
    web/                  # Next.js frontend
    api/                  # Express backend
  packages/
    shared/               # shared types, zod schemas, constants
    config/               # shared eslint/prettier/tsconfig if needed
  prisma/
    schema.prisma
    seed.ts
  docs/
    PROJECT_BRIEF_FOR_CURSOR.md
  .env.example
  package.json
  pnpm-workspace.yaml
  README.md
```

الأوامر المقترحة:

```txt
pnpm dev                  # تشغيل الواجهة والباك إند معًا
pnpm dev:web              # تشغيل Next.js فقط
pnpm dev:api              # تشغيل Express فقط
pnpm db:migrate           # تشغيل Prisma migrations
pnpm db:seed              # إنشاء بيانات مبدئية
pnpm test                 # تشغيل الاختبارات
pnpm lint                 # فحص الكود
pnpm typecheck            # فحص TypeScript
```

---

# 7. قواعد Cursor العامة

يجب على Cursor اتباع هذه القواعد دائمًا:

```txt
1. Always use TypeScript strict mode.
2. Do not use any unless absolutely necessary.
3. The app is Arabic-first and RTL-first.
4. Use real Arabic UI text, not Lorem Ipsum.
5. Use Next.js App Router in the frontend.
6. Use Express.js REST API in the backend.
7. Do not put business logic inside the frontend.
8. Use Prisma with Neon PostgreSQL.
9. Do not mix Prisma and Drizzle in the same implementation.
10. Use Zod for all forms and API validation.
11. Use shadcn/ui components and customize them with Tailwind.
12. Design must be premium, clean, spacious, and modern.
13. Never expose secrets to the browser.
14. Never store auth tokens in localStorage.
15. Enforce authorization in the backend, not only in the UI.
16. Add loading, empty, error, and success states for important screens.
17. Add responsive layouts for mobile, tablet, and desktop.
18. Do not install new libraries without explaining why.
19. Do not modify unrelated files.
20. Before large changes, create a plan and list affected files.
```

---

# 8. تجربة التصميم المطلوبة

## لغة التصميم

التصميم يجب أن يكون:

- عربي RTL بالكامل.
- Light theme فقط في البداية.
- Premium SaaS/LMS style.
- نظيف، واسع، احترافي.
- بعيد عن الألوان الطفولية والتصاميم العشوائية.
- قريب من إحساس منصات احترافية مثل Linear / Stripe / modern LMS، لكن باللغة العربية.

## ألوان مقترحة

استخدم ألوان قليلة وقوية:

```txt
Background: #F8FAFC or #FFFFFF
Surface: #FFFFFF
Primary: Deep Indigo / Blue
Accent: Emerald or Cyan very subtly
Text: Slate / Zinc dark tones
Border: Soft slate borders
Success: Emerald
Warning: Amber
Danger: Rose
```

لا تستخدم gradients كثيرة. استخدم gradient خفيف في hero أو cards المهمة فقط.

## الخطوط

استخدم خط عربي واضح وحديث:

- Cairo
- IBM Plex Sans Arabic
- Tajawal

الاقتراح الافتراضي:

```txt
Use Cairo or IBM Plex Sans Arabic via next/font/google.
```

## Layout RTL

- Sidebar في لوحات التحكم يكون على اليمين.
- المحتوى الرئيسي يكون على اليسار من السايدبار.
- الجداول والنماذج تكون RTL.
- الأيقونات التي لها اتجاه يجب أن تعكس اتجاه RTL.
- استخدم `dir="rtl"` على مستوى التطبيق.
- استخدم `lang="ar"`.

## تفاصيل تجعل التصميم قويًا

كل صفحة مهمة يجب أن تحتوي على:

- عنوان واضح.
- وصف صغير أسفل العنوان.
- CTA واضح.
- Cards متناسقة.
- مساحات كبيرة ومنظمة.
- Grid متجاوب.
- Empty state جميل.
- Loading skeleton.
- Error state واضح.
- Hover states.
- Focus states.
- Badges للحالة.
- Icons من lucide-react.
- حركات بسيطة جدًا باستخدام Framer Motion عند الحاجة.

## ممنوعات التصميم

لا تفعل:

- لا تستخدم تصميم generic dashboard رخيص.
- لا تستخدم ألوان كثيرة.
- لا تجعل كل شيء gradient.
- لا تستخدم shadow مبالغ فيه.
- لا تجعل الصفحة مزدحمة.
- لا تستخدم نصوص إنجليزية في الواجهة إلا للضرورة.
- لا تنس حالات empty/loading/error.
- لا تضع buttons بدون hierarchy واضح.

---

# 9. أدوار المستخدمين والصلاحيات

## Super Admin

صلاحيات كاملة:

- إدارة كل المستخدمين.
- إنشاء وتعديل وحذف admins.
- رؤية كل الطلاب.
- رؤية كل الكورسات.
- رؤية كل المدفوعات.
- رؤية كل الأكواد.
- تغيير إعدادات المنصة.
- رؤية Audit Logs.
- تعطيل أو تفعيل أي مستخدم.
- تعطيل أو نشر أي كورس.
- مراجعة أداء الأدمنز.

## Admin / Employee

صلاحيات عملية:

- إنشاء كورسات.
- تعديل كورساته أو الكورسات المسموحة له.
- نشر أو إخفاء الكورسات حسب الصلاحية.
- إضافة دروس من YouTube.
- استيراد playlist من YouTube.
- ترتيب الدروس.
- إدارة الطلاب.
- إضافة كورس لطالب.
- حذف كورس من طالب.
- متابعة تقدم الطلاب.
- إنشاء أكواد تفعيل للكورسات.
- مراجعة طلبات الدفع عبر CliQ.
- الموافقة أو الرفض على طلبات الدفع.

لا يستطيع:

- إنشاء Super Admin.
- حذف Super Admin.
- تغيير إعدادات خطيرة.
- رؤية أسرار النظام.
- تعطيل أدمن آخر إلا إذا السوبر أدمن أعطاه صلاحية.

## Student

صلاحياته:

- تسجيل الدخول.
- رؤية كورساته.
- استكشاف الكورسات المنشورة.
- فتح الدروس المسموحة له فقط.
- مشاهدة الفيديو داخل المنصة.
- تتبع تقدمه.
- تفعيل كورس بكود.
- طلب دفع عبر CliQ.
- رؤية حالة طلب الدفع.
- تعديل ملفه الشخصي.

لا يستطيع:

- فتح كورس مدفوع غير مشترك فيه.
- تعديل بيانات كورس.
- رؤية طلاب آخرين.
- استخدام API إداري.

---

# 10. أهم قاعدة أمان

لا تعتمد على إخفاء الأزرار في الواجهة فقط.

كل endpoint في Express يجب أن يتحقق من:

1. هل المستخدم مسجل دخول؟
2. ما هو دوره؟
3. هل لديه صلاحية لهذا المورد بالذات؟

مثال:

- الطالب لا يستطيع فتح enrollment لطالب آخر.
- الأدمن لا يستطيع تعديل كورس لا يملكه إلا إذا لديه صلاحية.
- الطالب لا يستطيع مشاهدة درس من كورس غير مسجل فيه.
- كود التفعيل لا يمكن استخدامه إذا منتهي أو مستهلك أو غير مخصص لهذا الكورس.

---

# 11. الصفحات المطلوبة

## Public Pages

```txt
/
/courses
/courses/[slug]
/login
/register
/forgot-password
```

### الصفحة الرئيسية

يجب أن تكون قوية جدًا بصريًا:

- Hero section عربي Premium.
- عنوان قوي.
- وصف المنصة.
- CTA: ابدأ التعلم / استكشف الكورسات.
- Featured courses.
- Why choose us.
- How it works.
- Stats section.
- Testimonials لاحقًا.
- FAQ.
- Footer.

### صفحة استكشاف الكورسات العامة

- بحث.
- فلترة حسب التصنيف.
- فلترة مجاني/مدفوع.
- Course cards جميلة.
- Empty state.

### صفحة تفاصيل الكورس

- صورة الغلاف.
- عنوان ووصف.
- مجاني أو مدفوع.
- السعر إن كان مدفوعًا.
- عدد الدروس.
- مدة تقريبية.
- ما الذي ستتعلمه.
- محتوى الكورس.
- زر التسجيل أو تفعيل الكود أو طلب الدفع.

---

## Student Pages

```txt
/student
/student/my-courses
/student/explore
/student/courses/[slug]/learn
/student/redeem-code
/student/payments
/student/profile
/student/settings
```

### Student Dashboard

يجب أن يحتوي على:

- ترحيب باسم الطالب.
- كرت “تابع التعلم”.
- آخر درس شاهده.
- كورساته النشطة.
- نسبة التقدم.
- إنجازات بسيطة.
- تنبيهات أو رسائل مهمة.
- كورسات مقترحة.

### My Courses

- قائمة كورسات الطالب.
- Progress لكل كورس.
- زر متابعة.
- حالات: لم يبدأ، قيد التعلم، مكتمل.

### Explore

- كورسات منشورة.
- كورسات مجانية يمكن التسجيل فيها مباشرة.
- كورسات مدفوعة تحتاج كود أو دفع CliQ.

### Learn Page

هذه من أهم الصفحات.

يجب أن تحتوي على:

- YouTube video player داخل المنصة.
- عنوان الدرس.
- وصف الدرس.
- قائمة الدروس على اليمين بسبب RTL.
- Progress للكورس.
- زر الدرس التالي والسابق.
- زر mark as complete.
- حالة الدرس مكتمل/غير مكتمل.
- Notes بسيطة لاحقًا.
- Responsive ممتاز على الهاتف.

### Redeem Code

- حقل إدخال الكود.
- شرح بسيط.
- تحقق من الكود.
- إذا صحيح، يتم إضافة الكورس لحساب الطالب.
- إذا خطأ، رسالة واضحة.
- Rate limiting لمنع التخمين.

### Payments

- طلبات الدفع عبر CliQ.
- حالة الطلب: pending, approved, rejected.
- تفاصيل طريقة الدفع.
- إدخال transaction reference.
- رفع صورة إثبات الدفع إن تم دعم upload.

---

## Admin Pages

```txt
/admin
/admin/courses
/admin/courses/new
/admin/courses/new/easy
/admin/courses/new/custom
/admin/courses/[courseId]
/admin/courses/[courseId]/builder
/admin/students
/admin/students/[studentId]
/admin/codes
/admin/payments
/admin/analytics
/admin/profile
/admin/settings
```

### Admin Dashboard

- إحصائيات سريعة:
  - عدد الكورسات.
  - عدد الطلاب.
  - enrollments الجديدة.
  - طلبات الدفع المعلقة.
  - نسبة إكمال الكورسات.
- Quick actions:
  - إنشاء كورس.
  - إضافة طالب.
  - إنشاء كود.
  - مراجعة دفعات.
- جدول آخر النشاطات.

### Courses Management

- جدول كورسات.
- بحث.
- فلترة حسب الحالة: draft, published, archived.
- فلترة مجاني/مدفوع.
- زر إنشاء كورس.
- actions: edit, duplicate, publish/unpublish, archive.

### Create Course: Easy Mode

هذا مهم جدًا.

الأدمن يدخل:

- عنوان الكورس.
- وصف.
- صورة غلاف.
- هل الكورس مجاني أم مدفوع.
- السعر إن كان مدفوعًا.
- التصنيف.
- رابط YouTube playlist.

النظام يعمل:

1. يتحقق من رابط playlist.
2. يستخرج playlistId.
3. يستخدم YouTube Data API من الباك إند فقط.
4. يجلب الفيديوهات بالترتيب.
5. ينشئ lessons تلقائيًا.
6. يعرض preview للأدمن قبل الحفظ النهائي.
7. يسمح للأدمن بتعديل أسماء الدروس وحذف درس قبل النشر.

### Create Course: Custom Mode

الأدمن ينشئ الكورس يدويًا:

- معلومات الكورس.
- Sections.
- Lessons.
- لكل درس:
  - عنوان.
  - وصف.
  - YouTube URL.
  - مدة تقريبية.
  - ترتيب.
  - هل هو Preview مجاني؟
- Drag and drop لترتيب الدروس.
- Save draft.
- Publish.

### Course Builder

يجب أن يكون سهل جدًا:

- layout واضح.
- قائمة sections والدروس.
- زر إضافة section.
- زر إضافة lesson.
- drag/drop.
- preview للفيديو.
- autosave أو save واضح.
- publish checklist.

### Students Management

- جدول الطلاب.
- بحث بالاسم أو الإيميل أو الهاتف.
- فلترة حسب الحالة.
- فتح صفحة طالب.

### Student Details Page

الأدمن يرى:

- بيانات الطالب.
- كورسات الطالب.
- Progress في كل كورس.
- آخر نشاط.
- إضافة كورس للطالب.
- حذف كورس من الطالب.
- إيقاف حساب الطالب أو تفعيله حسب الصلاحية.

### Codes Management

الأدمن يستطيع:

- إنشاء كود لكورس.
- اختيار one-time أو multi-use.
- تحديد max uses.
- تحديد expiry date.
- تحديد ملاحظات.
- رؤية الأكواد المستخدمة.
- معرفة من استخدم الكود ومتى.
- تعطيل كود.
- تصدير الأكواد CSV لاحقًا.

### Payments Management

- جدول طلبات الدفع CliQ.
- فلترة pending/approved/rejected.
- رؤية الطالب والكورس والمبلغ.
- رؤية reference أو صورة الإثبات.
- Approve: يتم إنشاء enrollment للطالب.
- Reject: يكتب سبب الرفض.

---

## Super Admin Pages

```txt
/super-admin
/super-admin/admins
/super-admin/users
/super-admin/courses
/super-admin/payments
/super-admin/codes
/super-admin/audit-logs
/super-admin/settings
/super-admin/security
```

### Super Admin Dashboard

- مؤشرات عامة:
  - إجمالي الطلاب.
  - إجمالي الكورسات.
  - إجمالي الاشتراكات.
  - المدفوعات المعلقة.
  - أعلى كورسات مشاهدة.
  - أداء الأدمنز.
- آخر النشاطات المهمة.
- تنبيهات أمنية.

### Admins Management

- إنشاء أدمن.
- تعديل أدمن.
- تعطيل أدمن.
- تحديد صلاحيات.
- رؤية نشاط الأدمن.

### Audit Logs

سجل لكل العمليات الحساسة:

- من أنشأ كورس.
- من عدل كورس.
- من حذف enrollment.
- من وافق على دفع.
- من أنشأ كود.
- من عطّل مستخدم.

---

# 12. Database Schema مقترح

استخدم هذه الجداول كأساس. يمكن تعديلها أثناء التنفيذ، لكن لا تغير الفكرة العامة بدون سبب.

## User

```txt
id
fullName
email
phone
passwordHash
role: SUPER_ADMIN | ADMIN | STUDENT
status: ACTIVE | SUSPENDED | DELETED
avatarUrl
emailVerifiedAt
lastLoginAt
createdAt
updatedAt
```

## AdminProfile

```txt
id
userId
jobTitle
permissionsJson
createdAt
updatedAt
```

## Category

```txt
id
name
slug
description
createdAt
updatedAt
```

## Course

```txt
id
title
slug
subtitle
description
coverImageUrl
trailerYoutubeId
status: DRAFT | PUBLISHED | ARCHIVED
pricingType: FREE | PAID
price
currency
level: BEGINNER | INTERMEDIATE | ADVANCED | ALL_LEVELS
categoryId
createdById
publishedAt
createdAt
updatedAt
```

## CourseSection

```txt
id
courseId
title
sortOrder
createdAt
updatedAt
```

## Lesson

```txt
id
courseId
sectionId
title
description
youtubeVideoId
youtubeUrl
durationSeconds
sortOrder
isPreview
isRequired
status: DRAFT | PUBLISHED
createdAt
updatedAt
```

## Enrollment

```txt
id
studentId
courseId
source: MANUAL | ACTIVATION_CODE | PAYMENT | FREE
status: ACTIVE | REVOKED | COMPLETED
progressPercent
startedAt
completedAt
enrolledById
createdAt
updatedAt
```

Important:

```txt
Unique: studentId + courseId
```

## LessonProgress

```txt
id
enrollmentId
studentId
courseId
lessonId
watchedSeconds
isCompleted
completedAt
lastWatchedAt
createdAt
updatedAt
```

Important:

```txt
Unique: enrollmentId + lessonId
```

## ActivationCode

```txt
id
codeHash
courseId
status: ACTIVE | DISABLED | EXPIRED
maxUses
usedCount
expiresAt
createdById
notes
createdAt
updatedAt
```

Important:

- لا تخزن الأكواد الحساسة كنص مكشوف إذا أمكن.
- اعرض الكود مرة واحدة عند الإنشاء.
- خزّن hash للكود.

## CodeRedemption

```txt
id
activationCodeId
studentId
courseId
redeemedAt
ipAddress
userAgent
```

## PaymentRequest

```txt
id
studentId
courseId
amount
currency
method: CLIQ
status: PENDING | APPROVED | REJECTED
transactionReference
proofImageUrl
studentNote
adminNote
reviewedById
reviewedAt
createdAt
updatedAt
```

## AuditLog

```txt
id
actorId
action
entityType
entityId
metadataJson
ipAddress
userAgent
createdAt
```

## AppSetting

```txt
id
key
valueJson
createdAt
updatedAt
```

---

# 13. Database indexes مهمة

أضف indexes على الأقل لـ:

```txt
User.email unique
User.phone optional unique if used
Course.slug unique
Course.status
Course.createdById
Enrollment.studentId
Enrollment.courseId
Enrollment.studentId + courseId unique
Lesson.courseId
Lesson.sectionId
LessonProgress.enrollmentId + lessonId unique
ActivationCode.codeHash unique
PaymentRequest.status
PaymentRequest.studentId
AuditLog.actorId
AuditLog.createdAt
```

---

# 14. API Endpoints مقترحة

Base URL:

```txt
/api/v1
```

## Auth

```txt
POST   /auth/login
POST   /auth/logout
GET    /auth/me
POST   /auth/refresh
POST   /auth/forgot-password
POST   /auth/reset-password
```

## Admin Auth / Users

```txt
GET    /admin/students
POST   /admin/students
GET    /admin/students/:studentId
PATCH  /admin/students/:studentId
POST   /admin/students/:studentId/enrollments
DELETE /admin/students/:studentId/enrollments/:enrollmentId
```

## Courses

```txt
GET    /courses                     # public published courses
GET    /courses/:slug               # public course details
GET    /admin/courses               # admin courses
POST   /admin/courses               # create basic course
GET    /admin/courses/:courseId
PATCH  /admin/courses/:courseId
DELETE /admin/courses/:courseId
POST   /admin/courses/:courseId/publish
POST   /admin/courses/:courseId/archive
```

## Course Builder

```txt
POST   /admin/courses/import-youtube-playlist
POST   /admin/courses/:courseId/sections
PATCH  /admin/sections/:sectionId
DELETE /admin/sections/:sectionId
POST   /admin/courses/:courseId/lessons
PATCH  /admin/lessons/:lessonId
DELETE /admin/lessons/:lessonId
POST   /admin/courses/:courseId/reorder-lessons
```

## Student Learning

```txt
GET    /student/dashboard
GET    /student/my-courses
GET    /student/courses/:courseSlug/learn
POST   /student/lessons/:lessonId/progress
POST   /student/lessons/:lessonId/complete
```

## Activation Codes

```txt
GET    /admin/codes
POST   /admin/codes
PATCH  /admin/codes/:codeId/disable
GET    /admin/codes/:codeId/redemptions
POST   /student/redeem-code
```

## Payments CliQ

```txt
GET    /student/payments
POST   /student/payments/cliq
GET    /admin/payments
GET    /admin/payments/:paymentId
POST   /admin/payments/:paymentId/approve
POST   /admin/payments/:paymentId/reject
```

## Super Admin

```txt
GET    /super-admin/overview
GET    /super-admin/admins
POST   /super-admin/admins
PATCH  /super-admin/admins/:adminId
GET    /super-admin/audit-logs
GET    /super-admin/settings
PATCH  /super-admin/settings
```

---

# 15. YouTube integration

## المطلوب

الفيديوهات ستأتي من YouTube وتعرض داخل المنصة.

## Easy Mode

الأدمن يضع رابط playlist مثل:

```txt
https://www.youtube.com/playlist?list=PLAYLIST_ID
```

الباك إند:

1. يستخرج playlistId.
2. يتحقق من صحة الرابط.
3. يستخدم YouTube Data API من السيرفر فقط.
4. يجلب الفيديوهات بالترتيب.
5. ينشئ lessons.
6. يرجع preview قبل الحفظ النهائي.

## Custom Mode

الأدمن يضع YouTube URL لكل درس.

الباك إند:

1. يستخرج videoId.
2. يخزن videoId و URL.
3. يعرض الفيديو عبر YouTube embed داخل صفحة التعلم.

## ملاحظة أمان مهمة

YouTube embed لا يحمي الفيديوهات حماية كاملة من النسخ أو المشاركة. إذا كان المطلوب حماية فيديوهات قوية جدًا لاحقًا، يجب الانتقال إلى خدمة فيديو مخصصة مثل Mux أو Vimeo أو Bunny Stream. لكن في النسخة الأولى سنلتزم بيوتيوب حسب قرار المشروع.

---

# 16. Progress tracking

تتبع تقدم الطالب يتم هكذا:

- عند فتح درس، يتم تسجيل آخر مشاهدة.
- كل فترة محددة، الواجهة ترسل watchedSeconds للباك إند.
- الطالب يستطيع وضع الدرس كمكتمل.
- يمكن اعتبار الدرس مكتملًا إذا شاهد نسبة معينة مثل 90% أو ضغط Complete.
- Progress الكورس = عدد الدروس المكتملة / عدد الدروس المطلوبة.

مهم:

- لا تثق بالواجهة وحدها.
- لا تسمح لطالب بتحديث progress لكورس غير مسجل فيه.
- لا تسمح لطالب بتحديث lesson لا ينتمي إلى enrollment الخاص به.

---

# 17. Activation Codes

## الهدف

الطالب يستطيع أخذ كورس مدفوع عن طريق كود.

## أنواع الأكواد

- One-time code: يستخدمه طالب واحد فقط.
- Multi-use code: يستخدمه عدد معين من الطلاب.
- Expiring code: ينتهي في تاريخ معين.
- Disabled code: تم إيقافه من الأدمن.

## قواعد مهمة

- الكود يجب أن يكون صعب التخمين.
- أضف rate limiting على redeem endpoint.
- سجل كل محاولة فاشلة أو مشبوهة.
- عند نجاح الكود، أنشئ Enrollment للطالب.
- إذا الطالب لديه الكورس مسبقًا، لا تنشئ duplicate.

---

# 18. CliQ Payment Flow

الدفع سيكون عبر CliQ وليس Stripe.

## النسخة الأولى المقترحة

نظام دفع يدوي منظم:

1. الطالب يفتح كورس مدفوع.
2. يضغط “طلب الدفع عبر CliQ”.
3. تظهر له بيانات الدفع الخاصة بالمنصة:
   - CliQ Alias أو رقم الهاتف أو البيانات المطلوبة.
   - المبلغ.
   - تعليمات الدفع.
4. الطالب يدخل transaction reference.
5. اختياريًا يرفع صورة إثبات الدفع.
6. الطلب يصبح Pending.
7. الأدمن يراجع الطلب.
8. إذا Approved، النظام يضيف الكورس لحساب الطالب.
9. إذا Rejected، يكتب الأدمن السبب.

## مهم

لا تفترض وجود API رسمي لـ CliQ بدون تأكيد. النسخة الأولى تعتمد على manual approval. إذا توفر API رسمي لاحقًا، يمكن دمجه.

---

# 19. Security checklist

## Backend

- Use Helmet.
- Use strict CORS with allowed frontend origin only.
- Use HttpOnly cookies.
- Use Secure cookies in production.
- Use SameSite=Lax or Strict حسب السيناريو.
- Add CSRF protection for cookie-based mutation requests.
- Rate limit auth endpoints.
- Rate limit redeem code endpoint.
- Rate limit payment request endpoint.
- Validate all inputs with Zod.
- Use parameterized queries through Prisma.
- Never return passwordHash.
- Never expose internal errors to users.
- Log sensitive admin actions.
- Add audit logs.

## Frontend

- Never store tokens in localStorage.
- Hide UI based on role, but do not depend on UI for security.
- Use safe rendering.
- Do not dangerouslySetInnerHTML unless sanitized.
- Show proper error messages without leaking secrets.

## Authorization examples

- `requireAuth`
- `requireRole(['SUPER_ADMIN'])`
- `requireRole(['ADMIN', 'SUPER_ADMIN'])`
- `canManageCourse(user, course)`
- `canViewEnrollment(user, enrollment)`
- `canApprovePayment(user, payment)`

---

# 20. Performance checklist

- Use Server Components by default in Next.js.
- Use Client Components only for interactive parts.
- Use TanStack Query in dashboards for dynamic data.
- Use pagination in all tables.
- Use debounced search.
- Use image optimization.
- Use lazy loading for heavy components.
- Cache public course lists where safe.
- Use Redis for expensive repeated backend queries.
- Use DB indexes.
- Avoid huge client bundles.
- Do not import heavy libraries globally.

---

# 21. Accessibility checklist

- Arabic labels واضحة.
- Buttons لها labels مفهومة.
- Form errors واضحة.
- Keyboard navigation.
- Focus ring واضح.
- Contrast جيد.
- لا تعتمد على اللون فقط لتوضيح الحالة.
- يدعم الموبايل بشكل ممتاز.

---

# 22. Components مطلوبة في الواجهة

## Shared UI

```txt
AppShell
DashboardShell
Sidebar
Topbar
Breadcrumbs
PageHeader
StatCard
DataTable
SearchInput
EmptyState
LoadingSkeleton
ErrorState
ConfirmDialog
RoleBadge
StatusBadge
CourseCard
ProgressBar
VideoPlayer
CourseLessonList
```

## Admin UI

```txt
CourseBuilder
CourseEasyImportWizard
CourseCustomBuilder
LessonEditor
SectionEditor
StudentCoursesManager
CodeGeneratorDialog
PaymentReviewDialog
```

## Student UI

```txt
ContinueLearningCard
MyCourseCard
LearningPlayerLayout
RedeemCodeForm
PaymentRequestForm
```

---

# 23. Design instructions for Cursor

When building UI, Cursor must follow this:

```txt
Design the UI as a premium Arabic SaaS/LMS platform.
Use RTL layout, light theme, spacious spacing, soft borders, subtle shadows, elegant cards, and polished empty/loading states.
Use shadcn/ui as the base, but customize components so the design does not look default.
Use lucide-react icons consistently.
Use Framer Motion only for subtle transitions, not excessive animations.
Use Cairo or IBM Plex Sans Arabic font.
Avoid childish colors, random gradients, crowded dashboards, and generic admin UI.
Every major page must feel intentional and high-end.
```

---

# 24. Form validation rules

استخدم Zod لكل فورم.

أمثلة:

## Course form

- title required, min 3.
- slug auto-generated but editable.
- description required.
- pricingType required.
- price required if PAID.
- playlist URL required only in Easy Mode.
- youtube URL required for each lesson.

## User form

- fullName required.
- email valid.
- phone optional or required حسب القرار.
- role controlled by Super Admin only.
- password strong.

## Code form

- courseId required.
- maxUses >= 1.
- expiresAt optional.
- notes optional.

## Payment form

- courseId required.
- transactionReference required.
- proofImage optional in MVP unless required by settings.

---

# 25. Environment variables

ضع ملف `.env.example` يحتوي على:

```txt
# General
NODE_ENV=development

# Frontend
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1

# Backend
API_PORT=4000
CLIENT_ORIGIN=http://localhost:3000

# Database
DATABASE_URL=postgresql://USER:PASSWORD@HOST/DB?sslmode=require

# Redis
REDIS_URL=redis://default:password@host:port

# Auth
SESSION_SECRET=change_me
JWT_ACCESS_SECRET=change_me
JWT_REFRESH_SECRET=change_me
COOKIE_DOMAIN=localhost

# YouTube
YOUTUBE_API_KEY=change_me

# CliQ Manual Payment Settings
CLIQ_ALIAS=your_cliq_alias
CLIQ_DISPLAY_NAME=Your Platform Name
CLIQ_INSTRUCTIONS=Pay via CliQ then submit the transaction reference.

# Uploads
UPLOAD_PROVIDER=cloudinary
CLOUDINARY_CLOUD_NAME=change_me
CLOUDINARY_API_KEY=change_me
CLOUDINARY_API_SECRET=change_me

# Monitoring
SENTRY_DSN=
```

---

# 26. MVP phases

## Phase 1: Foundation

- Monorepo setup.
- Next.js app.
- Express API.
- Prisma + Neon.
- Shared types/schemas.
- Basic layout RTL.
- Design system setup.
- Auth base.
- Seed Super Admin.

## Phase 2: Auth & RBAC

- Login/logout/me.
- Secure cookies.
- Role guards.
- Protected routes.
- Super Admin/Admin/Student shells.

## Phase 3: Courses

- Course CRUD.
- Categories.
- Course status.
- Admin course list.
- Public course list.
- Course details.

## Phase 4: Course Builder

- Easy Mode YouTube playlist import.
- Custom Mode manual lessons.
- Sections/lessons CRUD.
- Drag/drop reorder.
- Publish checklist.

## Phase 5: Student Learning

- Student dashboard.
- My courses.
- Explore.
- Learning page.
- YouTube player.
- Lesson progress.

## Phase 6: Students & Enrollments

- Admin students list.
- Student details.
- Add/remove course from student.
- Progress tracking overview.

## Phase 7: Codes

- Generate activation codes.
- Redeem code page.
- Code usage tracking.
- Rate limiting.

## Phase 8: CliQ Payments

- Student payment request.
- Admin payment review.
- Approve creates enrollment.
- Reject with reason.

## Phase 9: Super Admin & Audit

- Super Admin dashboard.
- Manage admins.
- Audit logs.
- Platform settings.

## Phase 10: Polish & QA

- Responsive polish.
- Empty/loading/error states.
- Security review.
- Tests.
- Performance review.
- Deployment preparation.

---

# 27. Initial seed data

Seed should create:

- One Super Admin.
- One Admin.
- One Student.
- 2 categories.
- 2 sample courses.
- A few lessons using safe YouTube demo URLs.
- One free course enrollment for the sample student.

Do not use fake English UI text. Arabic sample content only.

---

# 28. Testing plan

## Backend Vitest

اختبر:

- Login.
- Role guards.
- Course creation.
- Student enrollment.
- Redeem code.
- Payment approval.
- Unauthorized access.

## Frontend Playwright

اختبر:

- Student can login.
- Student can see my courses.
- Student cannot open admin dashboard.
- Admin can create course draft.
- Admin can add enrollment to student.
- Student can redeem valid code.
- Invalid code shows proper error.

---

# 29. Definition of Done

أي feature لا تعتبر مكتملة إلا إذا:

- تعمل على desktop و mobile.
- UI عربي RTL.
- فيها loading state.
- فيها empty state إذا كانت قائمة.
- فيها error state.
- فيها validation واضح.
- محمية من الباك إند.
- لا تكشف أسرار أو بيانات مستخدم آخر.
- TypeScript بدون أخطاء.
- ESLint بدون أخطاء كبيرة.
- لها اختبار واحد على الأقل إذا كانت حساسة.

---

# 30. Cursor prompts

استخدم هذه البرومبتات داخل Cursor. لا تنفذ كل شيء مرة واحدة.

---

## Prompt 1: اقرأ الملف وضع خطة

```txt
Read PROJECT_BRIEF_FOR_CURSOR.md carefully.
Do not write code yet.
Create a full MVP implementation plan.
Split it into phases.
For Phase 1, list exactly which files and folders you will create.
Follow the stack: Next.js App Router frontend, Express.js TypeScript backend, Neon PostgreSQL with Prisma, Redis, Arabic RTL light theme.
```

---

## Prompt 2: إنشاء بنية المشروع

```txt
Implement Phase 1 only: create the monorepo structure.
Use pnpm workspaces.
Create apps/web for Next.js App Router with TypeScript and Tailwind.
Create apps/api for Express.js with TypeScript.
Create packages/shared for shared Zod schemas and types.
Create .env.example.
Do not implement business features yet.
After implementation, explain the structure and commands to run the project.
```

---

## Prompt 3: نظام التصميم العربي

```txt
Build the initial Arabic RTL design system in apps/web.
Use shadcn/ui, Tailwind CSS, lucide-react, and a premium light theme.
Set lang="ar" and dir="rtl" globally.
Use Cairo or IBM Plex Sans Arabic.
Create AppShell, DashboardShell, Sidebar, Topbar, PageHeader, StatCard, EmptyState, LoadingSkeleton, and ErrorState.
The UI must look premium, spacious, modern, and not like a default dashboard.
Do not create backend features in this step.
```

---

## Prompt 4: Prisma schema

```txt
Create the Prisma schema for the platform based on PROJECT_BRIEF_FOR_CURSOR.md.
Use PostgreSQL.
Models must include User, AdminProfile, Category, Course, CourseSection, Lesson, Enrollment, LessonProgress, ActivationCode, CodeRedemption, PaymentRequest, AuditLog, and AppSetting.
Add enums, relations, indexes, and unique constraints.
Do not overcomplicate.
Also create a seed file that creates one Super Admin, one Admin, one Student, categories, and sample Arabic courses.
Explain how to run migrations and seed.
```

---

## Prompt 5: Express API foundation

```txt
Implement the Express.js API foundation.
Add TypeScript setup, app bootstrap, error handling, request logging, Helmet, CORS, cookie parser, JSON body parsing, health route, API version prefix /api/v1, and environment validation.
Connect Prisma.
Add a clean folder structure: routes, controllers, services, middlewares, utils, validators.
Do not implement all features yet.
```

---

## Prompt 6: Auth & RBAC

```txt
Implement authentication and RBAC.
Use secure HttpOnly cookies.
Use password hashing with Argon2id or bcrypt.
Create login, logout, me, and refresh endpoints.
Create middlewares: requireAuth, requireRole, and permission helpers.
Make sure SUPER_ADMIN, ADMIN, and STUDENT are supported.
Never expose passwordHash.
Add rate limiting to auth endpoints.
Add frontend login page and protected route handling.
Explain the security decisions.
```

---

## Prompt 7: Admin course CRUD

```txt
Implement admin course management.
Backend: create CRUD endpoints for courses, categories, sections, and lessons.
Frontend: create /admin/courses and /admin/courses/[courseId] pages.
Use premium Arabic RTL UI.
Include search, filters, status badges, empty states, and loading states.
Authorization must be enforced in the backend.
```

---

## Prompt 8: Course Builder Easy and Custom Modes

```txt
Implement the Admin Course Builder.
Create two flows:
1. Easy Mode: admin enters YouTube playlist URL, course title, description, pricing type, price, category, and cover image. Backend validates the playlist and imports lessons using YouTube Data API from the server only.
2. Custom Mode: admin manually creates sections and lessons, each lesson using a YouTube URL.
Add drag and drop reorder with dnd-kit.
Add preview before publishing.
The UI must be very easy, polished, and premium.
```

---

## Prompt 9: Student dashboard and learning experience

```txt
Implement the student experience.
Create /student dashboard, /student/my-courses, /student/explore, and /student/courses/[slug]/learn.
The learning page must show the YouTube player inside the platform, lesson list on the right in RTL, progress bar, previous/next lesson buttons, and mark as complete.
Backend must prevent students from accessing courses they are not enrolled in.
Track lesson progress.
Use beautiful Arabic UI with loading, empty, and error states.
```

---

## Prompt 10: Admin student management

```txt
Implement Admin Student Management.
Create /admin/students and /admin/students/[studentId].
Admin can view student profile, courses, progress, and last activity.
Admin can add a course to the student or remove a course from the student.
Backend must enforce authorization.
Add audit logs for enrollment changes.
Use premium RTL data tables and polished dialogs.
```

---

## Prompt 11: Activation codes

```txt
Implement activation codes.
Admin can create one-time or multi-use codes for paid courses, set max uses, expiry date, and notes.
Student can redeem a code from /student/redeem-code.
Store code hashes, not plain codes if possible.
Add rate limiting to redeem endpoint.
On successful redemption, create enrollment.
Add admin code usage page.
Use Arabic messages and polished UI states.
```

---

## Prompt 12: CliQ payment flow

```txt
Implement manual CliQ payment flow.
Student can request access to a paid course by submitting a CliQ transaction reference and optional proof image.
Admin can review pending payments, approve or reject with a note.
On approval, create enrollment automatically.
On rejection, show reason to student.
Add audit logs.
Do not integrate Stripe.
Do not assume a CliQ API exists.
Use settings from environment variables or AppSetting for CliQ payment instructions.
```

---

## Prompt 13: Super Admin dashboard

```txt
Implement Super Admin dashboard.
Create overview, admins management, users, all courses, payments, codes, audit logs, and settings pages.
Super Admin can create and disable Admin users.
Show high-level analytics and recent sensitive actions.
Use premium Arabic RTL dashboard design.
Backend must restrict these endpoints to SUPER_ADMIN only.
```

---

## Prompt 14: Security audit

```txt
Review the entire codebase for security issues.
Focus on authentication, authorization, cookie settings, CORS, CSRF, rate limiting, input validation, Prisma queries, student access to paid courses, admin access boundaries, activation code brute force, payment approval, and secret exposure.
Do not change code yet.
First produce a security report with issues ranked Critical, High, Medium, Low.
Then ask which fixes to apply first.
```

---

## Prompt 15: Design polish

```txt
Polish the UI across the platform.
Focus on making the Arabic light theme look premium and consistent.
Improve spacing, typography, cards, dashboards, course cards, tables, dialogs, loading states, empty states, mobile responsiveness, and RTL details.
Do not change backend logic.
Avoid generic dashboard design.
Use subtle animations only where they improve UX.
```

---

# 31. First message to send to Cursor

ابدأ بهذه الرسالة:

```txt
You are my senior full-stack engineer and product designer.
Read PROJECT_BRIEF_FOR_CURSOR.md carefully.
This is an Arabic RTL course platform with Next.js App Router frontend, Express.js TypeScript backend, Neon PostgreSQL with Prisma, Redis, shadcn/ui, Tailwind, and premium light theme.
Do not write code yet.
First create a professional MVP implementation plan with phases, folder structure, database plan, API plan, UI plan, security plan, and the exact files for Phase 1.
The design quality is extremely important. Avoid generic UI. The platform must look premium.
```

---

# 32. ملاحظات نهائية مهمة

- لا تحاول بناء المشروع كله ببرومبت واحد.
- اجعل Cursor يخطط أولًا.
- نفذ Phase واحدة في كل مرة.
- راجع كل diff قبل الموافقة.
- ركز على التصميم من البداية، لأن تحسين التصميم بعد بناء كل شيء أصعب.
- الأمان يجب أن يكون في الباك إند وليس في الواجهة فقط.
- YouTube مناسب للنسخة الأولى، لكنه ليس حماية فيديو مثالية.
- CliQ في النسخة الأولى يكون manual approval، ثم يمكن تطويره لاحقًا.

