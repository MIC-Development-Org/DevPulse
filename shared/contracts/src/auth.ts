// DevPulse shared authentication contracts (Phase 2).
//
// These schemas cross the API boundary between the Next.js frontend (Auth.js
// host) and the Express backend (identity + session validation), and between
// the browser and the frontend BFF route handlers:
//
//   browser ──▶ Next.js BFF (/api/register) ──▶ Express (/auth/*)
//
// Password hashes never live here on purpose — no schema below has a field
// that could carry a hash or raw token, so a hash can never be serialized to
// a client by mistake.

import { z } from "zod";

// ---------------------------------------------------------------------------
// Role (authorization foundation; extended in later phases only if needed)
// ---------------------------------------------------------------------------

export const RoleSchema = z.enum(["USER", "ADMIN"]);
export type Role = z.infer<typeof RoleSchema>;

// ---------------------------------------------------------------------------
// Safe user shapes — what API responses may contain (never passwordHash)
// ---------------------------------------------------------------------------

export const SessionUserSchema = z.object({
  id: z.string().min(1),
  name: z.string().nullish(),
  email: z.string().nullish(),
  image: z.string().nullish(),
  emailVerified: z.string().nullish(), // ISO datetime string, not Date (JSON boundary)
  role: RoleSchema,
});
export type SessionUser = z.infer<typeof SessionUserSchema>;

// ---------------------------------------------------------------------------
// Registration
// ---------------------------------------------------------------------------

const emailBase = z.string().trim().toLowerCase().email();

export const RegisterInputSchema = z.object({
  /** 2–60 visible characters; optional so OAuth-only flows stay compatible. */
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(60, "Name must be at most 60 characters")
    .optional(),
  email: emailBase,
  /**
   * NIST SP 800-63B style: length over composition. Minimum 10 characters
   * (signup), no forced complexity rules, hard cap to blunt DoS hashing.
   */
  password: z
    .string()
    .min(10, "Password must be at least 10 characters")
    .max(128, "Password must be at most 128 characters"),
});
export type RegisterInput = z.infer<typeof RegisterInputSchema>;

/** Registration success response body: safe fields only. */
export const RegisterResponseSchema = SessionUserSchema;
export type RegisterResponse = SessionUser;

// ---------------------------------------------------------------------------
// Credentials login (Auth.js authorize() -> Express POST /auth/login)
// ---------------------------------------------------------------------------

export const LoginRequestSchema = z.object({
  email: emailBase,
  // min(1): wrong-length passwords must fail as "invalid credentials" (401),
  // not as a validation hint; max(128) caps hashing input size.
  password: z.string().min(1).max(128),
});
export type LoginRequest = z.infer<typeof LoginRequestSchema>;

/** Successful login response body (consumed by Auth.js authorize()). */
export const LoginResponseSchema = z.object({
  user: SessionUserSchema,
});
export type LoginResponse = z.infer<typeof LoginResponseSchema>;

// ---------------------------------------------------------------------------
// Introspection (GET /auth/session) — how the BFF/Express validate identity
// ---------------------------------------------------------------------------

export const SessionIntrospectionResponseSchema = z.object({
  user: SessionUserSchema,
  expires: z.string(), // ISO datetime string
});
export type SessionIntrospectionResponse = z.infer<
  typeof SessionIntrospectionResponseSchema
>;

// ---------------------------------------------------------------------------
// Error envelope shared by all auth endpoints
// ---------------------------------------------------------------------------

export const AuthErrorEnvelopeSchema = z.object({
  error: z.string(),
});
export type AuthErrorEnvelope = z.infer<typeof AuthErrorEnvelopeSchema>;
