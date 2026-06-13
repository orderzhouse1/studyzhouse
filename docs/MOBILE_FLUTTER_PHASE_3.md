# STUDYZHOUSE — Flutter Phase 3 (Student Home + Courses)

**Scope:** Dashboard, my courses, explore, course detail, saved courses. No learn player, no payments, no Google mobile.

---

## Endpoints used

| Method | Path | Screen |
|--------|------|--------|
| GET | `/student/dashboard` | Home |
| GET | `/student/my-courses` | Home preview, My Courses |
| GET | `/courses` | Explore (+ pagination) |
| GET | `/courses/:slug` | Course detail |
| GET | `/categories` | Explore filters |
| GET | `/student/saved-courses` | Saved list |
| GET | `/student/saved-courses/ids` | Explore/detail bookmarks |
| POST | `/student/courses/:courseId/save` | Save |
| DELETE | `/student/courses/:courseId/save` | Unsave |

All student routes use **Bearer** token (Phase 2).

---

## Routes

| Route | Screen |
|-------|--------|
| `/home` | Student dashboard (tab) |
| `/courses` | Explore (tab) |
| `/courses/:slug` | Course detail (nested, keeps bottom nav) |
| `/profile` | Account menu (tab) |
| `/my-courses` | Full my courses list |
| `/saved` | Saved courses |
| `/learn/:slug` | Learn player placeholder (Phase 4) |

Auth routes unchanged: `/splash`, `/login`, `/signup`, `/forgot-password`.

---

## Image URL handling

`absoluteApiAssetUrl(path, apiBaseUrl: …)` in `lib/src/core/utils/absolute_api_asset_url.dart`:

- `API_BASE_URL` = `https://studyzhouse.com/api/v1`
- Origin = `https://studyzhouse.com`
- `/api/v1/uploads/...` → `https://studyzhouse.com/api/v1/uploads/...`
- Full `https://` URLs unchanged
- `CourseThumbnail` uses `cached_network_image` with placeholder on error

---

## Saved courses

- IDs loaded via `savedCourseIdsProvider` (AsyncNotifier).
- Toggle on explore/detail: optimistic UI, rollback + Arabic snackbar on failure.
- Saved list: `GET /student/saved-courses`, remove via same toggle + list refresh.
- Saving does **not** enroll.

---

## UX notes

- Home: greeting, stats, continue learning, my courses preview, explore preview, quick links.
- My courses: progress bar, pending payment badge, «ابدأ التعلم» → `/learn/:slug` placeholder.
- Explore: search, category chips, free/paid filter, «تحميل المزيد».
- Detail: cover, meta, save, CTAs placeholders for paid/activation.
- Profile: links to my courses / saved / explore + logout.

---

## After Phase 3 (Phase 4)

- Learn player (`/student/courses/:slug/learn` or equivalent)
- Lesson progress sync
- Redeem / payments / notifications
- Profile settings (Phase 2 web parity)

See `docs/MOBILE_APP_PLAN.md`.

---

## Related

- [Phase 1](./MOBILE_FLUTTER_PHASE_1.md)
- [Phase 2](./MOBILE_FLUTTER_PHASE_2.md)
