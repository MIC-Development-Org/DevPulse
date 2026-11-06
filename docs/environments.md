# DevPulse environment matrix

This document is the single source of truth for environment configuration
across the four effective modes DevPulse runs in: **development**, **e2e**
(Playwright), **production (local build)**, and **Docker**. It reflects the
architecture decisions taken in Phase 2 (authentication), Phase 3 (live API
communication layer), and Phase 4 (DB-backed Tracks & Modules APIs). Where a
statement is enforced in code, the enforcing file is named.

## Topology

```
Browser ──(same-origin, HttpOnly session cookie)──▶ Next.js frontend
                                                      │  BFF route handlers /
                                                      │  Auth.js v5 (DB sessions)
                                                      ▼
                                               Express backend
                                                      │  Bearer sessionToken
                                                      ▼
                                              PostgreSQL (devpulse-db)
```

Invariants (enforced by `frontend/src/lib/api/http-client.ts`,
`frontend/tests/unit/security-boundaries.test.ts`):

1. **The browser never calls Express directly.** All business/auth traffic
   goes through same-origin Next.js routes. `NEXT_PUBLIC_API_BASE_URL` was
   **removed in Phase 3**; browser code has no notion of an absolute backend
   origin.
2. **`BACKEND_INTERNAL_URL`, `DATABASE_URL`, and the Prisma client are
   server-only** (`import "server-only"` in `frontend/src/lib/bff.ts`). The
   session token is read from the HttpOnly cookie inside the server process
   and forwarded to Express as `Authorization: Bearer` — never by browser code.
3. **Identity travels exactly once**: browser cookie → BFF → `Bearer` header.
   Express trusts validated `Session` rows only
   (see `backend/docs/auth-integration.md`).

## Mock adapter semantics (`NEXT_PUBLIC_API_MOCK`)

| Value                    | Behavior                                                                                              |
| ------------------------ | ----------------------------------------------------------------------------------------------------- |
| absent or `"true"`       | **Mock adapter** — everything in-browser. Default for mock-only development.                        |
| `"false"`                | **Hybrid adapter** (Phase 4): tracks, modules and quiz questions are served by the live DB-backed |
|                          | Express API; profile/progress/quiz-submission stay mock until Phase 5; certificates stay static.     |

- `NEXT_PUBLIC_*` values are **inlined at build time** by Next.js. Changing
  the flag requires a rebuild (`next build`), not just a restart.
- The selection lives in `frontend/src/lib/api/adapter.ts` (`MockApiClient`
  vs `HybridApiClient` — the hybrid adapter delegates migrated flows to the
  HTTP client and NEVER falls back to mock data on failure).
- **Hard production guard**: when `NODE_ENV=production` and the mock adapter
  is selected, startup throws (`assertMockSelectionAllowed`, called from
  `guard.server.ts`). As of Phase 4 there is NO sanctioned consumer of
  `ALLOW_MOCK_IN_PRODUCTION` — e2e runs the hybrid topology instead — so its
  only acceptable state in a real deployment is: **unset**.
- **Verification**: mock behavior must be visible, never silent:
  `MockDataBanner` renders an amber "MOCK DATA" pill under the pure mock
  adapter, and a softer "PARTIAL MOCK · USER DATA" pill in hybrid mode
  (disclosing that profile/quiz-grading flows are still mocked until
  Phase 5).
- Note: because the guard relies on `NODE_ENV`, running a production build
  (`next start`) without `NODE_ENV=production` explicitly set is not a valid
  production runtime (Next.js sets it automatically via `next start`).

## e2e-only variables (Set by `frontend/playwright.config.ts`)

The Playwright webServer command builds and starts BOTH servers with these
flags; none of them may appear in real deployments:

- `AUTH_TRUST_HOST=true` — opens Auth.js v5's strict production host check
  for our own trusted server (`backend/docs/auth-integration.md`).
- `AUTHJS_SESSION_COOKIE_INSECURE=true` — drops the `__Secure-` prefix so
  plain-http localhost clients deterministically receive the session cookie.
- `NEXT_PUBLIC_API_MOCK=false` — selects the Phase 4 **hybrid** adapter: e2e
  flows exercise the REAL DB-backed Tracks & Modules API through the full
  chain (browser → BFF → Express → PostgreSQL). Requires the database to be
  up, migrated and seeded (3 tracks / 23 modules / 18 quiz questions) before
  the run — `backend` migrations + `prisma db seed` are idempotent.
- `ALLOW_MOCK_IN_PRODUCTION=true` is **no longer part of the e2e topology**
  (Phase 4): mock data may not be served by production builds at all.

## Host per mode (Express origin)

| Mode        | Where Express address appears                            | Address                                                   |
| ----------- | -------------------------------------------------------- | --------------------------------------------------------- |
| dev         | `frontend/.env.local` `BACKEND_INTERNAL_URL`             | `http://localhost:4000` (host loopback)                   |
| Docker      | Compose service env for the frontend container           | `http://backend:4000` (service hostname + container port) |
| production  | same as dev/prod: private `BACKEND_INTERNAL_URL`         | `https://…` (loopback exempt for local builds)            |

- The browser NEVER uses this value (see invariants). The Next.js server
  resolves it at request time (BFF `authedBackendFetch`).
- In Docker, the BFF talks to `backend` via the Compose network using the
  **container port 4000**; the published host port mapping (if any) is
  irrelevant inside the network.
- Database: from the backend container, `DATABASE_URL` points at the
  Compose postgres service (`postgres:5432`); from the host machine it is
  `localhost:5433` (host port mapping). The frontend process only needs its
  own copy for the Auth.js Prisma adapter, kept in sync per
  `backend/docs/auth-integration.md` (plan risk R1).

## Copy templates

- `frontend/.env.example` — copy to `frontend/.env.local` and fill in;
  `NEXT_PUBLIC_QUIZ_PASS_PERCENTAGE` and mock flags are browser-known (
  `NEXT_PUBLIC_` inlined, nothing sensitive).
- `backend/.env.example` — copy to `backend/.env` (server-side values;
  CORS origins, Argon2 tuning, rate limits, `TRUST_PROXY` posture).
- Docker runs use the documented service names above rather than
  `localhost` values.

## Production checklist

1. `NEXT_PUBLIC_API_MOCK=false` set BEFORE `next build` (inlined).
2. Do not set `ALLOW_MOCK_IN_PRODUCTION` (its presence in a real deployment
   is a red flag — the adapter hard-fail otherwise makes this deterministic).
3. `BACKEND_INTERNAL_URL` must be `https://` (loopback exempt).
4. Auth: `AUTH_SECRET` strong random; `AUTH_URL` matching the public origin;
   no `AUTH_TRUST_HOST`/`AUTHJS_SESSION_COOKIE_INSECURE` unless the origin
   is one you control end-to-end.
5. Mock-bin visibility: with mock off, no "MOCK DATA" pill renders.
   In hybrid mode one soft "PARTIAL MOCK · USER DATA" pill
   (`MockDataBanner`) stays visible until Phase 5 retires the mocked
   user-scoped flows.
