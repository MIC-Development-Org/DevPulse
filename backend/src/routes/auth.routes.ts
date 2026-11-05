import { Router } from "express";
import {
  introspectAdminSession,
  introspectSession,
  loginUser,
  registerUser,
} from "../controllers/auth.controller";
import { requireAuth } from "../middleware/authenticate";
import { requireRole } from "../middleware/authorize";
import {
  loginRateLimiter,
  registerRateLimiter,
} from "../middleware/rateLimiter";

export interface AuthRouterOptions {
  register?: { windowMs: number; max: number };
  login?: { windowMs: number; max: number };
}

/**
 * /auth/* — credentials registration + login, and bearer-token session
 * introspection for the Next.js BFF.
 *
 * Rate limits (per client IP): register 10/15min, login 20/15min by default,
 * overridable via createApp options (integration tests use tiny windows).
 */
export function createAuthRouter(options?: AuthRouterOptions): Router {
  const router = Router();

  router.post("/auth/register", registerRateLimiter(options?.register), registerUser);
  router.post("/auth/login", loginRateLimiter(options?.login), loginUser);

  // Session introspection — requires a valid, non-expired session token on
  // every call; identity is derived from the Session row, never from request
  // fields. /auth/session/admin additionally exercises requireRole.
  router.get("/auth/session", requireAuth, introspectSession);
  router.get("/auth/session/admin", requireAuth, requireRole("ADMIN"), introspectAdminSession);

  return router;
}
