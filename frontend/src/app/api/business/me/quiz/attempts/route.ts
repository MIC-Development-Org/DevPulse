import { z } from "zod";
import { QuizAttemptHistorySchema } from "@devpulse/contracts";
import { authedBackendFetch, jsonBackendResponse, requireSessionToken } from "@/lib/bff";

/**
 * GET /api/business/me/quiz/attempts (Phase 5) — the signed-in user's
 * persisted attempt history (latest first).
 *
 * Query: optional `moduleId` (kebab-case editorial id) and `limit`
 * (1..50, backend default 20). Values are validated HERE so malformed query
 * strings never reach Express (400 before the proxy hop).
 */
const AttemptsQuerySchema = z.object({
  moduleId: z
    .string()
    .min(1)
    .max(120)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .optional(),
  limit: z.coerce.number().int().min(1).max(50).optional(),
});

export async function GET(request: Request) {
  const session = await requireSessionToken();
  if (!session.ok) return session.response;

  const url = new URL(request.url);
  const query = AttemptsQuerySchema.safeParse({
    moduleId: url.searchParams.get("moduleId") ?? undefined,
    limit: url.searchParams.get("limit") ?? undefined,
  });
  if (!query.success) {
    return Response.json(
      { error: "Invalid attempts query" },
      { status: 400, headers: { "cache-control": "no-store" } }
    );
  }

  const search = new URLSearchParams();
  if (query.data.moduleId) search.set("moduleId", query.data.moduleId);
  if (query.data.limit !== undefined) search.set("limit", String(query.data.limit));
  const suffix = search.toString();

  const response = await authedBackendFetch(
    `/me/quiz/attempts${suffix ? `?${suffix}` : ""}`
  );
  const result = await jsonBackendResponse(response, { schema: QuizAttemptHistorySchema });
  if (!result.ok) return result.response;
  return Response.json(result.data, { headers: { "cache-control": "no-store" } });
}
