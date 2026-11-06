import { describe, expect, it } from "vitest";
import { ApiErrorEnvelopeSchema, apiErrorCodeForStatus } from "@devpulse/contracts";
import request from "supertest";
import { createApp } from "../../src/app";

/**
 * Phase 3: the backend error envelope and the shared communication contract
 * must stay in lockstep — BFF + HTTP client consume this shape.
 */
describe("shared error envelope compliance", () => {
  it("400 validation responses match ApiErrorEnvelopeSchema", async () => {
    const res = await request(createApp())
      .post("/auth/register")
      .send({ email: "not-an-email", password: "short" });

    expect(res.status).toBe(400);
    const parsed = ApiErrorEnvelopeSchema.safeParse(res.body);
    expect(parsed.success).toBe(true);
  });

  it("401 credential failures match ApiErrorEnvelopeSchema (no details)", async () => {
    const res = await request(createApp())
      .post("/auth/login")
      .send({ email: "empty@integration-test.dev", password: "whatever-pass-1" });

    expect(res.status).toBe(401);
    const parsed = ApiErrorEnvelopeSchema.safeParse(res.body);
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data.details).toBeUndefined();
  });

  it("apiErrorCodeForStatus maps the documented status set", () => {
    expect(apiErrorCodeForStatus(400)).toBe("bad_request");
    expect(apiErrorCodeForStatus(401)).toBe("unauthorized");
    expect(apiErrorCodeForStatus(403)).toBe("forbidden");
    expect(apiErrorCodeForStatus(404)).toBe("not_found");
    expect(apiErrorCodeForStatus(409)).toBe("conflict");
    expect(apiErrorCodeForStatus(429)).toBe("rate_limited");
    expect(apiErrorCodeForStatus(500)).toBe("server_error");
    expect(apiErrorCodeForStatus(503)).toBe("server_error");
    expect(apiErrorCodeForStatus(200)).toBeUndefined();
    expect(apiErrorCodeForStatus(302)).toBeUndefined();
  });
});
