import type { Role } from "@prisma/client";

/**
 * Per-request authentication context, populated exclusively by `requireAuth`
 * from the validated database-backed session. Handlers must read identity
 * from here — never from headers, query strings, or request bodies, which are
 * client-controlled and forgeable.
 */export interface AuthContext {
  /** RAW session token. Server-internal only: never logged, never echoed in
   * any response body. */
  sessionToken: string;
  userId: string;
  email: string | null;
  name: string | null;
  role: Role;
  /** Session expiry ISO string, for introspection responses. */
  expiresAt: string;
}
