import { randomUUID } from "node:crypto";
import request from "supertest";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import type { Module, QuizQuestion, Track } from "@prisma/client";
import {
  ProgressOverviewSchema,
  QuizAttemptHistorySchema,
  QuizResultSchema,
  UserProfileSchema,
} from "@devpulse/contracts";
import { createApp } from "../../src/app";
import { prisma } from "../../src/lib/prisma";
import { sessionRepository } from "../../src/repositories/session.repository";
import { quizRepository } from "../../src/repositories/quiz.repository";
import { progressRepository } from "../../src/repositories/progress.repository";
import {
  trackRepository,
  type TrackWithModules,
} from "../../src/repositories/track.repository";

/**
 * Phase 5 user-progress & grading integration tests.
 *
 * Runs against the real seeded Postgres volume (3 tracks / 23 modules / 18
 * banked questions). Every HTTP fixture is scoped to a RUN_ID user deleted
 * in afterAll (sessions, attempts, and progress rows cascade with users).
 * Grading expectations are derived from DATABASE rows (never from the shared
 * curriculum content) so the suite proves the persisted grading path.
 *
 * Approved rules covered here:
 *  - D1: identical 401 envelope on every /me endpoint (no anonymous variant).
 *  - D2: per-track unlock chain; unbanked modules never block; locked
 *    modules rejected by BOTH progress-start and submissions; first-banked
 *    modules are reachable by fresh users; pass unlocks the next module.
 *  - D3: grade over the full bank; unanswered = incorrect; empty -> 400;
 *    unknown/cross-module ids and bad option indexes -> 400; server-only
 *    scoring (client claims never trusted); no grading truth in responses.
 *  - D4: streak/weekly activity derived from persisted events (no fakes).
 *  - Persistence: one transaction writes attempt + progress; bestScore is
 *    the max; completedAt anchors to the FIRST pass; reset wipes own rows.
 */

const RUN_ID = `phase5it-${Date.now()}-${randomUUID().slice(0, 8)}`;

/**
 * Shared suite app with RELAXED limits so the many submissions of one file
 * never trip the production defaults; the dedicated rate-limit describe at
 * the bottom re-creates apps with the tight caps it asserts against.
 */
const app = createApp({
  rateLimits: {
    quizSubmit: { windowMs: 60_000, max: 500 },
    progressMutation: { windowMs: 60_000, max: 500 },
  },
});

let userCounter = 0;
const itEmail = () => `${RUN_ID}-${userCounter++}@example.com`;
const randToken = () =>
  `tok-${randomUUID().replaceAll("-", "")}${randomUUID().replaceAll("-", "")}`;

type User = Awaited<ReturnType<typeof prisma.user.create>>;
type Bearer = { Authorization: string };

async function makeUser(email = itEmail(), name = "Progress IT"): Promise<User> {
  return prisma.user.create({ data: { email, name, role: "USER" } });
}

async function makeSession(userId: string, expiresInMs = 3600_000) {
  return sessionRepository.create({
    sessionToken: randToken(),
    userId,
    expires: new Date(Date.now() + expiresInMs),
  });
}

async function newUser(name = "Progress IT"): Promise<{ user: User; bearer: Bearer }> {
  const user = await makeUser(undefined, name);
  const session = await makeSession(user.id);
  return { user, bearer: { Authorization: `Bearer ${session.sessionToken}` } };
}

const submit = (
  bearer: Bearer,
  moduleId: string,
  answers: Record<string, number>,
  appInstance: typeof app = app
) =>
  request(appInstance)
    .post("/me/quiz/submissions")
    .set(bearer)
    .send({ moduleId, answers });

// ---------------------------------------------------------------------------
// Geometry — resolved from DB rows once before the suite
// ---------------------------------------------------------------------------

let tracksDb: TrackWithModules[] = [];
let bankedIds: Set<string>;
let questionsByModule: Map<string, QuizQuestion[]>;
let gitModules: Module[]; // modules of the mod-0-5 track, ordered by position
let fiberModules: Module[]; // modules of the mod-1-3 track, ordered by position
let mod05: Module;
let expectedGitNextModuleId: string;

/** Modules a FRESH user may reach (no earlier banked module in their track). */
function freshUnlockedIds(track: Track, modulesOrdered: Module[]): string[] {
  let seenBanked = false;
  const unlocked: string[] = [];
  for (const moduleRow of modulesOrdered) {
    if (seenBanked) continue;
    unlocked.push(moduleRow.id);
    if (bankedIds.has(moduleRow.id)) seenBanked = true;
  }
  return unlocked;
}

/** Expected fresh-user unlocked id set across all tracks. */
const expectedFreshUnlocked = (): Set<string> =>
  new Set(
    tracksDb.flatMap((track) =>
      freshUnlockedIds(track, [...track.modules].sort((a, b) => a.position - b.position))
    )
  );

