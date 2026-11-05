import { randomUUID } from "node:crypto";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { createApp } from "../../src/app";
import { prisma } from "../../src/lib/prisma";
import { sessionRepository } from "../../src/repositories/session.repository";
import { Role } from "@prisma/client";

/**
 * Phase 2 authentication integration tests.
 *
 * Runs against the real Postgres instance (same DATABASE_URL as the app —
 * the Phase 1 Docker volume). Every created row is scoped to a unique
 * run-id email marker and cleaned up in afterAll; sessions cascade with
 * their users. Skips cleanly are not possible without DATABASE_URL (env.ts
 * exits fast when config is missing, which is the intended boot behavior).
 */

const RUN_ID = `phase2it-${Date.now()}-${randomUUID().slice(0, 8)}`;
const app = createApp();

let userCounter = 0;
const itEmail = () => `${RUN_ID}-${userCounter++}@example.com`;
const randToken = () =>
  `tok-${randomUUID().replaceAll("-", "")}${randomUUID().replaceAll("-", "")}`;

async function makeUser(email = itEmail(), role: Role = "USER") {
  return prisma.user.create({ data: { email, name: "IT User", role } });
}

function makeSession(userId: string, expiresInMs = 3600_000) {
  return sessionRepository.create({
    sessionToken: randToken(),
    userId,
    expires: new Date(Date.now() + expiresInMs),
  });
}

afterAll(async () => {
  await prisma.user.deleteMany({ where: { email: { contains: RUN_ID } } });
  await prisma.$disconnect();
});

// ---------------------------------------------------------------------------
// Health stays public (regression guard for the auth gating)
// ---------------------------------------------------------------------------

describe("public endpoints", () => {
  it("GET /health remains open without authentication", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
  });
});

// ---------------------------------------------------------------------------
// Registration
// ---------------------------------------------------------------------------

describe("POST /auth/register", () => {
  it("creates a user with an Argon2id hash and returns only safe fields", async () => {
    const payload = { name: "Ada Lovelace", email: itEmail(), password: "s3cret-pass-42" };

    const res = await request(app).post("/auth/register").send(payload);

    expect(res.status).toBe(201);
    expect(res.body.id).toBeTruthy();
    expect(res.body.email).toBe(payload.email);
    expect(res.body.role).toBe("USER");
    // Never expose the hash or internals.
    expect(JSON.stringify(res.body)).not.toContain("argon2");
    expect(res.body.passwordHash).toBeUndefined();

    const row = await prisma.user.findUnique({ where: { email: payload.email } });
    expect(row?.passwordHash?.startsWith("$argon2id$")).toBe(true);
    expect(row?.email).not.toBe(payload.password);
  });

  it("rejects duplicate email registration with a generic 409", async () => {
    const payload = { name: "Dup Test", email: itEmail(), password: "s3cret-pass-42" };
    await request(app).post("/auth/register").send(payload);

    const res = await request(app)
      .post("/auth/register")
      .send({ name: "Dup Again", email: payload.email, password: "another-pass-99" });

    expect(res.status).toBe(409);
    expect(res.body).toEqual({
      error: "This email cannot be used to create an account.",
    });
  });

  it("handles concurrent duplicate registrations (exactly one wins)", async () => {
    const payload = { name: "Race", email: itEmail(), password: "concurrent-pw-1" };

    const [a, b] = await Promise.allSettled([
      request(app).post("/auth/register").send(payload),
      request(app).post("/auth/register").send(payload),
    ]);

    const statuses = [a, b].map(
      (r) => (r.status === "fulfilled" ? r.value.status : 0)
    );
    expect(statuses.filter((s) => s === 201)).toHaveLength(1);
    expect(statuses.filter((s) => s === 409)).toHaveLength(1);
  });

  it("rejects invalid payloads as 400 without creating rows", async () => {
    const before = await prisma.user.count({ where: { email: { contains: RUN_ID } } });

    expect(
      (await request(app).post("/auth/register").send({ email: "not-an-email", password: "1234567890" }))
        .status
    ).toBe(400);
    expect(
      (await request(app).post("/auth/register").send({ email: itEmail(), password: "short" }))
        .status
    ).toBe(400);
    expect(
      (await request(app).post("/auth/register").send({ email: itEmail(), password: "1234567890", name: "x" }))
        .status
    ).toBe(400);

    const after = await prisma.user.count({ where: { email: { contains: RUN_ID } } });
    expect(after).toBe(before);
  });
});

