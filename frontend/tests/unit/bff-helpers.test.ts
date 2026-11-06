import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Phase 3 BFF helper unit tests: explicit route-handler plumbing from
 * frontend/src/lib/bff.ts — session guard + standardized upstream envelope
 * propagation. No auth logic is duplicated here; the cookie store is
 * mocked next/headers plumbing.
 */

// bff.ts is a server-only module; the "server-only" package throws when
// resolved outside RSC harnesses, so stub it for unit tests.
vi.mock("server-only", () => ({}));

const cookieStore = vi.hoisted(() => ({ value: null as string | null }));
vi.mock("next/headers", () => ({
  cookies: async () => ({
    // get() returns any cookie name's value — our fake HttpOnly session token.
    get: () => (cookieStore.value ? { value: cookieStore.value } : undefined),
  }),
}));

import { requireSessionToken, jsonBackendResponse } from "@/lib/bff";
import { z } from "zod";

function upstreamEnvelopeResponse(
  status: number,
  body: unknown
): Response {
  return new Response(typeof body === "string" ? body : JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

beforeAll(() => {
  cookieStore.value = "test-session-token";
});

describe("requireSessionToken", () => {
  beforeEach(() => {
    cookieStore.value = "test-session-token";
  });

  it("returns the token when the HttpOnly session cookie exists", async () => {
    const result = await requireSessionToken();
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data).toBe("test-session-token");
  });

  it("produces a 401 with the shared envelope when signed out", async () => {
    cookieStore.value = null;
    const result = await requireSessionToken();
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.response.status).toBe(401);
      const body = (await result.response.json()) as { error?: string };
      expect(typeof body.error).toBe("string");
      expect(body.error?.length ?? 0).toBeGreaterThan(0);
    }
  });
});

describe("jsonBackendResponse", () => {
  beforeEach(() => {
    cookieStore.value = "test-session-token";
  });

  it("passes upstream success payloads through", async () => {
    const result = await jsonBackendResponse(
      upstreamEnvelopeResponse(200, { id: "abc", sessionToken: "SECRET" })
    );
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data).toEqual({ id: "abc", sessionToken: "SECRET" });
  });

  it("validates success payloads against the provided contract schemas", async () => {
    const result = await jsonBackendResponse(
      upstreamEnvelopeResponse(200, { email: "a@b.dev" }),
      { schema: z.object({ email: z.string().email() }) }
    );
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data).toEqual({ email: "a@b.dev" });
  });

  it("responds 502 without leaking payload details on schema mismatches", async () => {
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const result = await jsonBackendResponse(
      upstreamEnvelopeResponse(200, {
        email: "SHOULD-NOT-BE-LOGGED",
        sessionToken: "SHOULD-NOT-BE-LOGGED",
      }),
      { schema: z.object({ email: z.string().email() }) }
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.response.status).toBe(502);
      const body = (await result.response.json()) as { error?: string };
      expect(body.error).toBe("The service returned an unexpected payload.");
    }
    const logged = errSpy.mock.calls.map((c) => c.join(" "));
    expect(logged.join("\n")).not.toContain("SHOULD-NOT-BE-LOGGED");
    expect(logged.join("\n")).toContain("email");
  });

  it("forwards backend error envelopes with their statuses verbatim", async () => {
    const result = await jsonBackendResponse(
      upstreamEnvelopeResponse(401, { error: "Invalid credentials" })
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.response.status).toBe(401);
      const body = (await result.response.json()) as { error?: string };
      expect(body.error).toBe("Invalid credentials");
    }
  });

  it("keeps validation details on 400 envelopes", async () => {
    const result = await jsonBackendResponse(
      upstreamEnvelopeResponse(400, {
        error: "Validation failed",
        details: { password: ["too short"] },
      })
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.response.status).toBe(400);
      const body = (await result.response.json()) as {
        error?: string;
        details?: Record<string, string[]>;
      };
      expect(body.details?.password).toEqual(["too short"]);
    }
  });

  it("normalizes non-envelope upstream failures into generic envelopes", async () => {
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const result = await jsonBackendResponse(
      new Response("<html>stack trace</html>", {
        status: 500,
        headers: { "content-type": "text/html" },
      })
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.response.status).toBe(500);
      const body = (await result.response.json()) as { error?: string };
      expect(body.error).toBe("The service failed to handle the request.");
    }
    expect(errSpy).toHaveBeenCalled();
  });

  it("treats statuses outside the allowed success set as failures", async () => {
    const result = await jsonBackendResponse(
      upstreamEnvelopeResponse(202, { queued: true }),
      { successStatuses: [201] }
    );
    expect(result.ok).toBe(false);
  });

  it("handles 204 as empty success", async () => {
    const result = await jsonBackendResponse(
      new Response(null, { status: 204 })
    );
    expect(result.ok).toBe(true);
  });

  it("gives 502 envelopes when the upstream success body is unreadable", async () => {
    const result = await jsonBackendResponse(
      new Response("<html>ok</html>", {
        status: 200,
        headers: { "content-type": "text/html" },
      })
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.response.status).toBe(502);
      const body = (await result.response.json()) as { error?: string };
      expect(body.error).toBe("The service returned a malformed response.");
    }
  });
});
