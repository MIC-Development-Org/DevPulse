import {
  hash as argon2Hash,
  verify as argon2Verify,
  Algorithm,
} from "@node-rs/argon2";
import { env } from "../config/env";

/**
 * Argon2id password hashing (Phase 2).
 *
 * Parameters come from env so they can be tuned after benchmarking on the
 * target environment (`npm run bench:argon2`). Defaults follow the current
 * OWASP Password Storage Cheat Sheet: m=19456 KiB (19 MiB), t=2, p=1.
 *
 * Argon2id parameters are encoded into the hash string itself, so verification
 * uses the parameters that produced the stored hash — changing env defaults
 * never breaks existing password verification.
 */
const argon2Options = {
  algorithm: Algorithm.Argon2id,
  memoryCost: env.ARGON2_MEMORY_COST,
  timeCost: env.ARGON2_TIME_COST,
  parallelism: env.ARGON2_PARALLELISM,
};

export const getArgon2Params = () => ({
  algorithm: "argon2id" as const,
  memoryCost: env.ARGON2_MEMORY_COST,
  timeCost: env.ARGON2_TIME_COST,
  parallelism: env.ARGON2_PARALLELISM,
});

/** Hash a plaintext password into an encoded Argon2id string. */
export const hashPassword = (password: string): Promise<string> =>
  argon2Hash(password, argon2Options);

/** Constant-time verification of a password against an encoded hash. */
export const verifyPassword = (
  encodedHash: string,
  password: string
): Promise<boolean> => argon2Verify(encodedHash, password);
