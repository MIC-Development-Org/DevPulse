import { ModuleProgressEntrySchema } from "@devpulse/contracts";
import { authedBackendFetch, jsonBackendResponse, requireSessionToken } from "@/lib/bff";

/** Same editorial-id shape the backend enforces: kebab-case, bounded. */
const MODULE_ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * POST /api/business/me/progress/:moduleId/start (Phase 5).
 *
 * Records engagement with an UNLOCKED module (server-verified). Malformed
 * module ids answer 400 BEFORE any backend call; locked modules produce the
 * backend's 403 envelope verbatim; guests get the shared 401 envelope.
 */
export async function POST(
  request: Request,
  { params }: { params: { moduleId: string } }
) {
  const session = await requireSessionToken();
  if (!session.ok) return session.response;

  const moduleId = typeof params?.moduleId === "string" ? params.moduleId : "";
  if (moduleId.length === 0 || moduleId.length > 120 || !MODULE_ID_PATTERN.test(moduleId)) {
    return Response.json(
      { error: "Invalid module id." },
      { status: 400, headers: { "cache-control": "no-store" } }
    );
  }

  const response = await authedBackendFetch(
    `/me/progress/${encodeURIComponent(moduleId)}/start`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{}",
    }
  );
  const result = await jsonBackendResponse(response, { schema: ModuleProgressEntrySchema });
  if (!result.ok) return result.response;
  return Response.json(result.data, { headers: { "cache-control": "no-store" } });
}
