import type { RequestHandler } from "express";
import rateLimit, { type Options } from "express-rate-limit";
import { env } from "../config/env";

export interface RateLimitOptions {
  windowMs: number;
  max: number;
}

/** JSON 429 body — same envelope as every other auth error response. */
const tooManyRequests: NonNullable<Options["handler"]> = (_req, res) => {
  res.status(429).json({ error: "Too many requests. Please try again later." });
};

/**
 * Rate limiter factory for auth endpoints (keyed per client IP).
 *
 * Branched keep-alive disabled only via tests/default; production posture:
 * register 10 / 15 min, login 20 / 15 min (env-tunable). When Express runs
 * behind a trusted reverse proxy, `TRUST_PROXY` must be set so IPs are keyed
 * from the real client, not the proxy — see docs/auth-integration.md.
 */
export const createRateLimiter = (
  overrides?: Partial<RateLimitOptions>,
  defaults?: RateLimitOptions
): RequestHandler =>
  rateLimit({
    windowMs: overrides?.windowMs ?? defaults?.windowMs ?? 15 * 60 * 1000,
    limit: overrides?.max ?? defaults?.max ?? 100,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    handler: tooManyRequests,
  });

export const registerRateLimiter = (
  overrides?: Partial<RateLimitOptions>
): RequestHandler =>
  createRateLimiter(overrides, {
    windowMs: env.RATE_LIMIT_REGISTER_WINDOW_MS,
    max: env.RATE_LIMIT_REGISTER_MAX,
  });

export const loginRateLimiter = (
  overrides?: Partial<RateLimitOptions>
): RequestHandler =>
  createRateLimiter(overrides, {
    windowMs: env.RATE_LIMIT_LOGIN_WINDOW_MS,
    max: env.RATE_LIMIT_LOGIN_MAX,
  });

/** POST /me/quiz/submissions — one persisted graded attempt per call. */
export const quizSubmitRateLimiter = (
  overrides?: Partial<RateLimitOptions>
): RequestHandler =>
  createRateLimiter(overrides, {
    windowMs: env.RATE_LIMIT_QUIZ_SUBMIT_WINDOW_MS,
    max: env.RATE_LIMIT_QUIZ_SUBMIT_MAX,
  });

/** Progress mutations (start/reset) — lighter touch, higher allowance. */
export const progressMutationRateLimiter = (
  overrides?: Partial<RateLimitOptions>
): RequestHandler =>
  createRateLimiter(overrides, {
    windowMs: env.RATE_LIMIT_PROGRESS_WINDOW_MS,
    max: env.RATE_LIMIT_PROGRESS_MAX,
  });
