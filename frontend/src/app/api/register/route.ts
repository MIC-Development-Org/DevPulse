import { NextRequest, NextResponse } from "next/server";
import { RegisterInputSchema } from "@devpulse/contracts";
import { backendInternalUrl } from "@/lib/bff";

/**
 * BFF registration endpoint (Phase 2): browser → here → Express /auth/register.
 *
 * Validation happens twice by design: here (friendly field errors) and in
 * Express (authoritative). Success returns the safe user; failure envelopes
 * are curated — internal/Prisma error text never surfaces.
 */

const GENERIC_CONFLICT = "This email cannot be used to create an account.";
const GENERIC_FAILURE = "Registration failed. Please try again.";
const GENERIC_RATE_LIMITED = "Too many requests. Please try again later.";

export async function POST(request: NextRequest) {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = RegisterInputSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid registration data",
        details: parsed.error.flatten().fieldErrors,
      },
      { status: 400 }
    );
  }

  try {
    const res = await fetch(`${backendInternalUrl()}/auth/register`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(parsed.data),
      cache: "no-store",
    });

    if (res.status === 201) {
      const user = await res.json();
      return NextResponse.json(user, { status: 201 });
    }

    if (res.status === 409) {
      return NextResponse.json({ error: GENERIC_CONFLICT }, { status: 409 });
    }

    if (res.status === 429) {
      return NextResponse.json({ error: GENERIC_RATE_LIMITED }, { status: 429 });
    }

    if (res.status === 400) {
      // Express rejected shape we already validated — forward the generic
      // part of its 400 without inventing new error text.
      const body = (await res.json().catch(() => null)) as { error?: string } | null;
      return NextResponse.json(
        { error: body?.error ?? "Invalid registration data" },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: GENERIC_FAILURE }, { status: 502 });
  } catch {
    return NextResponse.json({ error: GENERIC_FAILURE }, { status: 502 });
  }
}
