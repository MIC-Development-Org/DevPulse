import { NextResponse } from "next/server";
import { TRACKS } from "@/lib/data/mock-data";
import {
  businessRouteNotImplemented,
  notImplementedResponse,
} from "@/lib/api/not-implemented";

export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  if (businessRouteNotImplemented()) return notImplementedResponse();
  const track = TRACKS.find((t) => t.slug === params.slug);
  if (!track) {
    return NextResponse.json({ error: "Track not found" }, { status: 404 });
  }
  return NextResponse.json(track);
}

