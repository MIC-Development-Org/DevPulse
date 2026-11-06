import { ModuleDetailSchema } from "@devpulse/contracts";
import { authedBackendFetch, jsonBackendResponse } from "@/lib/bff";

/**
 * GET /api/business/tracks/:trackSlug/modules/:moduleSlug — real DB-backed
 * module reader payload (Phase 4). Module existence is asserted against its
 * track on the backend, so mismatched slug pairs 404 as "Module not found"
 * (no cross-track relationship disclosure).
 */
export async function GET(
  _request: Request,
  { params }: { params: { slug: string; moduleSlug: string } }
) {
  const path =
    `/tracks/${encodeURIComponent(params.slug)}` +
    `/modules/${encodeURIComponent(params.moduleSlug)}`;
  const response = await authedBackendFetch(path);
  const result = await jsonBackendResponse(response, { schema: ModuleDetailSchema });
  if (!result.ok) return result.response;
  return Response.json(result.data, { headers: { "cache-control": "no-store" } });
}
