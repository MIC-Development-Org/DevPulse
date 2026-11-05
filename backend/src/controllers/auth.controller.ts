import type { Request, RequestHandler, Response } from "express";
import { LoginRequestSchema, RegisterInputSchema } from "@devpulse/contracts";
import { register, verifyCredentials } from "../services/auth.service";

const GENERIC_CREDENTIALS_FAILURE = "Invalid email or password";
const GENERIC_REGISTER_CONFLICT =
  "This email cannot be used to create an account.";

/** POST /auth/register — create a credentials user (Argon2id, rate-limited).
 * Success: 201 safe SessionUser. Duplicate: 409 generic. Invalid: 400. */
export const registerUser: RequestHandler = async (req, res, next) => {
  try {
    if (typeof req.body !== "object" || req.body === null) {
      res.status(400).json({ error: "Invalid JSON body" });
      return;
    }

    const parsed = RegisterInputSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: "Invalid registration data",
        details: parsed.error.flatten().fieldErrors,
      });
      return;
    }

    const user = await register(parsed.data);
    res.status(201).json(user);
  } catch (error) {
    // Expected domain failure (Prisma P2002 -> service HttpError 409) gets
    // the generic envelope; anything else stays unexpected and falls through
    // to the central error handler (database outages remain 500s, not 409s).
    if ((error as { status?: number })?.status === 409) {
      res.status(409).json({ error: GENERIC_REGISTER_CONFLICT });
      return;
    }
    next(error);
  }
};

/** POST /auth/login — credentials verification consumed by Auth.js authorize().
 * One generic failure body for malformed input, unknown email and wrong
 * password alike (anti-enumeration). Success: { user } with no hash. */
export const loginUser: RequestHandler = async (req, res, next) => {
  try {
    if (typeof req.body !== "object" || req.body === null) {
      res.status(401).json({ error: GENERIC_CREDENTIALS_FAILURE });
      return;
    }

    const parsed = LoginRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(401).json({ error: GENERIC_CREDENTIALS_FAILURE });
      return;
    }

    const user = await verifyCredentials(parsed.data.email, parsed.data.password);
    res.json({ user });
  } catch (error) {
    // Service throws HttpError(401, generic) for every credential failure;
    // here we re-assert the same envelope so the contract is uniform.
    if ((error as { status?: number })?.status === 401) {
      res.status(401).json({ error: GENERIC_CREDENTIALS_FAILURE });
      return;
    }
    next(error);
  }
};

/** GET /auth/session — Bearer-token introspection; identity comes only from
 * the validated session (forged body/header identity fields are ignored). */
export const introspectSession: RequestHandler = (req: Request, res) => {
  const context = req.authContext!;
  res.json({
    user: {
      id: context.userId,
      name: context.name,
      email: context.email,
      image: null,
      emailVerified: null,
      role: context.role,
    },
    expires: context.expiresAt,
  });
};

/** GET /auth/session/admin — the same introspection behind requireRole("ADMIN");
 * exercises the authorization foundation (used by tests, extendable by BFF). */
export const introspectAdminSession: RequestHandler = introspectSession;
