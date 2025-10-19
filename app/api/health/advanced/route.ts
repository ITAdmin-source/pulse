/**
 * Advanced health check endpoint with detailed monitoring
 * Used by uptime monitoring services and internal diagnostics
 */

import { NextResponse } from "next/server";
import { db } from "@/db/db";
import { sql } from "drizzle-orm";
import { logger, ConnectionPoolMonitor } from "@/lib/monitoring";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface HealthCheckResult {
  status: "healthy" | "degraded" | "unhealthy";
  timestamp: string;
  checks: {
    database: {
      status: "ok" | "slow" | "failed";
      responseTime: number;
      connectionInfo?: {
        timestamp: Date | string;
        activeConnections: number | bigint;
        idleConnections: number | bigint;
        databaseSize: number | bigint;
      };
      error?: string;
    };
    memory?: {
      used: number;
      total: number;
      percentage: number;
    };
  };
  version?: string;
}

export async function GET() {
  const startTime = Date.now();
  const result: HealthCheckResult = {
    status: "healthy",
    timestamp: new Date().toISOString(),
    checks: {
      database: {
        status: "ok",
        responseTime: 0,
      },
    },
    version: process.env.NEXT_PUBLIC_APP_VERSION || "unknown",
  };

  try {
    // Database health check with connection pool info
    const dbStartTime = Date.now();

    const dbResult = await db.execute(sql`
      SELECT
        current_timestamp as timestamp,
        pg_database_size(current_database()) as db_size,
        (SELECT count(*) FROM pg_stat_activity WHERE state = 'active') as active_connections,
        (SELECT count(*) FROM pg_stat_activity WHERE state = 'idle') as idle_connections
    `);

    const dbResponseTime = Date.now() - dbStartTime;

    result.checks.database = {
      status: dbResponseTime > 500 ? "slow" : "ok",
      responseTime: dbResponseTime,
      connectionInfo: dbResult[0] ? {
        timestamp: dbResult[0].timestamp as Date | string,
        activeConnections: Number(dbResult[0].active_connections || 0),
        idleConnections: Number(dbResult[0].idle_connections || 0),
        databaseSize: Number(dbResult[0].db_size || 0),
      } : undefined,
    };

    // Warn if database is slow
    if (dbResponseTime > 500) {
      result.status = "degraded";
      logger.warn("Database health check is slow", {
        action: "health_check",
        duration: dbResponseTime,
        metadata: {
          threshold: 500,
          connectionInfo: result.checks.database.connectionInfo,
        },
      });
    }

    // Check memory usage (Node.js process)
    if (typeof process !== "undefined" && process.memoryUsage) {
      const memoryUsage = process.memoryUsage();
      const totalMemory = memoryUsage.heapTotal;
      const usedMemory = memoryUsage.heapUsed;
      const memoryPercentage = (usedMemory / totalMemory) * 100;

      result.checks.memory = {
        used: usedMemory,
        total: totalMemory,
        percentage: Math.round(memoryPercentage * 100) / 100,
      };

      // Warn if memory usage is high
      if (memoryPercentage > 80) {
        result.status = "degraded";
        logger.warn("High memory usage detected", {
          action: "health_check",
          metadata: {
            memoryPercentage,
            threshold: 80,
          },
        });
      }
    }

    // Track health check execution
    ConnectionPoolMonitor.checkHealth();

    // Log successful health check
    const totalDuration = Date.now() - startTime;
    logger.performance("health_check.total", totalDuration);

    return NextResponse.json(result, {
      status: result.status === "healthy" ? 200 : 503,
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });
  } catch (error) {
    const dbResponseTime = Date.now() - startTime;

    logger.error(
      "Health check failed",
      error as Error,
      {
        action: "health_check_failure",
        duration: dbResponseTime,
        metadata: {
          critical: true,
        },
      }
    );

    result.status = "unhealthy";
    result.checks.database = {
      status: "failed",
      responseTime: dbResponseTime,
      error: (error as Error).message,
    };

    return NextResponse.json(result, {
      status: 503,
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });
  }
}
