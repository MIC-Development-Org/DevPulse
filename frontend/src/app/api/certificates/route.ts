import { NextResponse } from "next/server";
import { CERTIFICATES } from "@/lib/data/mock-data";
import {
  businessRouteNotImplemented,
  notImplementedResponse,
} from "@/lib/api/not-implemented";

// Certificates are a frontend-curated static catalog (no backend endpoint by
// design; see @devpulse/contracts header). This route still gets the Phase 3
// dead-route guard so nothing under /api silently serves mock payloads in a
// non-mock context.
export async function GET() {
  if (businessRouteNotImplemented()) return notImplementedResponse();
  return NextResponse.json(CERTIFICATES);
}

