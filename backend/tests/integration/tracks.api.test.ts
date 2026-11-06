import request from "supertest";
import { afterAll, afterEach, describe, expect, it, vi } from "vitest";
import { QUIZ_BANKS, TRACKS } from "@devpulse/curriculum";
import {
  ModuleDetailSchema,
  ModuleListItemSchema,
  PublicQuizQuestionListSchema,
  TrackDetailSchema,
  TrackListSchema,
} from "@devpulse/contracts";
import { createApp } from "../../src/app";
import { prisma } from "../../src/lib/prisma";
import { quizRepository } from "../../src/repositories/quiz.repository";
import { trackRepository } from "../../src/repositories/track.repository";

/**
 * Phase 4 learning-content API integration tests.
 *
 * Runs against the real seeded Postgres volume (3 tracks / 23 modules / 18
 * persisted quiz questions). The suite is read-only for HTTP fixtures — the
 * database failure and empty-list shapes are produced with repository spies
 * that are undone between tests.
 */

const app = createApp();

const orderedTracks = [...TRACKS].sort((a, b) => a.trackNumber - b.trackNumber);

const gitBank = QUIZ_BANKS["mod-0-5"];
const fiberBank = QUIZ_BANKS["mod-1-3"];
if (!gitBank || !fiberBank) {
  throw new Error("authored quiz banks missing from shared/curriculum");
}

const trackForModule = (moduleId: string) =>
  orderedTracks.find((track) => track.modules.some((module) => module.id === moduleId))!;
const gitTrack = trackForModule("mod-0-5");
const gitModule = gitTrack.modules.find((module) => module.id === "mod-0-5")!;
const otherTrack = orderedTracks.find((track) => track.id !== gitTrack.id)!;
const firstGitModule = [...gitTrack.modules].sort((a, b) => a.order - b.order)[0]!;

afterEach(() => {
  vi.restoreAllMocks();
});

afterAll(async () => {
  await prisma.$disconnect();
});

// ---------------------------------------------------------------------------
// GET /tracks
// ---------------------------------------------------------------------------

describe("GET /tracks", () => {
  it("lists 3 tracks in trackNumber order and satisfies the shared contract", async () => {
    const res = await request(app).get("/tracks");

    expect(res.status).toBe(200);
    expect(() => TrackListSchema.parse(res.body)).not.toThrow();
    expect(res.body).toHaveLength(orderedTracks.length);
    expect(res.body.map((track: { trackNumber: number }) => track.trackNumber)).toEqual(
      orderedTracks.map((track) => track.trackNumber)
    );
    expect(res.body.map((track: { slug: string }) => track.slug)).toEqual(
      orderedTracks.map((track) => track.slug)
    );
    expect(res.body.every((track: { moduleCount: number; modules: unknown[] }) =>
      track.moduleCount === track.modules.length
    )).toBe(true);
  });

  it("returns nested modules ordered by their database position", async () => {
    const res = await request(app).get("/tracks");

    const firstTrack = res.body[0];
    expect(firstTrack.modules.length).toBeGreaterThan(0);
    expect(firstTrack.modules.map((m: { order: number }) => m.order)).toEqual(
      firstTrack.modules
        .map((m: { order: number }) => m.order)
        .sort((a: number, b: number) => a - b)
    );

    // Whole corpus preserved: 23 modules across all tracks.
    const totalModules = res.body.reduce(
      (sum: number, track: { modules: unknown[] }) => sum + track.modules.length,
      0
    );
    expect(totalModules).toBe(23);

    // DB anchoring: nested ids/slugs are database rows, not content lookups.
    const firstModule = firstTrack.modules[0];
    const dbRow = await prisma.module.findUnique({ where: { id: firstModule.id } });
    expect(dbRow?.slug).toBe(firstModule.slug);
    expect(dbRow?.position).toBe(firstModule.order);
  });

  it("answers a generic 500 envelope when the database fails", async () => {
    vi.spyOn(trackRepository, "listTracks").mockRejectedValueOnce(new Error("db down"));
    const res = await request(app).get("/tracks");

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: "Internal server error" });
  });

  it("renders an empty track list when the database holds none", async () => {
    vi.spyOn(trackRepository, "listTracks").mockResolvedValueOnce([]);
    const res = await request(app).get("/tracks");

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// GET /tracks/:slug
// ---------------------------------------------------------------------------

describe("GET /tracks/:slug", () => {
  it("returns the requested track as a validated contract payload", async () => {
    const res = await request(app).get(`/tracks/${gitTrack.slug}`);

    expect(res.status).toBe(200);
    expect(() => TrackDetailSchema.parse(res.body)).not.toThrow();
    expect(res.body.id).toBe(gitTrack.id);
    expect(res.body.slug).toBe(gitTrack.slug);
    expect(res.body.trackNumber).toBe(gitTrack.trackNumber);
    expect(res.body.modules).toHaveLength(gitTrack.modules.length);
  });

  it("answers 404 with the standardized envelope for unknown tracks", async () => {
    const res = await request(app).get("/tracks/does-not-exist");

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: "Track not found" });
  });

  it("rejects malformed slugs with a 400 before hitting the database", async () => {
    const res = await request(app).get("/tracks/Not_A_Slug");

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: "Invalid track slug" });
    expect(res.body.error).not.toContain("Not_A_Slug");
  });
});

// ---------------------------------------------------------------------------
// GET /tracks/:trackSlug/modules
// ---------------------------------------------------------------------------

