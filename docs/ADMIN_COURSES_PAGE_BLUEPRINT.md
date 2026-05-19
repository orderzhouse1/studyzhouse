# مخطّط صفحة إدارة الكورسات (Admin Courses)

> وثيقة استخراج من الكود الفعلي في مشروع StudyHouse — للمرجع عند إعادة بناء نفس التجربة في موقع آخر.  
> المسار الرئيسي: `/admin/courses`  
> تاريخ التوثيق: مايو 2026

---

## 1. فكرة الصفحة العامة

صفحة **إدارة الكورسات** هي مركز عمل المدرّس/الأدمن لإنشاء وتحرير ونشر وأرشفة الكورسات التعليمية دون مغادرة لوحة الإدارة. تجمع في شاشة واحدة:

- **إنشاء/تعديل سريع** عبر لوحة مدمجة أعلى القائمة (Composer).
- **قائمة الكورسات** مع بحث وترقيم صفحات.
- **إدارة الدروس** عبر نافذة منبثقة (ليست صفحة منفصلة في التدفق الأساسي).
- **النشر** بضغطة واحدة بعد استيفاء شروط الجاهزية (على الواجهة والخادم).

الصفحة مهمة لأنها تربط بين: التصنيفات، التسعير (مجاني/مدفوع)، محتوى يوتيوب، وحالة الظهور في الكتالوج (`DRAFT` / `PUBLISHED` / `ARCHIVED`).

**ملاحظة معمارية:** يوجد أيضًا مسارات قديمة/ثانوية (`/admin/courses/new`, `/admin/courses/[id]`, `/admin/courses/[id]/builder`) لنموذج تفصيلي وبناء هيكل كامل — لكن **التجربة الأساسية الموصوفة في لقطة الشاشة** هي `AdminCoursesPanel` + `AdminCourseComposer` على `/admin/courses`.

---

## 2. المستخدم المستهدف

| الدور | الوصول |
|--------|--------|
| **ADMIN** | `/admin/*` عبر middleware؛ API `/api/v1/admin/courses/*`؛ يرى في القائمة **كورساته فقط** (`createdById = userId`). |
| **SUPER_ADMIN** | نفس مسارات `/admin` في middleware؛ على API يمكنه إدارة **أي** كورس (`assertCanManageCourse` يتخطى فحص المالك). قائمة الكورسات في `listCoursesAdmin` **لا تُفلتر** بمنشئ الكورس. |
| **STUDENT** | **ممنوع** — middleware يعيد التوجيه؛ لا يصل لـ endpoints الإدارية. |
| **زائر** | ممنوع — يُحوَّل لتسجيل الدخول. |

التنقل الفرعي في `AdminWorkspaceShell` يعرض «إدارة الكورسات» ضمن `ADMIN_SUB_NAV` فقط لدور `admin` في التخطيط الافتراضي. Super Admin له مساحة `/super-admin` منفصلة بدون عنصر «الكورسات» في شريطه الفرعي، لكنه يستطيع فتح `/admin/courses` يدويًا إن كان مسموحًا بالسياسة.

---

## 3. بنية الصفحة بصريًا

التخطيط العام يأتي من `AdminWorkspaceShell` (`apps/web/src/components/admin/workspace/admin-workspace-shell.tsx`):

