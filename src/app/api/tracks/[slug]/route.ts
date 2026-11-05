import { NextResponse } from "next/server";
import { TRACKS } from "@/lib/data/mock-data";

export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  const track = TRACKS.find((t) => t.slug === params.slug);
  if (!track) {
    return NextResponse.json({ error: "Track not found" }, { status: 404 });
  }
  return NextResponse.json(track);
}

