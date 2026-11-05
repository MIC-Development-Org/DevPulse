import express, { type Express } from "express";
import cors from "cors";
import { corsOrigins } from "./config/env";
import { requestLogger } from "./middleware/requestLogger";
import { errorHandler } from "./middleware/errorHandler";
import { notFoundHandler } from "./middleware/notFound";
import { router } from "./routes";

/**
 * Express application factory. Server bootstrap (listen + signals) lives in
 * server.ts so the composition stays testable.
 */
export function createApp(): Express {
  const app = express();

  app.disable("x-powered-by");
  app.use(express.json({ limit: "1mb" }));
  app.use(cors({ origin: corsOrigins, credentials: true }));
  app.use(requestLogger);

  app.use(router);
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
