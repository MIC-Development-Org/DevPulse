import type { Prisma, UserModuleProgress } from "@prisma/client";
import { prisma } from "../lib/prisma";

/**
 * Data-access layer for UserModuleProgress (Phase 5).
 *
 * This table is the server-authoritative per-(user, module) progress state.
 * Rows are keyed by the compound PK (userId, moduleId):
 *
 *  - start: creates an UNLOCKED row (or touches the existing one) — opening
 *    a module NEVER completes it and never introduces a new status; the
 *    approved enum stays LOCKED | UNLOCKED | COMPLETED.
 *  - grading: status only ever moves UNLOCKED -> COMPLETED via a passing
 *    attempt; bestScore keeps the maximum percentage; completedAt is the
 *    FIRST passing timestamp and is never moved by later attempts.
 *
 * All queries are userId-filtered at the repository layer: there is no code
 * path that can read or write another user's progress row.
 */
export const progressRepository = {
  listByUser: (userId: string, client: Prisma.TransactionClient = prisma): Promise<UserModuleProgress[]> =>
    client.userModuleProgress.findMany({ where: { userId } }),

  findByUserAndModule: (
    userId: string,
    moduleId: string,
    client: Prisma.TransactionClient = prisma
  ): Promise<UserModuleProgress | null> =>
    client.userModuleProgress.findUnique({
      where: { userId_moduleId: { userId, moduleId } },
    }),

  /**
   * Progress-start (POST /me/progress/:moduleId/start). Creates the row as
   * UNLOCKED on first engagement; when a row already exists nothing else
   * changes — `update: {}` merely refreshes the activity timestamp, keeping
   * the stored status/bestScore/completedAt intact (idempotent start).
   */
  touchOrStart: (
    userId: string,
    moduleId: string,
    client: Prisma.TransactionClient = prisma
  ): Promise<UserModuleProgress> =>
    client.userModuleProgress.upsert({
      where: { userId_moduleId: { userId, moduleId } },
      update: {},
      create: { userId, moduleId, status: "UNLOCKED" as const },
    }),

  /**
   * Grading-side progress upsert (runs inside the submission transaction).
   * The row is guaranteed to exist or be creatable only when the module was
   * UNLOCKED for the user (the grading service checks first — grading a
   * locked module is rejected before any write happens).
   */
  /**
   * Grading-side progress upsert (runs inside the submission transaction).
   * The row is guaranteed to exist or be creatable only when the module was
   * UNLOCKED for the user (the grading service checks first — grading a
   * locked module is rejected before any write happens).
   *
   * Status moves UNLOCKED -> COMPLETED on the first passing attempt and is
   * never downgraded; bestScore keeps the maximum; completedAt is anchored
   * to the FIRST pass and later attempts never move it.
   */
  upsertProgressForAttempt: async (
    userId: string,
    moduleId: string,
    percentage: number,
    passed: boolean,
    now: Date,
    client: Prisma.TransactionClient
  ): Promise<UserModuleProgress> => {
    const existing = await client.userModuleProgress.findUnique({
      where: { userId_moduleId: { userId, moduleId } },
    });

    if (!existing) {
      return client.userModuleProgress.create({
        data: {
          userId,
          moduleId,
          status: passed ? "COMPLETED" : "UNLOCKED",
          bestScore: percentage,
          completedAt: passed ? now : null,
        },
      });
    }

    const nextBest =
      existing.bestScore === null ? percentage : Math.max(existing.bestScore, percentage);

    return client.userModuleProgress.update({
      where: { userId_moduleId: { userId, moduleId } },
      data: {
        status: passed ? "COMPLETED" : existing.status,
        bestScore: nextBest,
        completedAt: passed ? existing.completedAt ?? now : existing.completedAt,
      },
    });
  },

  /** Progress reset (POST /me/progress/reset) — the caller's rows only. */
  deleteForUser: (userId: string, client: Prisma.TransactionClient = prisma): Promise<Prisma.BatchPayload> =>
    client.userModuleProgress.deleteMany({ where: { userId } }),
};
