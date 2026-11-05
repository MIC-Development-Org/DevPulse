# Authentication integration — Next.js Auth.js ⇄ Express (Phase 2)

This document is the contract for how authenticated identity produced by
Auth.js v5 (running **in the Next.js frontend**) is consumed by the Express
backend. It matters more than the code: read it before changing auth.

## 1. Roles of the two services

| Concern | Owner |
| --- | --- |
| Cookie issuance, HttpOnly/SameSite/Secure flags, CSRF for auth pages | Next.js (Auth.js v5) |
| Session **rows** (`Session` table) | Created/updated/deleted by Auth.js via the Prisma adapter |
| Password storage + verification (Argon2id) | Express (`/auth/login`, `/auth/register`) |
| Protected business authorization | Express (`requireAuth` + `requireRole`) |
| OAuth provider secrets (GitHub) | Next.js env only — never in backend env |

## 2. Request flow

```
Registration:
browser ──▶ POST /api/register (Next BFF route handler, Zod-validated)
        ──▶ POST /auth/register (Express; rate-limited; Argon2id; P2002 → 409 generic)
        ◀── 201 SessionUser (safe fields only)
browser ──▶ signIn("credentials") → Auth.js creates Session row; HttpOnly cookie set

Login:
browser ──▶ POST /api/auth/credentials (custom BFF route; same-origin; CSRF-checked)
        ──▶ POST /auth/login (server-to-server)
        ◀── 200 { user }  | 401 { error: "Invalid email or password" } (generic)
BFF: creates the Session row via the SAME PrismaAdapter Auth.js uses and sets
     the HttpOnly cookie (authjs.session-token)
WHY A CUSTOM ROUTE: Auth.js v5 throws UnsupportedStrategy for the built-in
credentials action under `strategy: "database"`. Everything else (session
reads via auth()/useSession, expiry updates, sign-out, OAuth flows) remains
Auth.js's own database-session machinery.

Authenticated calls (BFF only):
browser ──▶ Next route handler (BFF) — server code only
BFF: auth() session → cookies() → raw sessionToken (HttpOnly cookie)
BFF ──▶ Express: Authorization: Bearer <sessionToken>
Express: requireAuth → Session.findUnique({include:{user}}) → expires > now
       → req.authContext {userId, role, ...}
◀── 200 (or 401 missing/garbage/expired, 403 wrong role)
```

## 3. Why Bearer session-token (and its limits)

The token in the `Authorization` header is the same per-session secret Auth.js
stores in its HttpOnly cookie and the `Session.sessionToken` column.

- No new trust format, no shared signing secret, no clock skew.
- Logout/expiry invalidation is **global and instant**: the row disappears ⇒
  every service rejects the token on the next request.
- Possession of the token equals possession of the session — identical to
  Auth.js's own model (that is what the cookie is).

**Mandatory hardening rule:** this model is safe only while Express is not
publicly reachable.

- **Production deployment posture ( requirement):** Express must only be
  reachable through a private server-to-server network from the Next.js
  backend (same host, private subnet, VPC, or service mesh). Browser traffic
  must never terminate directly on Express. `CORS_ORIGINS` is still enforced,
  but it is not a network control.
- **Transport:** BFF → Express must use HTTPS in production. Frontend env
  validation rejects an `http://` `BACKEND_INTERNAL_URL` when
  `NODE_ENV=production`.
- **Never log** `Authorization` headers or session tokens; the request logger
  records method/path/status/duration only. Passwords are never logged.
- **Never let the token reach browser JS**: it exists only in the HttpOnly
  cookie and in server-only modules (`server-only` imports make accidental
  client bundling a build error).

**If Express ever becomes publicly reachable**, the Bearer model above is no
longer sufficient — an attacker who cannot get a session token could still
aim credential-stuffing/replay traffic directly at Express. The required
upgrade is a **signed server-to-server identity assertion**:

1. The BFF still validates the session DB row (tokens never leave the BFF).
2. The BFF sends a short-lived assertion: HMAC-SHA256 over
   `{userId, role, iat, exp ≤ 60s, nonce}` with a dedicated
   `INTERNAL_AUTH_ASSERTION_KEY` present only in the two server envs.
3. Express verifies the HMAC + expiry + nonce replay cache instead of doing
   its own session lookup (or in addition, for instant revocation).
4. Rotate the assertion key like any other secret.

## 4. Anti-enumeration / anti-abuse decisions

- Login responses are byte-identical for unknown email and wrong password,
  including a decoy Argon2 verification on unknown emails to flatten timing.
- Registration duplicate → `409 {"error":"This email cannot be used to
  create an account."}` (approved UX tradeoff; not a hard enumeration guarantee).
- Rate limits per IP: register 10/15 min, login 20/15 min (env-tunable). Behind
  a reverse proxy set `TRUST_PROXY` to the number of trusted hops.
- Identity for handlers comes exclusively from `req.authContext` — body,
  query, and extra headers are never consulted.

## 5. Environment variables

Frontend (Next.js, server-only usage): `AUTH_SECRET`, `AUTH_URL`,
`BACKEND_INTERNAL_URL`, optional `GITHUB_CLIENT_ID`/`GITHUB_CLIENT_SECRET`,
plus `DATABASE_URL` (Prisma adapter only — scoped to auth, see plan R1).

Backend: `ARGON2_*` (benchmarked params), `RATE_LIMIT_*`, `TRUST_PROXY`
(0 for private-network deploy), plus existing `CORS_ORIGINS`, `DATABASE_URL`,
`PORT`, `NODE_ENV`.