```
┌─────────────────────────────────────────────────────────────────┐
│  خلفية رمادية فاتحة (hsl 220 14% 88%) — خارج البطاقة البيضاء   │
│  ┌──────────┐  ┌──────────────────────────────────────────────┐ │
│  │ شريط     │  │ بطاقة بيضاء كبيرة (rounded ~1.75rem)         │ │
│  │ جانبي    │  │ ┌ هيدر كحلي (hsl 222 47% 12%) ─────────────┐ │ │
│  │ كحلي     │  │ │ شعار + «مساحة إدارة المنصّة»              │ │ │
│  │ يمين RTL │  │ └──────────────────────────────────────────┘ │ │
│  │          │  │ ┌ فرعي │ منطقة المحتوى (رمادي فاتح جدًا)   │ │
│  │          │  │ │      │  ← AdminCoursesPanel هنا           │ │
│  └──────────┘  └──────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### عناصر صفحة الكورسات نفسها (`AdminCoursesPanel`)

1. **عنوان الصفحة** — «إدارة الكورسات» + وصف فرعي صغير.
2. **زر «كورس جديد» / «إخفاء الإضافة»** — دائري (`rounded-full`)، ظل `shadow-brand` (برتقالي).
3. **كرت Composer** (`#admin-course-composer`) — يظهر عند `composerOpen === true`؛ تدرج خفيف من `primary/4%` إلى `card`؛ حدود برتقالية في وضع الإضافة، كحلية في وضع التعديل.
4. **جدول الكورسات** — داخل `rounded-xl border bg-card shadow-sm`.
5. **شريط البحث** — حقل دائري مع أيقونة بحث برتقالية؛ عدّاد `shown/total` بلون بنفسجي `hsl(265 45% 42%)`.
6. **صفوف متناوبة** — `bg-muted/25` للصفوف الفردية.
7. **صف التعديل النشط** — تمييز `bg-primary/[0.06] ring-primary/25`.

**RTL:** `dir="rtl"` على الـ shell؛ محاذاة النص `text-right` في الجدول؛ أيقونة البحث `end-3`.

---

## 4. Design System

مستخرج من `globals.css` ومكوّنات الصفحة:

| العنصر | القيمة / الاستخدام |
|--------|---------------------|
| **البرتقالي (Primary CTA)** | `--primary: 24 95% 53%` — أزرار رئيسية، روابط تعديل، حلقة التركيز |
| **الكحلي (Heading / Admin chrome)** | `hsl(222 47% 11–19%)` — شريط جانبي، هيدر البطاقة، نص العناوين `--heading` |
| **البنفسجي (عداد القائمة)** | `hsl(265 45% 42%)` — عداد النتائج في الجدول |
| **خلفية المحتوى** | `hsl(210 22% 98%)` داخل `main` |
| **البطاقات** | `bg-card`, `border-border/60-70`, `rounded-xl` أو `rounded-lg`, `shadow-sm` |
| **الأزرار الرئيسية** | `Button` + `rounded-full` + `shadow-brand` + `text-xs` |
| **المدخلات** | ارتفاع `h-8`–`h-9`, خط `text-[0.6875rem]` في Composer (كثافة عالية) |
| **الجدول** | `text-xs`, رؤوس `text-[0.6875rem]`, أعمدة: عنوان / حالة / تصنيف / إجراءات |
| **الشارات** | في Composer للدروس؛ في Builder تستخدم variants مثل `published`, `draft` |
| **الفراغات** | `space-y-3` بين أقسام اللوحة؛ `p-4 sm:p-6` في المحتوى |
| **الخطوط** | `text-base` للعنوان، `text-xs` للوصف والجدول — تصميم **مضغوط للأدمن** |

---

## 5. Layout breakdown

| Section | المكوّن | المسؤولية |
|---------|---------|-----------|
| Admin shell | `AdminWorkspaceShell` | إطار كامل: جانبي + بطاقة + هيدر |
| Sidebar رئيسي | داخل Shell | تنقل المنصّة + معاينات |
| Sub-nav | `ADMIN_SUB_NAV` | «إدارة الكورسات» وغيرها |
| Page header | `AdminCoursesPanel` (أعلى) | عنوان + زر إظهار/إخفاء |
| Course creation panel | `AdminCourseComposer` | نموذج + دروس + نشر/حفظ |
| Search | داخل بطاقة الجدول | debounce 320ms |
| Courses table | `AdminCoursesPanel` | قائمة + ترقيم |
| Empty state | نص مركزي | «لا توجد كورسات مطابقة للبحث» |
| Actions | أزرار تعديل / حذف (أرشفة) | لكل صف |

---

## 6. Course creation form logic

المكوّن: `AdminCourseComposer` (`apps/web/src/components/admin/courses/admin-course-composer.tsx`).

