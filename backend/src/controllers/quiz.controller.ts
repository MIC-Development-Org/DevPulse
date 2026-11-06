import type { RequestHandler } from "express";
import { slugParam } from "../lib/params";
import { listPublicQuizQuestions } from "../services/quiz.service";

/**
 * GET /tracks/:trackSlug/modules/:moduleSlug/quiz — public questions only.
 * Grading truth (correctOptionIndex/explanation) never leaves the service
 * layer; this controller has no visibility into it by construction.
 */
export const getQuizQuestions: RequestHandler = async (req, res, next) => {
  try {
    const trackSlug = slugParam(req, "trackSlug");
    const moduleSlug = slugParam(req, "moduleSlug");
    if (!trackSlug || !moduleSlug) {
      res.status(400).json({ error: "Invalid track or module slug" });
      return;
    }
    res.json(await listPublicQuizQuestions(trackSlug, moduleSlug));
  } catch (error) {
    next(error);
  }
};
