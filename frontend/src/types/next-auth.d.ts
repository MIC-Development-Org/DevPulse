import type { DefaultSession } from "next-auth";
import type { JWT } from "next-auth/jwt";

/** Prisma Role enum values shared with the backend via @devpulse/contracts. */
type AppRole = "USER" | "ADMIN";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: AppRole;
    } & DefaultSession["user"];
  }

  interface User {
    role?: AppRole;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: AppRole;
  }
}
