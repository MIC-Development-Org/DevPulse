import express, { type Express } from "express";
import cors from "cors";
import { corsOrigins, env } from "./config/env";
import { requestLogger } from "./middleware/requestLogger";
import { errorHandler } from "./middleware/errorHandler";
import { notFoundHandler } from "./middleware/notFound";
import { createRouter } from "./routes";

/** Options for createApp — primarily for integration tests. */
export interface AppOptions {
  /** Overrides env-driven auth rate limits (register + login). */
  rateLimits?: {
    register?: { windowMs: number; max: number };
    login?: { windowMs: number; max: number };
  };
}

/**
 * Express application factory. Server bootstrap (listen + signals) lives in
 * server.ts so the composition stays testable.
 */
export function createApp(options: AppOptions = {}): Express {
  const app = express();

  app.disable("x-powered-by");
  app.set("trust proxy", env.TRUST_PROXY);
  app.use(express.json({ limit: "1mb" }));
  app.use(cors({ origin: corsOrigins, credentials: true }));
  app.use(requestLogger);

  app.use(createRouter(options));
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
