import { Prisma } from "@prisma/client";
import type {
  LoginRequest,
  RegisterInput,
  Role,
  SessionUser,
} from "@devpulse/contracts";
import { User } from "@prisma/client";
import { userRepository } from "../repositories/user.repository";
import { sessionRepository, SessionWithUser } from "../repositories/session.repository";
import { hashPassword, verifyPassword } from "./password.service";
import { HttpError } from "../middleware/errorHandler";

/**
 * Decoy hash used to equalize login timing when the email does not exist.
 * Without this, "unknown email" returns ~100ms faster than "known email,
 * wrong password", which is a user-enumeration timing oracle. This constant
 * is an Argon2id hash of a meaningless decoy password — it is not a secret,
 * and it contains no user data.
 */
const DECOY_ARGON2ID_HASH =
  "$argon2id$v=19$m=19456,t=2,p=1$uAQWKVXklJeycGUnRRc2JQ$E/r1J5gKZCE34D+9UI+go5+/Y4/GGmPnz+q7j0qDy1Q";

const GENERIC_INVALID_CREDENTIALS = "Invalid email or password";
const GENERIC_REGISTER_CONFLICT = "This email cannot be used to create an account.";

/** Map a User row to the externally safe shape (no passwordHash, ever). */
export function toSessionUser(user: User & { role: Role }): SessionUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    image: user.image,
    emailVerified: user.emailVerified ? user.emailVerified.toISOString() : null,
    role: user.role,
  };
}

/**
 * Create a credentials user. Argon2id first, then an insert-only create —
 * uniqueness is enforced by the DB unique constraint, so concurrent
 * registrations race safely: exactly one wins, the loser gets P2002.
 */
export async function register(input: RegisterInput): Promise<SessionUser> {
  const passwordHash = await hashPassword(input.password);

  try {
    const user = await userRepository.createWithPassword({
      name: input.name,
      email: input.email,
      passwordHash,
    });
    return toSessionUser(user);
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      // Deliberately ambiguous (UX/anti-enumeration tradeoff approved in the
      // Phase 2 plan): no "already registered" wording, identical shape for
      // every conflict.
      throw new HttpError(409, GENERIC_REGISTER_CONFLICT);
    }
    throw error;
  }
}

/**
 * Validate an email/password pair for Auth.js authorize(). Returns the user
 * on success; throws a generic 401 on any failure (unknown email, disabled
 * password auth, wrong password) with identical response shape.
 */
export async function verifyCredentials(
  email: string,
  password: string
): Promise<SessionUser> {
  const user = await userRepository.findByEmail(email);

  if (!user || user.passwordHash === null) {
    // Burn the same Argon2 time a real verification would take so the wall
    // clock cannot distinguish unknown-email from wrong-password.
    await verifyPassword(DECOY_ARGON2ID_HASH, password);
    throw new HttpError(401, GENERIC_INVALID_CREDENTIALS);
  }

  const valid = await verifyPassword(user.passwordHash, password);
  if (!valid) {
    throw new HttpError(401, GENERIC_INVALID_CREDENTIALS);
  }

  return toSessionUser(user);
}

/**
 * Session introspection: token -> active (non-expired) session + user, or
 * null. Every protected Express request re-runs this — auth decisions are
 * never cached, so logout and expiry take effect immediately.
 */
export async function findActiveSessionUser(
  sessionToken: string
): Promise<SessionWithUser | null> {
  const session = await sessionRepository.findByTokenWithUser(sessionToken);
  if (!session) return null;
  if (session.expires.getTime() <= Date.now()) return null;
  return session;
}