/** Expected topic tallies over the FULL bank for a validated submission. */
function expectedTopicBreakdown(
  questions: QuizQuestion[],
  answers: Record<string, number>
): { topic: string; correct: number; total: number; percentage: number }[] {
  const tally = new Map<string, { correct: number; total: number }>();
  for (const question of questions) {
    const entry = tally.get(question.topic) ?? { correct: 0, total: 0 };
    entry.total += 1;
    if (answers[question.id] === question.correctOptionIndex) entry.correct += 1;
    tally.set(question.topic, entry);
  }
  return [...tally.entries()].map(([topic, entry]) => ({
    topic,
    correct: entry.correct,
    total: entry.total,
    percentage: Math.round((entry.correct / entry.total) * 100),
  }));
}

const wrongAnswersOf = (questions: QuizQuestion[]): Record<string, number> =>
  Object.fromEntries(
    questions.map((question) => [
      question.id,
      (question.correctOptionIndex + 1) % (question.options as string[]).length,
    ])
  );

const correctAnswersOf = (questions: QuizQuestion[]): Record<string, number> =>
  Object.fromEntries(questions.map((question) => [question.id, question.correctOptionIndex]));

beforeAll(async () => {
  tracksDb = await trackRepository.listTracks();
  const questions = await prisma.quizQuestion.findMany({ orderBy: { position: "asc" } });
  bankedIds = new Set(questions.map((question) => question.moduleId));
  questionsByModule = new Map();
  for (const question of questions) {
    questionsByModule.set(question.moduleId, [
      ...(questionsByModule.get(question.moduleId) ?? []),
      question,
    ]);
  }

  const gitTrack = tracksDb.find((track) =>
    track.modules.some((m) => m.id === "mod-0-5")
  )!;
  const fiberTrack = tracksDb.find((track) =>
    track.modules.some((m) => m.id === "mod-1-3")
  )!;
  mod05 = gitTrack.modules.find((m) => m.id === "mod-0-5")!;
  gitModules = [...gitTrack.modules].sort((a, b) => a.position - b.position);
  fiberModules = [...fiberTrack.modules].sort((a, b) => a.position - b.position);
  expectedGitNextModuleId =
    gitModules.find((m) => m.position > mod05.position)?.id ?? null!;
});

afterEach(() => {
  vi.restoreAllMocks();
});

afterAll(async () => {
  // Attempts, progress rows, and sessions cascade with the user rows.
  await prisma.user.deleteMany({ where: { email: { contains: RUN_ID } } });
  await prisma.$disconnect();
});

const countAttempts = (userId: string) =>
  prisma.quizAttempt.count({ where: { userId } });

const countProgress = (userId: string) =>
  prisma.userModuleProgress.count({ where: { userId } });

const progressRow = (userId: string, moduleId: string) =>
  prisma.userModuleProgress.findUnique({
    where: { userId_moduleId: { userId, moduleId } },
  });

const entryOf = (
  body: {
    entries: {
      moduleId: string;
      status?: string;
      bestScore?: number | null;
      completedAt?: string | null;
      attemptCount?: number;
    }[];
  },
  moduleId: string
) => body.entries.find((entry) => entry.moduleId === moduleId)!;

/** Modules positioned AFTER a given module in the same track (ordered). */
const afterMod = (modules: Module[], position: number) =>
  modules.filter((m) => m.position > position);

// ---------------------------------------------------------------------------
// D1 — authentication gating: no anonymous variant of any /me endpoint
// ---------------------------------------------------------------------------

describe("/me/* authentication gating", () => {
  const endpoints: [string, "get" | "post"][] = [
    ["/me/profile", "get"],
    ["/me/progress", "get"],
    ["/me/progress/mod-0-1/start", "post"],
    ["/me/progress/reset", "post"],
    ["/me/quiz/submissions", "post"],
    ["/me/quiz/attempts", "get"],
  ];

  it("rejects every endpoint without a token with the same 401 body", async () => {
    for (const [path, method] of endpoints) {
      const res = await request(app)[method](path);
      expect(res.status).toBe(401);
      expect(res.body).toEqual({ error: "Unauthorized" });
    }
  });

  it("rejects garbage and expired tokens identically", async () => {
    for (const [path, method] of endpoints) {
      const garbage = await request(app)
        [method](path)
        .set("Authorization", `Bearer ${randToken()}`);
      expect(garbage.status).toBe(401);
      expect(garbage.body).toEqual({ error: "Unauthorized" });
    }

    const { user } = await newUser();
    const expired = await makeSession(user.id, -1000);
    const res = await request(app)
      .get("/me/progress")
      .set({ Authorization: `Bearer ${expired.sessionToken}` });
    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: "Unauthorized" });
  });
});

// ---------------------------------------------------------------------------
// D2 — GET /me/progress (fresh user)
// ---------------------------------------------------------------------------

