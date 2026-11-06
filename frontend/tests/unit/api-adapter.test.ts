import { afterAll, describe, expect, it, vi } from "vitest";

/**
 * Phase 3 selection/guard tests, including the hard production guard:
 * a production context must never silently serve the mock adapter — only
 * the sanctioned e2e escape hatch (`ALLOW_MOCK_IN_PRODUCTION=true`) can
 * authorize it, and the guard must run ONLY in server code
 * (lib/api/guard.server.ts) because browser bundles can never see
 * non-NEXT_PUBLIC env values.
 */

// guard.server.ts is a server-only module; the "server-only" package throws
// when resolved outside RSC harnesses, so stub it for unit tests.
vi.mock("server-only", () => ({}));

const ENV_KEYS = [
  "NODE_ENV",
  "NEXT_PUBLIC_API_MOCK",
  "ALLOW_MOCK_IN_PRODUCTION",
] as const;

const SAVED_ENV: Record<string, string | undefined> = Object.fromEntries(
  ENV_KEYS.map((key) => [key, process.env[key]])
);

function withEnv(
  nodeEnv: string | undefined,
  mock: string | undefined,
  allowMock: string | undefined
): void {
  // process.env.NODE_ENV is typed read-only; the record view is mutable.
  (process.env as Record<string, string | undefined>).NODE_ENV = nodeEnv;
  if (mock === undefined) delete process.env.NEXT_PUBLIC_API_MOCK;
  else process.env.NEXT_PUBLIC_API_MOCK = mock;
  if (allowMock === undefined) delete process.env.ALLOW_MOCK_IN_PRODUCTION;
  else process.env.ALLOW_MOCK_IN_PRODUCTION = allowMock;
}

async function freshSelection(): Promise<
  typeof import("@/lib/api/selection")
> {
  // Re-evaluate the module so cached selection state is recomputed under
  // the current environment values.
  vi.resetModules();
  return await import("@/lib/api/selection");
}

afterAll(() => {
  for (const [key, value] of Object.entries(SAVED_ENV)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
});

describe("adapter selection primitives", () => {
  it("defaults to the mock adapter outside production (existing behavior)", async () => {
    withEnv("development", undefined, undefined);
    const selection = await freshSelection();
    expect(selection.computeMockSelection().active).toBe(true);
  });

  it("selects the HTTP adapter under NEXT_PUBLIC_API_MOCK=false", async () => {
    withEnv("development", "false", undefined);
    const selection = await freshSelection();
    expect(selection.computeMockSelection().active).toBe(false);

    const adapter = await import("@/lib/api/adapter");
    expect(adapter.api).toBeInstanceOf(
      (await import("@/lib/api/http-api-client")).HttpApiClient
    );
  });

  it("explicit false only; any other value keeps the mock default", async () => {
    withEnv("development", "1", undefined);
    const selection = await freshSelection();
    expect(selection.computeMockSelection().active).toBe(true);

    const adapter = await import("@/lib/api/adapter");
    expect(adapter.api).toBeInstanceOf(
      (await import("@/lib/api/mock-api-client")).MockApiClient
    );
  });
});

describe("hard production mock guard (pure primitive)", () => {
  it("is inert under the test NODE_ENV used by vitest", async () => {
    withEnv("test", "true", undefined);
    const selection = await freshSelection();
    expect(() => selection.assertMockSelectionAllowed()).not.toThrow();
  });

  it("throws when production would run on mock data", async () => {
    withEnv("production", "true", undefined);
    const selection = await freshSelection();
    const error = (() => {
      try {
        selection.assertMockSelectionAllowed();
        return null;
      } catch (e) {
        return e as Error;
      }
    })();
    expect(error?.message).toContain("mock API adapter");
    expect(error?.message).toContain("ALLOW_MOCK_IN_PRODUCTION=true");
    expect(error?.message).toContain("docs/environments.md");
  });

  it("throws when production leaves the mock flag unset (explicit required)", async () => {
    withEnv("production", undefined, undefined);
    const selection = await freshSelection();
    expect(() => selection.assertMockSelectionAllowed()).toThrow(
      /NEXT_PUBLIC_API_MOCK/
    );
  });

  it("never throws when mock flag is disabled in production", async () => {
    withEnv("production", "false", undefined);
    const selection = await freshSelection();
    expect(() => selection.assertMockSelectionAllowed()).not.toThrow();
  });

  it("passes only for the sanctioned e2e topology (ALLOW_MOCK_IN_PRODUCTION=true)", async () => {
    withEnv("production", "true", "true");
    const selection = await freshSelection();
    expect(() => selection.assertMockSelectionAllowed()).not.toThrow();
  });
});

describe("hard production mock guard (server-only module init)", () => {
  it("guard.server fails import when production would serve mock data", async () => {
    withEnv("production", "true", undefined);
    vi.resetModules();
    await expect(import("@/lib/api/guard.server")).rejects.toThrow(
      /mock API adapter/
    );
  });

  it("guard.server imports cleanly in the dev context (no throw)", async () => {
    withEnv("development", "true", undefined);
    vi.resetModules();
    await expect(import("@/lib/api/guard.server")).resolves.toBeTruthy();
  });

  it("guard.server imports cleanly under the sanctioned e2e escape", async () => {
    withEnv("production", "true", "true");
    vi.resetModules();
    await expect(import("@/lib/api/guard.server")).resolves.toBeTruthy();
  });
});
