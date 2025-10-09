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
  const timeoutMs = 15000; // 15 seconds

  // Build prompt
  const userPrompt = generateUserPrompt(request);

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      // Call OpenAI API with GPT-5 mini
      const completion = await openai.chat.completions.create(
        {
          model: "gpt-5-mini",
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: userPrompt },
          ],
          max_completion_tokens: 500, // GPT-5 uses max_completion_tokens instead of max_tokens
          temperature: 0.7,
        },
        {
          signal: controller.signal,
        }
      );

      clearTimeout(timeoutId);

      // Extract response
      const rawResponse = completion.choices[0]?.message?.content;

      if (!rawResponse) {
        throw new Error("Empty response from OpenAI");
      }

      // Parse response
      const { title, body } = parseInsightResponse(rawResponse);

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
      model: "gpt-5-mini",
      messages: [{ role: "user", content: "Say 'OK' in Hebrew" }],
      max_completion_tokens: 10, // GPT-5 uses max_completion_tokens
    });

    return !!completion.choices[0]?.message?.content;
  } catch (error) {
    console.error("[OpenAI] Connection test failed:", error);
    return false;
  }
}
