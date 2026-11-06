import type { ApiClient } from "./api-client";
import { MockApiClient } from "./mock-api-client";
import { HybridApiClient } from "./hybrid-api-client";
import { computeMockSelection, getApiMode, type ApiMode } from "./selection";

/**
 * Concrete `api` behind the ApiClient interface (Phase 3; hybrid since 4).
 *
 * Selection depends only on the build-time mock flag. This module is inert
 * at import time (no side effects) so both the client and server graphs can
 * use it safely. The hard production guard lives exclusively in
 * `guard.server.ts` (server-only): the server decides whether a page is
 * served at all, so it is the only place where a mock-selection veto can be
 * reliable.
 *
 *  - mock mode  (NEXT_PUBLIC_API_MOCK absent/true): pure MockApiClient.
 *  - hybrid mode(NEXT_PUBLIC_API_MOCK=false): learning content from the live
 *    DB-backed API, user-scoped flows still mocked until Phase 5.
 */
export const api: ApiClient = computeMockSelection().active
  ? new MockApiClient()
  : new HybridApiClient();

/** Which adapter family is active — "hybrid" is live-content, mock-user. */
export function getActiveApiMode(): ApiMode {
  return getApiMode();
}