describe("GET /me/progress (fresh user)", () => {
  it("returns 23 contract-valid entries with derived unlock state and zero counters", async () => {
    const { bearer } = await newUser();
    const res = await request(app).get("/me/progress").set(bearer);

    expect(res.status).toBe(200);
    expect(() => ProgressOverviewSchema.parse(res.body)).not.toThrow();
    expect(res.body.entries).toHaveLength(23);

    const unlocked = expectedFreshUnlocked();
    for (const entry of res.body.entries as {
      moduleId: string;
      status: string;
      bestScore: number | null;
      attemptCount: number;
      completedAt: string | null;
      updatedAt: string | null;
    }[]) {
      expect(entry.status).toBe(unlocked.has(entry.moduleId) ? "UNLOCKED" : "LOCKED");
      expect(entry.bestScore).toBeNull();
      expect(entry.attemptCount).toBe(0);
      expect(entry.completedAt).toBeNull();
      expect(entry.updatedAt).toBeNull();
    }

    // Order mirrors DB track/module positions exactly.
    const orderedIds = tracksDb.flatMap((track) =>
      [...track.modules].sort((a, b) => a.position - b.position).map((m) => m.id)
    );
    expect((res.body.entries as { moduleId: string }[]).map((entry) => entry.moduleId)).toEqual(
      orderedIds
    );
  });

  it("the first banked module of each track is UNLOCKED for a fresh user", async () => {
    const { bearer } = await newUser();
    const res = await request(app).get("/me/progress").set(bearer);
    const byId = new Map(
      (res.body.entries as { moduleId: string; status: string }[]).map((entry) => [
        entry.moduleId,
        entry.status,
      ])
    );
    expect(byId.get("mod-0-5")).toBe("UNLOCKED");
    expect(byId.get("mod-1-3")).toBe("UNLOCKED");
    // Unbanked bridges (first module of a track) unlock as well.
    expect(byId.get(gitModules[0].id)).toBe("UNLOCKED");
  });

  it("answers a generic 500 envelope when the progress store fails", async () => {
    const { bearer } = await newUser();
    vi.spyOn(progressRepository, "listByUser").mockRejectedValueOnce(new Error("db down"));
    const res = await request(app).get("/me/progress").set(bearer);
    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: "Internal server error" });
  });
});

// ---------------------------------------------------------------------------
// D2 — POST /me/progress/:moduleId/start
// ---------------------------------------------------------------------------

