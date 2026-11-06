import { Router } from "express";
import {
  getTrack,
  getTrackModule,
  getTrackModules,
  getTracks,
} from "../controllers/tracks.controller";
import { getQuizQuestions } from "../controllers/quiz.controller";

/**
 * /tracks* — public, read-only learning content (Phase 4).
 *
 * The server composes PostgreSQL rows (existence, ids, relationships and
 * ordering) with shared/curriculum editorial content, and answers through the
 * shared contracts in @devpulse/contracts. Content is not user-scoped, so
 * these reads are public; user-scoped learning features (progress, quiz
 * submission) mount requireAuth in their own routers in later phases.
 */
export const curriculumRoutes = Router();

curriculumRoutes.get("/tracks", getTracks);
curriculumRoutes.get("/tracks/:slug", getTrack);
curriculumRoutes.get("/tracks/:trackSlug/modules", getTrackModules);
curriculumRoutes.get("/tracks/:trackSlug/modules/:moduleSlug", getTrackModule);
curriculumRoutes.get("/tracks/:trackSlug/modules/:moduleSlug/quiz", getQuizQuestions);
