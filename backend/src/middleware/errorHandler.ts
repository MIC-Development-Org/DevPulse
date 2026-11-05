import type { NextFunction, Request, RequestHandler, Response } from "express";

/**
 * Central error-handling middleware. Unexpected errors are logged with stack
 * traces server-side; clients receive a generic 500 body without internals.
 * Handlers that want specific failure shapes (e.g. health/db's 503) respond
 * themselves before reaching this middleware.
 */
export const errorHandler: (
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction
) => void = (err, _req, res, _next) => {
  console.error("Unhandled error:", err);

  const status = (err as { status?: number } | null)?.status ?? 500;
  res.status(status).json({
    error: status === 500 ? "Internal server error" : (err as Error).message,
  });
};

/** Error with an HTTP status attached, thrown by future route handlers. */
export class HttpError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}
