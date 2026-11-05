import { prisma } from "../lib/prisma";

/**
 * Data-access layer for health checks. Business APIs will follow the same
 * routes -> controllers -> services -> repositories layering.
 */
export interface DatabasePing {
  alive: boolean;
  latencyMs: number;
}

/** Issues the cheapest possible round-trip to PostgreSQL (SELECT 1). */
export const pingDatabase = async (): Promise<DatabasePing> => {
  const startedAt = process.hrtime.bigint();
  await prisma.$queryRaw`SELECT 1`;
  return {
    alive: true,
    latencyMs: Number(process.hrtime.bigint() - startedAt) / 1_000_000,
  };
};
