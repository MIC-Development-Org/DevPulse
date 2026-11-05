import type { RequestHandler } from "express";
import { findActiveSessionUser } from "../services/auth.service";

/** Acceptable raw session-token length bounds (Auth.js tokens are long). */
const MIN_TOKEN_LENGTH = 16;
const MAX_TOKEN_LENGTH = 256;

/**
 * Authentication middleware (Phase 2).
 *
 * Validates a Bearer session token against the shared Session table on EVERY
 * protected request (fresh lookup + expiry check; nothing cached), then
 * attaches `req.authContext`. Identity always originates from the database —
 * headers, query, or body fields are never trusted.
 *
 * Rejects with an identical 401 body for: missing header, malformed header,
 * garbage/expired/deleted tokens. No token material is ever logged.
 */
export const requireAuth: RequestHandler = async (req, res, next) => {
  try {
    const header = req.headers.authorization;

    if (!header?.startsWith("Bearer ")) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const sessionToken = header.slice("Bearer ".length).trim();
    if (
      sessionToken.length < MIN_TOKEN_LENGTH ||
      sessionToken.length > MAX_TOKEN_LENGTH
    ) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const session = await findActiveSessionUser(sessionToken);
    if (!session) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    req.authContext = {
      sessionToken,
      userId: session.user.id,
      email: session.user.email,
      name: session.user.name,
      role: session.user.role,
      expiresAt: session.expires.toISOString(),
    };

    next();
  } catch (error) {
    next(error);
  }
};
