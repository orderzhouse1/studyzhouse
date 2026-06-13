# STUDYZHOUSE — Flutter Phase 4 (Learn Player + Progress)

**Scope:** Enrolled course learning, YouTube player, lesson list, mark complete. No payments, activation, notifications, or profile editing.

---

## Endpoints

| Method | Path | Use |
|--------|------|-----|
| GET | `/student/courses/:courseSlug/learn?lessonId=` | Load course + sections + current lesson + navigation |
| POST | `/student/lessons/:lessonId/complete` | Mark lesson complete (`{}`) |
| POST | `/student/lessons/:lessonId/progress` | Optional `watchedSeconds` (not used in UI yet) |
| GET | `/student/courses/:courseSlug/access` | Course detail — show «متابعة التعلّم» when enrolled |

Bearer auth (Phase 2).

---

## Route

`/learn/:slug?lessonId=...`

- Replaces Phase 3 placeholder.
- Lesson tap updates local state + `context.replace` with query.
- Prev/next use navigation IDs from payload (computed locally after selection).

---

## Lesson selection

1. Initial load: optional `lessonId` query → API picks current lesson.
2. Tap in list: update `_payload.withSelectedLesson` without full refetch.
3. Pull-to-refresh refetches with current `lessonId`.
4. URL query kept in sync for deep links / back stack.

---

## Completion

- Button: **تحديد كدرس مكتمل** → `POST .../complete`
- Optimistic local update of lesson + stats + course `progressPercent`
- Snackbar: **تم إكمال الدرس بنجاح**
- Already completed lessons show **تم إكمال الدرس** / disabled button

## Watch-time / progress

- **`updateLessonProgress` is implemented in repository but not called from UI** in Phase 4.
- No periodic watch-time tracking while video plays.
- Documented for Phase 5+ if needed.

---

## YouTube player

Package: **`youtube_player_iframe`**

- Widget: `YoutubeLessonPlayer`
- Valid 11-char video IDs only; extracts ID from `youtubeUrl` if needed
- Placeholder: **لا يوجد فيديو لهذا الدرس بعد.**
- Controller disposed on lesson change / screen dispose

---

## Error states

| Case | Message / action |
|------|------------------|
| 403 FORBIDDEN | لا تملك صلاحية الوصول… + استكشف الكورسات |
| 404 | الكورس غير موجود أو غير متاح |
| NO_LESSONS | لا توجد دروس متاحة بعد |
| Network | Retry |

---

## Limitations

- No offline downloads
- No background playback
- No deep watch-time sync
- No in-app free enroll (use web / later phase)
- Paid activation / CliQ not in this phase

---

## After Phase 4 (Phase 5)

- Payments, activation codes, redeem
- Notifications
- Profile / settings / purchases
- Optional `watchedSeconds` tracking from player

---

## Related

- [Phase 3](./MOBILE_FLUTTER_PHASE_3.md)