describe("GET /tracks/:trackSlug/modules", () => {
  it("lists the track's modules with DB counters and contract shape", async () => {
    const res = await request(app).get(`/tracks/${gitTrack.slug}/modules`);

    expect(res.status).toBe(200);
    expect(() => ModuleListItemSchema.array().parse(res.body)).not.toThrow();
    expect(res.body.map((m: { order: number }) => m.order)).toEqual(
      res.body.map((m: { order: number }) => m.order).sort((a: number, b: number) => a - b)
    );
    expect(res.body.every((m: { trackSlug: string }) => m.trackSlug === gitTrack.slug)).toBe(true);

    const gitListItem = res.body.find((m: { id: string }) => m.id === "mod-0-5");
    expect(gitListItem.quizQuestionCount).toBe(gitBank.length);
    expect(gitListItem.slug).toBe(gitModule.slug);

    // Modules without an authored bank report exactly 0 — no placeholders.
    expect(firstGitModule.id in QUIZ_BANKS).toBe(false);
    const firstListItem = res.body.find((m: { id: string }) => m.id === firstGitModule.id);
    expect(firstListItem.quizQuestionCount).toBe(0);
  });

  it("answers 404 for unknown tracks", async () => {
    const res = await request(app).get("/tracks/does-not-exist/modules");
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: "Track not found" });
  });
});

// ---------------------------------------------------------------------------
// GET /tracks/:trackSlug/modules/:moduleSlug
// ---------------------------------------------------------------------------

describe("GET /tracks/:trackSlug/modules/:moduleSlug", () => {
  it("returns the full reader payload with DB ordering and quiz counter", async () => {
    const res = await request(app).get(
      `/tracks/${gitTrack.slug}/modules/${gitModule.slug}`
    );

    expect(res.status).toBe(200);
    expect(() => ModuleDetailSchema.parse(res.body)).not.toThrow();
    expect(res.body.id).toBe("mod-0-5");
    expect(res.body.slug).toBe(gitModule.slug);
    expect(res.body.trackId).toBe(gitTrack.id);
    expect(res.body.trackSlug).toBe(gitTrack.slug);
    expect(res.body.order).toBe(gitModule.order);
    expect(res.body.quizQuestionCount).toBe(gitBank.length);
  });

  it("answers 404 when the module belongs to a different track (no leak)", async () => {
    const res = await request(app).get(
      `/tracks/${otherTrack.slug}/modules/${gitModule.slug}`
    );

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: "Module not found" });
  });

  it("answers 404 for unknown modules", async () => {
    const res = await request(app).get(
      `/tracks/${gitTrack.slug}/modules/does-not-exist`
    );

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: "Module not found" });
  });

  it("answers 400 for malformed slugs", async () => {
    const res = await request(app).get(
      `/tracks/${gitTrack.slug}/modules/UPPER_case`
    );

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: "Invalid track or module slug" });
  });
});

// ---------------------------------------------------------------------------
// GET /tracks/:trackSlug/modules/:moduleSlug/quiz
// ---------------------------------------------------------------------------

describe("GET /tracks/:trackSlug/modules/:moduleSlug/quiz", () => {
  it("returns the public questions in authored order without answer keys", async () => {
    const res = await request(app).get(
      `/tracks/${gitTrack.slug}/modules/${gitModule.slug}/quiz`
    );

    expect(res.status).toBe(200);
    expect(() => PublicQuizQuestionListSchema.parse(res.body)).not.toThrow();
    expect(res.body).toHaveLength(gitBank.length);
    expect(res.body.map((q: { id: string }) => q.id)).toEqual(gitBank.map((q) => q.id));

    // Content parity (options are exactly the authored alternatives).
    expect(res.body.map((q: { options: string[] }) => q.options)).toEqual(
      gitBank.map((q) => q.options)
    );
    expect(res.body[0].hint).toBe(gitBank[0].hint);

    // CONTRACT SECURITY: grading truth may not appear anywhere in the body —
    // not as fields, not as keys, not as a value.
    const serialized = JSON.stringify(res.body);
    expect(serialized).not.toContain("correctOptionIndex");
    expect(serialized).not.toContain("explanation");
    expect(Object.keys(res.body[0]).sort()).toEqual(["hint", "id", "options", "question", "topic"]);
  });

  it("returns an empty list for modules without an authored bank", async () => {
    const res = await request(app).get(
      `/tracks/${gitTrack.slug}/modules/${firstGitModule.slug}/quiz`
    );

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it("answers 404 for unknown modules and mismatched track pairs", async () => {
    const unknown = await request(app).get(
      `/tracks/${gitTrack.slug}/modules/does-not-exist/quiz`
    );
    expect(unknown.status).toBe(404);
    expect(unknown.body).toEqual({ error: "Module not found" });

    const mismatched = await request(app).get(
      `/tracks/${otherTrack.slug}/modules/${gitModule.slug}/quiz`
    );
    expect(mismatched.status).toBe(404);
    expect(mismatched.body).toEqual({ error: "Module not found" });
  });

  it("answers a generic 500 envelope when the question store fails", async () => {
    vi.spyOn(quizRepository, "listQuestionsByModuleId").mockRejectedValueOnce(
      new Error("db down")
    );
    const res = await request(app).get(
      `/tracks/${gitTrack.slug}/modules/${gitModule.slug}/quiz`
    );

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: "Internal server error" });
  });
});
