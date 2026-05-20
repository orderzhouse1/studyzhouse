# التحقق اليدوي بعد النشر — Studyhouse (P0)

استخدم هذا المستند بعد ضبط أسرار الإنتاج وإعادة النشر. لا يستبدل `docs/PRODUCTION_DEPLOYMENT_AUDIT.md`.

---

## 1. فحوصات API العامة (آمنة — بدون بيانات إدارية)

من **جهازك** (أو Cloud Shell) — استبدل `DOMAIN` بنطاق الإنتاج:

```bash
curl -sS "https://DOMAIN/api/v1/health"
curl -sS "https://DOMAIN/api/v1/courses?page=1&pageSize=4"
curl -sS "https://DOMAIN/api/v1/categories?page=1&pageSize=12"
```

**متوقّع:**

| Endpoint | نجاح |
|----------|------|
| `/health` | `{"success":true,"data":{"status":"ok",...}}` |
| `/courses` | `success: true` و `data.items` (قد تكون `[]` إن لا كورسات منشورة) |
| `/categories` | `success: true` و `data.items` |

من **شبكة خادم Next** (مهم لـ SSR — الصفحة الرئيسية لا تستخدم rewrite):

```bash
# استخدم نفس قيمة API_INTERNAL_URL في خدمة الويب
curl -sS "$API_INTERNAL_URL/api/v1/health"
curl -sS "$API_INTERNAL_URL/api/v1/courses?page=1&pageSize=4"
```

إن فشل الطلب الثاني من خادم Next بينما يعمل من المتصفح → **`API_INTERNAL_URL` خاطئ**.

---

## 2. ظهور الكورسات العامة (بيانات + كاش)

| القاعدة | التفاصيل |
|---------|----------|
| الحالة | فقط **`PUBLISHED`** تظهر في `/api/v1/courses` العام |
| لا يظهر | `DRAFT`, `ARCHIVED` |
| النشر | من لوحة الإدارة: إكمال البنية → **نشر الكورس** (`POST .../admin/courses/:id/publish`) |
| التأخير | `revalidate = 300` — قد يستغرق **حتى 5 دقائق** حتى يظهر على `/` و `/courses` |
| كاش فارغ | إن نُشر الموقع والـ API/DB فارغان، أعد **deploy** لخدمة Next بعد وجود كورسات منشورة |

**SQL (Neon / psql):**

```sql
SELECT status, COUNT(*) FROM "Course" GROUP BY status;
SELECT id, title, slug, status FROM "Course" WHERE status = 'PUBLISHED' LIMIT 10;
```

**الصفحات:**

- [ ] `https://DOMAIN/` — أقسام كورسات/تصنيفات (إن وُجدت بيانات)
- [ ] `https://DOMAIN/courses` — شبكة كورسات
- [ ] `https://DOMAIN/courses/<slug>` — تفاصيل كورس منشور

**سجلات Next (إنتاج):** عند فشل جلب عام:

```text
[studyhouse/web] Public API fetch failed for /api/v1/courses?... (api host: ..., network|http) — ...
```

---

## 3. Google OAuth (إنتاج)

| المتغير (API) | قيمة |
|---------------|------|
| `CLIENT_ORIGIN` | `https://DOMAIN` |
| `GOOGLE_REDIRECT_URI` | `https://DOMAIN/api/v1/auth/google/callback` |

**Google Cloud Console** (نفس OAuth client):

- Authorized JavaScript origins: `https://DOMAIN`
- Authorized redirect URIs: `https://DOMAIN/api/v1/auth/google/callback`
- **لا** تعتمد على `http://localhost:3000` في الإنتاج

**اختبار يدوي:**

1. افتح `https://DOMAIN/login`
2. «المتابعة عبر Google»
3. قبل الموافقة: في URL Google تحقق أن `redirect_uri` = نطاق الإنتاج (ليس localhost)
4. بعد النجاح: يجب أن تبقى على `https://DOMAIN/...` (مثلاً `/student`)
5. الكوكي HttpOnly + **HTTPS** (`NODE_ENV=production` → `Secure`)

---

## 4. متغيرات يجب تغييرها في Cloud Run / Google

### خدمة API

| المتغير | ملاحظة |
|---------|--------|
| `NODE_ENV` | `production` |
| `DATABASE_URL` | Postgres إنتاج |
| `CLIENT_ORIGIN` | `https://DOMAIN` — **ليس localhost** |
| `JWT_ACCESS_SECRET` | ≥32 حرفًا |
| `JWT_EXPIRES_IN` | اختياري |
| `ACTIVATION_CODE_PEPPER` | موصى |
| `GOOGLE_CLIENT_ID` | |
| `GOOGLE_CLIENT_SECRET` | |
| `GOOGLE_REDIRECT_URI` | `https://DOMAIN/api/v1/auth/google/callback` |
| `RESEND_API_KEY` | OTP |
| `EMAIL_FROM` | بريد مُتحقق |
| `YOUTUBE_API_KEY` | اختياري |

### خدمة Next (الويب)

| المتغير | ملاحظة |
|---------|--------|
| `NODE_ENV` | `production` |
| `API_INTERNAL_URL` | عنوان API **من خادم Next** (انظر `.env.example`) |
| `JWT_ACCESS_SECRET` | **نفس API** |

---

## 5. بعد إعادة النشر

```bash
pnpm typecheck
pnpm build
```

1. `curl` health + courses من DOMAIN ومن `API_INTERNAL_URL`
2. تحقق SQL من `PUBLISHED`
3. افتح `/`, `/courses`, Google login
4. راقب سجلات Cloud Run لتحذيرات `[studyhouse/web] Public API fetch failed`

---

## 6. ما لم يُنفَّذ في P0 (مقصود)

- لا `/api/v1/home`
- لا `revalidatePath` عند النشر
- لا endpoint تشخيصي عام جديد — `/api/v1/health` + الـ curl أعلاه كافيان