### الحقول

| الحقل | UI | مطلوب للحفظ (تعديل) | مطلوب للنشر (واجهة) | Zod (إنشاء) |
|-------|-----|---------------------|---------------------|-------------|
| **عنوان الكورس** | `Input` | ≥3 أحرف، ليس «مسودة كورس» | نفس الشيء | `min(3)` |
| **التصنيف** | `select` | مطلوب | مطلوب | `categoryId` اختياري في Zod؛ الواجهة تشدّد |
| **الوصف** | `Textarea` | ≥10 أحرف | ≥10 | `min(10)` |
| **صورة الغلاف** | `CourseThumbnailDropzone` | اختياري | **غير مطلوب** للنشر | `url` أو `""` |
| **التسعير** | FREE / PAID | — | PAID يتطلب سعرًا | `superRefine` للمبلغ |
| **المستوى** | BEGINNER…ALL_LEVELS | اختياري | اختياري | default `ALL_LEVELS` |
| **السعر** | يظهر إذا PAID | مطلوب إذا مدفوع | مطلوب إذا مدفوع | `priceAmount` positive |
| **slug** | في الحالة الداخلية | اختياري (يُولَّد من العنوان على الخادم) | — | regex اختياري |

**عند الإنشاء الأولي للمسودة:** `formToCreateBody` يضع وصفًا افتراضيًا `DRAFT_DESCRIPTION_PLACEHOLDER` إذا الوصف &lt; 10 أحرف، و`status: "DRAFT"`.

**عند الحفظ (وضع التعديل):** `handleSaveChanges` → `validateForEdit` → `PATCH /admin/courses/:id` + مزامنة الأقسام/الدروس.

**عند النشر (كورس جديد):** الزر الرئيسي `نشر الكورس` → `handlePublish` (ليس «حفظ مسودة» منفصل في الوضع الجديد).

### الأخطاء

- قائمة `publishMissing` تُعرض كـ `<ul>` تحت `fieldError`.
- أخطاء API عبر `AdminApiError` مع `code` مثل `PUBLISH_READINESS`.
- تحقق Zod على العميل قبل `POST`/`PATCH`.

### بعد النجاح

يُعرض كرت أخضر (`savedCourseId`) مع روابط: «فتح صفحة الكورس» أو «إضافة كورس آخر».

---

## 7. Lessons logic

### زر «إضافة الدروس»

- **لا يفتح `/builder` مباشرة** في التدفق الأساسي.
- يفتح **`AdminLessonsPopup`** (`fixed` modal, `z-[70]`) فوق الصفحة.
- العداد على الزر يعرض عدد الدروس في الذاكرة (`lessons.length`).

### مصادر الدروس

1. **قائمة يوتيوب** — `POST .../youtube-playlist/preview` بعد `ensureCourseIdForLessons()` (ينشئ مسودة خفيفة على الخادم).
2. **رابط فيديو يدوي** — `parseYoutubeVideoId` على العميل؛ يُضاف للقائمة محليًا.
3. **في وضع التعديل** — تُحمَّل من `GET .../structure` وتُدمج كل الأقسام في قائمة واحدة مع `sectionTitle` من أول قسم.

### العلاقة Course → Section → Lesson

- في قاعدة البيانات: `Course` → `CourseSection` → `Lesson`.
- Composer يستخدم **قسمًا واحدًا منطقيًا** (`sectionTitle`, افتراضي «المحتوى الرئيسي»).
- عند النشر/الحفظ: `POST /sections` ثم `POST .../sections/:id/lessons` لكل درس.
- **الترتيب:** سحب وإفلات في الـ popup؛ عند الحفظ `POST .../lessons/reorder` إذا &gt;1 درس.

### عدد الدروس

- يُحسب محليًا في الواجهة؛ على الخادم `_count.lessons` في قائمة الإدارة.
- لا يُخزَّن حقل منفصل «عدد الدروس» على `Course`.

---

## 8. Publish logic

### متى يظهر زر النشر؟

