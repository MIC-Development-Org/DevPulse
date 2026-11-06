import { TrackSchema } from "@devpulse/contracts";
import { authedBackendFetch, jsonBackendResponse } from "@/lib/bff";

/**
 * GET /api/business/tracks/:slug — real DB-backed track detail (Phase 4).
 * Backend 404 is forwarded verbatim (an envelope, not mock data); the client
 * adapter maps it to `null`.
 */
export async function GET(
  _request: Request,
  { params }: { params: { slug: string } }
) {
  const response = await authedBackendFetch(
    `/tracks/${encodeURIComponent(params.slug)}`
  );
  const result = await jsonBackendResponse(response, { schema: TrackSchema });
  if (!result.ok) return result.response;
  return Response.json(result.data, { headers: { "cache-control": "no-store" } });
}
