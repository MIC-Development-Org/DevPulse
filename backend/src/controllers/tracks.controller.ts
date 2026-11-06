import type { RequestHandler } from "express";
import { slugParam } from "../lib/params";
import {
  getModuleDetail,
  getTrackBySlug,
  listModulesByTrack,
  listTracks,
} from "../services/curriculum.service";

/**
 * Track/module controllers (Phase 4). All payloads come from the curriculum
 * and quiz services (already contract-validated); controllers only validate
 * route params and forward failures to the central error handler.
 */

/** GET /tracks — all tracks with nested modules (one round trip). */
export const getTracks: RequestHandler = async (_req, res, next) => {
  try {
    res.json(await listTracks());
  } catch (error) {
    next(error);
  }
};

/** GET /tracks/:slug */
export const getTrack: RequestHandler = async (req, res, next) => {
  try {
    const slug = slugParam(req, "slug");
    if (!slug) {
      res.status(400).json({ error: "Invalid track slug" });
      return;
    }
    res.json(await getTrackBySlug(slug));
  } catch (error) {
    next(error);
  }
};

/** GET /tracks/:trackSlug/modules */
export const getTrackModules: RequestHandler = async (req, res, next) => {
  try {
    const trackSlug = slugParam(req, "trackSlug");
    if (!trackSlug) {
      res.status(400).json({ error: "Invalid track slug" });
      return;
    }
    res.json(await listModulesByTrack(trackSlug));
  } catch (error) {
    next(error);
  }
};

/** GET /tracks/:trackSlug/modules/:moduleSlug */
export const getTrackModule: RequestHandler = async (req, res, next) => {
  try {
    const trackSlug = slugParam(req, "trackSlug");
    const moduleSlug = slugParam(req, "moduleSlug");
    if (!trackSlug || !moduleSlug) {
      res.status(400).json({ error: "Invalid track or module slug" });
      return;
    }
    res.json(await getModuleDetail(trackSlug, moduleSlug));
  } catch (error) {
    next(error);
  }
};