- **كورس جديد:** الزر `نشر الكورس (N درس)` دائمًا في Composer (ليس في وضع التعديل).
- **تعديل:** الزر `حفظ التعديلات` بدل النشر؛ النشر من صفحة `[id]` / Builder عبر `course-actions` أو Builder.

### تحقق الواجهة (`validateForPublish`)

1. عنوان ≥3 وليس placeholder المسودة  
2. وصف ≥10  
3. تصنيف محدد  
4. درس واحد على الأقل  
5. عنوان قسم ≥2 حرف إن وُجدت دروس  
6. سعر صالح إذا PAID  

**لا يشترط:** صورة غلاف، slug، مدة تقديرية.

### تحقق الخادم (`enforcePublishReadinessForAdminCourse`)

من `courseReadiness.service.ts`:

| الشرط | الرسالة العربية |
|--------|-----------------|
| عنوان ≥3 | عنوان واضح |
| وصف ≥10 | وصف كافٍ |
| `categoryId` | تصنيف |
| قسم واحد على الأقل | قسم |
| درس واحد على الأقل | درس |
| كل درس `youtubeVideoId` صالح (11 حرفًا) | فيديو لكل درس |
| ليس `ARCHIVED` | لا نشر مؤرشف |

عند الفشل: HTTP 400, `code: "PUBLISH_READINESS"`, `details.missing[]`.

بعد النشر الناجح: `LessonStatus.DRAFT` → `PUBLISHED` لجميع دروس الكورس؛ `Course.status` → `PUBLISHED`.

### تدفق `handlePublish` (كورس جديد)

1. `ensureCourseDraft()` → `POST /admin/courses` أو تحديث  
2. إنشاء قسم + دروس عبر API  
3. `POST /admin/courses/:id/publish`

---

## 9. Table/list logic

### الأعمدة

| العمود | المصدر |
|--------|--------|
| العنوان | `row.title` — زر يفتح التعديل في Composer |
| الحالة | `DRAFT` / `PUBLISHED` / `ARCHIVED` (نص عربي) |
| التصنيف | `row.category?.name` أو «—» |
| إجراءات | تعديل + حذف (أرشفة) |

### البحث

- **واجهة:** debounce 320ms → query param `search`.
- **خادم:** يبحث في `title` و `slug` فقط (`contains`, insensitive).
- **ملاحظة:** placeholder الواجهة يذكر «التصنيف أو الحالة» لكن **الخادم لا يبحث فيهما** حاليًا. مخطط `adminCoursesQuerySchema` يدعم `status` و `pricingType` لكن اللوحة **لا تعرض فلاتر** لها.

### الترقيم

- `pageSize: 20` ثابت؛ أزرار السابق/التالي إذا `totalPages > 1`.

### الحذف

- الزر «حذف» يستدعي **`POST .../archive`** وليس DELETE للكورس.
- معطّل إذا الحالة `ARCHIVED` أو أثناء التنفيذ.

### فارغ

«لا توجد كورسات مطابقة للبحث.»

---

## 10. API endpoints

القاعدة: `/api/v1` + `requireAuth` + `requireRole([ADMIN, SUPER_ADMIN])`.

### الكورسات

| Method | Path | الغرض |
|--------|------|--------|
| GET | `/admin/courses` | قائمة مع `page`, `pageSize`, `search`, `status`, `pricingType` |
| POST | `/admin/courses` | إنشاء كورس (`courseCreateBodySchema`) |
| GET | `/admin/courses/:id` | تفاصيل كورس |
| PATCH | `/admin/courses/:id` | تحديث (`courseUpdateBodySchema`) |
| POST | `/admin/courses/:id/publish` | نشر + فحص الجاهزية |
| POST | `/admin/courses/:id/archive` | أرشفة (`ARCHIVED`) |

### الهيكل والدروس

