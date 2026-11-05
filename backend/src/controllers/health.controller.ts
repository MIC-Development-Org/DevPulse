import type { Request, RequestHandler, Response } from "express";
import {
  getDatabaseHealth as getDatabaseHealthReport,
  getLiveness,
} from "../services/health.service";

/** GET /health — process liveness, no database dependency. */
export const getHealth: RequestHandler = (_req: Request, res: Response) => {
  res.json(getLiveness());
};

/** GET /health/db — round-trips the PostgreSQL connection via Prisma. */
export const getDatabaseHealth: RequestHandler = async (
  _req: Request,
  res: Response
) => {
  const report = await getDatabaseHealthReport();

  if (report === null) {
    res.status(503).json({ status: "unhealthy", database: "unreachable" });
    return;
  }

  res.json({ status: "ok", database: report.status, latencyMs: report.latencyMs });
};