describe("POST /me/progress/:moduleId/start", () => {
  it("records engagement as UNLOCKED — no IN_PROGRESS drift, no completion", async () => {
    const { user, bearer } = await newUser();
    const firstUnbanked = gitModules.find((m) => !bankedIds.has(m.id))!;

    const res = await request(app)
      .post(`/me/progress/${firstUnbanked.id}/start`)
      .set(bearer);

    expect(res.status).toBe(200);
    expect(res.body.moduleId).toBe(firstUnbanked.id);
    expect(res.body.status).toBe("UNLOCKED");

    const row = await progressRow(user.id, firstUnbanked.id);
    expect(row?.status).toBe("UNLOCKED");
    expect(row?.bestScore).toBeNull();
    expect(row?.completedAt).toBeNull();
  });

  it("start is idempotent: one row, stable status, refreshed activity timestamp", async () => {
    const { user, bearer } = await newUser();
    const firstUnbanked = gitModules.find((m) => !bankedIds.has(m.id))!;
    await request(app).post(`/me/progress/${firstUnbanked.id}/start`).set(bearer);
    const firstRow = (await progressRow(user.id, firstUnbanked.id))!;
    await new Promise((resolve) => setTimeout(resolve, 20));

    const res = await request(app)
      .post(`/me/progress/${firstUnbanked.id}/start`)
      .set(bearer);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("UNLOCKED");
    expect(await countProgress(user.id)).toBe(1);
    const secondRow = (await progressRow(user.id, firstUnbanked.id))!;
    expect(secondRow.status).toBe("UNLOCKED");
    expect(secondRow.updatedAt.getTime()).toBeGreaterThanOrEqual(firstRow.updatedAt.getTime());
  });

  it("rejects a LOCKED module with 403 and persists nothing", async () => {
    const { user, bearer } = await newUser();
    // Everything after the first banked module (mod-0-5) is locked for a
    // fresh user; the last such module is the stable pick.
    const lockedModule = afterMod(gitModules, mod05.position).at(-1)!;
    expect(lockedModule).toBeDefined();

    const res = await request(app)
      .post(`/me/progress/${lockedModule.id}/start`)
      .set(bearer);

    expect(res.status).toBe(403);
    expect(res.body).toEqual({ error: "Complete the previous module to unlock this one." });
    expect(await countProgress(user.id)).toBe(0);
    expect(await countAttempts(user.id)).toBe(0);
  });

  it("rejects unknown module ids (404) and malformed ids (400)", async () => {
    const { bearer } = await newUser();
    expect(
      (await request(app).post("/me/progress/mod-9-not-there/start").set(bearer)).status
    ).toBe(404);
    expect(
      (await request(app).post("/me/progress/Not_A_Module/start").set(bearer)).status
    ).toBe(400);
  });

  it("restarting a COMPLETED module keeps its status (only the activity touch moves)", async () => {
    const { user, bearer } = await newUser();
    const full = correctAnswersOf(questionsByModule.get("mod-0-5")!);
    await submit(bearer, "mod-0-5", full);

    const before = (await progressRow(user.id, "mod-0-5"))!;
    const res = await request(app).post("/me/progress/mod-0-5/start").set(bearer);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("COMPLETED");
    const after = (await progressRow(user.id, "mod-0-5"))!;
    expect(after.status).toBe("COMPLETED");
    expect(after.completedAt?.getTime()).toBe(before.completedAt?.getTime());
  });

  it("answers a generic 500 envelope when the progress store fails", async () => {
    const { user, bearer } = await newUser();
    vi.spyOn(progressRepository, "touchOrStart").mockRejectedValueOnce(new Error("db down"));
    const res = await request(app).post(`/me/progress/${gitModules[0].id}/start`).set(bearer);
    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: "Internal server error" });
    expect(await countProgress(user.id)).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// D3/D8 — POST /me/quiz/submissions (server-side grading)
// ---------------------------------------------------------------------------

describe("POST /me/quiz/submissions — full-correct pass", () => {
  it("grades, persists attempt + progress in one write, and unlocks the next module", async () => {
    const { user, bearer } = await newUser();
    const bank = questionsByModule.get("mod-0-5")!;
    const res = await submit(bearer, "mod-0-5", correctAnswersOf(bank));

    // Contract + exact server-computed verdicts.
    expect(res.status).toBe(201);
    expect(() => QuizResultSchema.parse(res.body)).not.toThrow();
    expect(res.body.moduleId).toBe("mod-0-5");
    expect(res.body.score).toBe(bank.length);
    expect(res.body.totalQuestions).toBe(bank.length);
    expect(res.body.percentage).toBe(100);
    expect(res.body.passed).toBe(true);
    expect(res.body.passMarkPercentage).toBe(80);
    expect(res.body.missedTopics).toEqual([]);
    expect(res.body.unlockedNextModuleId).toBe(expectedGitNextModuleId);
    expect(res.body.message).toContain("You scored 100%");
    expect(res.body.message).toContain("pass mark is 80%");
    expect(res.body.message).toContain("The next module has been unlocked!");

    // SECURITY: no grading truth anywhere in the response payload.
    const serialized = JSON.stringify(res.body);
    expect(serialized).not.toContain("correctOptionIndex");
    expect(serialized).not.toContain("explanation");

    // Attempt row persisted with the submitted answers + computed breakdown.
    const attempts = await prisma.quizAttempt.findMany({ where: { userId: user.id } });
    expect(attempts).toHaveLength(1);
    expect(attempts[0].score).toBe(bank.length);
    expect(attempts[0].total).toBe(bank.length);
    expect(attempts[0].percentage).toBe(100);
    expect(attempts[0].passed).toBe(true);
    expect(attempts[0].answers).toEqual(correctAnswersOf(bank));
    // Breakdown is stored even for perfect runs (every topic fully correct).
    expect(attempts[0].breakdown).toEqual({
      topicBreakdown: expectedTopicBreakdown(bank, correctAnswersOf(bank)),
      missedTopics: [],
    });

    // Progress row: COMPLETED, first-pass timestamp, attempt count derived.
    const overview = await request(app).get("/me/progress").set(bearer);
    const entry = entryOf(overview.body, "mod-0-5");
    expect(entry.status).toBe("COMPLETED");
    expect(entry.bestScore).toBe(100);
    expect(entry.completedAt).toBeTruthy();
    expect(entry.attemptCount).toBe(1);

    // The NEXT module in the track unlocks for this user.
    const nextEntry = entryOf(overview.body, expectedGitNextModuleId);
    expect(nextEntry.status).toBe("UNLOCKED");
  });
});

describe("POST /me/quiz/submissions — score math, unanswered, message truth", () => {
  it("scores unanswered questions as incorrect (partial submission fails at 70%)", async () => {
    const { user, bearer } = await newUser();
    const bank = questionsByModule.get("mod-0-5")!;
    const answers: Record<string, number> = {};
    // 7 correct
    for (const question of bank.slice(0, 7)) answers[question.id] = question.correctOptionIndex;
    // 2 wrong
    for (const question of bank.slice(7, 9)) {
      answers[question.id] =
        (question.correctOptionIndex + 1) % (question.options as string[]).length;
    }
    // last question left UNANSWERED

    const res = await submit(bearer, "mod-0-5", answers);

    expect(res.status).toBe(201);
    expect(res.body.score).toBe(7);
    expect(res.body.totalQuestions).toBe(bank.length);
    expect(res.body.percentage).toBe(70);
    expect(res.body.passed).toBe(false);
    expect(res.body.unlockedNextModuleId).toBeNull();
    expect(res.body.message).toContain("70%");
    expect(res.body.message).toMatch(/below the 80% pass mark/);

    // Full-bank tallies: every topic counts ALL its bank questions.
    expect(res.body.topicBreakdown).toEqual(expectedTopicBreakdown(bank, answers));
    expect((res.body.topicBreakdown as { total: number }[]).reduce((sum, t) => sum + t.total, 0))
      .toBe(bank.length);

    // Missed topics: 2 wrong + 1 unanswered, with review material only.
    const missed = res.body.missedTopics as { topic: string; explanation: string; reviewConcept: string }[];
    expect(missed).toHaveLength(3);
    const wrongBank = bank.slice(7, 9);
    for (const question of wrongBank) {
      const miss = missed.find((m) => m.reviewConcept === `Review: ${question.question}`);
      expect(miss?.topic).toBe(question.topic);
      expect(miss?.explanation).toBe(question.explanation);
    }
    const unanswered = bank.slice(9)[0];
    expect(missed.find((m) => m.reviewConcept === `Review: ${unanswered.question}`)).toBeTruthy();

    // Progress: attempt recorded, still UNLOCKED, no completion, no unlock.
    const row = await progressRow(user.id, "mod-0-5");
    expect(row?.status).toBe("UNLOCKED");
    expect(row?.bestScore).toBe(70);
    expect(row?.completedAt).toBeNull();
    const overview = await request(app).get("/me/progress").set(bearer);
    expect(entryOf(overview.body, expectedGitNextModuleId).status).toBe("LOCKED");
  });

  it("grades an all-wrong attempt at 0% without unlocking anything", async () => {
    const { bearer } = await newUser();
    const bank = questionsByModule.get("mod-0-5")!;
    const res = await submit(bearer, "mod-0-5", wrongAnswersOf(bank));
    expect(res.status).toBe(201);
    expect(res.body.score).toBe(0);
    expect(res.body.percentage).toBe(0);
    expect(res.body.passed).toBe(false);
    expect(res.body.missedTopics).toHaveLength(bank.length);
  });
});

describe("POST /me/quiz/submissions — malformed and invalid submissions", () => {
  it("rejects empty submissions with 400 and persists nothing (D3)", async () => {
    const { user, bearer } = await newUser();
    const beforeAttempts = await countAttempts(user.id);

    const res = await submit(bearer, "mod-0-5", {});

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/no answers/i);
    expect(await countAttempts(user.id)).toBe(beforeAttempts);
    expect(await countProgress(user.id)).toBe(0);
  });

  it("rejects schema-shape violations with a generic 400 (no internals)", async () => {
    const { bearer } = await newUser();
    const missingModule = await request(app)
      .post("/me/quiz/submissions")
      .set(bearer)
      .send({ answers: { "q-05-1": 0 } });
    expect(missingModule.status).toBe(400);
    expect(missingModule.body.error).toBe("Invalid quiz submission payload");

    const notAnObject = await request(app)
      .post("/me/quiz/submissions")
      .set(bearer)
      .send("just-a-string");
    expect(notAnObject.status).toBe(400);

    const noAnswersField = await request(app)
      .post("/me/quiz/submissions")
      .set(bearer)
      .send({ moduleId: "mod-0-5" });
    expect(noAnswersField.status).toBe(400);
  });

  it("rejects unknown and cross-module question ids (400, no leak, no writes)", async () => {
    const { user, bearer } = await newUser();
    const bank = questionsByModule.get("mod-0-5")!;
    const fiberBank = questionsByModule.get("mod-1-3")!;

    const unknownId = await submit(bearer, "mod-0-5", {
      [bank[0].id]: bank[0].correctOptionIndex,
      "q-forged-404": 1,
    });
    expect(unknownId.status).toBe(400);

    const crossModule = await submit(bearer, "mod-0-5", {
      [bank[0].id]: bank[0].correctOptionIndex,
      [fiberBank[0].id]: fiberBank[0].correctOptionIndex,
    });
    expect(crossModule.status).toBe(400);
    // The rejection is deliberately vague: no internals, no cross-module hint.
    expect(crossModule.body.error).toBe(
      "Submission references questions that do not belong to this module."
    );

    expect(await countAttempts(user.id)).toBe(0);
    expect(await countProgress(user.id)).toBe(0);
  });

  it("rejects out-of-range, fractional, and non-integer option indexes", async () => {
    const { user, bearer } = await newUser();
    const bank = questionsByModule.get("mod-0-5")!;
    for (const badIndex of [4, -1, 1.5, "0", null]) {
      const res = await submit(bearer, "mod-0-5", { [bank[0].id]: badIndex as number });
      expect(res.status).toBe(400);
    }
    expect(await countAttempts(user.id)).toBe(0);
    expect(await countProgress(user.id)).toBe(0);
  });

  it("collapses duplicate question keys to one entry (record semantics, last wins)", async () => {
    const { user, bearer } = await newUser();
    const bank = questionsByModule.get("mod-0-5")!;
    const duplicatedId = bank[0].id;
    const secondIndex = (bank[0].correctOptionIndex + 1) % (bank[0].options as string[]).length;

    const raw = `{"moduleId":"mod-0-5","answers":{"${duplicatedId}":2,"${duplicatedId}":${secondIndex}}}`;
    const res = await request(app)
      .post("/me/quiz/submissions")
      .set(bearer)
      .set("Content-Type", "application/json")
      .send(raw);

    expect(res.status).toBe(201);
    // JSON object semantics: one normalized entry with the LAST value.
    const attempts = await prisma.quizAttempt.findMany({ where: { userId: user.id } });
    expect(attempts).toHaveLength(1);
    expect(attempts[0].answers).toEqual({ [duplicatedId]: secondIndex });
    const expectedScore = secondIndex === bank[0].correctOptionIndex ? 1 : 0;
    expect(attempts[0].score).toBe(expectedScore);
  });
});

describe("POST /me/quiz/submissions — locked, unbanked, unknown modules", () => {
  it("rejects grading a LOCKED module with 403 and persists nothing (D2)", async () => {
    const { user, bearer } = await newUser();
    const lockedModule = afterMod(gitModules, mod05.position).at(-1)!;

    const res = await submit(bearer, lockedModule.id, {
      [questionsByModule.get("mod-0-5")![0].id]: 0,
    });

    expect(res.status).toBe(403);
    expect(res.body).toEqual({ error: "Complete the previous module to unlock this one." });
    expect(await countAttempts(user.id)).toBe(0);
    expect(await countProgress(user.id)).toBe(0);
  });

  it("answers 404 for an unlocked but unbanked module (quiz not published)", async () => {
    const { user, bearer } = await newUser();
    const unbanked = gitModules.find((m) => !bankedIds.has(m.id))!;

    const res = await submit(bearer, unbanked.id, { "q-anything": 0 });

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: "The quiz for this module is not published yet." });
    expect(await countAttempts(user.id)).toBe(0);
    expect(await countProgress(user.id)).toBe(0);
  });

  it("answers 404 for unknown modules before touching any table", async () => {
    const { user, bearer } = await newUser();
    const res = await submit(bearer, "mod-9-ghost", { "q-x": 0 });
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: "Module not found" });
    expect(await countAttempts(user.id)).toBe(0);
    expect(await countProgress(user.id)).toBe(0);
  });
});

