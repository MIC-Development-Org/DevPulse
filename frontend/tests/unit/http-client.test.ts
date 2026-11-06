import { afterEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { httpFetch, DEFAULT_TIMEOUT_MS } from "@/lib/api/http-client";
import { ApiError, ApiSchemaError } from "@/lib/api/errors";

/**
 * Phase 3 HTTP transport unit tests: contract mapping, schema validation,
 * timeout/network handling, and the boundary invariants (same-origin only;
 * failure logs never contain response/token data).
 */

const SENSITIVE_MARK = "SESSION-TOKEN-SHOULD-NEVER-APPEAR-IN-LOGS";

function jsonResponse(
  status: number,
  body: unknown,
  contentType = "application/json"
): Response {
  const payload = typeof body === "string" ? body : JSON.stringify(body);
  return new Response(payload, {
    status,
    headers: { "content-type": contentType },
  });
}

function stubFetch(impl: () => Promise<Response>): ReturnType<typeof vi.fn> {
  const mock = vi.fn(impl as unknown as typeof fetch);
  vi.stubGlobal("fetch", mock);
  return mock;
}

describe("httpFetch", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("uses the same-origin only contract and rejects absolute URLs", async () => {
    const mock = stubFetch(() => Promise.resolve(jsonResponse(200, {})));

    await expect(httpFetch("/api/business/tracks")).resolves.toEqual({});
    expect(mock.mock.calls[0][0]).toBe("/api/business/tracks");

    await expect(
      httpFetch("https://evil.example.com/api")
    ).rejects.toBeInstanceOf(ApiError);
    await expect(httpFetch("//evil.example.com/api")).rejects.toBeInstanceOf(
      ApiError
    );
    // The rejected calls never reached the network layer.
    expect(mock).toHaveBeenCalledTimes(1);
  });

  it("stamps the content-type only when a body exists", async () => {
    const mock = stubFetch(() => Promise.resolve(jsonResponse(200, {})));

    await httpFetch("/api/x");
    const headersGet0 = new Headers((mock.mock.calls[0][1] as RequestInit).headers);
    expect(headersGet0.get("content-type")).toBeNull();

    await httpFetch("/api/x", { method: "POST", body: { a: 1 } });
    const [url1, init1] = mock.mock.calls[1] as [string, RequestInit];
    expect(url1).toBe("/api/x");
    expect(init1.method).toBe("POST");
    expect(init1.body).toBe(JSON.stringify({ a: 1 }));
    expect(new Headers(init1.headers).get("content-type")).toBe(
      "application/json"
    );
  });

  it("validates successful responses against the provided schema", async () => {
    stubFetch(() =>
      Promise.resolve(jsonResponse(200, { id: "t1", extra: true }))
    );

    const data = await httpFetch("/api/x", {
      schema: z.object({ id: z.string() }),
    });
    // zod strips unknown keys — the validated output is the contract shape.
    expect(data).toEqual({ id: "t1" });
  });

  it("throws ApiSchemaError with safe issue paths on contract mismatches", async () => {
    stubFetch(() => Promise.resolve(jsonResponse(200, { deep: [1] })));

    await expect(
      httpFetch("/api/x", {
        schema: z.object({ deep: z.object({ inner: z.string() }) }),
      })
    ).rejects.toMatchObject({
      name: "ApiSchemaError",
      issuePaths: ["deep"],
    });
  });

  it("maps documented error statuses to typed codes with the shared envelope", async () => {
    const cases: Array<[number, unknown, string]> = [
      [400, { error: "Invalid input", details: { email: ["bad"] } }, "bad_request"],
      [401, { error: "Wrong email or password" }, "unauthorized"],
      [403, { error: "No access" }, "forbidden"],
      [404, { error: "Track not found" }, "not_found"],
      [409, { error: "Already exists" }, "conflict"],
      [429, { error: "Slow down" }, "rate_limited"],
      [500, { error: "Broken" }, "server_error"],
      [503, { error: "Down" }, "server_error"],
    ];

    for (const [status, body, expectedCode] of cases) {
      stubFetch(() => Promise.resolve(jsonResponse(status, body)));
      const err = await httpFetch("/api/x").then(
        () => null,
        (e: unknown) => e
      );
      expect(err, `status ${status}`).toBeInstanceOf(ApiError);
      expect((err as ApiError).code).toBe(expectedCode);
      expect((err as ApiError).status).toBe(status);
      if (expectedCode === "bad_request") {
        expect((err as ApiError).envelope?.details?.email).toEqual(["bad"]);
      }
      if (status === 401) {
        expect((err as ApiError).message).toBe("Wrong email or password");
      }
    }
  });

  it("degrades non-envelope error bodies to a generic client-safe message", async () => {
    stubFetch(() =>
      Promise.resolve(
        new Response("<html>SERVER STACK TRACE</html>", {
          status: 404,
          headers: { "content-type": "text/html" },
        })
      )
    );

    const err = await httpFetch("/api/x").then(
      () => null,
      (e: unknown) => e as ApiError
    );
    expect(err).toBeInstanceOf(ApiError);
    expect(err?.code).toBe("not_found");
    expect(err?.envelope).toBeNull();
    expect(err?.message).not.toContain("STACK TRACE");
  });

  it("treats malformed success bodies as bad_response", async () => {
    stubFetch(() => Promise.resolve(new Response("not-json", { status: 200 })));

    await expect(httpFetch("/api/x")).rejects.toMatchObject({
      name: "ApiError",
      code: "bad_response",
      status: 200,
    });
  });

  it("handles 204 as empty success without a schema", async () => {
    stubFetch(() => Promise.resolve(new Response(null, { status: 204 })));

    expect(await httpFetch("/api/x")).toBeUndefined();
    await expect(
      httpFetch("/api/x", { schema: z.object({}) })
    ).rejects.toBeInstanceOf(ApiSchemaError);
  });

  it("builds query parameters and drops undefined values", async () => {
    const mock = stubFetch(() => Promise.resolve(jsonResponse(200, {})));

    await httpFetch("/api/x", {
      searchParams: { a: 1, b: "two", c: undefined },
    });

    expect(mock.mock.calls[0][0]).toBe("/api/x?a=1&b=two");
  });

  it("maps network failures to the network code", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.reject(new TypeError("Failed to fetch")))
    );

    await expect(httpFetch("/api/x")).rejects.toMatchObject({
      name: "ApiError",
      code: "network",
    });
  });

  it("turns silent fetch delays into timeout errors", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        (_url: string, init: RequestInit) =>
          new Promise<Response>((_resolve, reject) => {
            init.signal!.addEventListener("abort", () =>
              reject(
                new DOMException("This operation was aborted", "AbortError")
              )
            );
          })
      )
    );

    await expect(httpFetch("/api/x", { timeoutMs: 10 })).rejects.toMatchObject({
      name: "ApiError",
      code: "timeout",
    });
  });

  it("documents the default timeout constant", () => {
    expect(DEFAULT_TIMEOUT_MS).toBeGreaterThan(0);
  });

  it("never logs bodies or token-ish content on failures", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    stubFetch(() =>
      Promise.resolve(
        jsonResponse(401, {
          error: SENSITIVE_MARK,
          details: { password: [SENSITIVE_MARK] },
        })
      )
    );

    await expect(httpFetch("/api/auth/sign-in")).rejects.toBeInstanceOf(ApiError);

    const logged = errorSpy.mock.calls.map((c) => c.join(" "));
    expect(logged.length).toBeGreaterThan(0);
    for (const line of logged) {
      expect(line).not.toContain(SENSITIVE_MARK);
    }
  });
});

describe("httpFetch failure logging shape", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("logs method, path (query stripped) and status only", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    stubFetch(() =>
      Promise.resolve(jsonResponse(409, { error: "Oops", details: { email: ["x"] } }))
    );

    await expect(
      httpFetch("/api/thing?secret=QueryValue")
    ).rejects.toBeInstanceOf(ApiError);

    expect(errorSpy).toHaveBeenCalledWith(
      "[devpulse http]",
      "GET",
      "/api/thing",
      409
    );
  });
});
