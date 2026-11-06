import {
  ModuleProgressEntrySchema,
  ProgressOverviewSchema,
  UserProfileSchema,
} from "@devpulse/contracts";
import type {
  ModuleProgressEntry,
  ProgressOverview,
  UserProfile,
} from "@devpulse/contracts";
import { BADGES } from "@devpulse/curriculum";
import type { Module, UserModuleProgress } from "@prisma/client";
import { HttpError } from "../middleware/errorHandler";
import { prisma } from "../lib/prisma";
import { quizRepository } from "../repositories/quiz.repository";
import { progressRepository } from "../repositories/progress.repository";
import {
  trackRepository,
  type ModuleWithTrack,
  type TrackWithModules,
} from "../repositories/track.repository";

/**
 * Progress service (Phase 5) — user-scoped learning state composition.
 *
 * APPROVED RULES (D1/D2/D4, no new status):
 *  - The first module of every track is unlocked for every user.
 *  - A module is unlocked when every EARLIER BANKED module in the same track
 *    is COMPLETED. Unbanked modules (no authored quiz bank) are SKIPPED by
 *    the chain so they can never permanently block a track — but they are
 *    never marked COMPLETED either.
 *  - Modules become COMPLETED exclusively through a passing attempt
 *    (percentage >= module.passThreshold). Opening content never completes.
 *  - Start (POST /me/progress/:moduleId/start) records engagement: the row
 *    is created as UNLOCKED on first touch, later touches merely refresh the
 *    activity timestamp. Locked modules are rejected with 403.
 *  - Streak/weekly activity are DERIVED from persisted events (attempt
 *    createdAt + progress createdAt/updatedAt/completedAt) as UTC days.
 *    No fabricated activity, ever.
 *
 * Identity: every function takes the userId that requireAuth resolved from
 * the validated Session row — never from request bodies or query strings.
 */

const DAY_MS = 86_400_000;
const ACTIVITY_WINDOW_DAYS = 112; // 16 weeks, matches the heatmap granularity.

