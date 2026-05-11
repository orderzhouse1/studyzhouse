# Manual QA checklist — Studyhouse MVP

Execute in **staging** (or pre-production) with realistic TLS and env vars. Record pass/fail and screenshots for critical flows.

**Roles:** SUPER_ADMIN, ADMIN, STUDENT (fixed set — no other roles).

---

## Public (unauthenticated)

| # | Scenario | Expected |
|---|----------|----------|
| P1 | Open landing page (`/`) | Loads without error; RTL/layout acceptable. |
| P2 | Open courses catalog (`/courses`) | Lists published courses (or empty state). |
| P3 | Open a **published** course detail (`/courses/[slug]`) | Shows course info; no admin-only data. |
| P4 | Navigate to login (`/login`) from a protected URL while logged out | After login, user lands in role-appropriate area (student vs admin). |

---

## Student

| # | Scenario | Expected |
|---|----------|----------|
| S1 | Login with valid STUDENT credentials | Success; session cookie set; redirect to student area. |
| S2 | Dashboard (`/student` or dashboard route) | Loads for enrolled/context; no server error. |
| S3 | My courses (`/student/my-courses`) | Lists enrollments; matches API. |
| S4 | Explore (`/student/explore`) | Published courses visible; enroll CTA behaves per pricing. |
| S5 | Open learn page for **enrolled** course (`/learn/[courseSlug]`) | Lessons/content load; navigation between lessons works. |
| S6 | Complete or progress a lesson | Progress persists on refresh (lesson progress API). |
| S7 | Redeem activation code (`/student/redeem` or equivalent) | Valid code → enrollment ACTIVE, source activation code; invalid → clear error. |
| S8 | Create CliQ payment request for **published PAID** course | Request created pending; cannot duplicate pending for same course. |
| S9 | View payment status | List/detail shows pending / approved / rejected appropriately. |
| S10 | Open learn for course **without** ACTIVE enrollment | Access denied or blocked per app behavior (403 / redirect). |

---

## Admin

| # | Scenario | Expected |
|---|----------|----------|
| A1 | Login as ADMIN | Success; access to `/admin` routes. |
| A2 | List and manage courses | CRUD per permissions; only own courses manageable unless SUPER_ADMIN rules apply. |
| A3 | Create course → edit metadata → add section/lesson | Saves correctly; publish guard blocks incomplete publish. |
| A4 | Publish course when readiness satisfied | Status PUBLISHED; appears on public catalog. |
| A5 | Archive course | Status ARCHIVED; behavior on public listing per product. |
| A6 | Course Builder (manual structure) | Sections/lessons order and content consistent with API. |
| A7 | YouTube playlist import (if key configured) | Import creates lessons; errors shown if key missing. |
| A8 | Manage categories | Create/edit/archive per UI. |
| A9 | Manage students | List/search; open student detail. |
| A10 | Enroll student in course | Enrollment created; student sees course when appropriate. |
| A11 | Revoke enrollment | Student loses learn access for that course. |
| A12 | Create activation codes for published course | Plain code shown once; list shows masked. |
| A13 | Disable activation code | Redeem fails with inactive-style error. |
| A14 | Payment requests — approve | Enrollment ACTIVE, source reflects CliQ payment path. |
| A15 | Payment requests — reject with reason | Student sees rejection reason where UI exposes it. |

---

## Super Admin

| # | Scenario | Expected |
|---|----------|----------|
| SA1 | Login as SUPER_ADMIN | Success. |
| SA2 | Overview (`/super-admin`) | Metrics/widgets load. |
| SA3 | Create ADMIN user | New admin is ADMIN role only; optional generated password rules work. |
| SA4 | Disable / enable admin | Status updates; disabled admin cannot perform admin actions. |
| SA5 | Audit logs | Recent actions visible; no raw secrets in entries. |
| SA6 | Settings (platform, CliQ copy) | Saves; student-facing payment instructions follow settings. |
| SA7 | As ADMIN, open `/super-admin` routes | **Forbidden** (403) or redirect — ADMIN must not access super-admin. |

---

## Security & edge cases

| # | Scenario | Expected |
|---|----------|----------|
| SEC1 | Hit protected API/route without cookie | 401 / redirect to login. |
| SEC2 | STUDENT calls admin-only endpoint | 403. |
| SEC3 | ADMIN calls super-admin endpoint | 403. |
| SEC4 | SUSPENDED user — login or session | Login rejected or session invalid for protected routes. |
| SEC5 | Invalid activation code | Safe error; no hash leakage. |
| SEC6 | Disabled activation code | Error (e.g. inactive). |
| SEC7 | Duplicate pending payment request same course | Rejected (pending exists). |
| SEC8 | Revoked enrollment — access learn | Blocked (403 or equivalent). |

---

## Sign-off

| Role | Tester | Date | Pass/Fail |
|------|--------|------|-----------|
| Public | | | |
| Student | | | |
| Admin | | | |
| Super Admin | | | |
| Security spot-check | | | |

---

## Related docs

- `docs/PRODUCTION_READINESS_CHECKLIST.md`
- `README.md` (integration tests, env vars)
- `docs/PROJECT_AUDIT_AND_HANDOFF.md`