| Method | Path | الغرض |
|--------|------|--------|
| GET | `/admin/courses/:courseId/structure` | أقسام + دروس |
| POST | `/admin/courses/:courseId/sections` | قسم جديد |
| PATCH | `/admin/courses/:courseId/sections/:sectionId` | تحديث قسم |
| DELETE | `/admin/courses/:courseId/sections/:sectionId` | حذف قسم |
| POST | `/admin/courses/:courseId/sections/reorder` | ترتيب أقسام |
| POST | `/admin/courses/:courseId/sections/:sectionId/lessons` | درس جديد |
| PATCH | `/admin/courses/:courseId/lessons/:lessonId` | تحديث درس |
| DELETE | `/admin/courses/:courseId/lessons/:lessonId` | حذف درس |
| POST | `/admin/courses/:courseId/lessons/reorder` | ترتيب دروس داخل قسم |

### يوتيوب

| Method | Path | الغرض |
|--------|------|--------|
| POST | `/admin/courses/:courseId/youtube-playlist/preview` | معاينة قائمة تشغيل |
| POST | `/admin/courses/:courseId/youtube-playlist/import` | استيراد (يُستخدم في Builder أيضًا) |

### مساعدة

| Method | Path | الغرض |
|--------|------|--------|
| GET | `/categories?page=1&pageSize=100` | قائمة التصنيفات للـ select (عام) |
| POST | `/admin/uploads/course-thumbnail` | رفع صورة (base64) |

### الاستجابة النموذجية للقائمة

```json
{
  "success": true,
  "data": { "items": [ { "id", "title", "slug", "status", "pricingType", "category", "updatedAt", ... } ] },
  "meta": { "page", "pageSize", "total", "totalPages" }
}
```

---

## 11. Database models

### `Course`

- `title`, `slug` (unique), `description`, `subtitle`, `coverImageUrl`
- `status`: `DRAFT` | `PUBLISHED` | `ARCHIVED`
- `pricingType`: `FREE` | `PAID`; `price`, `currency`
- `level`: `BEGINNER` | `INTERMEDIATE` | `ADVANCED` | `ALL_LEVELS`
- `categoryId`, `createdById`, `publishedAt`, `estimatedDurationMinutes`

### `Category`

- `name`, `slug`, `description`, `archivedAt`

### `CourseSection`

- `courseId`, `title`, `sortOrder`

### `Lesson`

- `courseId`, `sectionId`, `title`, `description`
- `youtubeVideoId`, `youtubeUrl`, `durationSeconds`
- `sortOrder`, `isPreview`, `isRequired`, `status` (`DRAFT`/`PUBLISHED`)

### علاقات التعلّم (غير مباشرة على الصفحة)

- `Enrollment` — بعد النشر يمكن للطلاب التسجيل حسب التسعير/الدفع.
- `LessonProgress` — تقدم الطالب في الدروس المنشورة.

---

## 12. State management

كل الحالة **محلية React** (`useState` / `useCallback` / `useEffect`) — لا Redux ولا React Query على هذه الصفحة.

| الحالة | المكوّن | الوصف |
|--------|---------|--------|
| `rows`, `meta`, `loading`, `error` | `AdminCoursesPanel` | قائمة الكورسات |
| `composerOpen`, `editingCourseId` | Panel | إظهار Composer + وضع تعديل |
| `searchInput` → `search` | Panel | debounce |
| `archivingId` | Panel | أرشفة صف |
| `form`, `lessons`, `lessonsOpen` | Composer | نموذج ودروس |
| `courseId`, `existingSectionId` | Composer | ربط بالخادم |
| `busy`, `fieldError`, `publishMissing` | Composer | عمليات وحالة أخطاء |
| `savedCourseId` | Composer | شاشة نجاح |
| `loadingCats`, `categories` | Composer | تحميل التصنيفات |
| `dragIndex`, `expandedLessonId` | Composer + Popup | ترتيب وتوسيع درس |

**تحديث الجدول:** `onSaved` → `load()` يعيد `GET /admin/courses`.

---

## 13. Authorization & security

### الواجهة (Next.js)

- `middleware.ts`: `/admin` يتطلب JWT بصلاحية `ADMIN` أو `SUPER_ADMIN`.
- لا فحص DB في الـ middleware — قد يتأخر تغيير الدور حتى انتهاء التوكن.

