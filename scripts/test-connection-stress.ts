/**
 * Supabase Connection Stress Test
 *
 * Simulates realistic load scenarios to identify connection issues:
 * - Multiple concurrent users
 * - Rapid sequential requests
 * - Connection recovery after failures
 * - Pool exhaustion scenarios
 */

import { config } from "dotenv";
import postgres from "postgres";
import { performance } from "perf_hooks";

config({ path: ".env.local" });

interface StressTestResult {
  name: string;
  totalRequests: number;
  successful: number;
  failed: number;
  duration: number;
  avgResponseTime: number;
  errors: string[];
}

const results: StressTestResult[] = [];

async function stressTest(
  name: string,
  requestCount: number,
  concurrency: number,
  queryFn: (client: ReturnType<typeof postgres>, index: number) => Promise<any>
): Promise<void> {
  console.log(`\n🔥 Starting: ${name}`);
  console.log(`   Requests: ${requestCount}, Concurrency: ${concurrency}`);

  const client = postgres(process.env.DATABASE_URL!, {
    max: 10,
    prepare: false,
    idle_timeout: 20,
    connect_timeout: 30,
  });

  const startTime = performance.now();
  const responseTimes: number[] = [];
  const errors: string[] = [];
  let successful = 0;
  let failed = 0;

  // Execute requests in batches based on concurrency
  for (let i = 0; i < requestCount; i += concurrency) {
    const batch = Math.min(concurrency, requestCount - i);
    const batchPromises = Array.from({ length: batch }, async (_, j) => {
      const index = i + j;
      const queryStart = performance.now();
      try {
        await queryFn(client, index);
        const responseTime = performance.now() - queryStart;
        responseTimes.push(responseTime);
        successful++;
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        errors.push(`Request ${index}: ${errorMsg}`);
        failed++;
      }
    });

    await Promise.all(batchPromises);
  }

  const duration = performance.now() - startTime;
  const avgResponseTime = responseTimes.length > 0
    ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
    : 0;

  await client.end();

  const result: StressTestResult = {
    name,
    totalRequests: requestCount,
    successful,
    failed,
    duration: Math.round(duration),
    avgResponseTime: Math.round(avgResponseTime),
    errors: errors.slice(0, 5), // Keep only first 5 errors for brevity
  };

  results.push(result);

  console.log(`✅ Completed in ${Math.round(duration)}ms`);
  console.log(`   Success: ${successful}/${requestCount} (${Math.round((successful/requestCount)*100)}%)`);
  if (failed > 0) {
    console.log(`   ❌ Failed: ${failed}`);
  }
}

