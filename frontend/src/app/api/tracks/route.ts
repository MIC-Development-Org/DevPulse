import { NextResponse } from "next/server";
import { TRACKS } from "@/lib/data/mock-data";
import {
  businessRouteNotImplemented,
  notImplementedResponse,
} from "@/lib/api/not-implemented";

export async function GET() {
  if (businessRouteNotImplemented()) return notImplementedResponse();
  return NextResponse.json(TRACKS);
}

