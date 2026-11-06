import { Router } from "express";
import { createAuthRouter } from "./auth.routes";
import { curriculumRoutes } from "./curriculum.routes";
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

  // Public read-only learning content (tracks/modules/quiz, Phase 4). The
  // user-scoped business routers (progress, quiz submission, certificates)
  // mount here in later phases behind requireAuth + requireRole.
  router.use(curriculumRoutes);

  return router;
}
