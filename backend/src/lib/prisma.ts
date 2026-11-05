import { PrismaClient } from "@prisma/client";
import { env } from "../config/env";

/**
 * Prisma Client singleton for the backend.
 *
 * Same hot-reload-safe pattern as the Prisma docs: during `tsx watch` restarts
 * the instance is cached on globalThis outside production so watch-session
 * module reloads do not exhaust the connection pool.
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma: PrismaClient =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
