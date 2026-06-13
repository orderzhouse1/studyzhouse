# Integration tests (API)

Vitest + Supertest suites live under `apps/api/src/integration/`. They require a **dedicated Postgres database** — never production `DATABASE_URL`.

## Rules

| Situation | Expected behavior |
|-----------|-------------------|
| No `TEST_DATABASE_URL` | Integration `describe` blocks are **skipped** (intentional). One placeholder test explains why. |
| `TEST_DATABASE_URL` set | All integration suites **must run** — no skip due to transient DB unless the suite fails. |
| Production DB | **Never** use as `TEST_DATABASE_URL`. |

## Recommended setup: local Postgres (Docker)

```bash
# Start isolated Postgres on port 5433
pnpm db:test:up

# Apply migrations (once per fresh container)
# PowerShell:
$env:TEST_DATABASE_URL = "postgresql://studyhouse:studyhouse_test@127.0.0.1:5433/studyhouse_test"
$env:DATABASE_URL = $env:TEST_DATABASE_URL
pnpm db:test:migrate

# bash:
export TEST_DATABASE_URL="postgresql://studyhouse:studyhouse_test@127.0.0.1:5433/studyhouse_test"
DATABASE_URL="$TEST_DATABASE_URL" pnpm db:test:migrate

# Run full API test suite
pnpm test:api

# Stop and remove test data
pnpm db:test:down
```

`docker-compose.test.yml` uses **tmpfs** — data is ephemeral and fast. Port **5433** avoids clashing with a local Postgres on 5432.

## Alternative: Neon test branch

1. Create a **separate branch** or database in Neon (not production).
2. Set `TEST_DATABASE_URL` with `?sslmode=require`.
3. Run `DATABASE_URL="$TEST_DATABASE_URL" pnpm db:migrate:deploy` once.
4. Run `pnpm test:api`.

Neon pooler can be flaky under long sequential suites (~8 min). Prefer local Docker for CI and pre-release runs.

## Commands

| Command | Purpose |
|---------|---------|
| `pnpm test:api` | Full API suite (integration + unit) |
| `pnpm db:test:up` | Start Docker Postgres for tests |
| `pnpm db:test:down` | Stop Docker Postgres |
| `pnpm db:test:migrate` | Apply migrations (set `DATABASE_URL` to test URL first) |

### Run only new feature integration tests

```bash
pnpm --filter @studyhouse/api exec vitest run \
  src/integration/activation-redeem.integration.test.ts \
  src/integration/lesson-notes.integration.test.ts \
  src/integration/course-reviews.integration.test.ts \
  src/integration/student-recommendations.integration.test.ts \
  src/integration/admin-analytics.integration.test.ts \
  src/integration/audit-logs-enhanced.integration.test.ts \
  src/integration/web-push.integration.test.ts
```

## Stability helpers (Phase 8)

- **`integrationGlobalSetup.ts`** — pings the DB with retries before any suite runs.
- **`ensureIntegrationDatabaseReady()`** — used in heavy suites (`critical-flows`, `student-notifications`) to retry transient connection errors.
- **`activation-redeem.integration.test.ts`** — focused redeem stability tests (independent of the long critical-flows suite).

## Skipped vs failed

- **Skipped without `TEST_DATABASE_URL`:** expected — not a green run.
- **Skipped with `TEST_DATABASE_URL`:** usually means a suite `beforeAll` threw (DB unreachable). Fix connectivity or use Docker.
- **Failed:** investigate the specific test; activation redeem failures on Neon were infrastructure timeouts, not production logic bugs.

## CI suggestion

```yaml
services:
  postgres:
    image: postgres:16-alpine
    env:
      POSTGRES_USER: studyhouse
      POSTGRES_PASSWORD: studyhouse_test
      POSTGRES_DB: studyhouse_test
    ports:
      - 5433:5432
env:
  TEST_DATABASE_URL: postgresql://studyhouse:studyhouse_test@127.0.0.1:5433/studyhouse_test
steps:
  - run: pnpm install --frozen-lockfile
  - run: pnpm db:generate
  - run: DATABASE_URL=$TEST_DATABASE_URL pnpm db:migrate:deploy
  - run: pnpm test:api
```
