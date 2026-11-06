import type { QuizQuestion } from "@prisma/client";
import { prisma } from "../lib/prisma";

/**
 * Data-access layer for persisted quiz banks (Phase 4).
 *
 * These rows are the server-only source of grading truth: `correctOptionIndex`
 * and `explanation` live here and must be stripped by the quiz service before
 * anything is returned to a browser.
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
};
