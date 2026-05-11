# Production readiness checklist — Studyhouse MVP

Use this document together with `README.md`, `.env.example`, and `docs/MANUAL_QA_CHECKLIST.md`.  

**Integration tests (Phase 10B):** The suite in `apps/api/src/integration/critical-flows.integration.test.ts` has been **executed successfully** against an **isolated Neon test database** using **`TEST_DATABASE_URL`** — **21 passed**, **0 skipped**, **0 failed** (no timeouts; async errors routed via `asyncHandler`).  

**Ongoing requirement:** Every developer and every CI pipeline must still use a **dedicated test Postgres URL** via **`TEST_DATABASE_URL`** — **never** production `DATABASE_URL`. Running `pnpm test:api` without `TEST_DATABASE_URL` skips integration tests and is **not** equivalent to a green run. CI jobs should provision or inject an isolated DB secret when gatekeeping releases.

---

## Environment variables

| Area | Action |
|------|--------|
| Secrets | Generate strong random values for `JWT_ACCESS_SECRET` (≥32 chars) and, if used, `ACTIVATION_CODE_PEPPER` (≥32 chars). Store in your host’s secret manager, not in Git. |
| Production DB | Set `DATABASE_URL` to the production Postgres URL (TLS as required by your provider). |
| App URL alignment | Set `CLIENT_ORIGIN` to the **exact** browser origin of the Next.js app (e.g. `https://app.example.com`). Must match for CORS and cookie expectations. |
| Internal API | Set `API_INTERNAL_URL` so **server-side** Next.js can reach Express (same Docker network, K8s service URL, etc.). |
| Node | Set `NODE_ENV=production` for API and web build/runtime where applicable. |
| Optional | `YOUTUBE_API_KEY` if admins need playlist import; `JWT_EXPIRES_IN`; `ACTIVATION_CODE_PEPPER` (do **not** rotate after real codes exist unless you intentionally invalidate old hashes). |
| Integration tests only | `TEST_DATABASE_URL` — **never** production; used only when running `pnpm test:api`. Vitest sets `DATABASE_URL` from it inside the test process. |

See `README.md` for the full variable table.

---

## Database setup

- [ ] Provision a dedicated Postgres instance (or schema + role if your policy allows) for **production**.
- [ ] Restrict network access (VPC, firewall, Neon IP allowlist, etc.).
- [ ] Use TLS (`sslmode=require` or equivalent) if required by the provider.
- [ ] Do **not** run `pnpm db:seed` against production (seed passwords are public in `prisma/seed.ts`).
- [ ] Create initial super-admin and admins through your secure onboarding process (not seed).

---

## Prisma migrations

| Environment | Recommended command |
|-------------|---------------------|
| **Local development** | `pnpm db:push` is acceptable for fast iteration **or** `pnpm exec prisma migrate dev` when you intend to commit migrations. |
| **Production** | Use **`pnpm db:migrate:deploy`** (= `prisma migrate deploy` from repo root). |

**Do not** run `db push` against production databases for long-lived environments — it can drift from tracked migrations.

Workflow when changing schema locally:

1. Edit `prisma/schema.prisma`.
2. Run `pnpm exec prisma migrate dev --name descriptive_name` to create a migration and apply it locally.
3. Commit the `prisma/migrations/` folder.
4. In production deploy pipeline: `pnpm install` / `pnpm db:generate` then **`pnpm db:migrate:deploy`**.

### Prisma CLI / `package.json` deprecation notice

Prisma may print a **non-blocking** deprecation warning about defining `prisma` in root `package.json` — it suggests migrating configuration to **`prisma.config.ts`** in a future Prisma release. This does **not** stop `pnpm db:generate`, `db push`, or `migrate deploy`. Address it when convenient by following Prisma’s migration guide; no urgent action required for MVP deployment.

---

## Auth, cookies, CORS

- [ ] **HTTPS** on the public app URL so `Secure` cookies work (`NODE_ENV=production` enables Secure in `cookieAuth`).
- [ ] **SameSite=Lax** on the JWT cookie (current behavior); document your apex/subdomain strategy if cookies must span hosts.
- [ ] **CORS**: single origin `CLIENT_ORIGIN`, `credentials: true` — no wildcard with credentials.
- [ ] Next.js **rewrites** `/api/v1/*` to `API_INTERNAL_URL` so the browser talks same-origin for API calls (see `apps/web/next.config.ts`).
- [ ] Trust proxy / load balancer: Express uses `trust proxy` — confirm headers behind your reverse proxy.

---

## Security checklist

