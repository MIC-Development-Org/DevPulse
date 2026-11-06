import "server-only";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { z } from "zod";
import type { ApiErrorEnvelope } from "@devpulse/contracts";
import { ApiErrorEnvelopeSchema } from "@devpulse/contracts";

/**
 * BFF plumbing (Phase 2) — server-to-server calls from Next route handlers
 * to the Express backend.
 *
 * Security contract (backend/docs/auth-integration.md):
 *  - BACKEND_INTERNAL_URL is server-only (never NEXT_PUBLIC_*), must be
 *    https:// in production.
 *  - The session token is read exclusively from the HttpOnly session cookie
 *    inside this server process and forwarded as `Authorization: Bearer` to
 *    Express. It never leaves server code, and browser cookies are never
 *    forwarded to Express.
 *  - Express derives identity from the validated Session row only; nothing
 *    here carries identity fields.
 */

const SESSION_COOKIE_NAMES = [
  "__Secure-authjs.session-token", // production
  "authjs.session-token", // development
];

export function backendInternalUrl(): string {
  const url = process.env.BACKEND_INTERNAL_URL;
  if (!url) {
    throw new Error("BACKEND_INTERNAL_URL is not configured");
  }
  if (process.env.NODE_ENV === "production") {
    // Production requires https, EXCEPT loopback targets, so that local
    // production-build runs (e2e, self-host checks) remain possible without
    // weakening the real deployment rule (docs/auth-integration.md).
    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      throw new Error("BACKEND_INTERNAL_URL is not a valid URL");
    }
    const isLoopback =
      parsed.hostname === "localhost" ||
      parsed.hostname === "127.0.0.1" ||
      parsed.hostname === "[::1]" ||
      parsed.hostname === "::1";
    if (!parsed.protocol.startsWith("https:") && !isLoopback) {
      throw new Error(
        "BACKEND_INTERNAL_URL must use https:// in production (see docs/auth-integration.md)"
      );
    }
  }
  return url;
}

/** Raw session token from the HttpOnly cookie — server-only by construction. */
export async function getSessionToken(): Promise<string | null> {
  const store = await cookies();
  for (const name of SESSION_COOKIE_NAMES) {
    const value = store.get(name)?.value;
    if (value) return value;
  }
  return null;
}

/**
 * Fetch the Express backend with the caller's session attached (if any).
 * Callers own status mapping; missing/invalid tokens simply receive 401s.
 */
export async function authedBackendFetch(
  path: string,
  init: RequestInit = {}
): Promise<Response> {
  const headers = new Headers(init.headers);
  const token = await getSessionToken();
  if (token) {
    headers.set("authorization", `Bearer ${token}`);
  }
  // Never forward browser cookies to Express.
  headers.delete("cookie");

  return fetch(`${backendInternalUrl()}${path}`, {
    ...init,
    headers,
    cache: "no-store",
  });
}

/** Result passed to explicit BFF route handlers (Phase 3 helpers). */
export type BackendResult<T> =
  | { readonly ok: true; readonly data: T }
  | { readonly ok: false; readonly response: Response };

/**
 * Guard for BFF endpoints that require a signed-in browser session.
 * Reuses getSessionToken() — no duplicated auth logic. Errors become
 * 401s with the shared envelope; never leak whether a session row exists.
 */
export async function requireSessionToken(): Promise<
  BackendResult<string>
> {
  const token = await getSessionToken();
  if (token) return { ok: true, data: token };
  return {
    ok: false,
    response: Response.json(
      { error: "You need to sign in first." },
      { status: 401, headers: { "cache-control": "no-store" } }
    ),
  };
}

export interface JsonBackendResponseOptions<T> {
  /** Upstream statuses treated as success (default: any 2xx). */
  successStatuses?: readonly number[];
  /** Optional contract for the upstream success payload. */
  schema?: z.ZodType<T, z.ZodTypeDef, unknown>;
}

