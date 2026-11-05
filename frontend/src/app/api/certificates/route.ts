import { NextResponse } from "next/server";
import { CERTIFICATES } from "@/lib/data/mock-data";

export async function GET() {
  return NextResponse.json(CERTIFICATES);
}