- [ ] No real secrets in `.env.example` or committed `.env`.
- [ ] **CSRF**: No explicit CSRF token today — mitigation is SameSite=Lax + same-origin API via rewrite. Consider explicit CSRF tokens for sensitive cookie-authenticated mutations in a future phase.
- [ ] **Rate limits**: In-memory (`express-rate-limit`) — per process; for multi-instance API consider Redis-backed store later (`REDIS_URL` is stubbed).
- [ ] **CSP / Helmet**: Baseline Helmet in use; further CSP tightening deferred — validate in staging.
- [ ] **Refresh tokens**: Not implemented; JWT access cookie only — document session length (`JWT_EXPIRES_IN`).
- [ ] **Logging**: Do not log passwords, `passwordHash`, activation code hashes, plain activation codes, JWTs, or raw payment secrets (see Monitoring section).
- [ ] **Integration tests**: Run `pnpm test:api` with `TEST_DATABASE_URL` before launch (see README).

---

## Role-based access checklist

Roles are fixed: **SUPER_ADMIN**, **ADMIN**, **STUDENT** only.

- [ ] **STUDENT** cannot hit `/admin/*` or `/super-admin/*` API routes (403).
- [ ] **ADMIN** cannot hit `/super-admin/*` API routes (403).
- [ ] **SUPER_ADMIN** can access super-admin APIs; cannot create another SUPER_ADMIN via current API (admins created as ADMIN).
- [ ] **Suspended** users cannot authenticate (`login` 403) and active sessions become invalid on `/auth/me` when status is not ACTIVE.

---

## Manual QA checklist by role

See **`docs/MANUAL_QA_CHECKLIST.md`** for step-by-step scenarios (public, student, admin, super-admin, security).

---

## Payment / CliQ manual process checklist

- [ ] CliQ display copy for students comes from **Super Admin → Settings** (`AppSetting` / `platform_governance`), not from `CLIQ_*` env vars.
- [ ] Student can submit one **pending** payment request per paid course (duplicate pending rejected).
- [ ] Student with **ACTIVE** enrollment cannot create another payment request for that course.
- [ ] Admin can **approve** (creates/reactivates enrollment, source CLIQ_PAYMENT) or **reject** with reason.
- [ ] No automatic bank/CliQ verification — manual review only.

---

## Activation code checklist

- [ ] `ACTIVATION_CODE_PEPPER` stable in production once codes are issued (changing it invalidates old hashes).
- [ ] Admin creates codes only for **published** paid (or eligible) courses per product rules.
- [ ] Plain code shown **once** on create; list views show masked prefix only.
- [ ] Test disabled codes, expired (if used), max uses, duplicate redeem paths in staging.

---

## YouTube import checklist

- [ ] `YOUTUBE_API_KEY` set on API server only (never `NEXT_PUBLIC_*`).
- [ ] API quota and key restrictions in Google Cloud Console.
- [ ] Feature degrades gracefully when key is missing (admin UI messaging).

---

## Monitoring / logging checklist

### Recommended (not fully wired in repo)

| Component | Suggestion |
|-----------|------------|
| **Sentry** | Optional SDK for `apps/web` (browser + server) and `apps/api` (Express). Use DSN via env; separate projects or environments for staging/production. |
| **Capture** | Unhandled exceptions, 5xx responses, failed auth spikes (metrics only — no raw tokens). |
| **Do not send to third parties** | Passwords, JWTs, `passwordHash`, activation code hashes, plain activation codes, full payment card data (N/A for CliQ manual). |

### Application logs

- Prefer structured logs (level, route, user id as opaque id, correlation id).
- Audit logs in DB already exist for many actions — backup DB includes audit trail.

---

## Backup / restore checklist

- [ ] Automated Postgres backups (provider snapshots or `pg_dump` schedule).
- [ ] Test restore to a **non-production** database periodically.
- [ ] Document RPO/RTO expectations with stakeholders.
- [ ] Protect backup storage encryption and access control.

---

## Deployment checklist

- [ ] `pnpm typecheck` passes in CI or locally before deploy.
- [ ] `pnpm build` passes (web + api).
- [ ] `pnpm test:api` with **`TEST_DATABASE_URL`** set to isolated DB — aim for **0 skipped** integration tests.
- [ ] Run **`pnpm db:migrate:deploy`** in production deploy step (after `pnpm db:generate` if needed).
- [ ] Set all production env vars on the host/orchestrator.
- [ ] Smoke test: health endpoint, login, one student path, one admin path (see manual QA doc).

---

## Known limitations before launch

| Limitation | Notes |
|--------------|--------|
| No Stripe / no automatic CliQ bank integration | Manual payment approval only. |
| No Redis-backed rate limiting | Scale-out API instances get independent rate limit buckets. |
| No refresh-token rotation | Access JWT in HttpOnly cookie; expiry controlled by `JWT_EXPIRES_IN`. |
| CSRF tokens not implemented | SameSite + same-origin API pattern; assess risk for your threat model. |
| CI without isolated DB | Pipeline must inject **`TEST_DATABASE_URL`** or integration tests are skipped — repeat full suite before release. |
| In-memory rate limits | May need Redis for strict global limits. |

---

## References

- `README.md` — env table, production checklist summary, integration test commands.
- `docs/MANUAL_QA_CHECKLIST.md` — manual test scenarios.
- `docs/PROJECT_AUDIT_AND_HANDOFF.md` — technical audit and phase history.
