import type { RequestHandler } from "express";
import { slugParam } from "../lib/params";
import {
  composeProgressOverview,
  composeUserProfile,
  resetProgress,
  startModule,
} from "../services/progress.service";

/**
 * User-scoped progress/profile controllers (Phase 5).
 *
 * Mounted behind `requireAuth`: the caller identity ALWAYS comes from
 * `req.authContext` (resolved by the middleware from the validated Session
 * row). Body/query fields are never consulted for identity, so no client
 * input can ever address another user's progress. All payloads are composed
 * and contract-parsed by the progress service; controllers validate route
 * params and forward failures to the central error handler.
 */

/** GET /me/profile — real user profile (identity + derived activity). */
export const getMyProfile: RequestHandler = async (req, res, next) => {
  try {
    res.json(await composeUserProfile(req.authContext!.userId));
  } catch (error) {
    next(error);
  }
};

/** GET /me/progress — whole-map progress overview (all modules). */
export const getProgressOverview: RequestHandler = async (req, res, next) => {
  try {
    res.json(await composeProgressOverview(req.authContext!.userId));
  } catch (error) {
    next(error);
  }
};

/** POST /me/progress/:moduleId/start — record engagement (locked -> 403). */
export const startMyModule: RequestHandler = async (req, res, next) => {
  try {
    const moduleId = slugParam(req, "moduleId");
    if (!moduleId) {
      res.status(400).json({ error: "Invalid module id" });
      return;
    }
    res.json(await startModule(req.authContext!.userId, moduleId));
  } catch (error) {
    next(error);
  }
};

/** POST /me/progress/reset — wipe own progress rows, fresh profile back. */
export const resetMyProgress: RequestHandler = async (req, res, next) => {
  try {
    res.json(await resetProgress(req.authContext!.userId));
  } catch (error) {
    next(error);
  }
};
