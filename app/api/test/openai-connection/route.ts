import { NextResponse } from "next/server";
import OpenAI from "openai";

/**
 * Test endpoint to verify OpenAI API connection
 * Access at: /api/test/openai-connection
 */
export async function GET() {
  try {
    console.log("[OpenAI Test] Starting connection test...");

    // Check if API key exists
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.error("[OpenAI Test] OPENAI_API_KEY not found in environment");
      return NextResponse.json(
        {
          success: false,
          error: "OPENAI_API_KEY not configured",
          details: "Environment variable is missing",
        },
        { status: 500 }
      );
    }

    console.log("[OpenAI Test] API key found (length:", apiKey.length, ")");
    console.log("[OpenAI Test] API key starts with:", apiKey.substring(0, 10) + "...");

    // Initialize OpenAI client
    const openai = new OpenAI({
      apiKey: apiKey,
    });

    console.log("[OpenAI Test] OpenAI client initialized");

    // Test 1: Simple completion with GPT-5 mini
    console.log("[OpenAI Test] Attempting GPT-5 mini completion...");
    const startTime = Date.now();

    const completion = await openai.chat.completions.create({
      model: "gpt-5-mini",
      messages: [
        {
          role: "user",
          content: "Say 'שלום' (hello in Hebrew) and confirm you are GPT-5 mini",
        },
      ],
      max_completion_tokens: 50,
      // temperature not supported in GPT-5 - uses default value of 1
    });

    const latency = Date.now() - startTime;
    console.log("[OpenAI Test] Request completed in", latency, "ms");

    const response = completion.choices[0]?.message?.content;
    const tokensUsed = completion.usage;

    console.log("[OpenAI Test] Response:", response);
    console.log("[OpenAI Test] Tokens used:", tokensUsed);

    return NextResponse.json({
      success: true,
      message: "OpenAI connection successful",
      data: {
        model: completion.model,
        response: response,
        tokensUsed: tokensUsed,
        latency: latency,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("[OpenAI Test] Error:", error);

    const errorDetails = error as {
      status?: number;
      message?: string;
      type?: string;
      code?: string;
    };

    return NextResponse.json(
      {
        success: false,
        error: "OpenAI API request failed",
        details: {
          message: errorDetails.message || "Unknown error",
          status: errorDetails.status,
          type: errorDetails.type,
          code: errorDetails.code,
        },
      },
      { status: 500 }
    );
  }
}
