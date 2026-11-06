import {
  QuizResultSchema,
  QuizSubmissionSchema,
} from "@devpulse/contracts";
import type { QuizResult } from "@devpulse/contracts";
import type { QuizQuestion } from "@prisma/client";
import { HttpError } from "../middleware/errorHandler";
import { prisma } from "../lib/prisma";
import { quizRepository } from "../repositories/quiz.repository";
import { progressRepository } from "../repositories/progress.repository";
import { trackRepository } from "../repositories/track.repository";
import { assertModuleUnlockedFor } from "./progress.service";

/**
 * Grading service (Phase 5) — the ONLY quiz grader in the system.
 *
 * SECURITY MODEL (approved D3/D8):
 *  - The browser submits `{ moduleId, answers }` (QuizSubmissionSchema) and
 *    NOTHING else. Scores, pass state and completion sent by clients are
 *    never read: all of them are recomputed here from the persisted DB bank.
 *  - Grading runs over the COMPLETE authored bank. Unanswered questions are
 *    scored as incorrect; an empty submission is a 400, never a 100%.
 *  - Every answer key must be a question of the submitted module (unknown
 *    ids and cross-module ids are 400s); every value must be an integer
 *    option index (JS records cannot hold duplicate keys — a JSON body with
 *    repeated keys collapses to one entry, which is the enforced semantics).
 *  - `correctOptionIndex`/`explanation` never leave this service except as
 *    computed review material in `missedTopics` (only for missed questions).
 *  - The attempt row + progress upsert happen in ONE transaction: a graded
 *    attempt always leaves consistent progress state (or nothing at all).
 *  - Locked modules are rejected (403) before any write occurs (D2).
 */

const OPTION_INDEX_MAX = 3; // authored banks expose exactly four options.

const INVALID_PAYLOAD_MESSAGE = "Invalid quiz submission payload";

export async function gradeSubmission(
  userId: string,
  rawSubmission: unknown
): Promise<QuizResult> {
  const parsed = QuizSubmissionSchema.safeParse(rawSubmission);
  if (!parsed.success) {
    throw new HttpError(400, INVALID_PAYLOAD_MESSAGE);
  }
  const { moduleId, answers } = parsed.data;

  if (Object.keys(answers).length === 0) {
    throw new HttpError(400, "Submission contains no answers — answer at least one question.");
  }

  const moduleRow = await trackRepository.findModuleById(moduleId);
  if (!moduleRow) {
    throw new HttpError(404, "Module not found");
  }

  // D2: locked modules may neither be started nor graded (no partial state).
  await assertModuleUnlockedFor(userId, moduleRow);

  const bank = await quizRepository.listQuestionsByModuleId(moduleRow.id);
  if (bank.length === 0) {
    throw new HttpError(404, "The quiz for this module is not published yet.");
  }

  const bankById = new Map(bank.map((question) => [question.id, question]));
  for (const [questionId, selectedOptionIndex] of Object.entries(answers)) {
    if (!bankById.has(questionId)) {
      // Deliberately vague: never distinguishes unknown vs cross-module ids.
      throw new HttpError(
        400,
        "Submission references questions that do not belong to this module."
      );
    }
    if (
      !Number.isInteger(selectedOptionIndex) ||
      selectedOptionIndex < 0 ||
      selectedOptionIndex > OPTION_INDEX_MAX
    ) {
      throw new HttpError(
        400,
        `Answer selections must be whole numbers between 0 and ${OPTION_INDEX_MAX}.`
      );
    }
  }

  const { score, topicBreakdown, missedTopics } = gradeAgainstBank(bank, answers);
  const percentage = Math.round((score / bank.length) * 100);
  const passed = percentage >= moduleRow.passThreshold;

  const now = new Date();
  const attempt = await prisma.$transaction(async (tx) => {
    const created = await quizRepository.createAttempt(tx, {
      userId,
      moduleId: moduleRow.id,
      score,
      total: bank.length,
      percentage,
      passed,
      answers,
      breakdown: { topicBreakdown, missedTopics },
    });
    await progressRepository.upsertProgressForAttempt(
      userId,
      moduleRow.id,
      percentage,
      passed,
      now,
      tx
    );
    return created;
  });

  // D2: passing this module completes the banked chain through it, so the
  // next module in the track (banked or unbanked bridge) is the newly
  // unlocked one. Null on the last module of a track.
  const nextModule = passed
    ? await trackRepository.findNextModuleInTrack(moduleRow.trackId, moduleRow.position)
    : null;

  const message = passed
    ? `Outstanding work! You scored ${percentage}% (pass mark is ${moduleRow.passThreshold}%).${
        nextModule ? " The next module has been unlocked!" : ""
      }`
    : `You scored ${percentage}%, just below the ${moduleRow.passThreshold}% pass mark. Review the missed concepts below and retry with confidence!`;

  return QuizResultSchema.parse({
    submissionId: attempt.id,
    moduleId: moduleRow.id,
    score,
    totalQuestions: bank.length,
    percentage,
    passed,
    passMarkPercentage: moduleRow.passThreshold,
    topicBreakdown,
    missedTopics,
    unlockedNextModuleId: nextModule?.id ?? null,
    message,
  });
}

/**
 * Grades a validated submission over the full authored bank (ordered).
 * Explanations are returned ONLY for missed questions (wrong answer or
 * unanswered — the fully missing entry counts as incorrect, D3).
 */
function gradeAgainstBank(
  bank: QuizQuestion[],
  answers: Record<string, number>
): {
  score: number;
  topicBreakdown: { topic: string; correct: number; total: number; percentage: number }[];
  missedTopics: { topic: string; explanation: string; reviewConcept: string }[];
} {
  let score = 0;

  // ordered per-topic tallies; topics appear in bank order
  const perTopic = new Map<string, { correct: number; total: number }>();
  const missedTopics: { topic: string; explanation: string; reviewConcept: string }[] = [];

  for (const question of bank) {
    const topicTally = perTopic.get(question.topic) ?? { correct: 0, total: 0 };

    topicTally.total += 1;
    const selected = answers[question.id];
    const answeredCorrectly =
      selected !== undefined && selected === question.correctOptionIndex;
    if (answeredCorrectly) {
      score += 1;
      topicTally.correct += 1;
    } else {
      missedTopics.push({
        topic: question.topic,
        explanation: question.explanation,
        reviewConcept: `Review: ${question.question}`,
      });
    }
    perTopic.set(question.topic, topicTally);
  }

  const topicBreakdown = [...perTopic.entries()].map(([topic, tally]) => ({
    topic,
    correct: tally.correct,
    total: tally.total,
    percentage: Math.round((tally.correct / tally.total) * 100),
  }));

  return { score, topicBreakdown, missedTopics };
}
