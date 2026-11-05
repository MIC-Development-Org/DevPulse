import type { AuthContext } from "./auth-context";

// Extend Express' Request with a typed authentication slot. This is the only
// sanctioned way identity crosses into handlers (populated by requireAuth).
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      authContext?: AuthContext;
    }
  }
}

export {};
