import { NextResponse } from "next/server";
import { db } from "@/db/db";
import { sql } from "drizzle-orm";

export async function GET() {
  try {
    const startTime = Date.now();

    // Try a simple query to test database connectivity
    const result = await db.execute(sql`SELECT 1 as test, current_timestamp as timestamp`);

    const responseTime = Date.now() - startTime;

    // Parse database URL for info (without exposing password)
    const dbUrl = process.env.DATABASE_URL ? new URL(process.env.DATABASE_URL) : null;

    return NextResponse.json({
      status: "healthy",
      database: {
        connected: true,
        host: dbUrl?.hostname || "unknown",
        port: dbUrl?.port || "unknown",
        database: dbUrl?.pathname?.slice(1) || "unknown",
        responseTime: `${responseTime}ms`,
        timestamp: result[0]?.timestamp || new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Database health check failed:", error);

    // Parse database URL for debugging info
    const dbUrl = process.env.DATABASE_URL ? new URL(process.env.DATABASE_URL) : null;

    let errorMessage = "Database connection failed";
    let errorDetails = {};

    if (error instanceof Error) {
      errorMessage = error.message;

      // Check for common connection errors
      if (error.message.includes("ENOTFOUND")) {
        errorDetails = {
          type: "DNS_RESOLUTION_FAILED",
          host: dbUrl?.hostname || "unknown",
          suggestion: "Check if the Supabase project exists and is active",
        };
      } else if (error.message.includes("ETIMEDOUT")) {
        errorDetails = {
          type: "CONNECTION_TIMEOUT",
          host: dbUrl?.hostname || "unknown",
          suggestion: "Check network connectivity and firewall settings",
        };
      } else if (error.message.includes("password authentication failed")) {
        errorDetails = {
          type: "AUTHENTICATION_FAILED",
          suggestion: "Check DATABASE_URL credentials in .env.local",
        };
      } else if (error.message.includes("database") && error.message.includes("does not exist")) {
        errorDetails = {
          type: "DATABASE_NOT_FOUND",
          database: dbUrl?.pathname?.slice(1) || "unknown",
          suggestion: "Check if the database name in DATABASE_URL is correct",
        };
      }
    }

    return NextResponse.json(
      {
        status: "unhealthy",
        database: {
          connected: false,
          host: dbUrl?.hostname || "unknown",
          port: dbUrl?.port || "unknown",
          database: dbUrl?.pathname?.slice(1) || "unknown",
          error: errorMessage,
          details: errorDetails,
        },
      },
      { status: 503 }
    );
  }
}