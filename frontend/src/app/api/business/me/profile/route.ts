import { UserProfileSchema } from "@devpulse/contracts";
import { authedBackendFetch, jsonBackendResponse, requireSessionToken } from "@/lib/bff";

/**
 * GET /api/business/me/profile (Phase 5) — the signed-in user's REAL profile.
 *
 * Server-to-server proxy to the authenticated Express endpoint (/me/profile).
 * requireSessionToken maps guest browsers to the shared 401 envelope; the
 * session token is attached server-side only. Identity is never carried in
 * the request — Express derives it from the validated Session row.
 */
export async function GET() {
  const session = await requireSessionToken();
  if (!session.ok) return session.response;

  const response = await authedBackendFetch("/me/profile");
  const result = await jsonBackendResponse(response, { schema: UserProfileSchema });
  if (!result.ok) return result.response;
  return Response.json(result.data, { headers: { "cache-control": "no-store" } });
}
