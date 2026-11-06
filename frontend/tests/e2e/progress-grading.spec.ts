import { test, expect } from "@playwright/test";

/**
 * Phase 5 user-progress & grading critical flow (e2e).
 *
 * Exercises the REAL chain end to end: browser → Next BFF (session cookie →
 * Bearer server-side) → Express (requireAuth → server-side grading →
 * transactional persistence) → PostgreSQL.
 *
 * Coverage matrix (approved Phase 5 decisions):
 *  - D1: guests see REAL zeroed progress (no mock-user leakage) and get 401s
 *        on every /me endpoint.
 *  - D2: locked modules reject start/submission with 403; unbanked modules
 *        answer 404 ("not published"); passing unlocks the next module.
 *  - D3: grading is server-authoritative — forged score/passed fields are
 *        ignored, unanswered questions count as incorrect.
 *  - Persistence: attempts append (latest-first history), bestScore keeps
 *        the max, completedAt anchors to the first pass even after later
 *        failed attempts (verified via progress + attempts endpoints).
 *  - Reset: wipes the caller's rows and returns a fresh profile.
 *
 * Each run uses a unique email; users stay in the dev database (documented
 * limitation — no cleanup endpoint exists by design). Bank answer indices
 * hardcoded below are TEST FIXTURES (never bundled into the app).
 */

const GIT_BANK_CORRECT: Record<string, number> = Object.fromEntries(
  ["q-05-1", "q-05-2", "q-05-3", "q-05-4", "q-05-5", "q-05-6", "q-05-7", "q-05-8", "q-05-9", "q-05-10"].map(
    (id) => [id, 0]
  )
);
const GIT_BANK_WRONG: Record<string, number> = Object.fromEntries(
  Object.keys(GIT_BANK_CORRECT).map((id) => [id, 1])
);

const emailFor = (label: string) =>
  `e2e-p5-${label}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@integration-test.dev`;
const password = "e2e-strong-pass-01";

async function register(page: import("@playwright/test").Page, email: string) {
  await page.goto("/signup");
  await page.fill('input[type="text"]', "E2E Progress Tester");
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL("**/dashboard", { timeout: 30_000 });
}

/** Same-origin signed-in fetch helper (runs with the browser's cookies). */
async function apiGet(page: import("@playwright/test").Page, path: string) {
  return page.evaluate(async (p: string) => {
    const res = await fetch(p, { headers: { accept: "application/json" } });
    return { status: res.status, body: await res.json() };
  }, path);
}

async function apiPost(
  page: import("@playwright/test").Page,
  path: string,
  body: unknown
) {
  return page.evaluate(
    ({ p, payload }: { p: string; payload: unknown }) =>
      fetch(p, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      }).then(async (res) => ({ status: res.status, body: await res.json() })),
    { p: path, payload: body }
  );
}

const findEntry = (
  body: { entries: { moduleId: string; status: string; bestScore: number | null; attemptCount: number; completedAt: string | null }[] },
  moduleId: string
) => body.entries.find((entry) => entry.moduleId === moduleId)!;

test.describe("guest progress & auth gating (D1)", () => {
  test("guests see zeroed real progress and every /me endpoint 401s", async ({ page, request }) => {
    await page.goto("/learn/web-foundations");
    await expect(page.locator("h1")).toContainText("Web Foundations");

    // D1: no mock-identity leak on public pages; no mock-mode chip.
    const html = await page.content();
    expect(html).not.toMatch(/arivera|Alex Rivera/i);
    await expect(page.locator('[aria-label="Mock data mode active"]')).toHaveCount(0);

    const profile = await request.get("/api/business/me/profile");
    expect(profile.status()).toBe(401);
    // Identical envelope from every BFF gate (requireSessionToken wording).
    expect(await profile.json()).toEqual({ error: "You need to sign in first." });

    const progress = await request.get("/api/business/me/progress");
    expect(progress.status()).toBe(401);

    const attempts = await request.get("/api/business/me/quiz/attempts");
    expect(attempts.status()).toBe(401);

    const start = await request.post("/api/business/me/progress/mod-0-5/start");
    expect(start.status()).toBe(401);

    const submit = await request.post("/api/business/quiz/submissions", {
      data: { moduleId: "mod-0-5", answers: { "q-05-1": 0 } },
    });
    expect(submit.status()).toBe(401);
  });
});

