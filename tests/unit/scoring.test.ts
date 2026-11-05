import { describe, it, expect } from "vitest";
import { api } from "@/lib/api/api-client";
import { QUIZ_CONFIG } from "@/lib/data/mock-data";

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

  it("strips correct answers when client requests quiz questions", async () => {
    const questions = await api.getQuizQuestions("mod-0-5");

    expect(questions.length).toBe(QUIZ_CONFIG.questionsPerAttempt);
    questions.forEach((q) => {
      // @ts-expect-error verifying that correctOptionIndex is not present
      expect(q.correctOptionIndex).toBeUndefined();
      expect(q.options.length).toBeGreaterThanOrEqual(2);
      expect(q.question).toBeDefined();
    });
  });
});

