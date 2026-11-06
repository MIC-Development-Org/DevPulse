import { describe, it, expect } from "vitest";
import { api } from "@/lib/api/api-client";
import { TRACKS, QUIZ_BANKS, QUIZ_CONFIG } from "@/lib/data/mock-data";

const gitModule = TRACKS.flatMap((t) => t.modules).find((m) => m.id === "mod-0-5")!;
const gitTrack = TRACKS.find((t) => t.modules.some((m) => m.id === "mod-0-5"))!;
const gitBank = QUIZ_BANKS["mod-0-5"];

describe("Quiz Scoring Engine & Server-Side Evaluation (M3 Contract)", () => {
  it("enforces the configurable 80% pass threshold", () => {
    expect(QUIZ_CONFIG.passPercentage).toBe(80);
    expect(QUIZ_CONFIG.questionsPerAttempt).toBe(8);
  });

  it("evaluates a passing quiz attempt and unlocks the next module", async () => {
    // Submit all correct answers for module 0.5 (indices are 0 in mock bank)
    const submission = {
      moduleId: "mod-0-5",
      answers: {
        "q-05-1": 0,
        "q-05-2": 0,
        "q-05-3": 0,
        "q-05-4": 0,
        "q-05-5": 0,
        "q-05-6": 0,
        "q-05-7": 0,
        "q-05-8": 0,
      },
    };

    const result = await api.submitQuiz(submission);

    expect(result.score).toBe(8);
    expect(result.percentage).toBe(100);
    expect(result.passed).toBe(true);
    expect(result.unlockedNextModuleId).toBe("mod-0-6");
    expect(result.missedTopics.length).toBe(0);
    expect(result.topicBreakdown.length).toBeGreaterThan(0);
  });

  it("evaluates a failing attempt, generates missed topics and does not unlock", async () => {
    // Submit wrong answers (indices 1 instead of 0)
    const submission = {
      moduleId: "mod-0-5",
      answers: {
        "q-05-1": 1,
        "q-05-2": 1,
        "q-05-3": 1,
        "q-05-4": 1,
        "q-05-5": 0,
        "q-05-6": 0,
        "q-05-7": 1,
        "q-05-8": 1,
      },
    };

    const result = await api.submitQuiz(submission);

    expect(result.score).toBe(2);
    expect(result.percentage).toBe(25);
    expect(result.passed).toBe(false);
    expect(result.unlockedNextModuleId).toBeNull();
    expect(result.missedTopics.length).toBe(6);
  });

  it("strips grading truth when client requests quiz questions", async () => {
    const questions = await api.getQuizQuestions(gitTrack.slug, gitModule.slug);

    // Phase 4: the full authored bank is served (parity with the live API) —
    // no shuffle/slice sampling and no fallback banks.
    expect(gitBank).toBeTruthy();
    expect(questions.length).toBe(gitBank!.length);
    expect(questions.map((q) => q.id)).toEqual(gitBank!.map((q) => q.id));
    questions.forEach((q) => {
      // @ts-expect-error verifying that correctOptionIndex is not present
      expect(q.correctOptionIndex).toBeUndefined();
      // @ts-expect-error verifying that explanation is not present either
      expect(q.explanation).toBeUndefined();
      expect(q.hint).toBeDefined();
      expect(q.options.length).toBeGreaterThanOrEqual(2);
      expect(q.question).toBeDefined();
    });
  });

  it("returns an empty list for modules without an authored bank (no fallback fabricating)", async () => {
    const unbanked = TRACKS.flatMap((t) => t.modules).find((m) => !(m.id in QUIZ_BANKS))!;
    const track = TRACKS.find((t) => t.modules.some((m) => m.id === unbanked.id))!;
    expect(unbanked).toBeTruthy();

    const questions = await api.getQuizQuestions(track.slug, unbanked.slug);
    expect(questions).toEqual([]);
  });

  it("throws for a module that does not exist", async () => {
    await expect(
      api.getQuizQuestions("does-not-exist", "also-fake")
    ).rejects.toThrow("Module not found");
  });
});

