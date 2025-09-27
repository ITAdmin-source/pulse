import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { StatementService } from "@/lib/services/statement-service";
import { getOrCreateSessionId } from "@/lib/utils/session";

export async function POST(request: NextRequest) {
  try {
    const { userId: clerkUserId } = await auth();
    const body = await request.json();
    const { pollId, text } = body;

    if (!pollId || !text) {
      return NextResponse.json(
        { error: "Poll ID and statement text are required" },
        { status: 400 }
      );
    }

    // Validate statement text length
    if (text.trim().length === 0) {
      return NextResponse.json(
        { error: "Statement text cannot be empty" },
        { status: 400 }
      );
    }

    if (text.length > 500) {
      return NextResponse.json(
        { error: "Statement text cannot exceed 500 characters" },
        { status: 400 }
      );
    }

    let sessionId: string | undefined;
    if (!clerkUserId) {
      // Anonymous user - get session ID
      sessionId = await getOrCreateSessionId();
    }

    // Create statement with automatic user creation
    const statement = await StatementService.createStatementWithUserCreation(
      pollId,
      text.trim(),
      clerkUserId || undefined,
      sessionId
    );

    return NextResponse.json({ statement, success: true });
  } catch (error) {
    console.error("Error submitting statement:", error);

    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to submit statement" },
      { status: 500 }
    );
  }
}