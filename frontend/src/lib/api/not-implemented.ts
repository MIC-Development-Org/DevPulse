import { computeMockSelection } from "./selection";
// Server guard participation: route handlers are server code, so they
// enforce the hard production mock guard too (fails build data collection
// and production route execution).
import "./guard.server";

/**
 * Phase 3 dead-route safeguards.
 *
 * These Next.js route handlers serve static/mock business payloads that the
 * running app never fetches (data flows through the `api` adapter, not HTTP).
 * Their mock responses are fine for development, but they must never look
 * like a live backend serving real product data:
 *  - any non-mock context (production, or workers without the mock flag)
 *    receives 501 with the shared error envelope instead of mock payloads;
 *  - dev/mock behavior is unchanged.
 *
 * The real business endpoints (tracks, modules, quiz, profile, progress) are
 * Phase 4 work, per the approved plan.
 */

export function businessRouteNotImplemented(): boolean {
  return !computeMockSelection().active;
}

export function notImplementedResponse(): Response {
  return Response.json(
    {
      error:
        "This DevPulse business endpoint is not implemented yet — it ships in the next phase.",
    },
    { status: 501, headers: { "cache-control": "no-store" } }
  );
}