// ---------------------------------------------------------------------------
// Login (consumed by Auth.js authorize())
// ---------------------------------------------------------------------------

describe("POST /auth/login", () => {
  it("returns the safe user on valid credentials", async () => {
    const email = itEmail();
    const password = "valid-login-pw-99";
    // Goes through the real registration path to get a real Argon2id hash.
    const created = await request(app)
      .post("/auth/register")
      .send({ name: "Login User", email, password })
      .expect(201);

    const res = await request(app).post("/auth/login").send({ email, password });

    expect(res.status).toBe(200);
    expect(res.body.user.id).toBe(created.body.id);
    expect(res.body.user.email).toBe(email);
    expect(res.body.user.role).toBe("USER");
    expect(JSON.stringify(res.body)).not.toContain("argon2");
    expect(res.body.user.passwordHash).toBeUndefined();
  });

  it("fails identically for wrong password and unknown email (anti-enumeration)", async () => {
    const email = itEmail();
    await request(app)
      .post("/auth/register")
      .send({ name: "Pw Check", email, password: "the-correct-pw-1" });

    const wrongPw = await request(app).post("/auth/login").send({ email, password: "the-wrong-pw-1" });
    const unknown = await request(app)
      .post("/auth/login")
      .send({ email: `ghost-${itEmail()}`, password: "whatever-pass-1" });

    expect(wrongPw.status).toBe(401);
    expect(unknown.status).toBe(401);
    // Byte-identical generic bodies.
    expect(wrongPw.body).toEqual(unknown.body);
    expect(wrongPw.body.error).toBe("Invalid email or password");
  });
});

// ---------------------------------------------------------------------------
// requireAuth / session validation
// ---------------------------------------------------------------------------

describe("GET /auth/session (requireAuth)", () => {
  it("rejects missing, garbage, and unknown tokens with the same 401 body", async () => {
    const missing = await request(app).get("/auth/session");
    expect(missing.status).toBe(401);
    expect(missing.body).toEqual({ error: "Unauthorized" });

    const malformed = await request(app)
      .get("/auth/session")
      .set("Authorization", "Basic abcdefghijklmnop");
    expect(malformed.status).toBe(401);
    expect(malformed.body).toEqual({ error: "Unauthorized" });

    const unknown = await request(app)
      .get("/auth/session")
      .set("Authorization", `Bearer ${randToken()}`);
    expect(unknown.status).toBe(401);
    expect(unknown.body).toEqual({ error: "Unauthorized" });
  });

  it("rejects expired sessions", async () => {
    const user = await makeUser();
    const session = await makeSession(user.id, -1000); // expired 1s ago

    const res = await request(app)
      .get("/auth/session")
      .set("Authorization", `Bearer ${session.sessionToken}`);

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: "Unauthorized" });
  });

  it("introspects a valid session and persists across calls", async () => {
    const user = await makeUser();
    const session = await makeSession(user.id);

    for (let i = 0; i < 2; i++) {
      const res = await request(app)
        .get("/auth/session")
        .set("Authorization", `Bearer ${session.sessionToken}`);

      expect(res.status).toBe(200);
      expect(res.body.user.id).toBe(user.id);
      expect(res.body.user.email).toBe(user.email);
      expect(res.body.user.role).toBe("USER");
      expect(new Date(res.body.expires).getTime()).toBeGreaterThan(Date.now());
      // Token never echoed back.
      expect(JSON.stringify(res.body)).not.toContain(session.sessionToken);
    }
  });

  it("ignores forged identity fields — identity comes from the session row", async () => {
    const owner = await makeUser();
    const forger = await makeUser();

    const session = await makeSession(owner.id);

    const res = await request(app)
      .get("/auth/session")
      .set("Authorization", `Bearer ${session.sessionToken}`)
      .set("x-user-id", forger.id)
      .query({ userId: forger.id });

    expect(res.status).toBe(200);
    expect(res.body.user.id).toBe(owner.id);
    expect(res.body.user.id).not.toBe(forger.id);
  });
});

