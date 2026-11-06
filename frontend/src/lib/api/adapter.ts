import type { ApiClient } from "./api-client";
import { MockApiClient } from "./mock-api-client";
import { HybridApiClient } from "./hybrid-api-client";
import { getApiMode, type ApiMode } from "./selection";

/**
 * Concrete `api` behind the ApiClient interface (Phase 3; fully-real user
 * flows in hybrid mode since Phase 5).
 *
 * BUILD-TIME DEAD-CODE ELIMINATION (approved Phase 5 decision D6 — this
 * module is load-bearing for bundle security):
 *
 *  - The env read is INLINED HERE so NEXT_PUBLIC_API_MOCK is replaced with a
 *    string literal inside this exact module during the Next.js production
 *    build. `MOCK_ADAPTER_ACTIVE` then folds to `false` in real/hybrid
 *    builds and SWC/webpack drops the `new MockApiClient()` branch as dead
 *    code — which makes the `MockApiClient` binding unused and allows the
 *    entire mock stack (mock-api-client → mock-data → QUIZ_BANKS answer
 *    keys, plus the in-browser "grading" simulation) to be tree-shaken OUT
 *    of the shipped client bundles. Cross-module reads (selection.ts)
 *    defeated constant folding in Phase 4 — that is what the bundle scanner
 *    caught, so this read stays inlined.
 *  - ALL mock instantiation sits behind the folded flag — a `?? new
 *    MockApiClient()` fallback nor any other reachable reference may exist.
 *  - The removable chain must be pure: every module below the fold is
 *    side-effect-free and @devpulse/curriculum ships "sideEffects": false.
 *    Do not add top-level side effects here, in mock-data, or in
 *    mock-api-client, or the tree shake will keep the bank in the bundle.
 *  - The bundle scanner (scripts/check-production-bundle.mjs) fails the
 *    production verification if answer keys or the mock grading code reach
 *    a shipped chunk anyway.
 *
 * The hard production guard still lives exclusively in guard.server.ts (the
 * server decides whether a page is served at all).
 *
 *  - mock mode   (NEXT_PUBLIC_API_MOCK absent/true): pure MockApiClient.
 *  - hybrid mode (NEXT_PUBLIC_API_MOCK=false): everything live; certificates
 *    stay static by design (P3 user decision).
 */
const MOCK_ADAPTER_ACTIVE = process.env.NEXT_PUBLIC_API_MOCK !== "false";

export const api: ApiClient = MOCK_ADAPTER_ACTIVE
  ? new MockApiClient()
  : new HybridApiClient();

/**
 * Which adapter family is active. Kept for UI chromium honesty surfaces
 * (mock banner); in hybrid mode the app is fully live — no phase boundary
 * is left where mock data could appear (D1: never guest-phase mock data).
 */
export function getActiveApiMode(): ApiMode {
  return getApiMode();
}
