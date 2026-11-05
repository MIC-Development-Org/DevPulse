import "server-only";
import NextAuth, { type NextAuthConfig } from "next-auth";
import GitHubProvider from "next-auth/providers/github";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prismaAuth } from "@/lib/prisma-auth";
import { getSessionCookieOptions } from "@/lib/session-cookie";

/**
 * Auth.js v5 configuration (Phase 2) — database-backed sessions.
 *
 * IMPORTANT ARCHITECTURE NOTE (verified against Auth.js v5 beta behavior):
 * v5 does not support the built-in credentials SIGN-IN action together with
 * `strategy: "database"` (it throws UnsupportedStrategy). The rest of the
 * session lifecycle IS database-native. Therefore:
 *   - credentials sign-in is a custom BFF route
 *     (src/app/api/auth/credentials/route.ts) that verifies with Express and
 *     creates the session row through the SAME PrismaAdapter,
 *   - session reads (auth()/useSession), expiry updates and sign-out are
 *     handled by Auth.js exactly as always,
 *   - OAuth (GitHub) sign-ins use Auth.js's native flow with DB sessions.
 *
 * The raw session token lives only in an HttpOnly cookie and inside this
 * server process; Express validates the same Session rows per request.
 * See backend/docs/auth-integration.md.
 */

const isProduction = process.env.NODE_ENV === "production";

const providers: NextAuthConfig["providers"] = [];

// GitHub OAuth is optional: added only when both client credentials exist
// (imported statically — importing the provider module needs no env vars).
// Local development works entirely without it (approved plan decision).
if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
  providers.push(
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
    })
  );
}

export const authConfig: NextAuthConfig = {
  adapter: PrismaAdapter(prismaAuth),
  providers,
  session: {
    strategy: "database",
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // refresh expiry once a day
  },
  pages: { signIn: "/login" },
  cookies: {
    sessionToken: {
      name: getSessionCookieOptions().name,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: getSessionCookieOptions().secure,
      },
    },
  },
  // Host-trust policy (Phase 2 plan v2, verified against Auth.js v5):
  //  - development: any local host is trusted (permissive as before).
  //  - production: STRICT by default — untrusted Host headers are rejected.
  //    Our production topology (frontend behind OUR reverse proxy, see
  //    backend/docs/auth-integration.md) opts in explicitly with
  //    AUTH_TRUST_HOST=true — the Auth.js-supported switch for trusted-proxy
  //    deployments. AUTH_URL keeps pinning the canonical origin.
  trustHost: !isProduction || process.env.AUTH_TRUST_HOST === "true",
  callbacks: {
    // Database strategy builds `session` from the ENTIRE Session + User rows
    // (including sessionToken and passwordHash). Returning a freshly built,
    // explicitly-shaped object replaces the whole payload so raw token/hash
    // can never leak into auth() or the /api/auth/session response body.
    session({ session, user }) {
      return {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          role: (user.role ?? "USER") as "USER" | "ADMIN",
        },
        expires: session.expires,
      };
    },
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
