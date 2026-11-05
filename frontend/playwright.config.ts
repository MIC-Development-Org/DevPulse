import { defineConfig, devices } from "@playwright/test";

const PORT = process.env.PORT || "3001";
// localhost (not 127.0.0.1): production secure cookies are settable/sent on
// localhost trustworthy origins, and AUTH_URL must match the exact host.
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: "list",
  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  // Two servers (Phase 2): the Express backend must be reachable for
  // credentials registration/login, so the auth flow can exercise the real
  // chain: browser → Next BFF/Auth.js → Express → PostgreSQL.
  // The frontend server builds first so `next start` runs the current code.
  webServer: [
    {
      command: "npm run start",
      cwd: "../backend",
      url: "http://127.0.0.1:4000/health",
      name: "backend",
      reuseExistingServer: false,
      timeout: 90_000,
    },
    {
      // Production-mode build+start (existing convention). The inlined env is
      // the documented e2e topology (own ports, plain http, no reverse proxy):
      // AUTH_TRUST_HOST=true opens v5's strict production host check for our
      // own trusted server; AUTHJS_SESSION_COOKIE_INSECURE=true drops the
      // __Secure- prefix so plain-http clients deterministically get the
      // session cookie. Neither is ever used in real deployments — see
      // auth.ts + backend/docs/auth-integration.md.
      command: `set AUTH_TRUST_HOST=true&& set AUTHJS_SESSION_COOKIE_INSECURE=true&& set AUTH_URL=http://localhost:${PORT}&& npm run build && npm run start -- -p ${PORT} -H localhost`,
      url: BASE_URL,
      name: "frontend",
      reuseExistingServer: false,
      timeout: 240_000,
    },
  ],
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
