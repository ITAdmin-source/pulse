import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { generateInsight, generateFallbackInsight } from "@/lib/ai/openai-client";
import { RateLimiter } from "@/lib/utils/rate-limiter";
import { UserService } from "@/lib/services/user-service";
import { getOrCreateSessionId } from "@/lib/utils/session";
import { getVotesByUserId } from "@/db/queries/votes-queries";
import { getPollById } from "@/db/queries/polls-queries";
import { getApprovedStatementsByPollId } from "@/db/queries/statements-queries";
import type { InsightGenerationRequest } from "@/lib/types/openai";

export async function POST(request: NextRequest) {
  const startTime = performance.now();
  console.log("[API] ===== INSIGHT GENERATION REQUEST STARTED =====");
  console.log("[API] Timestamp:", new Date().toISOString());

  try {
    const { userId: clerkUserId } = await auth();
    const body = await request.json();
    const { pollId } = body;

    if (!pollId) {
      return NextResponse.json({ error: "Poll ID is required" }, { status: 400 });
    }

    console.log("[API] Request parsed - pollId:", pollId, "clerkUserId:", clerkUserId || "anonymous");

    // Resolve to database user ID
    let dbUser;
    let sessionId: string | undefined;

    const userLookupStart = performance.now();
    if (clerkUserId) {
      // Authenticated user
      dbUser = await UserService.findByClerkId(clerkUserId);
    } else {
      // Anonymous user
      sessionId = await getOrCreateSessionId();
      if (sessionId) {
        dbUser = await UserService.findBySessionId(sessionId);
      }
    }
    console.log(`[API] ⏱️ User lookup: ${Math.round(performance.now() - userLookupStart)}ms`);

    if (!dbUser) {
      return NextResponse.json(
        { error: "User not found. Please start voting first." },
        { status: 404 }
      );
    }

    const effectiveUserId = dbUser.id;

    // Check rate limit (only for authenticated users to prevent localStorage abuse)
    if (clerkUserId) {
      const rateLimit = RateLimiter.check(effectiveUserId);

      if (!rateLimit.allowed) {
        const resetDate = new Date(rateLimit.resetAt);
        return NextResponse.json(
          {
            error: "Rate limit exceeded",
            message: `You've reached the daily limit of 10 insights. Resets at ${resetDate.toLocaleString("he-IL")}`,
            resetAt: rateLimit.resetAt,
          },
          { status: 429 }
        );
      }
    }

    // Fetch poll data
    const pollFetchStart = performance.now();
    const poll = await getPollById(pollId);
    console.log(`[API] ⏱️ Poll fetch: ${Math.round(performance.now() - pollFetchStart)}ms`);

    if (!poll) {
      return NextResponse.json({ error: "Poll not found" }, { status: 404 });
    }

    // Fetch approved statements
    const statementsFetchStart = performance.now();
    const statements = await getApprovedStatementsByPollId(pollId);
    console.log(`[API] ⏱️ Statements fetch: ${Math.round(performance.now() - statementsFetchStart)}ms`);

    if (statements.length === 0) {
      return NextResponse.json(
        { error: "No statements found for this poll" },
        { status: 404 }
      );
    }

    const statementIds = new Set(statements.map((s) => s.id));

    // Fetch user's votes
    const votesFetchStart = performance.now();
    const allUserVotes = await getVotesByUserId(effectiveUserId);
    const pollVotes = allUserVotes.filter((v) => statementIds.has(v.statementId));
    console.log(`[API] ⏱️ Votes fetch: ${Math.round(performance.now() - votesFetchStart)}ms (${allUserVotes.length} total, ${pollVotes.length} for this poll)`);

    if (pollVotes.length === 0) {
      return NextResponse.json(
        { error: "No votes found for this poll. Please vote on statements first." },
        { status: 404 }
      );
    }

    // Calculate vote statistics
    const agreeCount = pollVotes.filter((v) => v.value === 1).length;
    const disagreeCount = pollVotes.filter((v) => v.value === -1).length;
    const unsureCount = pollVotes.filter((v) => v.value === 0).length;
    const total = pollVotes.length;

    const voteStatistics = {
      agreeCount,
      disagreeCount,
      unsureCount,
      total,
      agreePercent: Math.round((agreeCount / total) * 100),
      disagreePercent: Math.round((disagreeCount / total) * 100),
      unsurePercent: Math.round((unsureCount / total) * 100),
    };

    // Build statements with votes
    const statementsWithVotes = pollVotes.map((vote) => {
      const statement = statements.find((s) => s.id === vote.statementId);
      return {
        text: statement?.text || "",
        vote: vote.value as 1 | 0 | -1,
      };
    });

    // Fetch user demographics (including gender) if available
    const demographicsFetchStart = performance.now();
    const { getUserDemographicsById } = await import("@/db/queries/user-demographics-queries");
    const demographics = await getUserDemographicsById(effectiveUserId);
    console.log(`[API] ⏱️ Demographics fetch: ${Math.round(performance.now() - demographicsFetchStart)}ms`);
    console.log("[API] User demographics:", demographics);

    let genderLabel: string | undefined;
    if (demographics?.genderId) {
      const genderLookupStart = performance.now();
      const { db } = await import("@/db/db");
      const { genders } = await import("@/db/schema/genders");
      const { eq } = await import("drizzle-orm");

      const genderResult = await db
        .select()
        .from(genders)
        .where(eq(genders.id, demographics.genderId))
        .limit(1);

      genderLabel = genderResult[0]?.label;
      console.log(`[API] ⏱️ Gender lookup: ${Math.round(performance.now() - genderLookupStart)}ms - genderId: ${demographics.genderId}, label: ${genderLabel}`);
    } else {
      console.log("[API] No gender data found for user");
    }

    // Build request
    const insightRequest: InsightGenerationRequest = {
      userId: effectiveUserId,
      pollId: poll.id,
      pollQuestion: poll.question,
      pollDescription: poll.description,
      statements: statementsWithVotes,
      voteStatistics,
      demographics: genderLabel ? { gender: genderLabel } : undefined,
    };

    console.log("[API] Insight request demographics:", insightRequest.demographics);

    // Generate insight using OpenAI
    console.log("[API] 🤖 Starting OpenAI insight generation...");
    const aiGenerationStart = performance.now();
    let result;
    try {
      result = await generateInsight(insightRequest);
      const aiDuration = Math.round(performance.now() - aiGenerationStart);
      console.log(`[API] ⏱️ OpenAI generation: ${aiDuration}ms`);
      console.log(`[API] ✅ OpenAI success - tokens: ${result.tokensUsed.total}, cost: $${result.cost}`);

      // Increment rate limit only on successful generation (authenticated users)
      if (clerkUserId) {
        RateLimiter.increment(effectiveUserId);
      }
    } catch (error) {
      const aiDuration = Math.round(performance.now() - aiGenerationStart);
      console.error(`[API] ❌ Insight generation failed after ${aiDuration}ms, using fallback:`, error);

      // Use fallback insight
      result = generateFallbackInsight(insightRequest);
      result.tokensUsed.total = -1; // Indicator that fallback was used
      console.log("[API] ✅ Fallback insight generated");
    }

    const totalDuration = Math.round(performance.now() - startTime);
    console.log(`[API] ⏱️ ===== TOTAL REQUEST DURATION: ${totalDuration}ms =====`);

    return NextResponse.json({
      success: true,
      insight: {
        title: result.title,
        body: result.body,
      },
      metadata: {
        tokensUsed: result.tokensUsed,
        cost: result.cost,
        latency: result.latency,
        totalDuration, // Add total duration to response
      },
    });
  } catch (error) {
    const totalDuration = Math.round(performance.now() - startTime);
    console.error(`[API] ❌ Error in insight generation endpoint after ${totalDuration}ms:`, error);

    return NextResponse.json(
      {
        error: "Failed to generate insight",
        message: error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 }
    );
  }
}
