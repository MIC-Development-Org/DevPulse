import { describe, expect, it } from "vitest";
import {
  LoginRequestSchema,
  RegisterInputSchema,
  RoleSchema,
  SessionUserSchema,
} from "@devpulse/contracts";

describe("shared auth contracts", () => {
  it("normalizes and validates registration emails", () => {
    const parsed = RegisterInputSchema.parse({
      email: "  Learner@Example.COM ",
      password: "long-enough-password",
    });
    expect(parsed.email).toBe("learner@example.com");
  });

  it("requires 10+ character registration passwords", () => {
    expect(
      RegisterInputSchema.safeParse({ email: "a@b.com", password: "short" }).success
    ).toBe(false);
    expect(
      RegisterInputSchema.safeParse({ email: "a@b.com", password: "0123456789" }).success
    ).toBe(true);
  });

  it("caps password length to blunt DoS hashing", () => {
    const longPassword = "x".repeat(129);
    expect(
      RegisterInputSchema.safeParse({ email: "a@b.com", password: longPassword })
        .success
    ).toBe(false);
  });

  it("accepts optional names between 2 and 60 chars only", () => {
    expect(
      RegisterInputSchema.safeParse({ name: "A", email: "a@b.com", password: "0123456789" })
        .success
    ).toBe(false);
    expect(
      RegisterInputSchema.safeParse({
        name: "x".repeat(61),
        email: "a@b.com",
        password: "0123456789",
      }).success
    ).toBe(false);
  });

  it("allows login passwords down to 1 char (generic failure, not a validation hint)", () => {
    const parsed = LoginRequestSchema.parse({ email: "a@b.com", password: "x" });
    expect(parsed.email).toBe("a@b.com");
  });

  it("role is the strict USER/ADMIN enum", () => {
    expect(RoleSchema.safeParse("USER").success).toBe(true);
    expect(RoleSchema.safeParse("ADMIN").success).toBe(true);
    expect(RoleSchema.safeParse("SUPERADMIN").success).toBe(false);
  });

  it("session user shape contains no sensitive fields", () => {
    const parsed = SessionUserSchema.safeParse({
      id: "u1",
      email: "a@b.com",
      role: "USER",
      // sneaky fields must be stripped/rejected rather than passed through
      passwordHash: "$argon2id$...",
      sessionToken: "tok",
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect("passwordHash" in parsed.data).toBe(false);
      expect("sessionToken" in parsed.data).toBe(false);
    }
  });
});
