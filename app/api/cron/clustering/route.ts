import { NextRequest, NextResponse } from "next/server";
import { ClusteringQueueService } from "@/lib/services/clustering-queue-service";

/**
 * Vercel Cron endpoint for processing clustering queue
 *
 * Security: Protected by Vercel Cron secret in production
 * Schedule: Every minute (configured in vercel.json)
 *
 * Usage:
 * - Production: Automatically triggered by Vercel Cron
 * - Local: curl http://localhost:3000/api/cron/clustering -H "Authorization: Bearer YOUR_CRON_SECRET"
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Verify authorization in production
    if (process.env.NODE_ENV === "production") {
      const authHeader = request.headers.get("authorization");
      const expectedAuth = `Bearer ${process.env.CRON_SECRET}`;

      if (!process.env.CRON_SECRET) {
        console.error("[Cron] CRON_SECRET not configured");
        return NextResponse.json(
          { error: "CRON_SECRET not configured" },
          { status: 500 }
        );
      }

      if (authHeader !== expectedAuth) {
        console.warn("[Cron] Unauthorized clustering cron request");
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    console.log("[Cron] Starting clustering queue processing...");

    // Process up to 5 jobs per invocation (rate limiting for safety)
    const results = await ClusteringQueueService.processQueue(5);

    const duration = Date.now() - startTime;

    console.log(
      `[Cron] ✅ Clustering queue processing complete in ${duration}ms:`,
      results
    );

    // Get queue stats for monitoring
    const stats = await ClusteringQueueService.getQueueStats();

    return NextResponse.json({
      success: true,
      duration,
      processed: results.processed,
      successful: results.successful,
      failed: results.failed,
      errors: results.errors,
      queueStats: stats,
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    console.error(`[Cron] ❌ Clustering queue processing failed:`, error);

    return NextResponse.json(
      {
        success: false,
        duration,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}
