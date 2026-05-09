# Studyhouse — منصة كورسات عربية

Monorepo للواجهة (Next.js App Router) والـ API (Express) مع Prisma و Postgres.

## المتطلبات

- [Node.js](https://nodejs.org/) 20+
- [pnpm](https://pnpm.io/) 9+
- حساب [Neon](https://neon.tech/) (أو Postgres محلي) للمرحلة الأولى

## الإعداد السريع

1. انسخ المتغيرات البيئية:

   ```bash
   cp .env.example .env
   ```

2. عدّل `.env` على الأقل:

   - `DATABASE_URL` — سلسلة اتصال Postgres (مثل Neon، مع `sslmode=require`)
   - `CLIENT_ORIGIN` — يجب أن يكون رابطًا صالحًا، مثل `http://localhost:3000`

3. ثبّت الحزم ثم ولّد عميل Prisma:

   ```bash
   pnpm install
   pnpm db:generate
   ```

4. طبّق المخطط على قاعدة البيانات (أنشئ الجداول):

   ```bash
   pnpm db:push
   ```

   أو استخدم migrations عند الحاجة:

   ```bash
   pnpm db:migrate
   ```

## التشغيل للتطوير

تشغيل الواجهة والـ API معًا:

```bash
pnpm dev
```

أو كل جزء على حدة:

```bash
pnpm dev:web   # Next.js — http://localhost:3000
pnpm dev:api   # Express — http://localhost:4000
```

### فحص صحة الـ API

```bash
curl http://localhost:4000/api/v1/health
```

استجابة متوقعة (JSON): `{ "success": true, "data": { "status": "ok", ... } }`.

## أوامر مفيدة

| الأمر | الوصف |
|--------|--------|
| `pnpm typecheck` | فحص TypeScript في كل الحزم |
| `pnpm build` | بناء الواجهة والـ API |
| `pnpm db:generate` | إعادة توليد Prisma Client بعد تعديل `schema.prisma` |
| `pnpm db:studio` | واجهة Prisma Studio |

## هيكل المستودع

```txt
apps/web      — Next.js (واجهة عربية RTL، ثيم فاتح)
apps/api      — Express REST تحت /api/v1
packages/shared — ثوابت، أنماط، ومخططات Zod مشتركة
prisma/       — schema.prisma في جذر المشروع
```

## المرحلة الحالية (Phase 1)

- أساس المونوريبو، الثيم، واتجاه RTL
- API أولي مع `GET /api/v1/health`
- لا يوجد بعد: مصادقة، كورسات، أو لوحات تحكم

راجع `PROJECT_BRIEF_FOR_CURSOR.md` للسياق الكامل للمنتج.
# studyzhouse
