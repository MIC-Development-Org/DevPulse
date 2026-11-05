import { randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { LoginRequestSchema } from "@devpulse/contracts";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { backendInternalUrl } from "@/lib/bff";
import { prismaAuth } from "@/lib/prisma-auth";
import {
  SESSION_MAX_AGE_SECONDS,
  getSessionCookieOptions,
} from "@/lib/session-cookie";

/**
 * Credentials sign-in (Phase 2) — replaces Auth.js's built-in credentials
 * *action*, which v5 rejects for database sessions ("UnsupportedStrategy").
 *
 * Everything else about the session lifecycle is unchanged and still owned
 * by Auth.js + the Prisma adapter:
 *   - the row is created through the same PrismaAdapter instance Auth.js uses,
 *   - auth()/useSession/signOut resolve or delete this cookie/row as usual,
 *   - OAuth (GitHub) sign-ins keep using Auth.js's own flow.
 *
 * Security properties:
 *   - token = 256-bit CSPRNG value, delivered only in an HttpOnly cookie, and
 *     validated per-request by Express against the Session table.
 *   - credentials verification happens in Express (Argon2id) via a
 *     server-to-server call; generic failure bodies only.
 *   - origin-checked (CSRF) and same-origin Add-Cookie semantics.
 */

const GENERIC_CREDENTIALS_FAILURE = "Invalid email or password";
const GENERIC_SESSION_FAILURE = "Unable to sign in. Please try again.";

const isSecureOriginRequired = (origin: string | null, req: NextRequest): boolean => {
  if (!origin) return false;
  try {
    const originHost = new URL(origin).host;
    const requestHost = req.headers.get("host");
    return !requestHost || originHost !== requestHost;
  } catch {
    return true;
  }
};

export async function POST(request: NextRequest) {
  // CSRF: same-origin POSTs only (browser fetches always send Origin).
  const origin = request.headers.get("origin");
  if (isSecureOriginRequired(origin, request)) {
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: GENERIC_CREDENTIALS_FAILURE }, { status: 400 });
  }

  const parsed = LoginRequestSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: GENERIC_CREDENTIALS_FAILURE }, { status: 401 });
  }

  let user: { id: string; name?: string | null; email?: string | null; image?: string | null };
  try {
    const res = await fetch(`${backendInternalUrl()}/auth/login`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(parsed.data),
      cache: "no-store",
    });

    if (res.status !== 200) {
      // 401 (and everything else) -> one generic body; no enumeration signal.
      return NextResponse.json({ error: GENERIC_CREDENTIALS_FAILURE }, { status: 401 });
    }

    const data = (await res.json()) as { user?: typeof user };
    if (!data.user?.id) {
      return NextResponse.json({ error: GENERIC_CREDENTIALS_FAILURE }, { status: 401 });
    }
    user = data.user;
  } catch {
    return NextResponse.json({ error: GENERIC_SESSION_FAILURE }, { status: 502 });
  }

  // Create the database-backed session through Auth.js's own adapter so the
  // row shape/lifecycle matches rows created by OAuth sign-ins exactly.
  const sessionToken = randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000);

  const adapter = PrismaAdapter(prismaAuth);
  try {
    await adapter.createSession?.({ sessionToken, userId: user.id, expires });
  } catch {
    return NextResponse.json({ error: GENERIC_SESSION_FAILURE }, { status: 502 });
  }

  const response = NextResponse.json({ ok: true });
  const cookieOptions = getSessionCookieOptions();
  response.cookies.set({
    name: cookieOptions.name,
    value: sessionToken,
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: cookieOptions.secure,
    maxAge: SESSION_MAX_AGE_SECONDS,
    expires,
  });
  return response;
}
