import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { VotingService } from "@/lib/services/voting-service";
import { getOrCreateSessionId } from "@/lib/utils/session";
import { voteLimiter } from "@/lib/utils/rate-limit";

export async function POST(request: NextRequest) {
  try {
    const { userId: clerkUserId } = await auth();
    const sessionId = await getOrCreateSessionId();
    const identifier = clerkUserId || sessionId;

    // Rate limit: max 20 votes per minute per user
    const { success } = await voteLimiter.check(identifier, 20);
    if (!success) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Please slow down." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { statementId, value } = body;

    if (!statementId || value === undefined) {
      return NextResponse.json(
        { error: "Statement ID and vote value are required" },
        { status: 400 }
      );
    }

    // Validate vote value
    if (![-1, 0, 1].includes(value)) {
      return NextResponse.json(
        { error: "Vote value must be -1, 0, or 1" },
        { status: 400 }
      );
    }

    let anonymousSessionId: string | undefined;
    if (!clerkUserId) {
      // Anonymous user - use session ID
      anonymousSessionId = sessionId;
    }

    // Cast vote with automatic user creation
    const vote = await VotingService.castVoteWithUserCreation(
      statementId,
      value,
      clerkUserId || undefined,
      anonymousSessionId
    );

    return NextResponse.json({ vote, success: true });
  } catch (error) {
    console.error("Error casting vote:", error);

    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to cast vote" },
      { status: 500 }
    );
  }
}