### API (Express)

- `requireAuth` + `requireRole(ADMIN, SUPER_ADMIN)` على `/admin/courses`.
- `assertCanManageCourse`: ADMIN فقط لكورساته؛ SUPER_ADMIN لكل الكورسات.
- **Zod** على query/body/params في كل route.
- **النشر:** فحص مزدوج (واجهة + `coursePublishGuard`).
- **رفع الصورة:** POST إلى `/admin/uploads/course-thumbnail`؛ تحقق نوع/حجم على العميل (5MB)؛ يتطلب نفس صلاحيات الأدمن.
- **تدقيق:** `writeAuditLog` عند إنشاء/تحديث/نشر/حظر نشر.

الطالب **لا يصل** لأي من هذه المسارات.

---

## 14. UX details

- **زر إخفاء الإضافة:** يقلل ازدحام الشاشة عندما يركز الأدمن على الجدول فقط؛ عند فتح «كورس جديد» يُمرَّر scroll إلى `#admin-course-composer`.
- **النموذج فوق الجدول:** نمط «إنشاء سريع في السياق» دون الانتقال لصفحة جديدة — مناسب للأدمن المتكرر.
- **كثافة بصرية:** خطوط صغيرة (`0.625rem`–`0.6875rem`) لعرض أكبر في شاشة واحدة.
- **التعديل inline:** النقر على العنوان يحمّل نفس Composer بـ `editCourseId` ويميّز الصف.
- **النجاح/الخطأ:** صندوق أحمر مع قائمة نقاط ناقصة؛ صندوق أخضر بعد النشر/الحفظ.

---

## 15. Reusable blueprint

لإعادة بناء نفس الصفحة في موقع آخر:

### مكوّنات الواجهة

1. `WorkspaceShell` (sidebar + card + header)  
2. `EntityListPanel` (search, table, pagination)  
3. `InlineEntityComposer` (collapsible create/edit)  
4. `LessonsModal` (playlist import + manual + reorder)  
5. `ThumbnailUpload`  
6. `StatusBadge` + confirm archive  

### API مطلوب

- CRUD كورس + publish + archive  
- CRUD sections/lessons + reorder  
- Playlist preview (اختياري)  
- Categories list  
- Image upload  
- Publish readiness endpoint أو منطق مدمج في publish  

### جداول DB

`courses`, `categories`, `course_sections`, `lessons` + enums الحالة والتسعير.

### حالات الكورس

`DRAFT` → `PUBLISHED` → `ARCHIVED` (لا حذف فعلي في UI الحالي).

### شروط النشر

عنوان + وصف + تصنيف + قسم + درس + فيديو لكل درس (على الأقل معرف يوتيوب).

### خطوات البناء من الصفر

1. Shell RTL + design tokens (برتقالي + كحلي).  
2. GET list + table.  
3. Composer مع POST draft.  
4. Modal دروس + ربط يوتيوب.  
5. Publish مع تحقق عميل + خادم.  
6. Archive من الجدول.  
7. (اختياري) صفحة Builder منفصلة للتحرير المتقدم.

---

## 16. Component map

| المكوّن | المسؤولية | Props / ملاحظات | أين يُستخدم |
|---------|-----------|-----------------|-------------|
| `AdminCoursesPage` | metadata + render panel | — | `app/admin/courses/page.tsx` |
| `AdminCoursesPanel` | قائمة + بحث + فتح composer | — | الصفحة الرئيسية |
| `AdminCourseComposer` | نموذج كامل + نشر/حفظ | `editCourseId`, `onSaved`, `onCancel`, `onStartNew` | داخل Panel |
| `AdminLessonsPopup` | modal الدروس | ~20 prop للتحكم بالدروس | Composer |
| `CourseThumbnailDropzone` | رفع/معاينة غلاف | `value`, `onChange` | Composer |
| `LessonResourcesDropzone` | مرفقات الدرس | داخل popup | Lessons popup |
| `AdminWorkspaceShell` | إطار الإدارة | `role: "admin"` | `app/admin/layout.tsx` |
| `CourseEditorForm` | نموذج react-hook-form | `mode`, `courseId?` | `/admin/courses/new`, edit shell |
| `EditCourseShell` | تحميل كورس للتعديل | `courseId` | `/admin/courses/[id]` |
| `CourseBuilderClient` | بناء أقسام/دروس كامل | `courseId` | `/admin/courses/[id]/builder` |
| `CourseActions` | نشر/أرشفة من صفحة التعديل | `courseId` | edit flow |
| `Button`, `Input`, `Label`, `Textarea`, `Badge` | UI أساس | shadcn-style | في كل مكان |

