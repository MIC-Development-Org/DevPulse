import { Router } from "express";
import { createAuthRouter } from "./auth.routes";
import { curriculumRoutes } from "./curriculum.routes";
import { createProgressRouter } from "./progress.routes";
import { healthRoutes } from "./health.routes";

/** compose options type here */
export interface RouterOptions {
  rateLimits?: {
    register?: { windowMs: number; max: number };
    login?: { windowMs: number; max: number };
    quizSubmit?: { windowMs: number; max: number };
    progressMutation?: { windowMs: number; max: number };
  };
}

export function createRouter(options: RouterOptions = {}): Router {
  const router = Router();

  // Health endpoints stay public — used by containers/monitoring and never
  // require authentication.
  router.use("/health", healthRoutes);
  router.use(createAuthRouter(options.rateLimits));

  // Public read-only learning content (tracks/modules/quiz, Phase 4).
  router.use(curriculumRoutes);

  // Authenticated user-scoped business endpoints (Phase 5): profile,
  // progress, quiz submission/grading. requireAuth + rate limits are applied
  // inside the sub-router; identity is always derived from the DB session.
  router.use(createProgressRouter(options.rateLimits));

  return router;
}
