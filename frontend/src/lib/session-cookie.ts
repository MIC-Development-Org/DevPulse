/**
 * Session cookie naming shared between the Auth.js config (which also reads
 * this cookie for every auth()/session resolution and OAuth flows) and the
 * custom credentials sign-in BFF route (which writes it). Keep both paths
 * aligned via this single module — drifting names would silently break
 * authentication.
 *
 * AUTHJS_SESSION_COOKIE_INSECURE=true is an e2e/local prod-build escape
 * hatch ONLY: it drops the `__Secure-` prefix + Secure flag so plain-http
 * localhost clients deterministically receive the cookie. Real deployments
 * must never set it; leaving it unset keeps production strict.
 */
export const SESSION_COOKIE = {
  /** Auth.js v5 standard names for its HttpOnly database-session cookie. */
  development: "authjs.session-token",
  production: "__Secure-authjs.session-token",
} as const;

export interface SessionCookieOptions {
  name: string;
  secure: boolean;
}

export function getSessionCookieOptions(): SessionCookieOptions {
  const insecureOverride =
    process.env.AUTHJS_SESSION_COOKIE_INSECURE === "true";
  const strict = process.env.NODE_ENV === "production" && !insecureOverride;
  return {
    name: strict ? SESSION_COOKIE.production : SESSION_COOKIE.development,
    secure: strict,
  };
}

/** Session policy mirrored from auth.ts (30 days). */
export const SESSION_MAX_AGE_SECONDS = 30 * 24 * 60 * 60;