---

## 17. Suggested improvements (مقترحات فقط — غير منفذة)

- فلاتر UI لـ `status` و `pricingType` (الـ API جاهز).
- بحث يشمل اسم التصنيف.
- Bulk archive / publish.
- سحب وإفلات أقسام في Composer (موجود جزئيًا للدروس فقط).
- Chips ملونة للحالة بدل نص رمادي.
- معاينة الكورس كطالب من الجدول.
- Autosave draft كل N ثوانٍ.
- Cropper للصورة.
- Analytics لكل كورس (تسجيلات، إكمال).
- توحيد المسارين: إلغاء `/new` المنفصل أو redirect إلى `/courses?new=1`.
- «حذف» حقيقي vs «أرشفة» — توضيح المصطلح في UI.

---

## 18. Final summary

| سؤال | جواب مختصر |
|------|------------|
| **ماذا تفعل؟** | إدارة دورة حياة الكورس: إنشاء، دروس يوتيوب، نشر، أرشفة، بحث. |
| **كيف تعمل؟** | Panel + Composer inline فوق جدول؛ API REST محمي؛ نشر بفحص جاهزية مزدوج. |
| **أهم المنطق؟** | `AdminCourseComposer` (نشر/دروس) + `courseReadiness` + `assertCanManageCourse`. |
| **كيف أنقلها؟** | انسخ: Shell + List + Inline Composer + Lessons Modal + publish guard على الخادم. |

---

## ملحق: الملفات التي تمت مراجعتها

- `apps/web/src/app/admin/courses/page.tsx`
- `apps/web/src/app/admin/courses/admin-courses-panel.tsx`
- `apps/web/src/components/admin/courses/admin-course-composer.tsx`
- `apps/web/src/components/admin/courses/admin-lessons-popup.tsx`
- `apps/web/src/components/admin/courses/course-thumbnail-dropzone.tsx`
- `apps/web/src/components/admin/course-editor-form.tsx`
- `apps/web/src/app/admin/courses/new/page.tsx`
- `apps/web/src/app/admin/courses/[id]/page.tsx`
- `apps/web/src/app/admin/courses/[id]/builder/course-builder-client.tsx`
- `apps/web/src/components/admin/workspace/admin-workspace-shell.tsx`
- `apps/web/src/components/admin/workspace/admin-workspace-config.ts`
- `apps/web/src/app/admin/layout.tsx`
- `apps/web/src/middleware.ts`
- `apps/web/src/lib/courses-client-api.ts`
- `apps/web/src/app/globals.css`
- `apps/api/src/routes/coursesAdmin.routes.ts`
- `apps/api/src/routes/index.ts`
- `apps/api/src/controllers/course.controller.ts`
- `apps/api/src/controllers/courseStructure.controller.ts`
- `apps/api/src/services/coursePublishGuard.service.ts`
- `apps/api/src/services/courseReadiness.service.ts`
- `apps/api/src/lib/courseAccess.ts`
- `packages/shared/src/schemas/course.ts`
- `packages/shared/src/schemas/courseStructure.ts`
- `prisma/schema.prisma`

---

*لا يُفترض أن تطابق هذه الوثيقة لقطة شاشة خارجية حرفيًا إن اختلفت نسخة النشر — المرجع النهائي هو الملفات أعلاه.*
