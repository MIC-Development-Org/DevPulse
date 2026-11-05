import type { Role, User } from "@prisma/client";
import { prisma } from "../lib/prisma";

export interface UserCreateWithPasswordInput {
  name?: string;
  email: string;
  passwordHash: string;
}

/**
 * User persistence for authentication flows. Exposes only what auth services
 * need; other layers must go through services, never directly to Prisma.
 *
 * passwordHash is an internal column: repositories may return User rows with
 * it inside the backend process, but services are the only place that reads
 * it, and no HTTP response mapping ever includes it.
 */
export const userRepository = {
  /** Insert-only creation. Uniqueness conflicts surface as Prisma P2002 —
   * the service layer maps them, so no read-before-write race exists. */
  createWithPassword(
    input: UserCreateWithPasswordInput
  ): Promise<User> {
    return prisma.user.create({
      data: {
        name: input.name ?? null,
        email: input.email,
        passwordHash: input.passwordHash,
      },
    });
  },

  /** Case-insensitive email lookup (emails are normalized to lowercase at
   * the contract layer; insensitive matching stays robust even if OAuth
   * users arrive with mixed-case addresses). */
  findByEmail(email: string): Promise<User | null> {
    return prisma.user.findFirst({
      where: { email: { equals: email, mode: "insensitive" } },
    });
  },

  findById(id: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { id } });
  },
};

export type UserWithRole = User & { role: Role };
