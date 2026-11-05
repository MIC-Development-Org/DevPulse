import "server-only";
import { cookies } from "next/headers";

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