/** Deterministic neutral avatar (inline SVG; no external calls, no fake photos). */
export function defaultAvatarUrl(initial: string): string {
  const letter = (initial || "d").toUpperCase().slice(0, 1);
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96">` +
    `<rect width="96" height="96" fill="#134e4a"/>` +
    `<circle cx="48" cy="38" r="17" fill="#5eead4"/>` +
    `<path d="M12 96 C12 66 30 57 48 57 C66 57 84 66 84 96 Z" fill="#2dd4bf"/>` +
    `<text x="48" y="44" font-family="sans-serif" font-weight="700" font-size="16" ` +
    `fill="#134e4a" text-anchor="middle">${letter}</text>` +
    `</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

// ---------------------------------------------------------------------------
// Pure date/activity helpers (exported for unit tests)
// ---------------------------------------------------------------------------

/** UTC calendar-day key, e.g. "2026-11-06". */
export function utcIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Activity intensity 0..4 for a day's persisted-event count. */
export function activityIntensityFor(eventCount: number): 0 | 1 | 2 | 3 | 4 {
  if (eventCount <= 0) return 0;
  if (eventCount === 1) return 1;
  if (eventCount <= 3) return 2;
  if (eventCount <= 6) return 3;
  return 4;
}

/**
 * Current streak in consecutive UTC days. The run must end today or
 * yesterday (one-day grace is standard practice); otherwise it is broken
 * and the streak reads 0.
 */
export function computeStreakDays(eventDates: Date[], now: Date = new Date()): number {
  const daySet = new Set(eventDates.map(utcIsoDate));
  if (daySet.size === 0) return 0;

  const today = utcIsoDate(now);
  const yesterday = utcIsoDate(new Date(now.getTime() - DAY_MS));
  if (!daySet.has(today) && !daySet.has(yesterday)) return 0;

  let cursor = new Date(`${daySet.has(today) ? today : yesterday}T00:00:00.000Z`);
  let streak = 0;
  while (daySet.has(utcIsoDate(cursor))) {
    streak += 1;
    cursor = new Date(cursor.getTime() - DAY_MS);
  }
  return streak;
}

/** 112-day activity record keyed by UTC ISO date (missing days = intensity 0). */
export function deriveActivityWindow(
  eventDates: Date[],
  now: Date = new Date()
): Record<string, number> {
  const perDay = new Map<string, number>();
  for (const date of eventDates) {
    const key = utcIsoDate(date);
    perDay.set(key, (perDay.get(key) ?? 0) + 1);
  }

  const record: Record<string, number> = {};
  const cursor = new Date(now.getTime() - (ACTIVITY_WINDOW_DAYS - 1) * DAY_MS);
  while (utcIsoDate(cursor) <= utcIsoDate(now)) {
    const key = utcIsoDate(cursor);
    record[key] = activityIntensityFor(perDay.get(key) ?? 0);
    cursor.setTime(cursor.getTime() + DAY_MS);
  }
  return record;
}

// ---------------------------------------------------------------------------
// Unlock chain (D2)
// ---------------------------------------------------------------------------

export type UnlockChain = {
  /** Modules of one track, ordered by position. */
  trackModules: Module[];
  /** Module ids that DO have an authored quiz bank (chain participants). */
  bankedIds: Set<string>;
  /** Module ids recorded COMPLETED for the user. */
  completedIds: Set<string>;
};

/**
 * A module is unlocked when it is COMPLETED, or when every earlier BANKED
 * module in its track is COMPLETED. Unbanked modules are skipped (bridge),
 * so a track stub never blocks later banked modules; first modules always
 * unlock because no earlier banked chain exists.
 */
export function isModuleUnlockedByChain(chain: UnlockChain, moduleId: string): boolean {
  if (chain.completedIds.has(moduleId)) return true;

  let allEarlierBankedCompleted = true;
  for (const moduleRow of chain.trackModules) {
    if (moduleRow.id === moduleId) break;
    if (!chain.bankedIds.has(moduleRow.id)) continue;
    if (!chain.completedIds.has(moduleRow.id)) {
      allEarlierBankedCompleted = false;
      break;
    }
  }
  return allEarlierBankedCompleted;
}

const PROGRESS_LOCKED_MESSAGE = "Complete the previous module to unlock this one.";

/** DB-backed unlock evaluation for one module; throws 403 when locked. */
export async function assertModuleUnlockedFor(
  userId: string,
  moduleRow: ModuleWithTrack
): Promise<void> {
  const trackRow = await trackRepository.findTrackById(moduleRow.trackId);
  if (!trackRow) {
    console.error(`Progress drift: module "${moduleRow.id}" has no track row`);
    throw new HttpError(500, "Progress data is unavailable");
  }

  const [progressRows, bankCounts] = await Promise.all([
    progressRepository.listByUser(userId),
    quizRepository.countQuestionsByModuleIds(trackRow.modules.map((m) => m.id)),
  ]);

  const chain: UnlockChain = {
    trackModules: trackRow.modules,
    bankedIds: new Set(
      trackRow.modules.filter((m) => (bankCounts[m.id] ?? 0) > 0).map((m) => m.id)
    ),
    completedIds: new Set(
      progressRows.filter((row) => row.status === "COMPLETED").map((row) => row.moduleId)
    ),
  };

  if (!isModuleUnlockedByChain(chain, moduleRow.id)) {
    throw new HttpError(403, PROGRESS_LOCKED_MESSAGE);
  }
}

// ---------------------------------------------------------------------------
// Shared composition sources (profile + overview read the same tables)
// ---------------------------------------------------------------------------

interface ProfileSources {
  tracks: TrackWithModules[];
  progressRows: UserModuleProgress[];
  /** Best percentage + attempt count per module (attempt rows aggregate). */
  aggregates: Map<string, { best: number | null; count: number }>;
  /** Module -> authored question count (0 = unbanked bridge). */
  bankCounts: Record<string, number>;
  /** Attempt activity timestamps for streak/window derivation. */
  attemptDates: Date[];
}

async function loadProfileSources(userId: string): Promise<ProfileSources> {
  const [tracks, progressRows, aggregates, attemptTimestamps] = await Promise.all([
    trackRepository.listTracks(),
    progressRepository.listByUser(userId),
    quizRepository.aggregateBestScores(userId),
    quizRepository.listAttemptTimestamps(userId),
  ]);

  const counts = await quizRepository.countQuestionsByModuleIds(
    tracks.flatMap((track) => track.modules.map((m) => m.id))
  );

  return {
    tracks,
    progressRows,
    aggregates: new Map(aggregates.map((a) => [a.moduleId, a])),
    bankCounts: counts,
    attemptDates: attemptTimestamps.map((row) => row.createdAt),
  };
}

/** Ordered module list across all tracks (track position, then module). */
function orderedModules(sources: ProfileSources): Module[] {
  return sources.tracks.flatMap((track) => track.modules);
}

/** Progress rows keyed by moduleId (small — max one row per user+module). */
function progressByModule(sources: ProfileSources): Map<string, UserModuleProgress> {
  return new Map(sources.progressRows.map((row) => [row.moduleId, row]));
}

/**
 * Unlock chains are evaluated PER TRACK (D2: no global cross-track
 * ordering). This indexer keys each track's modules; every  unlock decision
 * looks up the target module's OWN track so an unfinished banked module in
 * one track can never block another track's modules.
 */
function chainsByTrack(sources: ProfileSources): Map<string, UnlockChain> {
  const chainByTrack = new Map<string, UnlockChain>();
  for (const track of sources.tracks) {
    chainByTrack.set(track.id, buildUnlockChain(sources, track.modules));
  }
  return chainByTrack;
}

function buildUnlockChain(sources: ProfileSources, modules: Module[]): UnlockChain {
  return {
    trackModules: modules,
    bankedIds: new Set(
      modules.filter((m) => (sources.bankCounts[m.id] ?? 0) > 0).map((m) => m.id)
    ),
    completedIds: new Set(
      sources.progressRows
        .filter((row) => row.status === "COMPLETED")
        .map((row) => row.moduleId)
    ),
  };
}

/** All persisted activity timestamps (attempts + progress row touches). */
function activityEventDates(
  sources: ProfileSources,
  rowsByModule: Map<string, UserModuleProgress>
): Date[] {
  const events = [...sources.attemptDates];
  for (const row of rowsByModule.values()) {
    events.push(row.createdAt, row.updatedAt);
    if (row.completedAt) events.push(row.completedAt);
  }
  return events;
}

// ---------------------------------------------------------------------------
// GET /me/progress — overview
// ---------------------------------------------------------------------------

function buildEntries(sources: ProfileSources): ModuleProgressEntry[] {
  const modules = orderedModules(sources);
  const rowsByModule = progressByModule(sources);
  const chainByTrack = chainsByTrack(sources);
  const completedIds = new Set(
    sources.progressRows.filter((row) => row.status === "COMPLETED").map((row) => row.moduleId)
  );

  return modules.map((moduleRow) => {
    const stored = rowsByModule.get(moduleRow.id) ?? null;
    const aggregate = sources.aggregates.get(moduleRow.id);
    const status = completedIds.has(moduleRow.id)
      ? ("COMPLETED" as const)
      : isModuleUnlockedByChain(chainByTrack.get(moduleRow.trackId)!, moduleRow.id)
        ? ("UNLOCKED" as const)
        : ("LOCKED" as const);

    return ModuleProgressEntrySchema.parse({
      moduleId: moduleRow.id,
      status,
      bestScore: aggregate?.best ?? stored?.bestScore ?? null,
      completedAt: stored?.completedAt ? stored.completedAt.toISOString() : null,
      attemptCount: aggregate?.count ?? 0,
      updatedAt: stored ? stored.updatedAt.toISOString() : null,
    });
  });
}

/** GET /me/progress — contract-validated whole-map overview. */
export async function composeProgressOverview(userId: string): Promise<ProgressOverview> {
  const sources = await loadProfileSources(userId);
  return ProgressOverviewSchema.parse({
    entries: buildEntries(sources),
    generatedAt: new Date().toISOString(),
  });
}

// ---------------------------------------------------------------------------
// GET /me/profile — identity + derived activity + static badge catalog
// ---------------------------------------------------------------------------

export async function composeUserProfile(userId: string): Promise<UserProfile> {
  const sources = await loadProfileSources(userId);
  const modules = orderedModules(sources);
  const rowsByModule = progressByModule(sources);
  const chainByTrack = chainsByTrack(sources);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, username: true, email: true, image: true },
  });
  if (!user) {
    // Session validated but the user row vanished mid-flight: fail closed.
    throw new HttpError(500, "Progress data is unavailable");
  }

  const completedModuleIds = modules
    .filter((m) =>
      sources.progressRows.some(
        (row) => row.moduleId === m.id && row.status === "COMPLETED"
      )
    )
    .map((m) => m.id);
  const unlockedModuleIds = modules
    .filter((m) => isModuleUnlockedByChain(chainByTrack.get(m.trackId)!, m.id))
    .map((m) => m.id);
  const currentModuleId =
    modules.find((m) => unlockedModuleIds.includes(m.id) && !completedModuleIds.includes(m.id))
      ?.id ?? "";

  const quizScores: Record<string, number> = {};
  for (const [moduleId, aggregate] of sources.aggregates) {
    if (aggregate.best !== null) quizScores[moduleId] = aggregate.best;
  }

  const eventDates = activityEventDates(sources, rowsByModule);
  const emailLocalPart = user.email ? user.email.split("@")[0] : "learner";

  // Genesis badge is the single mechanically derivable unlock (D4): dated by
  // the user's FIRST completed module; every other badge stays locked until
  // its gamification rule ships in a later phase. No invented unlock dates.
  const firstCompletedAt = sources.progressRows
    .filter((row) => row.status === "COMPLETED" && row.completedAt !== null)
    .map((row) => row.completedAt as Date)
    .sort((a, b) => a.getTime() - b.getTime())[0];
  const badges = BADGES.map((badge) =>
    badge.id === "badge-genesis" && firstCompletedAt
      ? { ...badge, unlockedAt: firstCompletedAt.toISOString() }
      : badge
  );

  return UserProfileSchema.parse({
    id: user.id,
    name: user.name ?? emailLocalPart,
    username: user.username ?? emailLocalPart,
    email: user.email ?? "",
    avatarUrl: user.image ?? defaultAvatarUrl(user.name ?? emailLocalPart),
    streakDays: computeStreakDays(eventDates),
    completedModuleIds,
    unlockedModuleIds,
    currentModuleId,
    quizScores,
    weeklyActivity: deriveActivityWindow(eventDates),
    badges,
  });
}

// ---------------------------------------------------------------------------
// POST /me/progress/:moduleId/start
// ---------------------------------------------------------------------------

/**
 * Records engagement with an UNLOCKED module. Locked (403) and unknown
 * (404) modules are rejected; an existing row is merely touched (idempotent
 * start — status/bestScore/completedAt are preserved). Returns the fresh
 * entry for the addressed module.
 */
export async function startModule(
  userId: string,
  moduleId: string
): Promise<ModuleProgressEntry> {
  const moduleRow = await trackRepository.findModuleById(moduleId);
  if (!moduleRow) {
    throw new HttpError(404, "Module not found");
  }

  await assertModuleUnlockedFor(userId, moduleRow);
  await progressRepository.touchOrStart(userId, moduleRow.id);

  const overview = await composeProgressOverview(userId);
  const entry = overview.entries.find((candidate) => candidate.moduleId === moduleRow.id);
  if (!entry) {
    throw new HttpError(500, "Progress data is unavailable");
  }
  return entry;
}

// ---------------------------------------------------------------------------
// POST /me/progress/reset
// ---------------------------------------------------------------------------

/**
 * Clears the calling user's progress rows and attempt rows in one
 * transaction, then returns the freshly recomputed (empty) profile.
 * Notes/streak XP live client-side and are handled by the BFF callers.
 */
export async function resetProgress(userId: string): Promise<UserProfile> {
  await prisma.$transaction(async (tx) => {
    await quizRepository.deleteAttemptsForUser(userId, tx);
    await progressRepository.deleteForUser(userId, tx);
  });
  return composeUserProfile(userId);
}
