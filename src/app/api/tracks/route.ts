import { NextResponse } from "next/server";
import { TRACKS } from "@/lib/data/mock-data";

export async function GET() {
  return NextResponse.json(TRACKS);
}

