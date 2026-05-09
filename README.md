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

2. عدّل `.env` على الأقل:

   - `DATABASE_URL` — سلسلة اتصال Postgres (مثل Neon، مع `sslmode=require`)
   - `CLIENT_ORIGIN` — يجب أن يكون رابطًا صالحًا، مثل `http://localhost:3000`
   - `JWT_ACCESS_SECRET` — **32 حرفًا على الأقل** (لتوقيع JWT في ملف تعريف الارتباط HttpOnly)
   - (اختياري) `API_INTERNAL_URL` — عنوان Express الداخلي الذي تعيد توجيهه Next (`http://127.0.0.1:4000` افتراضيًا)

3. ثبّت الحزم ثم ولّد عميل Prisma:

   ```bash
   pnpm install
   pnpm db:generate
   ```

4. طبّق المخطط على قاعدة البيانات:

   ```bash
   pnpm db:push
   ```

   أو استخدم migrations عند الحاجة:

   ```bash
   pnpm db:migrate
   ```

5. زرع مستخدمي التجربة (سوبر أدمن، أدمن، طالب):

   ```bash
   pnpm db:seed
   ```

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
| `pnpm db:generate` | إعادة توليد Prisma Client بعد تعديل `schema.prisma` |
| `pnpm db:seed` | إعادة زرع مستخدمي التجربة |
| `pnpm db:studio` | واجهة Prisma Studio |

## هيكل المستودع

```txt
apps/web      — Next.js (واجهة عربية RTL، ثيم فاتح)
apps/api      — Express REST تحت /api/v1
packages/shared — ثوابت، أنماط، ومخططات Zod مشتركة
prisma/       — schema.prisma و seed.ts في جذر المشروع
```

## المرحلة الحالية

### Phase 2 — المصادقة و RBAC

- مصادقة عبر JWT في ملف تعريف ارتباط **HttpOnly** (بدون تخزين في localStorage)
- مسارات: `POST /api/v1/auth/login`, `POST /api/v1/auth/logout`, `GET /api/v1/auth/me`
- حماية بالأدوار على الواجهة عبر `middleware.ts` + تحقق الخادم في Express
- تحديد معدل لمحاولات تسجيل الدخول (`express-rate-limit`)
- سجل تدقيق مبسّط لتسجيل الدخول (نجاح/فشل)

لا توجد بعد: كورسات، لوحات كاملة، مدفوعات، أكواد، أو Course Builder.

راجع `PROJECT_BRIEF_FOR_CURSOR.md` للسياق الكامل للمنتج.
