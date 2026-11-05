import type { NextFunction, Request, RequestHandler, Response } from "express";

/**
 * Central error-handling middleware.
 *
 * Routing discipline:
 *  - `HttpError` instances carry curated, client-safe messages (auth 401/403
 *    envelopes) and pass through verbatim.
 *  - Body-parser/Express framework 4xx (e.g. JSON syntax errors) get a
 *    generic body — their internal messages must never reach clients.
 *  - Anything else is unexpected: logged with stack server-side, answered
 *    with a generic 500.
 */
export const errorHandler: (
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction
) => void = (err, _req, res, _next) => {
  if (err instanceof HttpError) {
    res.status(err.status).json({ error: err.message });
    return;
  }

  const framework = err as { type?: string; status?: number };

  if (framework?.type === "entity.parse.failed") {
    res.status(400).json({ error: "Invalid JSON body" });
    return;
  }

  const status = framework?.status ?? 500;

  if (status >= 500) {
    console.error("Unhandled error:", err);
    res.status(500).json({ error: "Internal server error" });
    return;
  }

  // Remaining non-HttpError 4xx (payload limits, etc.) — generic, no internals.
  res.status(status).json({ error: "Invalid request" });
};

/** Error with an HTTP status attached, thrown by future route handlers. */
export class HttpError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}