describe("POST /me/quiz/submissions — server-authoritative verdicts and persistence", () => {
  it("never trusts client claims: injected score/passed/percentage fields are ignored", async () => {
    const { user, bearer } = await newUser();
    const bank = questionsByModule.get("mod-0-5")!;
    const answers = wrongAnswersOf(bank);
    const forgedBody = { moduleId: "mod-0-5", answers, score: bank.length, percentage: 100, passed: true };

    const res = await request(app)
      .post("/me/quiz/submissions")
      .set(bearer)
      .send(forgedBody);

    expect(res.status).toBe(201);
    expect(res.body.score).toBe(0);
    expect(res.body.percentage).toBe(0);
    expect(res.body.passed).toBe(false);
    expect(await countProgress(user.id)).toBe(1);
    const row = (await progressRow(user.id, "mod-0-5"))!;
    expect(row?.status).toBe("UNLOCKED");
  });

  it("retries append rows; bestScore keeps the max; completedAt anchors to the FIRST pass", async () => {
    const { user, bearer } = await newUser();
    const bank = questionsByModule.get("mod-0-5")!;

    const failOne = await submit(bearer, "mod-0-5", wrongAnswersOf(bank.slice(0, 1)));
    const wrongButFromRealBank: Record<string, number> = {};
    for (const question of bank) {
      wrongButFromRealBank[question.id] =
        (question.correctOptionIndex + 1) % (question.options as string[]).length;
    }
    const passAttempt = await submit(bearer, "mod-0-5", correctAnswersOf(bank));
    const laterFail = await submit(bearer, "mod-0-5", wrongButFromRealBank);

    expect(failOne.status).toBe(201);
    expect(passAttempt.status).toBe(201);
    expect(laterFail.status).toBe(201);
    expect(await countAttempts(user.id)).toBe(3);

    const progress = await progressRow(user.id, "mod-0-5");
    expect(progress?.status).toBe("COMPLETED"); // never downgraded by later fails
    expect(progress?.bestScore).toBe(100); // max across attempts
    // completedAt stayed anchored to the FIRST passing attempt.
    const passingRow = await prisma.quizAttempt.findFirst({
      where: { userId: user.id, passed: true, moduleId: "mod-0-5" },
      orderBy: { createdAt: "asc" },
    });
    expect(
      Math.abs(progress!.completedAt!.getTime() - passingRow!.createdAt.getTime())
    ).toBeLessThan(1500);

    const overview = await request(app).get("/me/progress").set(bearer);
    expect(entryOf(overview.body, "mod-0-5").attemptCount).toBe(3);
    expect(entryOf(overview.body, "mod-0-5").bestScore).toBe(100);
  });

  it("rolls back the whole write when the progress side of the transaction fails", async () => {
    const { user, bearer } = await newUser();
    const bank = questionsByModule.get("mod-0-5")!;
    vi.spyOn(progressRepository, "upsertProgressForAttempt").mockRejectedValueOnce(
      new Error("db down")
    );

    const res = await submit(bearer, "mod-0-5", correctAnswersOf(bank));
    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: "Internal server error" });

    // Atomicity: no attempt row may survive a failed progress upsert.
    expect(await countAttempts(user.id)).toBe(0);
    expect(await countProgress(user.id)).toBe(0);

    // Recovery: the same submission succeeds once the failure is gone.
    const retry = await submit(bearer, "mod-0-5", correctAnswersOf(bank));
    expect(retry.status).toBe(201);
    expect(await countAttempts(user.id)).toBe(1);
  });

  it("answers a generic 500 when the attempt store fails mid-flow", async () => {
    const { user, bearer } = await newUser();
    const bank = questionsByModule.get("mod-0-5")!;
    vi.spyOn(quizRepository, "createAttempt").mockRejectedValueOnce(new Error("db down"));
    const res = await submit(bearer, "mod-0-5", correctAnswersOf(bank));
    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: "Internal server error" });
    expect(await countProgress(user.id)).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// GET /me/quiz/attempts — history, filters, ownership
