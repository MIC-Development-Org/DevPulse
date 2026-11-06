import { PublicQuizQuestionListSchema } from "@devpulse/contracts";
import type { PublicQuizQuestionList } from "@devpulse/contracts";
import type { Prisma } from "@prisma/client";
import { HttpError } from "../middleware/errorHandler";
import { quizRepository } from "../repositories/quiz.repository";
import { trackRepository } from "../repositories/track.repository";

/**
 * Quiz service (Phase 4) — public browser payloads for persisted quiz banks.
 *
 * SECURITY MODEL:
 *  - `correctOptionIndex` and `explanation` are server-only fields. They are
 *    stripped by EXPLICIT field mapping below (never by spreading rows or
 *    omitting fields from arbitrary row objects), so a schema evolution can
 *    not accidentally leak grading truth into a public response.
 *  - An empty result (no authored bank) is a normal empty array. Placeholder
 *    or fabricated questions are never generated.
 *  - Modules are only addressable through their track: mismatched slug pairs
 *    produce the same 404 as unknown modules.
 */

const QUIZ_DRIFT_MESSAGE = "Quiz content is unavailable";

/** JSON column guard: options must be exactly four string alternatives. */
function requireOptions(questionId: string, options: Prisma.JsonValue): string[] {
  if (
    !Array.isArray(options) ||
    options.length !== 4 ||
    !options.every((option) => typeof option === "string")
  ) {
    console.error(`Quiz data drift: question "${questionId}" has malformed options`);
    throw new HttpError(500, QUIZ_DRIFT_MESSAGE);
  }
  return options as string[];
}

/** GET /tracks/:trackSlug/modules/:moduleSlug/quiz */
export const listPublicQuizQuestions = async (
  trackSlug: string,
  moduleSlug: string
): Promise<PublicQuizQuestionList> => {
  const moduleRow = await trackRepository.findModuleByTrackAndSlugs(trackSlug, moduleSlug);
  if (!moduleRow) {
    throw new HttpError(404, "Module not found");
  }

  const rows = await quizRepository.listQuestionsByModuleId(moduleRow.id);

  return PublicQuizQuestionListSchema.parse(
    rows.map((row) => ({
      id: row.id,
      topic: row.topic,
      question: row.question,
      options: requireOptions(row.id, row.options),
      hint: row.hint,
    }))
  );
};
