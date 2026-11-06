import type { Module, Track } from "@prisma/client";
import { prisma } from "../lib/prisma";

/** Track row joined with its modules; both sides in deterministic order. */
export type TrackWithModules = Track & { modules: Module[] };

/** Module row joined with its parent track. */
export type ModuleWithTrack = Module & { track: Track };

/**
 * Data-access layer for tracks and modules (Phase 4).
 *
 * Every list query sorts by the database `position` column — HTTP responses
 * must never depend on insertion order or content-package iteration order.
 */
export const trackRepository = {
  /** All tracks with nested modules (single round trip for the hub payloads). */
  listTracks: async (): Promise<TrackWithModules[]> =>
    prisma.track.findMany({
      orderBy: { position: "asc" },
      include: { modules: { orderBy: { position: "asc" } } },
    }),

  findTrackBySlug: async (slug: string): Promise<TrackWithModules | null> =>
    prisma.track.findUnique({
      where: { slug },
      include: { modules: { orderBy: { position: "asc" } } },
    }),

  /** Modules are only addressable through their track (404 on mismatch). */
  findModuleByTrackAndSlugs: async (
    trackSlug: string,
    moduleSlug: string
  ): Promise<ModuleWithTrack | null> =>
    prisma.module.findFirst({
      where: { slug: moduleSlug, track: { slug: trackSlug } },
      include: { track: true },
    }),
};
