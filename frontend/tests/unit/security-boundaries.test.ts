import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Phase 3 security boundary suite — static, fast, and read-only.
 *
 * The boundaries these tests police:
 *  1. Browser-side transport never learns server-only configuration.
 *  2. The transport never attaches authorization material or reads cookies
 *     (identity is exclusively the BFF's job, lib/bff.ts).
 *  3. BFF source keeps `server-only` first and never references the browser
 *     mock/base-url flag.
 *  4. The hard production mock guard stays in adapter.ts and remains the
 *     documented escape (ALLOW_MOCK_IN_PRODUCTION=true lives ONLY in the
 *     Playwright e2e webServer command).
 *  5. The five dead mock routes keep their 501 dead-route gate.
 */

function repoSource(...segments: string[]): string {
  return readFileSync(
    path.join(process.cwd(), ...segments),
    "utf8"
  );
}

/** Remove comments so explanatory prose is not mistaken for real use. */
function stripComments(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/(^|\s)\/\/.*$/gm, "");
}

const S = process.cwd();

describe("browser transport boundary (src/lib/api/http-client.ts)", () => {
  const source = repoSource("src", "lib", "api", "http-client.ts");

  it("never references server-only configuration in code", () => {
    const lower = stripComments(source).toLowerCase();
    expect(lower).not.toContain("backend_internal_url");
    expect(lower).not.toContain("database_url");
    expect(lower).not.toContain("prisma");
    expect(lower).not.toContain("session-token");
  });

  it("never attaches identity — no authorization header, no cookie access", () => {
    const lower = source.toLowerCase();
    expect(lower).not.toContain("authorization");
    expect(lower).not.toContain("bearer");
    expect(lower).not.toContain("next/headers");
    expect(lower).not.toContain("cookies(");
  });

  it("keeps credentials to same-origin only", () => {
    expect(source).toContain('credentials: "same-origin"');
  });

  it("keeps its failure logging body-free", () => {
    // console.error calls must take only method/path/status-style args.
    const logLines = source
      .split("\n")
      .filter((line) => line.includes("console.error"));
    expect(logLines.length).toBeGreaterThan(0);
    for (const line of logLines) {
      expect(line.toLowerCase()).not.toMatch(/\.json|body|token/);
    }
  });
});

describe("bff server boundary (src/lib/bff.ts)", () => {
  const source = repoSource("src", "lib", "bff.ts");

  it("stays server-only", () => {
    expect(source.trimStart().startsWith('import "server-only";')).toBe(true);
  });

  it("reads BACKEND_INTERNAL_URL only inside server code", () => {
    expect(source).toContain("BACKEND_INTERNAL_URL");
    expect(source).not.toContain("NEXT_PUBLIC_API_BASE_URL");
    expect(source).not.toContain("NEXT_PUBLIC_API_MOCK");
  });

  it("never returns raw upstream bodies to the browser", () => {
    // Centralized propagation only through jsonBackendResponse envelopes.
    expect(source).toContain("ApiErrorEnvelopeSchema");
    expect(source).toContain("requireSessionToken");
    expect(source).toContain("jsonBackendResponse");
  });
});

describe("hard production mock guard", () => {
  it("guard.server.ts owns the guard, server-only, self-executed", () => {
    const source = repoSource("src", "lib", "api", "guard.server.ts");
    expect(source.trimStart().startsWith('import "server-only";')).toBe(true);
    expect(source).toContain("assertMockSelectionAllowed();");
    expect(source).toContain("docs/environments.md");
  });

  it("selection.ts defines the guard but performs no self-execution", () => {
    const source = repoSource("src", "lib", "api", "selection.ts");
    expect(source).toContain("export function assertMockSelectionAllowed");
    expect(source.match(/assertMockSelectionAllowed\(\);/g)?.length ?? 0).toBe(0);
  });

  it("adapter.ts remains side-effect-free (no local api guard throwing)", () => {
    const source = repoSource("src", "lib", "api", "adapter.ts");
    expect(source).not.toContain("assertMockSelectionAllowed");
    expect(source).not.toContain("ALLOW_MOCK_IN_PRODUCTION");
    expect(source).toContain("new MockApiClient()");
    expect(source).toContain("new HttpApiClient()");
  });

  it("the e2e webServer is the only sanctioned ALLOW_MOCK_IN_PRODUCTION consumer", () => {
    const config = repoSource("playwright.config.ts");
    expect(config).toContain("NEXT_PUBLIC_API_MOCK=true");
    expect(config).toContain("ALLOW_MOCK_IN_PRODUCTION=true");
  });

  it("no other production source even mentions the escape hatch", () => {
    const srcRoot = path.join(S, "src");
    const offenders: string[] = [];
    for (const file of [
      "lib/api/http-client.ts",
      "lib/api/http-api-client.ts",
      "lib/api/mock-api-client.ts",
      "lib/api/api-client.ts",
      "lib/api/errors.ts",
      "lib/api/not-implemented.ts",
      "lib/bff.ts",
    ]) {
      const content = readFileSync(path.join(srcRoot, file), "utf8");
      if (content.includes("ALLOW_MOCK_IN_PRODUCTION")) offenders.push(file);
    }
    expect(offenders).toEqual([]);
    // The guard definition (selection.ts) and its server-only caller
    // (guard.server.ts) are the by-design exceptions.
    expect(
      repoSource("src", "lib", "api", "selection.ts").includes(
        "ALLOW_MOCK_IN_PRODUCTION"
      )
    ).toBe(true);
    expect(
      repoSource("src", "lib", "api", "guard.server.ts").includes(
        "ALLOW_MOCK_IN_PRODUCTION"
      )
    ).toBe(true);
  });

  it("the root layout imports the guard so builds and renders are vetted", () => {
    const source = repoSource("src", "app", "layout.tsx");
    expect(source).toContain('import "@/lib/api/guard.server";');
  });
});

describe("mock visibility", () => {
  it("ClientShell mounts the mock data banner", () => {
    const shell = repoSource("src", "components", "layout", "client-shell.tsx");
    expect(shell).toContain("MockDataBanner");
  });
});

describe("dead-route gates (Phase 3 fallback behavior)", () => {
  const routes = [
    path.join("src", "app", "api", "tracks", "route.ts"),
    path.join("src", "app", "api", "tracks", "[slug]", "route.ts"),
    path.join("src", "app", "api", "quiz", "submit", "route.ts"),
    path.join("src", "app", "api", "certificates", "route.ts"),
    path.join("src", "app", "api", "user", "profile", "route.ts"),
  ];

  it.each(routes)("%s keeps the 501 dead-route gate", (route) => {
    const source = readFileSync(path.join(S, route), "utf8");
    expect(source).toContain("businessRouteNotImplemented");
    expect(source).toContain("notImplementedResponse");
  });

  it("the guard derives from the adapter selection primitives", () => {
    const source = repoSource("src", "lib", "api", "not-implemented.ts");
    expect(source).toContain("computeMockSelection");
    // Route handlers participate in the hard production guard too.
    expect(source).toContain('import "./guard.server"');
  });
});
