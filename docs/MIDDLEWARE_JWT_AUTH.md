# Middleware JWT auth (Phase 2)

## What changed

Protected routes (`/student`, `/learn`, `/admin`, `/super-admin`) are gated in Next.js middleware by **verifying the existing HttpOnly access cookie** (`studyhouse_access`) with **HS256** and `JWT_ACCESS_SECRET`, using the same algorithm and payload shape as `apps/api/src/lib/jwt.ts`.

Previously, middleware called **`GET /api/v1/auth/me`** on every navigation to those paths, which added a full API + database round-trip before the page could render.

## Security model

| Layer | Responsibility |
|--------|----------------|
| **Express** | Source of truth: `requireAuth` / `requireRole`, user loaded from DB, enrollment checks, etc. |
| **Middleware** | UX-only routing: signature-valid JWT + `role` claim must match the route prefix. Not used to authorize data mutations. |

The **`GET /auth/me`** endpoint is unchanged.

## Tradeoff (stale navigation vs APIs)

Claims in the JWT (`role`, existence of session) reflect the moment of login until **token expiry** (`JWT_EXPIRES_IN`, e.g. 12h).

If an admin **revokes** access or **changes role** in the database before the cookie expires:

- **APIs** enforce the new reality immediately (DB-backed auth).
- **Middleware** may still allow navigation to a previously allowed route until the JWT expires or the user logs in again — but any API call will fail with 401/403 as appropriate.

So navigation can briefly disagree with server authorization; **data access remains safe** because APIs do not trust middleware.

## Configuration

`JWT_ACCESS_SECRET` **must** be identical for:

- `apps/api` (signing and verifying tokens on the server)
- `apps/web` (middleware verification)

Set it in the environment for the Next build/runtime, or rely on the root `.env` merge in `apps/web/next.config.ts` for local monorepo setups.

Do **not** expose this secret as `NEXT_PUBLIC_*`.

## Performance

Navigation no longer waits on **`/auth/me`** in middleware, removing one network hop and DB read per client-side route transition to protected areas.
