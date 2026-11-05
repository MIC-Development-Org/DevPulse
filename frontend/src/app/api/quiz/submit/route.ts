import { NextResponse } from "next/server";
import { QuizSubmissionSchema } from "@/lib/contracts";
import { api } from "@/lib/api/api-client";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = QuizSubmissionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid submission format", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const result = await api.submitQuiz(parsed.data);
    return NextResponse.json(result);
  } catch (err: unknown) {
    const error = err as Error;
    return NextResponse.json(
      { error: "Internal server scoring error", message: error.message },
      { status: 500 }
    );
  }
}

