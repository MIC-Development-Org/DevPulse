import type { Prisma, QuizAttempt, QuizQuestion } from "@prisma/client";
import { prisma } from "../lib/prisma";

/**
 * Data-access layer for persisted quiz banks (Phase 4) and persisted quiz
 * attempts (Phase 5).
 *
 * These rows are the server-only source of grading truth: `correctOptionIndex`
 * and `explanation` live here and must be stripped by the quiz service before
 * anything is returned to a browser. Attempt rows are append-only: one row
 * per graded submission, best score per (user, module) derived by the
 * progress service and denormalized onto UserModuleProgress.
 */
export const quizRepository = {
  /** Authored bank of one module, ordered exactly as authored (position ASC). */
  listQuestionsByModuleId: async (moduleId: string): Promise<QuizQuestion[]> =>
    prisma.quizQuestion.findMany({ where: { moduleId }, orderBy: { position: "asc" } }),

  /** Per-module question counts for module lists (0 for unbanked modules). */
  countQuestionsByModuleIds: async (
    moduleIds: string[]
  ): Promise<Record<string, number>> => {
    if (moduleIds.length === 0) {
      return {};
    }

    const grouped = await prisma.quizQuestion.groupBy({
      by: ["moduleId"],
      where: { moduleId: { in: moduleIds } },
      _count: { moduleId: true },
    });

    return Object.fromEntries(grouped.map((group) => [group.moduleId, group._count.moduleId]));
  },

  // --- Persisted attempts (Phase 5) --------------------------------------

  /** Append one graded attempt (runs inside the grading transaction). */
  createAttempt: (
    client: Prisma.TransactionClient,
    data: {
      userId: string;
      moduleId: string;
      score: number;
      total: number;
      percentage: number;
      passed: boolean;
      answers: Prisma.InputJsonValue;
      breakdown: Prisma.InputJsonValue;
    }
  ): Promise<QuizAttempt> => client.quizAttempt.create({ data }),

  /**
   * The calling user's attempts, latest first. Ownership is enforced at the
   * repository layer via the `userId` filter — no query path exists that can
   * return another user's rows.
   */
  listAttemptsByUser: (
    userId: string,
    options: { moduleId?: string; limit?: number } = {},
    client: Prisma.TransactionClient = prisma
  ): Promise<QuizAttempt[]> =>
    client.quizAttempt.findMany({
      where: {
        userId,
        ...(options.moduleId ? { moduleId: options.moduleId } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: options.limit,
    }),

  /** Best percentage + attempt count per module for one user. */
  aggregateBestScores: (userId: string): Promise<
    Array<{ moduleId: string; best: number | null; count: number }>
  > =>
    prisma.quizAttempt.groupBy({
      by: ["moduleId"],
      where: { userId },
      _max: { percentage: true },
      _count: { _all: true },
    }).then((groups) =>
      groups.map((group) => ({
        moduleId: group.moduleId,
        best: group._max.percentage,
        count: group._count._all,
      }))
    ),

  /** Activity timestamps (attempt createdAt) for streak/activity derivation. */
  listAttemptTimestamps: (userId: string): Promise<{ createdAt: Date }[]> =>
    prisma.quizAttempt.findMany({
      where: { userId },
      select: { createdAt: true },
    }),

  /** Progress reset — removes every attempt row of the calling user. */
  deleteAttemptsForUser: (userId: string, client: Prisma.TransactionClient = prisma) =>
    client.quizAttempt.deleteMany({ where: { userId } }),
};
