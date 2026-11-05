import { Router } from "express";
import { createAuthRouter } from "./auth.routes";
import { healthRoutes } from "./health.routes";

/** compose options type here */
export interface RouterOptions {
  rateLimits?: {
    register?: { windowMs: number; max: number };
    login?: { windowMs: number; max: number };
  };
}

export function createRouter(options: RouterOptions = {}): Router {
  const router = Router();

  // Health endpoints stay public — used by containers/monitoring and never
  // require authentication.
  router.use("/health", healthRoutes);
  router.use(createAuthRouter(options.rateLimits));

  // Future business routers (tracks/modules/quizzes) mount here, each behind
  // requireAuth + requireRole as appropriate.
  return router;
}
