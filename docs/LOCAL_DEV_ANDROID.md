# تطوير محلي — Android Emulator + API

## خطأ `EADDRINUSE :::4000`

يعني أن **الـ API يعمل مسبقاً** على المنفذ 4000. لا تشغّل `pnpm dev` أو `pnpm dev:api` مرة ثانية.

تحقق:

```powershell
netstat -ano | findstr ":4000"
```

إذا ظهر `LISTENING` → الـ API جاهز على `http://localhost:4000`.

### ماذا تشغّل؟

| الحاجة | الأمر |
|--------|--------|
| API فقط (إن لم يكن شغالاً) | `pnpm dev:api` |
| الويب فقط (والـ API شغال) | `pnpm dev:web` |
| الاثنان معاً | `pnpm dev` — **فقط** إن كان المنفذ 4000 فارغاً |

### إيقاف العملية القديمة (إن أردت إعادة التشغيل)

```powershell
# استبدل PID برقم العمود الأخير من netstat
taskkill /PID 25360 /F
pnpm dev:api
```

---

## Flutter — ملف `.env` (الطريقة الموصى بها)

1. انسخ `apps/mobile/.env.example` → `apps/mobile/.env`
2. للمحاكي + API محلي (الافتراضي في `.env.example`):

   ```env
   API_BASE_URL=http://10.0.2.2:4000/api/v1
   ```

3. للإنتاج، غيّر في `.env` إلى:

   ```env
   API_BASE_URL=https://studyzhouse.com/api/v1
   ```

4. شغّل (في **debug** يُستخدم `.env` حتى لو أضفت `--dart-define` قديماً):

   ```powershell
   cd apps\mobile
   flutter run -d emulator-5554
   ```

   أو: `.\scripts\run-emulator.ps1`

5. في الطرفية يجب أن ترى:

   ```text
   [STUDYZHOUSE] API_BASE_URL=http://10.0.2.2:4000/api/v1
   ```

   إن ظهر `studyzhouse.com` وأنت في debug — راجع أن ملف `.env` موجود وأعد `flutter run` (ليس hot restart فقط).

### حساب تجريبي (قاعدة محلية)

أنشئه بـ:

```powershell
$env:STUDENT_EMAIL="ahmed2001@gmail.com"
$env:STUDENT_PASSWORD="Ahmed2000"
$env:STUDENT_FULL_NAME="Ahmed"
pnpm db:create-student
```

يعمل **فقط** مع `http://10.0.2.2:4000/api/v1` — وليس مع `https://studyzhouse.com/api/v1`.

---

## اختبار سريع من PowerShell

```powershell
Invoke-RestMethod http://localhost:4000/api/v1/health
```

تسجيل دخول:

```powershell
$body = '{"email":"ahmed2001@gmail.com","password":"Ahmed2000"}'
Invoke-RestMethod -Uri http://localhost:4000/api/v1/auth/login -Method Post -Body $body -ContentType "application/json"
```