async function main() {
  console.log("═══════════════════════════════════════════════════════");
  console.log("  SUPABASE CONNECTION STRESS TEST");
  console.log("═══════════════════════════════════════════════════════");

  if (!process.env.DATABASE_URL) {
    console.error("❌ DATABASE_URL not found in .env.local");
    process.exit(1);
  }

  // Test 1: Rapid Sequential Requests
  await stressTest(
    "Test 1: 50 Rapid Sequential Requests",
    50,
    1,
    async (client, index) => {
      await client`SELECT ${index} as request_num, current_timestamp as ts`;
    }
  );

  // Test 2: Moderate Concurrency
  await stressTest(
    "Test 2: 100 Requests with 10 Concurrent",
    100,
    10,
    async (client, index) => {
      await client`SELECT ${index} as request_num, pg_sleep(0.05)`;
    }
  );

  // Test 3: High Concurrency (simulating traffic spike)
  await stressTest(
    "Test 3: 50 Requests with 20 Concurrent",
    50,
    20,
    async (client, index) => {
      await client`SELECT ${index} as request_num, current_timestamp as ts`;
    }
  );

  // Test 4: Database-intensive queries
  await stressTest(
    "Test 4: 30 Database-Intensive Queries",
    30,
    5,
    async (client, index) => {
      // Simulate a realistic query with joins
      await client`
        SELECT
          t.tablename,
          pg_size_pretty(pg_total_relation_size(t.schemaname||'.'||t.tablename)) AS size
        FROM pg_tables t
        WHERE t.schemaname = 'public'
        LIMIT 5
      `;
    }
  );

  // Test 5: Connection pool exhaustion scenario
  await stressTest(
    "Test 5: Pool Exhaustion Test (100 concurrent)",
    100,
    100, // Intentionally exceed pool size
    async (client, index) => {
      await client`SELECT ${index} as request_num, pg_sleep(0.1)`;
    }
  );

  // Test 6: Recovery after idle period
  console.log("\n⏳ Test 6: Connection Recovery After Idle");
  console.log("   Waiting 10 seconds...");
  await new Promise(resolve => setTimeout(resolve, 10000));

  await stressTest(
    "Test 6: Post-Idle Recovery (20 requests)",
    20,
    5,
    async (client, index) => {
      await client`SELECT ${index} as request_num, current_timestamp as ts`;
    }
  );

  // Print detailed summary
  console.log("\n═══════════════════════════════════════════════════════");
  console.log("  STRESS TEST SUMMARY");
  console.log("═══════════════════════════════════════════════════════\n");

  const totalRequests = results.reduce((sum, r) => sum + r.totalRequests, 0);
  const totalSuccessful = results.reduce((sum, r) => sum + r.successful, 0);
  const totalFailed = results.reduce((sum, r) => sum + r.failed, 0);
  const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);

  console.log(`Total Requests: ${totalRequests}`);
  console.log(`✅ Successful: ${totalSuccessful} (${Math.round((totalSuccessful/totalRequests)*100)}%)`);
  console.log(`❌ Failed: ${totalFailed}`);
  console.log(`Total Duration: ${Math.round(totalDuration)}ms`);
  console.log(`Throughput: ${Math.round(totalRequests / (totalDuration / 1000))} req/sec`);

  console.log("\n📊 Individual Test Results:\n");
  results.forEach((r, index) => {
    const successRate = Math.round((r.successful / r.totalRequests) * 100);
    const status = successRate === 100 ? '✅' : successRate >= 95 ? '⚠️ ' : '❌';

    console.log(`${status} ${r.name}`);
    console.log(`   Duration: ${r.duration}ms`);
    console.log(`   Success Rate: ${successRate}% (${r.successful}/${r.totalRequests})`);
    console.log(`   Avg Response Time: ${r.avgResponseTime}ms`);

    if (r.errors.length > 0) {
      console.log(`   Errors:`);
      r.errors.forEach(err => console.log(`      - ${err}`));
      if (r.failed > r.errors.length) {
        console.log(`      ... and ${r.failed - r.errors.length} more errors`);
      }
    }
    console.log();
  });

  // Analysis and recommendations
  console.log("═══════════════════════════════════════════════════════");
  console.log("  ANALYSIS & RECOMMENDATIONS");
  console.log("═══════════════════════════════════════════════════════\n");

  const poolExhaustionTest = results.find(r => r.name.includes("Pool Exhaustion"));
  if (poolExhaustionTest && poolExhaustionTest.failed > 0) {
    console.log("⚠️  Pool Exhaustion Detected");
    console.log(`   Failed requests: ${poolExhaustionTest.failed}/${poolExhaustionTest.totalRequests}`);
    console.log("   Recommendation: Consider using Transaction Mode (port 6543) for better concurrency");
  }

  const highLatencyTests = results.filter(r => r.avgResponseTime > 500);
  if (highLatencyTests.length > 0) {
    console.log("\n⚠️  High Latency Detected in Some Tests");
    highLatencyTests.forEach(r => {
      console.log(`   ${r.name}: ${r.avgResponseTime}ms avg`);
    });
    console.log("   Recommendation: Optimize queries or check network connectivity");
  }

  if (totalFailed === 0) {
    console.log("\n✅ All tests passed! Connection is stable under load.");
  } else {
    console.log(`\n⚠️  ${totalFailed} requests failed. Review errors above.`);
  }

  console.log("\n✅ Stress test complete!");

  process.exit(totalFailed > 0 ? 1 : 0);
}

main().catch(error => {
  console.error("\n❌ Fatal error during stress test:", error);
  process.exit(1);
});
