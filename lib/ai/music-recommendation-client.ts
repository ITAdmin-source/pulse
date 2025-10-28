/**
 * OpenAI Client for Music Recommendations
 *
 * Generates Israeli music recommendations using GPT-5 mini with structured outputs
 * Optimized for speed with retry logic and fallback handling
 */

import OpenAI from "openai";
import {
  MUSIC_SYSTEM_PROMPT,
  generateMusicPrompt,
  MusicRecommendationSchema,
  getFallbackMusicRecommendation
} from "./prompts/music-prompt-hebrew";
import type {
  MusicRecommendationRequest,
  MusicRecommendationResponse
} from "@/lib/types/music-recommendation";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Cost tracking (GPT-5 mini pricing)
const INPUT_COST_PER_MILLION = 0.25;
const OUTPUT_COST_PER_MILLION = 2.0;

/**
 * Generate music recommendation with FULL voting context + demographics
 *
 * @param request - Complete request with voting data and demographics
 * @returns Music recommendation with metadata
 * @throws Error if generation fails after retries (then uses fallback)
 */
export async function generateMusicRecommendation(
  request: MusicRecommendationRequest
): Promise<MusicRecommendationResponse> {
  const startTime = Date.now();
  const maxRetries = 2; // Fewer retries than insights (music is non-critical)
  const timeoutMs = 30000; // 30 seconds (enough for complex recommendations with demographics)

  console.log("[MusicAI] ===== STARTING MUSIC RECOMMENDATION =====");
  console.log("[MusicAI] Poll:", request.pollQuestion);
  console.log("[MusicAI] Statements:", request.statements.length);
  console.log("[MusicAI] Vote stats:", request.voteStatistics);
  console.log("[MusicAI] Demographics:", request.demographics);

  if (!process.env.OPENAI_API_KEY) {
    console.error("[MusicAI] OPENAI_API_KEY not found!");
    throw new Error("OpenAI API key not configured");
  }

  const userPrompt = generateMusicPrompt(request);
  console.log(`[MusicAI] Generated prompt: ${userPrompt.length} characters`);

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      console.log(`[MusicAI] Attempt ${attempt + 1}/${maxRetries} - Calling GPT-5 mini...`);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      const completion = await openai.chat.completions.create(
        {
          model: "gpt-5-mini" as const,
          messages: [
            { role: "system" as const, content: MUSIC_SYSTEM_PROMPT },
            { role: "user" as const, content: userPrompt },
          ],
          reasoning_effort: "minimal" as const, // Fastest reasoning
          verbosity: "low" as const,
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "music_recommendation",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  songTitle: { type: "string" },
                  artistName: { type: "string" },
                  spotifyLink: { type: "string" },
                  appleMusicLink: { type: "string" },
                  thumbnailUrl: { type: "string" },
                  reasoning: { type: "string" }
                },
                required: ["songTitle", "artistName", "spotifyLink", "appleMusicLink", "thumbnailUrl", "reasoning"],
                additionalProperties: false
              }
            }
          },
          max_completion_tokens: 600 // Slightly more for longer reasoning with demographics
        },
        { signal: controller.signal }
      );

      clearTimeout(timeoutId);

      const rawResponse = completion.choices[0]?.message?.content;
      if (!rawResponse) {
        throw new Error("Empty response from OpenAI");
      }

      console.log("[MusicAI] Raw response received, parsing JSON...");

      // Parse and validate with Zod
      const parsed = JSON.parse(rawResponse);
      const validated = MusicRecommendationSchema.parse(parsed);

      // Calculate metrics
      const tokensUsed = {
        input: completion.usage?.prompt_tokens || 0,
        output: completion.usage?.completion_tokens || 0,
        total: completion.usage?.total_tokens || 0,
      };

      const cost = {
        input: (tokensUsed.input / 1_000_000) * INPUT_COST_PER_MILLION,
        output: (tokensUsed.output / 1_000_000) * OUTPUT_COST_PER_MILLION,
        total: 0,
      };
      cost.total = cost.input + cost.output;

      const latency = Date.now() - startTime;

      console.log(`[MusicAI] ✅ SUCCESS - "${validated.songTitle}" by ${validated.artistName}`);
      console.log(`[MusicAI] Tokens: ${tokensUsed.total}, Cost: $${cost.total.toFixed(6)}, Latency: ${latency}ms`);
      console.log(`[MusicAI] Reasoning: ${validated.reasoning.substring(0, 100)}...`);

      return {
        ...validated,
        metadata: {
          tokensUsed,
          cost,
          latency,
          fallbackUsed: false
        }
      };

    } catch (error) {
      const isLastAttempt = attempt === maxRetries - 1;
      const apiError = error as { name?: string; status?: number; message?: string };

      console.error(`[MusicAI] Error on attempt ${attempt + 1}:`, error);

      // Handle timeout
      if (apiError.name === "AbortError") {
        console.error(`[MusicAI] Request timeout (attempt ${attempt + 1}/${maxRetries})`);
        if (!isLastAttempt) {
          await sleep(1000 * Math.pow(2, attempt)); // 1s, 2s
          continue;
        }
      }

      // Handle rate limit (429)
      if (apiError.status === 429) {
        console.error(`[MusicAI] Rate limit hit (attempt ${attempt + 1}/${maxRetries})`);
        if (!isLastAttempt) {
          await sleep(2000 * Math.pow(2, attempt)); // 2s, 4s
          continue;
        }
      }

      // If last attempt or non-retryable error, use fallback
      if (isLastAttempt) {
        console.log("[MusicAI] All retries exhausted, using demographic-aware fallback");
        const fallback = getFallbackMusicRecommendation(
          request.voteStatistics,
          request.demographics
        );
        const latency = Date.now() - startTime;

        console.log(`[MusicAI] ⚠️ FALLBACK - "${fallback.songTitle}" by ${fallback.artistName}`);

        return {
          ...fallback,
          metadata: {
            tokensUsed: { input: 0, output: 0, total: 0 },
            cost: { input: 0, output: 0, total: 0 },
            latency,
            fallbackUsed: true
          }
        };
      }

      // Retry
      await sleep(1000 * Math.pow(2, attempt));
    }
  }

  // Should never reach here, but TypeScript needs it
  throw new Error("Failed to generate music recommendation after all retries");
}

/**
 * Sleep utility for retry delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
