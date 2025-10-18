import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { StatementService } from "@/lib/services/statement-service";
import { getOrCreateSessionId } from "@/lib/utils/session";
import { statementLimiter } from "@/lib/utils/rate-limit";

export async function POST(request: NextRequest) {
  try {
    const { userId: clerkUserId } = await auth();
    const sessionId = await getOrCreateSessionId();
    const identifier = clerkUserId || sessionId;

    // Rate limit: max 5 statements per hour per user
    const { success } = await statementLimiter.check(identifier, 5);
    if (!success) {
      return NextResponse.json(
        { error: "Rate limit exceeded. You can only submit 5 statements per hour." },
        { status: 429 }
      );
    }

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

    let anonymousSessionId: string | undefined;
    if (!clerkUserId) {
      // Anonymous user - use session ID
      anonymousSessionId = sessionId;
    }

    // Create statement with automatic user creation
    const statement = await StatementService.createStatementWithUserCreation(
      pollId,
      text.trim(),
      clerkUserId || undefined,
      anonymousSessionId
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