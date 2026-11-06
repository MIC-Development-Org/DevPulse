import { Router } from "express";
import {
  getMyProfile,
  getProgressOverview,
  resetMyProgress,
  startMyModule,
} from "../controllers/progress.controller";
import {
  listMyAttempts,
  submitQuizSubmission,
} from "../controllers/quiz-submission.controller";
import { requireAuth } from "../middleware/authenticate";
import {
  progressMutationRateLimiter,
  quizSubmitRateLimiter,
} from "../middleware/rateLimiter";

/** Test-injectable rate limits for the Phase 5 endpoints. */
export interface ProgressRouterRateLimits {
  quizSubmit?: { windowMs: number; max: number };
  progressMutation?: { windowMs: number; max: number };
}

/**
 * User-scoped business router (Phase 5): /me/profile, /me/progress,
 * /me/quiz. EVERY route runs behind requireAuth — the sub-router applies it
 * once so there is no unauthenticated variant of any /me endpoint.
 *
 * Rate limits: submissions persist a graded attempt each (tight cap), and
 * progress mutations (start/reset) get a lighter cap. Reads are unlimited
 * relative to those (cheap single-user queries), matching the auth router's
 * philosophy of limiting only credential-affecting writes.
 */
export function createProgressRouter(rateLimits?: ProgressRouterRateLimits): Router {
  const router = Router();

  router.use(requireAuth);

  // --- Profile & progress ---------------------------------------------------
  router.get("/me/profile", getMyProfile);
  router.get("/me/progress", getProgressOverview);
  router.post(
    "/me/progress/:moduleId/start",
    progressMutationRateLimiter(rateLimits?.progressMutation),
    startMyModule
  );
  router.post(
    "/me/progress/reset",
    progressMutationRateLimiter(rateLimits?.progressMutation),
    resetMyProgress
  );

  // --- Quiz submissions & attempt history ----------------------------------
  router.post(
    "/me/quiz/submissions",
    quizSubmitRateLimiter(rateLimits?.quizSubmit),
    submitQuizSubmission
  );
  router.get("/me/quiz/attempts", listMyAttempts);

  return router;
}
