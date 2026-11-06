/**
 * Mock adapter selection primitives (Phase 3).
 *
 * PURE and intentionally free of side effects: any module — client or
 * server — may import this. It must never throw on import and must never
 * instantiate adapters.
 *
 * SECURITY-CRITICAL (see guard.server.ts): the hard production guard lives
 * ONLY in server code. Browser code never re-implements it: whatever the
 * server serves was already vetted by the guard, because a page cannot be
 * rendered without passing through the server layout.
 *
 * Flag semantics (documented in docs/environments.md):
 *  - `NEXT_PUBLIC_API_MOCK` absent or "true"  -> mock adapter
 *  - `NEXT_PUBLIC_API_MOCK=false`             -> live HTTP adapter
 * Inlining note: NEXT_PUBLIC_* values are baked in at build time — changing
 * the flag requires a rebuild. `ALLOW_MOCK_IN_PRODUCTION` is NOT a
 * NEXT_PUBLIC_* value: it is visible to server code only, which is exactly
 * why the guard runs there (a client-side guard would see `undefined` and
 * mis-fire even for the sanctioned e2e topology).
 */

export interface MockSelection {
  active: boolean;
  /** Raw flag value as seen at build time (debugging/diagnostics). */
  flag: string | undefined;
}

/**
 * Adapter mode names (Phase 4 naming kept for UI honesty surfaces). Since
 * Phase 5, "hybrid" means EVERYTHING is live: the DB-backed API serves
 * tracks/modules/quiz AND the authenticated user flows (profile, progress,
 * server-side grading, attempts, reset) — no mock phase boundary remains.
 */
export type ApiMode = "mock" | "hybrid";

let cachedSelection: MockSelection | undefined;

export function computeMockSelection(): MockSelection {
  if (!cachedSelection) {
    // Read the env value literally so Next's build-time inlining applies.
    const flag = process.env.NEXT_PUBLIC_API_MOCK;
    const active = flag !== "false";
    cachedSelection = { active, flag };
  }
  return cachedSelection;
}

/** Convenience view for UI surfaces (mock banner, tests). */
export function isMockAdapterActive(): boolean {
  return computeMockSelection().active;
}

/** Fine-grained mode for honest UI disclosure (banner chips etc.). */
export function getApiMode(): ApiMode {
  return computeMockSelection().active ? "mock" : "hybrid";
}

/**
 * Hard production guard. Throws when a production context would serve mock
 * data without the explicit `ALLOW_MOCK_IN_PRODUCTION=true` escape hatch.
 * Invoked exclusively from server modules (guard.server.ts) — module init
 * there fails server startup and `next build` page-data collection.
 */
export function assertMockSelectionAllowed(): void {
  if (!computeMockSelection().active) return;
  if (process.env.NODE_ENV !== "production") return;
  if (process.env.ALLOW_MOCK_IN_PRODUCTION === "true") return;

  throw new Error(
    "DevPulse configuration error: the mock API adapter is selected in a " +
      "production build (NEXT_PUBLIC_API_MOCK is not 'false'). Production " +
      "must never silently serve mock API responses. Either set " +
      "NEXT_PUBLIC_API_MOCK=false for live endpoints, or, exclusively for " +
      "the e2e test topology, set ALLOW_MOCK_IN_PRODUCTION=true. " +
      "See docs/environments.md."
  );
}
