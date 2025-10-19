/**
 * Comprehensive Supabase Connection Health Checker
 *
 * This script performs detailed diagnostics on the Supabase database connection:
 * - Tests basic connectivity
 * - Measures connection latency
 * - Tests concurrent connections
 * - Monitors connection pool status
 * - Provides detailed error diagnostics
 */

import { config } from "dotenv";
import postgres from "postgres";
import { performance } from "perf_hooks";

config({ path: ".env.local" });

interface ConnectionTest {
  name: string;
  success: boolean;
  duration: number;
  error?: string;
  details?: any;
}

const results: ConnectionTest[] = [];

async function logTest(name: string, testFn: () => Promise<any>): Promise<void> {
  const startTime = performance.now();
  try {
    console.log(`\n🔍 Running: ${name}`);
    const result = await testFn();
    const duration = Math.round(performance.now() - startTime);
    console.log(`✅ PASSED (${duration}ms)`);
    results.push({ name, success: true, duration, details: result });
  } catch (error) {
    const duration = Math.round(performance.now() - startTime);
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.log(`❌ FAILED (${duration}ms): ${errorMsg}`);
    results.push({ name, success: false, duration, error: errorMsg });
  }
}

async function main() {
  console.log("═══════════════════════════════════════════════════════");
  console.log("  SUPABASE CONNECTION HEALTH DIAGNOSTIC");
  console.log("═══════════════════════════════════════════════════════\n");

  if (!process.env.DATABASE_URL) {
    console.error("❌ DATABASE_URL not found in .env.local");
    process.exit(1);
  }

  // Parse connection string
  const dbUrl = new URL(process.env.DATABASE_URL);
  console.log("📋 Connection Configuration:");
  console.log(`   Host: ${dbUrl.hostname}`);
  console.log(`   Port: ${dbUrl.port}`);
  console.log(`   Database: ${dbUrl.pathname.slice(1)}`);
  console.log(`   User: ${dbUrl.username}`);
  console.log(`   Parameters: ${dbUrl.search}`);
  console.log(`   Has pgbouncer param: ${dbUrl.searchParams.has('pgbouncer')}`);

  // Validate configuration
  console.log("\n🔍 Configuration Validation:");
  const port = dbUrl.port;
  const hasPgBouncer = dbUrl.searchParams.has('pgbouncer');

  if (port === '5432' && hasPgBouncer) {
    console.log("⚠️  WARNING: Port 5432 (Session Mode) should NOT use ?pgbouncer=true");
    console.log("   Recommendation: Remove ?pgbouncer=true OR switch to port 6543");
  } else if (port === '6543' && !hasPgBouncer) {
    console.log("⚠️  WARNING: Port 6543 (Transaction Mode) should use ?pgbouncer=true");
    console.log("   Recommendation: Add ?pgbouncer=true to connection string");
  } else if (port === '5432') {
    console.log("✅ Port 5432 (Session Mode) - correct for persistent connections");
  } else if (port === '6543' && hasPgBouncer) {
    console.log("✅ Port 6543 (Transaction Mode) - correct for serverless");
  }

  // Test 1: Basic connectivity with minimal config
  await logTest("Test 1: Basic Connection (minimal config)", async () => {
    const client = postgres(process.env.DATABASE_URL!, {
      max: 1,
      idle_timeout: 20,
      connect_timeout: 10,
    });

    const result = await client`SELECT 1 as test, current_timestamp as ts, version() as version`;
    await client.end();

    return {
      timestamp: result[0]?.ts,
      version: result[0]?.version?.substring(0, 50),
    };
  });

  // Test 2: Connection with prepare: false (required for Transaction Mode)
  await logTest("Test 2: Connection with prepare: false", async () => {
    const client = postgres(process.env.DATABASE_URL!, {
      max: 1,
      prepare: false,
      idle_timeout: 20,
      connect_timeout: 10,
    });

    const result = await client`SELECT current_database() as db, current_user as user`;
    await client.end();

    return {
      database: result[0]?.db,
      user: result[0]?.user,
    };
  });

  // Test 3: Connection latency measurement
  await logTest("Test 3: Connection Latency (5 sequential queries)", async () => {
    const client = postgres(process.env.DATABASE_URL!, {
      max: 1,
      prepare: false,
      idle_timeout: 20,
      connect_timeout: 10,
    });

    const latencies: number[] = [];

    for (let i = 0; i < 5; i++) {
      const start = performance.now();
      await client`SELECT ${i} as iteration`;
      latencies.push(Math.round(performance.now() - start));
    }

    await client.end();

    return {
      latencies,
      avg: Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length),
      min: Math.min(...latencies),
      max: Math.max(...latencies),
    };
  });

  // Test 4: Concurrent connections stress test
  await logTest("Test 4: Concurrent Connections (10 parallel queries)", async () => {
    const client = postgres(process.env.DATABASE_URL!, {
      max: 10,
      prepare: false,
      idle_timeout: 20,
      connect_timeout: 10,
    });

    const start = performance.now();
    const promises = Array.from({ length: 10 }, async (_, i) => {
      const queryStart = performance.now();
      const result = await client`SELECT ${i} as query_num, pg_sleep(0.1)`;
      return {
        queryNum: i,
        duration: Math.round(performance.now() - queryStart),
      };
    });

    const queryResults = await Promise.all(promises);
    const totalDuration = Math.round(performance.now() - start);

    await client.end();

    return {
      totalDuration,
      queries: queryResults.length,
      avgQueryDuration: Math.round(
        queryResults.reduce((a, b) => a + b.duration, 0) / queryResults.length
      ),
    };
  });

  // Test 5: Connection pool behavior
  await logTest("Test 5: Pool Behavior (create, query, wait, query)", async () => {
    const client = postgres(process.env.DATABASE_URL!, {
      max: 5,
      prepare: false,
      idle_timeout: 5, // Short timeout to test pool recycling
      connect_timeout: 10,
    });

    // First query
    await client`SELECT 1`;

    // Wait for idle timeout
    await new Promise(resolve => setTimeout(resolve, 6000));

    // Second query (should create new connection or reuse)
    const start = performance.now();
    await client`SELECT 2`;
    const reconnectTime = Math.round(performance.now() - start);

    await client.end();

    return {
      reconnectTime,
      idleTimeoutTested: true,
    };
  });

  // Test 6: Check pg_stat_activity for connection info
  await logTest("Test 6: Check Active Database Connections", async () => {
    const client = postgres(process.env.DATABASE_URL!, {
      max: 1,
      prepare: false,
      idle_timeout: 20,
      connect_timeout: 10,
    });

    const result = await client`
      SELECT
        count(*) as total_connections,
        count(*) FILTER (WHERE state = 'active') as active,
        count(*) FILTER (WHERE state = 'idle') as idle,
        count(*) FILTER (WHERE application_name LIKE '%postgres-js%') as postgres_js_connections
      FROM pg_stat_activity
      WHERE datname = current_database()
    `;

    await client.end();

    return result[0];
  });

  // Print summary
  console.log("\n═══════════════════════════════════════════════════════");
  console.log("  TEST SUMMARY");
  console.log("═══════════════════════════════════════════════════════\n");

  const passed = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;

  console.log(`Total Tests: ${results.length}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`Success Rate: ${Math.round((passed / results.length) * 100)}%`);

  if (failed > 0) {
    console.log("\n❌ Failed Tests:");
    results.filter(r => !r.success).forEach(r => {
      console.log(`   - ${r.name}`);
      console.log(`     Error: ${r.error}`);
    });
  }

  console.log("\n🔍 Detailed Results:");
  results.forEach(r => {
    console.log(`\n   ${r.success ? '✅' : '❌'} ${r.name}`);
    console.log(`      Duration: ${r.duration}ms`);
    if (r.details) {
      console.log(`      Details:`, JSON.stringify(r.details, null, 6));
    }
    if (r.error) {
      console.log(`      Error: ${r.error}`);
    }
  });

  // Recommendations
  console.log("\n═══════════════════════════════════════════════════════");
  console.log("  RECOMMENDATIONS");
  console.log("═══════════════════════════════════════════════════════\n");

  if (port === '5432' && hasPgBouncer) {
    console.log("🔧 CRITICAL: Fix connection string configuration");
    console.log("   Current: Port 5432 + ?pgbouncer=true (MISMATCH)");
    console.log("   Option 1: Use port 5432 WITHOUT ?pgbouncer=true (Session Mode)");
    console.log("   Option 2: Use port 6543 WITH ?pgbouncer=true (Transaction Mode - recommended for serverless)");
  }

  const avgLatency = results.find(r => r.name.includes('Latency'))?.details?.avg;
  if (avgLatency && avgLatency > 100) {
    console.log("\n⚠️  High latency detected");
    console.log(`   Average: ${avgLatency}ms`);
    console.log("   Consider: Check network connectivity, VPN, or Supabase region");
  }

  console.log("\n✅ Diagnostic complete!");

  process.exit(failed > 0 ? 1 : 0);
}

main().catch(error => {
  console.error("\n❌ Fatal error during diagnostics:", error);
  process.exit(1);
});
