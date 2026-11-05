import type { DatabasePing } from "../repositories/health.repository";
import { pingDatabase } from "../repositories/health.repository";

export interface DatabaseHealthReport {
  status: "healthy" | "unhealthy";
  latencyMs?: number;
}

export interface LivenessReport {
  status: "ok";
  service: string;
  uptimeSeconds: number;
  timestamp: string;
}

export const getLiveness = (): LivenessReport => ({
  status: "ok",
  service: "devpulse-backend",
  uptimeSeconds: Math.round(process.uptime()),
  timestamp: new Date().toISOString(),
});

/**
 * Returns the database health report, or null when the database is not
 * reachable (the controller maps null to HTTP 503).
 */
export const getDatabaseHealth = async (): Promise<DatabaseHealthReport | null> => {
  try {
    const ping: DatabasePing = await pingDatabase();
    return { status: "healthy", latencyMs: Math.round(ping.latencyMs * 100) / 100 };
  } catch (error) {
    console.error("Database health check failed:", error);
    return null;
  }
};
