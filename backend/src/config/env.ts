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
