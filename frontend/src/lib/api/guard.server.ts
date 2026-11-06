import "server-only";

import { assertMockSelectionAllowed } from "./selection";

/**
 * SERVER-side hard production guard (Phase 3).
 *
 * SECURITY-CRITICAL: production must NEVER silently run on the mock adapter.
 * Importing this module evaluates the guard at module initialization:
 *  - "next build" page-data collection fails when a production build would
 *    prerender content with the mock adapter and no sanctioned escape;
 *  - server startup fails on the first server render in production mode.
 *
 * `ALLOW_MOCK_IN_PRODUCTION=true` is the ONLY sanctioned escape, and its
 * only documented consumer is the Playwright e2e topology (see
 * playwright.config.ts and docs/environments.md). Real deployments must not
 * set it.
 *
 * This deliberately executes in SERVER code only — `import "server-only"`
 * makes any accidental client-graph inclusion a build error, which also
 * keeps the browser free of a guard that could not see server-only env
 * values correctly.
 */
assertMockSelectionAllowed();

export {};
