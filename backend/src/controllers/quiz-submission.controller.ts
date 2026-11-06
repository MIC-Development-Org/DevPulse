import { z } from "zod";
import type { RequestHandler } from "express";
import { quizRepository } from "../repositories/quiz.repository";
import { gradeSubmission } from "../services/grading.service";

/**
 * Quiz submission controllers (Phase 5).
 *
 * POST /me/quiz/submissions is the single grading path: the browser sends
 * `{ moduleId, answers }` (QuizSubmissionSchema) and receives the computed
 * QuizResult. The request body NEVER carries score/pass/completion input,
 * and the identity under which the attempt is persisted comes exclusively
 * from `req.authContext` (requireAuth) — never from a field.
 */

/** Attempts list query: optional banked-module filter, bounded page size. */
const AttemptsQuerySchema = z.object({
  moduleId: z
    .string()
    .max(128)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

/** POST /me/quiz/submissions — grade + persist in one transaction. */
export const submitQuizSubmission: RequestHandler = async (req, res, next) => {
  try {
    res.status(201).json(await gradeSubmission(req.authContext!.userId, req.body));
  } catch (error) {
    next(error);
  }
};

/**
 * GET /me/quiz/attempts — the caller's persisted attempt history
 * (latest first; `?moduleId=&limit=` filters). Ownership is enforced by the
 * userId filter — only own rows can ever be serialized here.
 */
export const listMyAttempts: RequestHandler = async (req, res, next) => {
  try {
    const query = AttemptsQuerySchema.safeParse(req.query);
    if (!query.success) {
      res.status(400).json({ error: "Invalid attempts query" });
      return;
    }

    const attempts = await quizRepository.listAttemptsByUser(req.authContext!.userId, {
      moduleId: query.data.moduleId,
      limit: query.data.limit,
    });

    res.json(
      attempts.map((attempt) => ({
        id: attempt.id,
        moduleId: attempt.moduleId,
        score: attempt.score,
        total: attempt.total,
        percentage: attempt.percentage,
        passed: attempt.passed,
        createdAt: attempt.createdAt.toISOString(),
      }))
    );
  } catch (error) {
    next(error);
  }
};
