import type { Request } from "express";
import { z } from "zod";

/** URL slugs: lowercase kebab-case editorial ids (e.g. "git-basics"). */
const SlugParamSchema = z
  .string()
  .max(128)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);

/**
 * Validates and returns a route param as a slug, or null when the value is
 * invalid. Controllers map null to a 400 envelope BEFORE the payload ever
 * reaches Prisma (malformed params must be 400s, never 500s).
 */
export function slugParam(request: Request, name: string): string | null {
  const value = request.params[name];
  return typeof value === "string" && SlugParamSchema.safeParse(value).success
    ? value
    : null;
}
