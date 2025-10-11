/**
 * OpenAI Client for GPT-5 Mini Integration
 *
 * Wrapper around OpenAI SDK with:
 * - Exponential backoff retry logic
 * - Timeout handling (15 seconds)
 * - Cost tracking
 * - Error handling
 *
 * Using GPT-5 mini (released August 2025)
 */

import OpenAI from "openai";
import type { InsightGenerationRequest, InsightGenerationResponse } from "@/lib/types/openai";
import { SYSTEM_PROMPT, generateUserPrompt, parseInsightResponse, getFallbackInsight } from "./prompts/insight-prompt-hebrew";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Pricing constants for GPT-5 mini (per million tokens)
const INPUT_COST_PER_MILLION = 0.25; // $0.25 per 1M input tokens
const OUTPUT_COST_PER_MILLION = 2.0; // $2.00 per 1M output tokens

/**
 * Sleep utility for retry delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Generate personal insight using GPT-5 mini
 *
 * @param request - Insight generation request data
 * @returns Generated insight with metadata
 * @throws Error if generation fails after retries
 */
export async function generateInsight(request: InsightGenerationRequest): Promise<InsightGenerationResponse> {
  const startTime = Date.now();
  const maxRetries = 3;
  const timeoutMs = 60000; // 60 seconds - GPT-5 reasoning models need more time

  console.log("[OpenAI] Starting insight generation for user:", request.userId, "poll:", request.pollId);
  console.log("[OpenAI] Vote statistics:", JSON.stringify(request.voteStatistics));

  // Check API key
  if (!process.env.OPENAI_API_KEY) {
    console.error("[OpenAI] OPENAI_API_KEY not found in environment!");
    throw new Error("OpenAI API key not configured");
  }

  console.log("[OpenAI] API key present (length:", process.env.OPENAI_API_KEY.length, ")");

  // Build prompt
  const userPrompt = generateUserPrompt(request);
  console.log("[OpenAI] Generated prompt (first 200 chars):", userPrompt.substring(0, 200) + "...");

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      console.log(`[OpenAI] Attempt ${attempt + 1}/${maxRetries} - Calling GPT-5 mini...`);

      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      // Call OpenAI API with GPT-5 mini
      // Note: GPT-5 models don't support custom temperature - only default (1)
      // GPT-5 mini is a reasoning model that uses tokens for internal thinking + output
      // Need higher token limit to account for both reasoning and actual response
      const apiRequest = {
        model: "gpt-5-mini" as const,
        messages: [
          { role: "system" as const, content: SYSTEM_PROMPT },
          { role: "user" as const, content: userPrompt },
        ],
        reasoning_effort: "minimal" as const,
        verbosity: "low" as const,
        max_completion_tokens: 4000 // GPT-5 uses ~2000 tokens for reasoning, need extra for Hebrew output (~200-500)
        // temperature not supported in GPT-5 - uses default value of 1
      };

      console.log("[OpenAI] ===== REQUEST JSON BEING SENT TO GPT-5 MINI =====");
      console.log(JSON.stringify(apiRequest, null, 2));
      console.log("[OpenAI] ===== END REQUEST JSON =====");

      const completion = await openai.chat.completions.create(
        apiRequest,
        {
          signal: controller.signal,
        }
      );

      console.log("[OpenAI] API call successful!");
      console.log("[OpenAI] Full completion object:", JSON.stringify(completion, null, 2));

      clearTimeout(timeoutId);

      // Extract response - GPT-5 reasoning models may have content in different places
      const message = completion.choices[0]?.message;
      console.log("[OpenAI] Message object:", JSON.stringify(message, null, 2));

      // Try multiple possible locations for the content
      const rawResponse = message?.content;

      // If content is null/empty, check if there's reasoning or other fields
      if (!rawResponse && message) {
        console.log("[OpenAI] Content is empty, checking alternative fields...");
        // GPT-5 reasoning models might use different structure
        const messageKeys = Object.keys(message);
        console.log("[OpenAI] Available message keys:", messageKeys);
      }

      console.log("[OpenAI] Raw response:", rawResponse);

      if (!rawResponse) {
        console.error("[OpenAI] Empty response from API!");
        console.error("[OpenAI] Full choices array:", JSON.stringify(completion.choices, null, 2));
        throw new Error("Empty response from OpenAI");
      }

      // Parse response
      console.log("[OpenAI] Parsing response...");
      const { title, body } = parseInsightResponse(rawResponse);
      console.log("[OpenAI] Parsed - Title:", title, "Body length:", body.length);

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

      // Log metrics for monitoring
      console.log(`[OpenAI] Insight generated - Tokens: ${tokensUsed.total}, Cost: $${cost.total.toFixed(6)}, Latency: ${latency}ms`);

      return {
        title,
        body,
        tokensUsed,
        cost,
        latency,
      };
    } catch (error) {
      const isLastAttempt = attempt === maxRetries - 1;
      const apiError = error as { name?: string; status?: number; message?: string };

      // Handle timeout
      if (apiError.name === "AbortError") {
        console.error(`[OpenAI] Request timeout (attempt ${attempt + 1}/${maxRetries})`);
        if (!isLastAttempt) {
          await sleep(1000 * Math.pow(2, attempt)); // Exponential backoff: 1s, 2s, 4s
          continue;
        }
        throw new Error("OpenAI request timed out after multiple attempts");
      }

      // Handle rate limit (429)
      if (apiError.status === 429) {
        console.error(`[OpenAI] Rate limit hit (attempt ${attempt + 1}/${maxRetries})`);
        if (!isLastAttempt) {
          await sleep(2000 * Math.pow(2, attempt)); // Longer backoff: 2s, 4s, 8s
          continue;
        }
        throw new Error("OpenAI rate limit exceeded. Please try again later.");
      }

      // Handle API errors (500, 502, etc.)
      if (apiError.status && apiError.status >= 500) {
        console.error(`[OpenAI] Server error ${apiError.status} (attempt ${attempt + 1}/${maxRetries})`);
        if (!isLastAttempt) {
          await sleep(1000 * Math.pow(2, attempt));
          continue;
        }
        throw new Error("OpenAI service temporarily unavailable");
      }

      // Handle authentication errors (401)
      if (apiError.status === 401) {
        console.error("[OpenAI] Authentication failed - check API key");
        throw new Error("OpenAI authentication failed");
      }

      // Unknown error
      console.error(`[OpenAI] Unexpected error (attempt ${attempt + 1}/${maxRetries}):`, error);
      if (!isLastAttempt) {
        await sleep(1000 * Math.pow(2, attempt));
        continue;
      }

      throw new Error(apiError.message || "Unknown error generating insight");
    }
  }

  // Should never reach here, but TypeScript needs it
  throw new Error("Failed to generate insight after all retries");
}

/**
 * Generate fallback insight when AI fails
 * Uses template-based generation
 *
 * @param request - Insight generation request data
 * @returns Fallback insight
 */
export function generateFallbackInsight(request: InsightGenerationRequest): InsightGenerationResponse {
  const startTime = Date.now();
  const { title, body } = getFallbackInsight(request.voteStatistics);

  return {
    title,
    body,
    tokensUsed: { input: 0, output: 0, total: 0 },
    cost: { input: 0, output: 0, total: 0 },
    latency: Date.now() - startTime,
  };
}

/**
 * Test OpenAI connection
 * Useful for health checks and setup verification
 *
 * @returns True if connection successful
 */
export async function testConnection(): Promise<boolean> {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-5-mini" as const,
      messages: [{ role: "user" as const, content: "Say 'OK' in Hebrew" }],
      max_completion_tokens: 10, // GPT-5 uses max_completion_tokens
    });

    return !!completion.choices[0]?.message?.content;
  } catch (error) {
    console.error("[OpenAI] Connection test failed:", error);
    return false;
  }
}
