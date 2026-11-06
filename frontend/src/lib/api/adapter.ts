import type { ApiClient } from "./api-client";
import { MockApiClient } from "./mock-api-client";
import { HttpApiClient } from "./http-api-client";
import { computeMockSelection } from "./selection";

/**
 * Concrete `api` behind the ApiClient interface (Phase 3).
 *
 * Selection depends only on the build-time mock flag. This module is inert
 * at import time (no side effects) so both the client and server graphs can
 * use it safely. The hard production guard lives exclusively in
 * `guard.server.ts` (server-only): the server decides whether a page is
 * served at all, so it is the only place where a mock-selection veto can be
 * reliable.
 */
export const api: ApiClient = computeMockSelection().active
  ? new MockApiClient()
  : new HttpApiClient();