test.describe("signed-in grading journey (D2/D3/persistence)", () => {
  const email = emailFor("journey");

  // Deliberately ONE sequential test: every step depends on the previous
  // state (fresh user → grade → unlock → forge → retry → best-score), and
  // session cookies are per-context.
  test("grade → persist → unlock → server-authoritative forgery defense → retries", async ({
    page,
  }) => {
    await register(page, email);
    await expect(
      page.locator('header [aria-label^="Signed in as"]')
    ).toBeVisible({ timeout: 15_000 });

    // Signed-in identity is REAL and belongs to THIS user.
    const profile = await apiGet(page, "/api/business/me/profile");
    expect(profile.status).toBe(200);
    expect(profile.body.email).toBe(email);
    expect(JSON.stringify(profile.body)).not.toContain("arivera_dev");

    // Fresh-user geometry: mod-0-5 unlocked, modules after it LOCKED.
    const track = await apiGet(page, "/api/business/tracks/web-foundations");
    expect(track.status).toBe(200);
    const modules = (track.body as { modules: { id: string; slug: string }[] }).modules;
    const gitIndex = modules.findIndex((m) => m.slug === "git-basics");
    expect(gitIndex).toBeGreaterThan(0);
    const lockedModule = modules[modules.length - 1].id; // after the first banked module

    let progress = await apiGet(page, "/api/business/me/progress");
    expect(findEntry(progress.body, "mod-0-5").status).toBe("UNLOCKED");
    expect(findEntry(progress.body, lockedModule).status).toBe("LOCKED");
    expect(progress.body.entries.every((e: { attemptCount: number }) => e.attemptCount === 0)).toBe(true);

    // D2: starting a LOCKED module is rejected before any write happens.
    const lockedStart = await apiPost(
      page,
      `/api/business/me/progress/${lockedModule}/start`,
      {}
    );
    expect(lockedStart.status).toBe(403);
    expect(lockedStart.body).toEqual({
      error: "Complete the previous module to unlock this one.",
    });

    // D2: an unlocked, UNBANKED module answers 404 (quiz not published).
    progress = await apiGet(page, "/api/business/me/progress");
    const unbanked = modules.find(
      (m) => findEntry(progress.body, m.id).status === "UNLOCKED" && m.id !== "mod-0-5"
    );
    const unbankedSubmit = await apiPost(page, "/api/business/quiz/submissions", {
      moduleId: unbanked!.id,
      answers: { "q-05-1": 0 },
    });
    expect(unbankedSubmit.status).toBe(404);
    expect(unbankedSubmit.body).toEqual({
      error: "The quiz for this module is not published yet.",
    });

    // Three-way invalid inputs (server contract, not just UI).
    const emptyAnswers = await apiPost(page, "/api/business/quiz/submissions", {
      moduleId: "mod-0-5",
      answers: {},
    });
    expect(emptyAnswers.status).toBe(400);

    const crossModule = await apiPost(page, "/api/business/quiz/submissions", {
      moduleId: "mod-0-5",
      answers: { "q-13-1": 0 },
    });
    expect(crossModule.status).toBe(400);

    // UI grading: the empty-submission guard blocks submitting at zero.
    await page.goto("/learn/web-foundations/git-basics/quiz");
    await expect(page.getByText(/Question 1 of \d+/)).toBeVisible({ timeout: 15_000 });
    await page.keyboard.press("r");
    const submitButton = page.getByRole("button", { name: /Submit for Grading/ });
    await expect(submitButton).toBeDisabled();
    await page.getByRole("button", { name: "Back to Quiz" }).click();

    // Answer every question with the correct option (index 0 => key "1").
    const questionCount = Object.keys(GIT_BANK_CORRECT).length;
    for (let i = 1; i <= questionCount; i += 1) {
      await expect(page.getByText(new RegExp(`Question ${i} of ${questionCount}`))).toBeVisible();
      await page.keyboard.press("1");
      if (i < questionCount) {
        await page.keyboard.press("Enter"); // advances like "Next Question"
      }
    }
    await page.keyboard.press("Enter"); // last question opens the review modal
    await expect(page.getByText("Review Answers Before Submitting")).toBeVisible();
    await submitButton.click();

    // Server verdict: 100%, pass, next module unlocked (the isPerfect h2).
    await expect(page.getByText("Flawless Victory!")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(/Outstanding work! You scored 100%/)).toBeVisible();

    // Persistence: the attempt is real, progress completed, next unlocked.
    const attempts = await apiGet(page, "/api/business/me/quiz/attempts");
    expect(attempts.status).toBe(200);
    expect(attempts.body).toHaveLength(1);
    expect(attempts.body[0].moduleId).toBe("mod-0-5");
    expect(attempts.body[0].passed).toBe(true);
    expect(attempts.body[0].percentage).toBe(100);

    progress = await apiGet(page, "/api/business/me/progress");
    const completedEntry = findEntry(progress.body, "mod-0-5");
    expect(completedEntry.status).toBe("COMPLETED");
    expect(completedEntry.bestScore).toBe(100);
    expect(completedEntry.attemptCount).toBe(1);
    expect(completedEntry.completedAt).toBeTruthy();
    // The first module AFTER the banked one is the newly unlocked one.
    expect(findEntry(progress.body, modules[gitIndex + 1].id).status).toBe("UNLOCKED");
    expect(findEntry(progress.body, lockedModule).status).toBe("UNLOCKED");

    const freshProfile = await apiGet(page, "/api/business/me/profile");
    expect(freshProfile.body.completedModuleIds).toEqual(["mod-0-5"]);
    expect(freshProfile.body.quizScores["mod-0-5"]).toBe(100);
    expect(freshProfile.body.streakDays).toBeGreaterThan(0);
    const genesis = (freshProfile.body.badges as { id: string; unlockedAt: string | null }[]).find(
      (badge) => badge.id === "badge-genesis"
    );
    expect(genesis?.unlockedAt).toBeTruthy();

    // D3: the server NEVER trusts client verdicts — forged 100% graded as
    // its computed truth (1 correct answer out of 10 = 10%).
    const forged = await apiPost(page, "/api/business/quiz/submissions", {
      moduleId: "mod-0-5",
      answers: { "q-05-1": 0 },
      score: 10,
      percentage: 100,
      passed: true,
      totalQuestions: 10,
    });
    expect(forged.status).toBe(201);
    expect(forged.body.passed).toBe(false);
    expect(forged.body.score).toBe(1);
    expect(forged.body.percentage).toBe(10);
    expect(forged.body.unlockedNextModuleId).toBeNull();

    // Retries append rows; bestScore and completion survive a later failure.
    const failedRetry = await apiPost(page, "/api/business/quiz/submissions", {
      moduleId: "mod-0-5",
      answers: GIT_BANK_WRONG,
    });
    expect(failedRetry.status).toBe(201);
    expect(failedRetry.body.passed).toBe(false);
    expect(failedRetry.body.percentage).toBe(0);

    const attemptsAfter = await apiGet(page, "/api/business/me/quiz/attempts");
    expect(attemptsAfter.body).toHaveLength(3);
    // Latest first: the failed retry is on top.
    expect(attemptsAfter.body[0].passed).toBe(false);
    expect(attemptsAfter.body[0].percentage).toBe(0);

    const progressAfter = await apiGet(page, "/api/business/me/progress");
    const survived = findEntry(progressAfter.body, "mod-0-5");
    expect(survived.status).toBe("COMPLETED"); // never downgraded by failure
    expect(survived.bestScore).toBe(100); // max across attempts
    expect(survived.attemptCount).toBe(3);
    expect(survived.completedAt).toBe(completedEntry.completedAt); // first-pass anchor
  });
});

test.describe("cross-user isolation and reset (Phase 5)", () => {
  test("a brand-new user cannot see another user's attempts; reset is idempotent", async ({
    page,
  }) => {
    await register(page, emailFor("isolation"));

    const attempts = await apiGet(page, "/api/business/me/quiz/attempts");
    expect(attempts.status).toBe(200);
    expect(attempts.body).toEqual([]); // user B sees nothing of user A's rows

    let profile = await apiGet(page, "/api/business/me/profile");
    expect(profile.body.completedModuleIds).toEqual([]);
    expect(profile.body.quizScores).toEqual({});
    expect(profile.body.badges.every((b: { unlockedAt: string | null }) => b.unlockedAt === null)).toBe(true);

    // Reset with nothing stored: idempotent, still a valid fresh profile.
    const reset = await apiPost(page, "/api/business/me/progress/reset", {});
    expect(reset.status).toBe(200);
    expect(reset.body.completedModuleIds).toEqual([]);

    profile = await apiGet(page, "/api/business/me/profile");
    expect(profile.body.streakDays).toBe(0);
  });
});
