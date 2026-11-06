import { QuizSubmissionSchema, QuizResultSchema } from "@devpulse/contracts";
import { authedBackendFetch, jsonBackendResponse, requireSessionToken } from "@/lib/bff";

/**
 * POST /api/business/quiz/submissions (Phase 5) — grading submission proxy.
 *
 * SECURITY pipeline:
 *  1. requireSessionToken — guests never reach Express;
 *  2. inbox re-validation with the SHARED QuizSubmissionSchema — a browser
 *     can only ever send `{moduleId, answers}`; scores/pass/completion
 *     fields are dropped and malformed payloads answer 400 here (defense in
 *     depth: Express applies the identical validation itself);
 *  3. the backend computes the verdict, persists attempt+progress in one
 *     transaction and returns the QuizResult — forwarded only after
 *     re-validation against QuizResultSchema.
 */
export async function POST(request: Request) {
  const session = await requireSessionToken();
  if (!session.ok) return session.response;

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return Response.json(
      { error: "Invalid quiz submission payload" },
      { status: 400, headers: { "cache-control": "no-store" } }
    );
  }

  const parsed = QuizSubmissionSchema.safeParse(raw);
  if (!parsed.success) {
    return Response.json(
      { error: "Invalid quiz submission payload" },
      { status: 400, headers: { "cache-control": "no-store" } }
    );
  }

  const response = await authedBackendFetch("/me/quiz/submissions", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(parsed.data),
  });
  const result = await jsonBackendResponse(response, { schema: QuizResultSchema });
  if (!result.ok) return result.response;
  return Response.json(result.data, { status: 201, headers: { "cache-control": "no-store" } });
}