// ---------------------------------------------------------------------------
// requireRole (authorization foundation)
// ---------------------------------------------------------------------------

describe("GET /auth/session/admin (requireRole)", () => {
  it("401 without auth, 403 for USER, 200 for ADMIN", async () => {
    expect((await request(app).get("/auth/session/admin")).status).toBe(401);

    const user = await makeUser();
    const userSession = await makeSession(user.id);
    expect(
      (
        await request(app)
          .get("/auth/session/admin")
          .set("Authorization", `Bearer ${userSession.sessionToken}`)
      ).status
    ).toBe(403);

    const admin = await makeUser(undefined, "ADMIN");
    const adminSession = await makeSession(admin.id);
    const ok = await request(app)
      .get("/auth/session/admin")
      .set("Authorization", `Bearer ${adminSession.sessionToken}`);
    expect(ok.status).toBe(200);
    expect(ok.body.user.role).toBe("ADMIN");
  });
});

// ---------------------------------------------------------------------------
// Session invalidation (logout semantics)
// ---------------------------------------------------------------------------

describe("logout invalidation", () => {
  it("a deleted session row makes the token invalid immediately", async () => {
    const user = await makeUser();
    const session = await makeSession(user.id);

    await request(app)
      .get("/auth/session")
      .set("Authorization", `Bearer ${session.sessionToken}`)
      .expect(200);

    await sessionRepository.deleteByToken(session.sessionToken);

    const res = await request(app)
      .get("/auth/session")
      .set("Authorization", `Bearer ${session.sessionToken}`);

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: "Unauthorized" });
  });
});

// ---------------------------------------------------------------------------
// Rate limiting
// ---------------------------------------------------------------------------

describe("rate limiting", () => {
  it("429s with a JSON envelope after the configured limit", async () => {
    const limited = createApp({ rateLimits: { login: { windowMs: 60_000, max: 2 } } });
    const payload = { email: `rl-${itEmail()}`, password: "no-matter-1" };

    await request(limited).post("/auth/login").send(payload).expect(401);
    await request(limited).post("/auth/login").send(payload).expect(401);

    const third = await request(limited).post("/auth/login").send(payload);
    expect(third.status).toBe(429);
    expect(third.body).toEqual({ error: "Too many requests. Please try again later." });
  });
});

// ---------------------------------------------------------------------------
// Logging hygiene
// ---------------------------------------------------------------------------

describe("request logging", () => {
  it("never logs Authorization headers or session tokens", async () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const user = await makeUser();
    const session = await makeSession(user.id);

    await request(app)
      .get("/auth/session")
      .set("Authorization", `Bearer ${session.sessionToken}`)
      .expect(200);

    // let the finish handler emit
    await new Promise((r) => setTimeout(r, 25));

    const lines = logSpy.mock.calls.map((c) => c.join(" ")).join("\n");
    expect(lines).not.toContain(session.sessionToken);
    expect(lines).not.toContain("Bearer");
    logSpy.mockRestore();
  });
});

// ---------------------------------------------------------------------------
// Unexpected failures stay 500s and generic (not mapped to domain codes)
// ---------------------------------------------------------------------------

describe("error handler hygiene", () => {
  it("malformed JSON bodies do not crash the process", async () => {
    const res = await request(app)
      .post("/auth/register")
      .set("Content-Type", "application/json")
      .send('{"broken');

    expect([400, 500]).toContain(res.status);
    expect(res.body.error).toBeTruthy();
    expect(res.body.error).not.toMatch(/prisma|stack|at /i);
  });
});
