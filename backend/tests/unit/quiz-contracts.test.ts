import { describe, expect, it } from "vitest";
import {
  PublicQuizQuestionSchema,
  PublicQuizQuestionListSchema,
  QuizQuestionSchema,
  QuizSubmissionSchema,
  QuizResultSchema,
} from "@devpulse/contracts";
import { QUIZ_BANKS } from "@devpulse/curriculum";

/**
 * Quiz-contract parity tests (Phase 5, decision D6 companion).
 *
 * `PublicQuizQuestionSchema` is declared STANDALONE in shared/contracts —
 * NOT as `QuizQuestionSchema.omit(...)` — because deriving from the bank
 * schema kept the answer-key property alive in client bundles (caught by
 * scripts/check-production-bundle.mjs). These tests prove the standalone
 * declaration stays shape-compatible with the authored-bank schema so the
 * two declarations can never silently drift.
 */

type BankQuestion = (typeof QUIZ_BANKS)[string][number];

/** Strips grading truth from a bank question (the public projection). */
const projectPublic = (question: BankQuestion) => {
  const { correctOptionIndex: _c, explanation: _e, ...rest } = question;
  return rest;
};

describe("public quiz contract parity with the authored bank schema", () => {
  const banks = Object.entries(QUIZ_BANKS);

  it("at least two authored banks exist (seed invariant)", () => {
    expect(banks.length).toBeGreaterThanOrEqual(2);
  });

  it.each(banks)("bank %s questions survive the public projection", (_moduleId, questions) => {
    for (const question of questions) {
      const parsed = PublicQuizQuestionSchema.parse(projectPublic(question));

      expect(parsed.id).toBe(question.id);
      expect(parsed.options).toEqual(question.options);
      expect(parsed.hint).toBe(question.hint);
      expect(JSON.stringify(parsed)).not.toContain("correctOptionIndex");
    }
  });

  it("the public list schema accepts each projected bank", () => {
    for (const [, questions] of banks) {
      expect(
        PublicQuizQuestionListSchema.safeParse(questions.map(projectPublic)).success
      ).toBe(true);
    }
  });

  it("QuizQuestionSchema keeps requiring graded truth (bank shape intact)", () => {
    const [firstQuestion] = QUIZ_BANKS[banks[0][0]];
    expect(() => QuizQuestionSchema.parse(firstQuestion)).not.toThrow();
  });

  it("the public schema's declared shape matches the bank minus graded truth", () => {
    const firstQuestion = QUIZ_BANKS[banks[0][0]][0];
    expect(Object.keys(PublicQuizQuestionSchema.shape).sort()).toEqual(
      Object.keys(QuizQuestionSchema.shape)
        .filter(
          (key) => key !== "correctOptionIndex" && key !== "explanation"
        )
        .sort()
    );
    expect(Object.keys(firstQuestion)).toContain("correctOptionIndex");
    expect(Object.keys(firstQuestion)).toContain("explanation");
  });

  it("submission and result contracts stay volume-compatible with Phase 5 grading", () => {
    const submission = QuizSubmissionSchema.safeParse({
      moduleId: "mod-0-5",
      answers: { "q-05-1": 0, "q-05-2": 3 },
    });
    expect(submission.success).toBe(true);

    const result = QuizResultSchema.safeParse({
      submissionId: "att-1",
      moduleId: "mod-0-5",
      score: 8,
      totalQuestions: 10,
      percentage: 80,
      passed: true,
      passMarkPercentage: 80,
      topicBreakdown: [{ topic: "Git", correct: 8, total: 10, percentage: 80 }],
      missedTopics: [],
      unlockedNextModuleId: "mod-0-6",
      message:
        "Outstanding work! You scored 80% (pass mark is 80%). The next module has been unlocked!",
    });
    expect(result.success).toBe(true);
  });
});
