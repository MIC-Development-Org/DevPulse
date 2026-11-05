import { Prisma, Session, User } from "@prisma/client";
import { prisma } from "../lib/prisma";

export type SessionWithUser = Session & { user: User };

/**
 * Session persistence for token introspection.
 *
 * Auth.js (Next.js) creates and deletes Session rows via the Prisma adapter.
 * The backend never creates sessions for credential logins — it only looks
 * them up. `create`/`deleteByToken` exist for integration tests (simulating
 * expiry by inserting stale rows, simulating logout by deleting the row).
 */
export const sessionRepository = {
  create(input: {
    sessionToken: string;
    userId: string;
    expires: Date;
  }): Promise<Session> {
    return prisma.session.create({ data: input });
  },

  /** The hot path for `requireAuth`: token -> session + user in one query. */
  findByTokenWithUser(sessionToken: string): Promise<SessionWithUser | null> {
    return prisma.session.findUnique({
      where: { sessionToken },
      include: { user: true },
    });
  },

  deleteByToken(sessionToken: string): Promise<Session> {
    return prisma.session.delete({ where: { sessionToken } });
  },

  deleteExpired(): Promise<Prisma.BatchPayload> {
    return prisma.session.deleteMany({ where: { expires: { lt: new Date() } } });
  },
};
