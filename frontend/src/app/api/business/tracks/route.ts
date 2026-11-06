import { TrackListSchema } from "@devpulse/contracts";
import { authedBackendFetch, jsonBackendResponse } from "@/lib/bff";

/**
 * GET /api/business/tracks — real DB-backed learning content (Phase 4).
 *
 * Server-to-server proxy to the Express backend (`/tracks`), validated
 * against the shared contract before re-serialization. Replaces the Phase 3
 * mock dead-route gate: non-mock builds now serve REAL data, and backend
 * failure envelopes are forwarded verbatim (never silently downgraded).
 */
export async function GET() {
  const response = await authedBackendFetch("/tracks");
  const result = await jsonBackendResponse(response, { schema: TrackListSchema });
  if (!result.ok) return result.response;
  return Response.json(result.data, { headers: { "cache-control": "no-store" } });
}
