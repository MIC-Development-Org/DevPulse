import { z } from "zod";
import dotenv from "dotenv";

// Load backend/.env (git-ignored). Runtime starts are expected from the
// backend/ directory (npm run dev / start), which makes cwd-relative .env
// resolution deterministic.
dotenv.config();

const EnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  CORS_ORIGINS: z.string().min(1).default("http://localhost:3000"),
  DATABASE_URL: z
    .string()
    .url()
    .startsWith("postgresql://", { message: "DATABASE_URL must be a postgresql:// connection string" }),

  // --- Argon2id password hashing (Phase 2). Defaults follow the current
  // OWASP Password Storage Cheat Sheet: m=19456 KiB (19 MiB), t=2, p=1.
  // Tune only after running `npm run bench:argon2` on the target environment.
  ARGON2_MEMORY_COST: z.coerce.number().int().positive().default(19456),
  ARGON2_TIME_COST: z.coerce.number().int().positive().default(2),
  ARGON2_PARALLELISM: z.coerce.number().int().positive().default(1),

  // --- Rate limiting for authentication endpoints (per client IP).
  RATE_LIMIT_REGISTER_MAX: z.coerce.number().int().positive().default(10),
  RATE_LIMIT_REGISTER_WINDOW_MS: z.coerce.number().int().positive().default(15 * 60 * 1000),
  RATE_LIMIT_LOGIN_MAX: z.coerce.number().int().positive().default(20),
  RATE_LIMIT_LOGIN_WINDOW_MS: z.coerce.number().int().positive().default(15 * 60 * 1000),

  /**
   * Express 5 "trust proxy" setting: number of trusted hops in front of this
   * server (e.g. 1 when behind a single reverse proxy). Leave 0 when Express
   * is only reached server-to-server — this is the intended production posture
   * (see docs/auth-integration.md). Enables correct client-IP keying for the
   * rate limiters when a trusted proxy exists.
   */
  TRUST_PROXY: z.coerce.number().int().min(0).default(0),
});

export type Env = z.infer<typeof EnvSchema>;

const parsed = EnvSchema.safeParse(process.env);

if (!parsed.success) {
  console.error(
    "Invalid backend environment configuration:",
    parsed.error.flatten().fieldErrors
  );
  // Fail fast: an Express service booted with unknown configuration is worse
  // than not booting at all.
  process.exit(1);
}

export const env: Env = parsed.data;

/** Parsed allow-list of CORS origins derived from the CSV env variable. */
export const corsOrigins: string[] = env.CORS_ORIGINS.split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
