import type { Role } from "@prisma/client";
import type { RequestHandler } from "express";

/**
 * Authorization middleware (authorization foundation, Phase 2).
 *
 * Must run after `requireAuth`. Rejects:
 *  - authenticated requests lacking `req.authContext` with 401 (defensive —
 *    never let a role check silently pass without an auth chain), and
 *  - authenticated requests whose role is not allowed with 403.
 *
 * Usage in future business routes:
 *   router.post("/quizzes", requireAuth, requireRole("USER"), handler)
 *   router.delete("/users/:id", requireAuth, requireRole("ADMIN"), handler)
 */
export const requireRole =
  (...allowed: Role[]): RequestHandler =>
  (req, res, next) => {
    const context = req.authContext;

    if (!context) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    if (!allowed.includes(context.role)) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    next();
  };
