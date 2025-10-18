import { NextResponse } from 'next/server';
import { db } from '@/db/db';
import { sql } from 'drizzle-orm';

export async function GET() {
  try {
    // Simple query to verify database connection
    const result = await db.execute(sql`SELECT NOW() as timestamp, version() as pg_version`);

    // Access result data - Drizzle returns array directly
    const row = (result as unknown as Array<{ timestamp: Date; pg_version: string }>)[0];

    return NextResponse.json({
      status: 'healthy',
      database: 'connected',
      timestamp: row?.timestamp || new Date().toISOString(),
      version: row?.pg_version || 'unknown',
      environment: process.env.NODE_ENV,
    });
  } catch (error) {
    console.error('Database health check failed:', error);
    return NextResponse.json(
      {
        status: 'unhealthy',
        database: 'disconnected',
        error: error instanceof Error ? error.message : 'Unknown error',
        environment: process.env.NODE_ENV,
      },
      { status: 503 }
    );
  }
}

// Disable caching for health checks
export const dynamic = 'force-dynamic';
export const revalidate = 0;