/**
 * Normalize an upstream Express response into a typed result plus a
 * ready-to-forward Response (same status code, standardized envelope).
 *
 * Propagation rules (shared/contracts + backend/docs/auth-integration.md):
 *  - upstream non-2xx: forward status + ApiErrorEnvelope body verbatim when
 *    the backend produced it; otherwise a generic, internals-free envelope;
 *  - malformed upstream success payloads: 502 with a generic envelope
 *    (details stay inside this server process).
 */
export async function jsonBackendResponse<T>(
  response: Response,
  options: JsonBackendResponseOptions<T> = {}
): Promise<BackendResult<T>> {
  const success = options.successStatuses
    ? options.successStatuses.includes(response.status)
    : response.ok;

  if (success) {
    if (response.status === 204) {
      return { ok: true, data: undefined as T };
    }

    let raw: unknown;
    try {
      raw = await response.json();
    } catch {
      console.error("[devpulse bff] malformed upstream success body");
      return {
        ok: false,
        response: Response.json(
          { error: "The service returned a malformed response." },
          { status: 502, headers: { "cache-control": "no-store" } }
        ),
      };
    }

    if (options.schema) {
      const parsed = options.schema.safeParse(raw);
      if (!parsed.success) {
        // Log issue paths only — never the received payload itself.
        const issuePaths = parsed.error.issues.map((issue) => issue.path.join("."));
        console.error(
          "[devpulse bff] upstream payload contract mismatch:",
          issuePaths.join(", ") || "(root)"
        );
        return {
          ok: false,
          response: Response.json(
            { error: "The service returned an unexpected payload." },
            { status: 502, headers: { "cache-control": "no-store" } }
          ),
        };
      }
      return { ok: true, data: parsed.data };
    }

    return { ok: true, data: raw as T };
  }

  // Non-2xx: best-effort envelope propagation (status is preserved).
  const raw: unknown = await response
    .json()
    .catch(() => null);
  const upstream = ApiErrorEnvelopeSchema.safeParse(raw);
  const upstreamEnvelope = upstream.success ? upstream.data : null;

  if (!upstreamEnvelope) {
    console.error("[devpulse bff] upstream failure", response.status);
  }

  const errorEnvelope: ApiErrorEnvelope = upstreamEnvelope ?? {
    error:
      response.status >= 500
        ? "The service failed to handle the request."
        : "The request was rejected.",
  };

  return {
    ok: false,
    response: Response.json(errorEnvelope, {
      status: response.status,
      headers: { "cache-control": "no-store" },
    }),
  };
}

/**
 * Typed error for server-page data fetching (Phase 4). Carries the backend
 * status and the (already sanitized) envelope message; server components map
 * `status === 404` to `notFound()` and let anything else bubble to the error
 * boundary. Never silent: failed real requests never fall back to mocks.
 */
export class BackendHttpError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "BackendHttpError";
    this.status = status;
  }
}

/**
 * Server-page JSON fetch (Phase 4): server-to-server call to the Express
 * backend (no BFF hop for React Server Components), validated against the
 * shared contract, with standardized envelopes surfaced as `BackendHttpError`.
 *
 * NOT for browser code (`httpFetch` exists for that) — the provided path is
 * an Express path like "/tracks/git-basics".
 */
export async function backendFetchJson<T>(
  path: string,
  schema: z.ZodType<T, z.ZodTypeDef, unknown>
): Promise<T> {
  const response = await authedBackendFetch(path, {
    headers: { accept: "application/json" },
  });
  const result = await jsonBackendResponse(response, { schema });
  if (result.ok) {
    return result.data;
  }

  const body = (await result.response.json().catch(() => null)) as
    | { error?: unknown }
    | null;
  const message = typeof body?.error === "string" ? body.error : "Request failed";
  throw new BackendHttpError(result.response.status, message);
}

/**
 * Convenience wrapper for server components: maps backend 404s to Next's
 * `notFound()` (NEXT_NOT_FOUND control flow) and rethrows every other
 * failure. Call ONLY from React Server Components.
 */
export function withNotFound<T>(promise: Promise<T>): Promise<T> {
  return promise.catch((error: unknown) => {
    if (error instanceof BackendHttpError && error.status === 404) {
      notFound();
    }
    throw error;
  });
}
