import {
  ModuleDetailSchema,
  ModuleListItemSchema,
  TrackDetailSchema,
  TrackListSchema,
} from "@devpulse/contracts";
import type {
  ModuleDetail,
  ModuleListItem,
  ModuleMeta,
  TrackDetail,
  TrackList,
} from "@devpulse/contracts";
import { TRACKS } from "@devpulse/curriculum";
import type { Module } from "@prisma/client";
import { HttpError } from "../middleware/errorHandler";
import { quizRepository } from "../repositories/quiz.repository";
import {
  trackRepository,
  type TrackWithModules,
} from "../repositories/track.repository";

/**
 * Curriculum service (Phase 4) — composes the two sources of truth:
 *
 *  - PostgreSQL (repositories): track/module existence, ids, relationships
 *    and ordering. These fields ALWAYS come from the rows.
 *  - shared/curriculum (TRACKS): editorial display content (descriptions,
 *    levels, minutes, outcomes, media).
 *
 * Shared contracts (@devpulse/contracts) are the single answer to "what may
 * this endpoint return": every composed payload is parsed through its schema
 * before it reaches a controller. Latent shape drift therefore fails closed
 * as a 500 envelope instead of leaking malformed data.
 *
 * Drift guard: a database row without a matching curriculum entry (or a count
 * mismatch) is a server fault — logged with the offending id and answered as
 * a generic 500. Content is never silently omitted and responses are never
 * partially composed.
 */

const CURRICULUM_DRIFT_MESSAGE = "Curriculum content is unavailable";

const curriculumTrackById = new Map(TRACKS.map((track) => [track.id, track]));
const curriculumModuleById = new Map(
  TRACKS.flatMap((track) => track.modules).map((module) => [module.id, module])
);

function requireTrackContent(trackId: string) {
  const content = curriculumTrackById.get(trackId);
  if (!content) {
    console.error(`Curriculum drift: track "${trackId}" has no curriculum entry`);
    throw new HttpError(500, CURRICULUM_DRIFT_MESSAGE);
  }
  return content;
}

function requireModuleContent(moduleId: string) {
  const content = curriculumModuleById.get(moduleId);
  if (!content) {
    console.error(`Curriculum drift: module "${moduleId}" has no curriculum entry`);
    throw new HttpError(500, CURRICULUM_DRIFT_MESSAGE);
  }
  return content;
}

/** Reader payload: full editorial module anchored to DB identity + ordering. */
function composeModuleMeta(moduleRow: Module, trackSlug: string): ModuleMeta {
  const content = requireModuleContent(moduleRow.id);
  return {
    ...content,
    slug: moduleRow.slug,
    trackId: moduleRow.trackId,
    trackSlug,
    order: moduleRow.position,
  };
}

/** Light module card (track listing + hub consumer): counts come from DB. */
function composeModuleListItem(
  moduleRow: Module,
  trackSlug: string,
  quizQuestionCount: number
): ModuleListItem {
  const content = requireModuleContent(moduleRow.id);
  return {
    id: moduleRow.id,
    slug: moduleRow.slug,
    trackId: moduleRow.trackId,
    trackSlug,
    title: content.title,
    description: content.description,
    order: moduleRow.position,
    level: content.level,
    estimatedMinutes: content.estimatedMinutes,
    hasGitVisualizer: content.hasGitVisualizer ?? false,
    quizQuestionCount,
  };
}

function composeTrack(trackRow: TrackWithModules): TrackDetail {
  const content = requireTrackContent(trackRow.id);

  if (content.moduleCount !== trackRow.modules.length) {
    console.error(
      `Curriculum drift: track "${trackRow.id}" has ${trackRow.modules.length} module rows, ` +
        `curriculum declares ${content.moduleCount}`
    );
    throw new HttpError(500, CURRICULUM_DRIFT_MESSAGE);
  }

  return {
    ...content,
    slug: trackRow.slug,
    trackNumber: trackRow.position,
    title: trackRow.title,
    modules: trackRow.modules.map((moduleRow) =>
      composeModuleMeta(moduleRow, trackRow.slug)
    ),
  };
}

/** GET /tracks */
export const listTracks = async (): Promise<TrackList> => {
  const rows = await trackRepository.listTracks();
  return TrackListSchema.parse(rows.map((trackRow) => composeTrack(trackRow)));
};

/** GET /tracks/:slug */
export const getTrackBySlug = async (slug: string): Promise<TrackDetail> => {
  const trackRow = await trackRepository.findTrackBySlug(slug);
  if (!trackRow) {
    throw new HttpError(404, "Track not found");
  }
  return TrackDetailSchema.parse(composeTrack(trackRow));
};

/** GET /tracks/:trackSlug/modules */
export const listModulesByTrack = async (trackSlug: string): Promise<ModuleListItem[]> => {
  const trackRow = await trackRepository.findTrackBySlug(trackSlug);
  if (!trackRow) {
    throw new HttpError(404, "Track not found");
  }

  const counts = await quizRepository.countQuestionsByModuleIds(
    trackRow.modules.map((moduleRow) => moduleRow.id)
  );

  return ModuleListItemSchema.array().parse(
    trackRow.modules.map((moduleRow) =>
      composeModuleListItem(moduleRow, trackRow.slug, counts[moduleRow.id] ?? 0)
    )
  );
};

/** GET /tracks/:trackSlug/modules/:moduleSlug */
export const getModuleDetail = async (
  trackSlug: string,
  moduleSlug: string
): Promise<ModuleDetail> => {
  const moduleRow = await trackRepository.findModuleByTrackAndSlugs(trackSlug, moduleSlug);
  if (!moduleRow) {
    // Also covers "module exists in another track" — no relationship info
    // is disclosed either way.
    throw new HttpError(404, "Module not found");
  }

  const counts = await quizRepository.countQuestionsByModuleIds([moduleRow.id]);

  return ModuleDetailSchema.parse({
    ...composeModuleMeta(moduleRow, moduleRow.track.slug),
    quizQuestionCount: counts[moduleRow.id] ?? 0,
  });
};
