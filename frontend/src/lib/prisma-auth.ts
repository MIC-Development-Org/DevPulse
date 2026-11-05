import "server-only";
import { PrismaClient } from "@prisma/client";

/**
 * Prisma client for the Auth.js Prisma adapter ONLY (Phase 2 / plan R1).
 *
 * This is the sanctioned database access surface inside the Next.js server
 * process. Nothing else — no page, component, or route handler — may import
 * it. `server-only` makes accidental client-side imports a build error.
 *
 * Hot-reload-safe singleton (tsx/next dev module reloads).
 */
const globalForPrismaAuth = globalThis as unknown as {
  prismaAuth?: PrismaClient;
};

export const prismaAuth =
  globalForPrismaAuth.prismaAuth ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrismaAuth.prismaAuth = prismaAuth;
}
