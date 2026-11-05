import { createApp } from "./app";
import { env } from "./config/env";
import { prisma } from "./lib/prisma";

const app = createApp();

const server = app.listen(env.PORT, () => {
  console.log(
    `devpulse-backend listening on http://localhost:${env.PORT} (${env.NODE_ENV})`
  );
});

/**
 * Graceful shutdown: stop accepting connections, drain in-flight requests,
 * disconnect Prisma, then exit. Falls back to a hard exit after 10s.
 */
const shutdown = (signal: string): void => {
  console.log(`${signal} received, shutting down gracefully...`);
  server.close(async (err) => {
    try {
      await prisma.$disconnect();
    } finally {
      process.exit(err ? 1 : 0);
    }
  });
  setTimeout(() => {
    console.error("Forced shutdown after timeout");
    process.exit(1);
  }, 10_000).unref();
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
