import type { Request, RequestHandler, Response } from "express";

/**
 * Minimal request logging without extra dependencies. Emits one line per
 * request with method, path, status code and duration in milliseconds.
 */
export const requestLogger: RequestHandler = (req: Request, res: Response, next) => {
  const startedAt = process.hrtime.bigint();

  res.on("finish", () => {
    const durationMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;
    const line = `${req.method} ${req.originalUrl} ${res.statusCode} ${durationMs.toFixed(1)}ms`;
    console.log(line);
  });

  next();
};