// ---------------------------------------------------------------------------

describe("GET /me/quiz/attempts", () => {
  it("lists the caller's attempts latest-first (contract shape, exact fields)", async () => {
    const { user, bearer } = await newUser();
    const bank = questionsByModule.get("mod-0-5")!;
    await submit(bearer, "mod-0-5", wrongAnswersOf(bank));
    await submit(bearer, "mod-0-5", correctAnswersOf(bank));

    const res = await request(app)
      .get("/me/quiz/attempts")
      .set(bearer)
      .query({ moduleId: "mod-0-5" });

    expect(res.status).toBe(200);
    expect(() => QuizAttemptHistorySchema.parse(res.body)).not.toThrow();
    expect(res.body).toHaveLength(2);
    expect(res.body[0].passed).toBe(true);
    expect(res.body[0].percentage).toBe(100);
    expect(res.body[1].percentage).toBe(0);
    const timestamps = (res.body as { createdAt: string }[]).map((attempt) => attempt.createdAt);
    expect(new Date(timestamps[0]).getTime()).toBeGreaterThan(
      new Date(timestamps[1]).getTime()
    );
    for (const attempt of res.body as (typeof res.body)[number][]) {
      expect(attempt.moduleId).toBe("mod-0-5");
      // Summaries stay light: no answers, no grading breakdown.
      expect(JSON.stringify(attempt)).not.toContain("correctOptionIndex");
      expect(JSON.stringify(attempt)).not.toContain("explanation");
      expect(JSON.stringify(attempt)).not.toContain(user.email);
    }
  });

  it("honors limit and rejects invalid query values", async () => {
    const { bearer } = await newUser();
    const bank = questionsByModule.get("mod-0-5")!;
    const fiberBank = questionsByModule.get("mod-1-3")!;
    await submit(bearer, "mod-0-5", wrongAnswersOf(bank.slice(0, 1)));
    await submit(bearer, "mod-1-3", wrongAnswersOf(fiberBank.slice(0, 1)));

    const limitOne = await request(app)
      .get("/me/quiz/attempts")
      .set(bearer)
      .query({ limit: 1 });
    expect(limitOne.status).toBe(200);
    expect(limitOne.body).toHaveLength(1);

    const moduleFilter = await request(app)
      .get("/me/quiz/attempts")
      .set(bearer)
      .query({ moduleId: "mod-1-3" });
    expect(moduleFilter.status).toBe(200);
    expect(moduleFilter.body).toHaveLength(1);
    expect(moduleFilter.body[0].moduleId).toBe("mod-1-3");

    const badLimit = await request(app)
      .get("/me/quiz/attempts")
      .set(bearer)
      .query({ limit: 999 });
    expect(badLimit.status).toBe(400);

    const badModule = await request(app)
      .get("/me/quiz/attempts")
      .set(bearer)
      .query({ moduleId: "Not_A_Module" });
    expect(badModule.status).toBe(400);
  });

  it("serves only the caller's rows — cross-user isolation", async () => {
    const userA = await newUser();
    const userB = await newUser();
    const bank = questionsByModule.get("mod-0-5")!;
    await submit(userA.bearer, "mod-0-5", correctAnswersOf(bank));

    const resB = await request(app).get("/me/quiz/attempts").set(userB.bearer);
    expect(resB.status).toBe(200);
    expect(resB.body).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// GET /me/profile — identity, derived activity, badges
// ---------------------------------------------------------------------------

describe("GET /me/profile", () => {
  it("composes a contract-valid profile for a fresh user with zeroed derived state", async () => {
    const { user, bearer } = await newUser();

    const res = await request(app).get("/me/profile").set(bearer);

    expect(res.status).toBe(200);
    expect(() => UserProfileSchema.parse(res.body)).not.toThrow();
    expect(res.body.id).toBe(user.id);
    expect(res.body.email).toBe(user.email);
    expect(res.body.name).toBe("Progress IT");
    expect(res.body.streakDays).toBe(0);
    expect(res.body.completedModuleIds).toEqual([]);
    expect([...res.body.unlockedModuleIds].sort()).toEqual([...expectedFreshUnlocked()].sort());
    expect(res.body.quizScores).toEqual({});
    expect(Object.keys(res.body.weeklyActivity)).toHaveLength(112);
    expect(res.body.badges.every((badge: { unlockedAt: string | null }) => badge.unlockedAt === null)).toBe(true);
  });

  it("derives activity and the Genesis badge from REAL events after a pass", async () => {
    const { user, bearer } = await newUser();
    const bank = questionsByModule.get("mod-0-5")!;
    await submit(bearer, "mod-0-5", correctAnswersOf(bank));

    const res = await request(app).get("/me/profile").set(bearer);

    expect(res.status).toBe(200);
    expect(() => UserProfileSchema.parse(res.body)).not.toThrow();
    expect(res.body.completedModuleIds).toEqual(["mod-0-5"]);
    expect(res.body.quizScores["mod-0-5"]).toBe(100);
    expect(res.body.unlockedModuleIds).toContain("mod-0-5");
    expect(res.body.unlockedModuleIds).toContain(expectedGitNextModuleId);
    // Global order rule: the first UNLOCKED, non-completed module overall —
    // track 0's first module is still unlocked-and-uncompleted here.
    expect(res.body.currentModuleId).toBe(tracksDb[0].modules[0].id);
    expect(res.body.streakDays).toBeGreaterThan(0);

    const progress = await progressRow(user.id, "mod-0-5");
    const genesis = res.body.badges.find((badge: { id: string }) => badge.id === "badge-genesis");
    expect(genesis.unlockedAt).toBe(progress?.completedAt?.toISOString() ?? null);

    const todayKey = new Date().toISOString().slice(0, 10);
    expect(res.body.weeklyActivity[todayKey]).toBeGreaterThan(0);

    // Everything real: no mock identity may bleed into the composed profile.
    const serialized = JSON.stringify(res.body);
    expect(serialized).not.toContain("arivera_dev");
    expect(serialized).not.toContain("phMocSkU");
  });

  it("answers a generic 500 envelope when attempt aggregates fail", async () => {
    const { bearer } = await newUser();
    vi.spyOn(quizRepository, "aggregateBestScores").mockRejectedValueOnce(new Error("db down"));
    const res = await request(app).get("/me/profile").set(bearer);
    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: "Internal server error" });
  });
});

// ---------------------------------------------------------------------------
// POST /me/progress/reset
// ---------------------------------------------------------------------------

describe("POST /me/progress/reset", () => {
  it("wipes only the caller's attempts and progress, then returns a fresh profile", async () => {
    const caller = await newUser();
    const other = await newUser();
    const bank = questionsByModule.get("mod-0-5")!;
    await submit(caller.bearer, "mod-0-5", correctAnswersOf(bank));
    const untouchedBank = questionsByModule.get("mod-1-3")!;
    await submit(other.bearer, "mod-1-3", correctAnswersOf(untouchedBank));

    const res = await request(app).post("/me/progress/reset").set(caller.bearer);

    expect(res.status).toBe(200);
    expect(() => UserProfileSchema.parse(res.body)).not.toThrow();
    expect(res.body.completedModuleIds).toEqual([]);
    expect(res.body.quizScores).toEqual({});
    expect(res.body.streakDays).toBe(0);
    expect(res.body.badges.every((badge: { unlockedAt: string | null }) => badge.unlockedAt === null)).toBe(true);
    expect(await countAttempts(caller.user.id)).toBe(0);
    expect(await countProgress(caller.user.id)).toBe(0);

    // Isolation: another user's data survives the reset untouched.
    expect(await countAttempts(other.user.id)).toBe(1);
    expect(await countProgress(other.user.id)).toBe(1);
  });

  it("is idempotent — resetting with nothing stored still returns a valid profile", async () => {
    const { bearer } = await newUser();
    const res = await request(app).post("/me/progress/reset").set(bearer);
    expect(res.status).toBe(200);
    expect(res.body.completedModuleIds).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Rate limiting (test-injectable windows)
// ---------------------------------------------------------------------------

describe("Phase 5 rate limits", () => {
  it("429s quiz submissions after the configured cap with a JSON envelope", async () => {
    const limited = createApp({ rateLimits: { quizSubmit: { windowMs: 60_000, max: 1 } } });
    const { bearer } = await newUser();
    const bank = questionsByModule.get("mod-0-5")!;

    const first = await submit(bearer, "mod-0-5", correctAnswersOf(bank), limited);
    expect(first.status).toBe(201);

    const second = await submit(bearer, "mod-0-5", correctAnswersOf(bank), limited);
    expect(second.status).toBe(429);
    expect(second.body).toEqual({ error: "Too many requests. Please try again later." });
  });

  it("429s progress mutations after the configured cap", async () => {
    const limited = createApp({ rateLimits: { progressMutation: { windowMs: 60_000, max: 1 } } });
    const { bearer } = await newUser();
    const moduleId = gitModules.find((m) => !bankedIds.has(m.id))!.id;

    const first = await request(limited)
      .post(`/me/progress/${moduleId}/start`)
      .set(bearer);
    expect(first.status).toBe(200);

    const second = await request(limited)
      .post(`/me/progress/${moduleId}/start`)
      .set(bearer);
    expect(second.status).toBe(429);
  });
});
