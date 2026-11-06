import { ProgressOverviewSchema } from "@devpulse/contracts";
import { authedBackendFetch, jsonBackendResponse, requireSessionToken } from "@/lib/bff";

/**
 * GET /api/business/me/progress (Phase 5) — whole-map progress overview for
 * the signed-in user (server-derived unlock chain; attempt counters).
 * Unauthenticated browsers get the shared 401 envelope; no mock progress is
 * ever served here (D1).
 */
export async function GET() {
  const session = await requireSessionToken();
  if (!session.ok) return session.response;

  const response = await authedBackendFetch("/me/progress");
  const result = await jsonBackendResponse(response, { schema: ProgressOverviewSchema });
  if (!result.ok) return result.response;
  return Response.json(result.data, { headers: { "cache-control": "no-store" } });
}
