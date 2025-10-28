import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { UserService } from "@/lib/services/user-service";
import { getOrCreateSessionId } from "@/lib/utils/session";
import { generateMusicRecommendation } from "@/lib/ai/music-recommendation-client";
import { getMusicRecommendation, saveMusicRecommendation } from "@/db/queries/music-recommendation-queries";
import { getUserDemographicsById } from "@/db/queries/user-demographics-queries";
import { searchSpotifyTrack, validateSpotifyConfig } from "@/lib/services/spotify-service";
import { isMusicRecommendationsEnabled } from "@/lib/config/features";
import crypto from "crypto";

// ===========================================================================
// IN-MEMORY CACHE (Tier 1)
// ===========================================================================
// 10 minutes TTL, max 100 entries with LRU eviction
const musicCache = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes
const MAX_CACHE_ENTRIES = 100;

function generateFingerprint(title: string, body: string): string {
  return crypto.createHash('md5').update(`${title}:${body}`).digest('hex');
}

function evictOldestIfNeeded() {
  if (musicCache.size >= MAX_CACHE_ENTRIES) {
    const oldestKey = musicCache.keys().next().value;
    if (oldestKey) musicCache.delete(oldestKey);
  }
}

// ===========================================================================
// MUSIC RECOMMENDATION API ENDPOINT
// ===========================================================================
export async function POST(request: NextRequest) {
  const startTime = performance.now();
  console.log("[MusicAPI] ===== MUSIC RECOMMENDATION REQUEST STARTED =====");
  console.log("[MusicAPI] Timestamp:", new Date().toISOString());

  // -----------------------------------------------------------------------
  // 0. CHECK FEATURE FLAG
  // -----------------------------------------------------------------------
  if (!isMusicRecommendationsEnabled()) {
    console.log("[MusicAPI] ⚠️ Music recommendations feature is disabled");
    return NextResponse.json(
      {
        error: "Music recommendations feature is currently disabled",
        featureEnabled: false
      },
      { status: 503 }
    );
  }

  try {
    // -----------------------------------------------------------------------
    // 1. AUTHENTICATION & USER RESOLUTION
    // -----------------------------------------------------------------------
    const { userId: clerkUserId } = await auth();
    const body = await request.json();
    const {
      pollId,
      pollQuestion,
      pollDescription,
      statements,        // Full statements with votes (required)
      voteStatistics,    // Vote statistics (required)
      insightTitle,      // Optional: for context
      insightBody        // Optional: for context
    } = body;

    console.log("[MusicAPI] Request body:", {
      pollId,
      pollQuestion: pollQuestion?.substring(0, 50) + "...",
      statementsCount: statements?.length,
      hasInsight: !!(insightTitle && insightBody)
    });

    // Validate required fields
    if (!pollId || !pollQuestion || !statements || !voteStatistics) {
      return NextResponse.json({
        error: "Missing required fields",
        required: ["pollId", "pollQuestion", "statements", "voteStatistics"],
        received: { pollId: !!pollId, pollQuestion: !!pollQuestion, statements: !!statements, voteStatistics: !!voteStatistics }
      }, { status: 400 });
    }

    // Resolve user (authenticated or anonymous)
    let dbUser;
    if (clerkUserId) {
      dbUser = await UserService.findByClerkId(clerkUserId);
      console.log("[MusicAPI] Authenticated user:", clerkUserId);
    } else {
      const sessionId = await getOrCreateSessionId();
      if (sessionId) {
        dbUser = await UserService.findBySessionId(sessionId);
        console.log("[MusicAPI] Anonymous user with session:", sessionId);
      }
    }

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userId = dbUser.id;

    // -----------------------------------------------------------------------
    // 2. FETCH ENHANCED DEMOGRAPHICS (Age + Ethnicity + Gender)
    // -----------------------------------------------------------------------
    console.log("[MusicAPI] Step 2: Fetching user demographics...");
    const demographicsStart = performance.now();

    const demographicsData = await getUserDemographicsById(userId);

    let demographics: { gender?: string; ageGroup?: string; ethnicity?: string } | undefined;

    if (demographicsData) {
      const { db } = await import("@/db/db");
      const { genders } = await import("@/db/schema/genders");
      const { ageGroups } = await import("@/db/schema/age-groups");
      const { ethnicities } = await import("@/db/schema/ethnicities");
      const { eq } = await import("drizzle-orm");

      // Fetch gender label
      let genderLabel: string | undefined;
      if (demographicsData.genderId) {
        const genderResult = await db
          .select()
          .from(genders)
          .where(eq(genders.id, demographicsData.genderId))
          .limit(1);
        genderLabel = genderResult[0]?.label;
      }

      // Fetch age group label
      let ageGroupLabel: string | undefined;
      if (demographicsData.ageGroupId) {
        const ageGroupResult = await db
          .select()
          .from(ageGroups)
          .where(eq(ageGroups.id, demographicsData.ageGroupId))
          .limit(1);
        ageGroupLabel = ageGroupResult[0]?.label;
      }

      // Fetch ethnicity label
      let ethnicityLabel: string | undefined;
      if (demographicsData.ethnicityId) {
        const ethnicityResult = await db
          .select()
          .from(ethnicities)
          .where(eq(ethnicities.id, demographicsData.ethnicityId))
          .limit(1);
        ethnicityLabel = ethnicityResult[0]?.label;
      }

      demographics = {
        gender: genderLabel,
        ageGroup: ageGroupLabel,
        ethnicity: ethnicityLabel
      };

      console.log(`[MusicAPI] ⏱️ Demographics lookup: ${Math.round(performance.now() - demographicsStart)}ms`);
      console.log("[MusicAPI] Demographics loaded:", demographics);
    } else {
      console.log("[MusicAPI] No demographics found for user");
    }

    // -----------------------------------------------------------------------
    // 3. CACHE FINGERPRINT GENERATION
    // -----------------------------------------------------------------------
    // Generate fingerprint based on insight (if provided) or voting data
    const insightFingerprint = (insightTitle && insightBody)
      ? generateFingerprint(insightTitle, insightBody)
      : generateFingerprint(JSON.stringify(statements), pollQuestion);

    console.log("[MusicAPI] Cache fingerprint:", insightFingerprint.substring(0, 8) + "...");

    // -----------------------------------------------------------------------
    // 4. CHECK TIER 1 CACHE: IN-MEMORY
    // -----------------------------------------------------------------------
    const cacheKey = `${userId}:${pollId}:${insightFingerprint}`;
    const cached = musicCache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      const cacheHitDuration = Math.round(performance.now() - startTime);
      console.log(`[MusicAPI] ✅ CACHE HIT (in-memory) - ${cacheHitDuration}ms`);

      return NextResponse.json({
        success: true,
        music: cached.data,
        cached: true,
        cacheType: "memory",
        latency: cacheHitDuration
      });
    }

    // -----------------------------------------------------------------------
    // 5. CHECK TIER 2 CACHE: DATABASE
    // -----------------------------------------------------------------------
    const dbCacheStart = performance.now();
    const dbCached = await getMusicRecommendation(userId, pollId, insightFingerprint);

    if (dbCached) {
      const dbCacheDuration = Math.round(performance.now() - dbCacheStart);
      const totalDuration = Math.round(performance.now() - startTime);

      console.log(`[MusicAPI] ✅ CACHE HIT (database) - DB query: ${dbCacheDuration}ms, Total: ${totalDuration}ms`);

      // Promote to Tier 1 (in-memory cache)
      evictOldestIfNeeded();
      musicCache.set(cacheKey, {
        data: dbCached,
        timestamp: Date.now()
      });

      return NextResponse.json({
        success: true,
        music: dbCached,
        cached: true,
        cacheType: "database",
        latency: totalDuration
      });
    }

    // -----------------------------------------------------------------------
    // 6. CACHE MISS - GENERATE NEW RECOMMENDATION
    // -----------------------------------------------------------------------
    console.log("[MusicAPI] ⚠️ CACHE MISS - Generating new recommendation with full context");
    console.log("[MusicAPI] Context:", {
      statements: statements.length,
      demographics: demographics || "none",
      hasInsight: !!(insightTitle && insightBody)
    });

    const generationStart = performance.now();

    const result = await generateMusicRecommendation({
      userId,
      pollId,
      pollQuestion,
      pollDescription,
      statements,           // Full statements with votes
      voteStatistics,
      demographics,         // Age + ethnicity + gender
      insightTitle,
      insightBody
    });

    const generationDuration = Math.round(performance.now() - generationStart);
    console.log(`[MusicAPI] ⏱️ OpenAI generation: ${generationDuration}ms`);

    // -----------------------------------------------------------------------
    // 6.5. ENRICH WITH REAL SPOTIFY DATA
    // -----------------------------------------------------------------------
    let finalSpotifyLink = result.spotifyLink;
    let finalAppleMusicLink = result.appleMusicLink;
    let finalThumbnailUrl = result.thumbnailUrl;

    if (validateSpotifyConfig()) {
      console.log(`[MusicAPI] 🎵 Searching Spotify for real URLs...`);
      const spotifyStart = performance.now();

      const spotifyData = await searchSpotifyTrack(result.songTitle, result.artistName);

      if (spotifyData) {
        finalSpotifyLink = spotifyData.spotifyLink;
        finalAppleMusicLink = spotifyData.appleMusicSearchUrl;
        finalThumbnailUrl = spotifyData.thumbnailUrl;

        const spotifyDuration = Math.round(performance.now() - spotifyStart);
        console.log(`[MusicAPI] ✅ Spotify enrichment: ${spotifyDuration}ms`);
        console.log(`[MusicAPI] Real URLs obtained:`, {
          spotify: finalSpotifyLink,
          thumbnail: finalThumbnailUrl.substring(0, 50) + '...'
        });
      } else {
        console.warn(`[MusicAPI] ⚠️ Spotify search failed, using AI-generated URLs`);
      }
    } else {
      console.warn(`[MusicAPI] ⚠️ Spotify not configured, using AI-generated URLs`);
    }

    // -----------------------------------------------------------------------
    // 7. SAVE TO DATABASE (Tier 2 cache)
    // -----------------------------------------------------------------------
    const saveStart = performance.now();

    const saved = await saveMusicRecommendation({
      userId,
      pollId,
      songTitle: result.songTitle,
      artistName: result.artistName,
      spotifyLink: finalSpotifyLink,
      appleMusicLink: finalAppleMusicLink,
      thumbnailUrl: finalThumbnailUrl,
      reasoning: result.reasoning,
      insightFingerprint
    });

    const saveDuration = Math.round(performance.now() - saveStart);
    console.log(`[MusicAPI] ⏱️ Database save: ${saveDuration}ms`);

    // -----------------------------------------------------------------------
    // 8. SAVE TO IN-MEMORY CACHE (Tier 1)
    // -----------------------------------------------------------------------
    evictOldestIfNeeded();
    musicCache.set(cacheKey, {
      data: saved,
      timestamp: Date.now()
    });

    // -----------------------------------------------------------------------
    // 9. RETURN SUCCESS RESPONSE
    // -----------------------------------------------------------------------
    const totalDuration = Math.round(performance.now() - startTime);
    console.log(`[MusicAPI] ⏱️ ===== TOTAL REQUEST DURATION: ${totalDuration}ms =====`);
    console.log(`[MusicAPI] ✅ Recommended: "${result.songTitle}" by ${result.artistName}`);
    console.log(`[MusicAPI] Cost: $${result.metadata.cost.total.toFixed(6)}, Tokens: ${result.metadata.tokensUsed.total}`);

    return NextResponse.json({
      success: true,
      music: saved,
      cached: false,
      metadata: {
        ...result.metadata,
        totalDuration,
        breakdownMs: {
          demographics: Math.round(performance.now() - demographicsStart),
          generation: generationDuration,
          save: saveDuration
        }
      }
    });

  } catch (error) {
    const totalDuration = Math.round(performance.now() - startTime);
    console.error(`[MusicAPI] ❌ ERROR after ${totalDuration}ms:`, error);
    console.error("[MusicAPI] Error stack:", error instanceof Error ? error.stack : "No stack");

    return NextResponse.json(
      {
        error: "Failed to generate music recommendation",
        message: error instanceof Error ? error.message : "Unknown error occurred",
        latency: totalDuration
      },
      { status: 500 }
    );
  }
}
