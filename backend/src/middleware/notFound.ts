import type { Request, RequestHandler, Response } from "express";

/** JSON 404 fallback for unknown paths. */
export const notFoundHandler: RequestHandler = (req: Request, res: Response) => {
  res.status(404).json({
    error: "Not found",
    path: req.originalUrl,
  });
};
