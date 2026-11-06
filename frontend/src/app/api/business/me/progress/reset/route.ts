import { UserProfileSchema } from "@devpulse/contracts";
import { authedBackendFetch, jsonBackendResponse, requireSessionToken } from "@/lib/bff";

/**
 * POST /api/business/me/progress/reset (Phase 5).
 *
 * Wipes the signed-in user's progress + attempt rows server-side and
 * returns the freshly composed (empty) profile. Only the caller's data is
 * removable — the userId is derived from the validated session, never from
 * a field.
 */
export async function POST() {
  const session = await requireSessionToken();
  if (!session.ok) return session.response;

  const response = await authedBackendFetch("/me/progress/reset", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: "{}",
  });
  const result = await jsonBackendResponse(response, { schema: UserProfileSchema });
  if (!result.ok) return result.response;
  return Response.json(result.data, { headers: { "cache-control": "no-store" } });
}
