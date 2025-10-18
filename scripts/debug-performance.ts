/**
 * Performance Debugging Script
 *
 * This script helps diagnose why the performance optimization might not be working.
 * Run with: npx tsx scripts/debug-performance.ts <poll-slug> <user-id>
 */

import { db } from "@/db/db";
import { polls, statements, votes } from "@/db/schema";
import { eq, and, notInArray, sql } from "drizzle-orm";

// ANSI color codes for terminal output
const colors = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
};

function log(color: keyof typeof colors, message: string) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function debugPerformance(pollSlug: string, userId: string) {
  log("cyan", "\n========================================");
  log("cyan", "PERFORMANCE DEBUGGING ANALYSIS");
  log("cyan", "========================================\n");

  try {
    // 1. Get poll configuration
    log("blue", "1. CHECKING POLL CONFIGURATION");
    const pollConfig = await db
      .select({
        id: polls.id,
        slug: polls.slug,
        statementOrderMode: polls.statementOrderMode,
        randomSeed: polls.randomSeed,
      })
      .from(polls)
      .where(eq(polls.slug, pollSlug))
      .limit(1);

    if (!pollConfig[0]) {
      log("red", `ERROR: Poll '${pollSlug}' not found`);
      return;
    }

    const poll = pollConfig[0];
    log("green", `Poll ID: ${poll.id}`);
    log("green", `Order Mode: ${poll.statementOrderMode}`);
    log("green", `Random Seed: ${poll.randomSeed || "None (using default)"}`);

    if (poll.statementOrderMode !== "random") {
      log("yellow", `\nWARNING: Poll is using '${poll.statementOrderMode}' mode, NOT 'random' mode!`);
      log("yellow", "The MD5 optimization ONLY applies to 'random' mode.");
      log("yellow", "This is likely why performance hasn't improved.\n");
    }

    // 2. Count statements
    log("blue", "\n2. COUNTING STATEMENTS");
    const statementCounts = await db
      .select({
        total: sql<number>`count(*)::int`,
        approved: sql<number>`count(*) filter (where approved = true)::int`,
      })
      .from(statements)
      .where(eq(statements.pollId, poll.id));

    const counts = statementCounts[0];
    log("green", `Total statements: ${counts.total}`);
    log("green", `Approved statements: ${counts.approved}`);

    // 3. Count user votes
    log("blue", "\n3. COUNTING USER VOTES");
    const userVotes = await db
      .select({ statementId: votes.statementId })
      .from(votes)
      .innerJoin(statements, eq(votes.statementId, statements.id))
      .where(and(
        eq(votes.userId, userId),
        eq(statements.pollId, poll.id)
      ));

    const votedIds = userVotes.map(v => v.statementId);
    log("green", `User has voted on: ${votedIds.length} statements`);
    log("green", `Unvoted statements: ${counts.approved - votedIds.length}`);

    // 4. Test OLD approach (fetch all, filter in JS)
    log("blue", "\n4. TESTING OLD APPROACH (Fetch all approved statements)");
    const startOld = performance.now();

    const allStatements = await db
      .select()
      .from(statements)
      .where(and(
        eq(statements.pollId, poll.id),
        eq(statements.approved, true)
      ));

    const endOld = performance.now();
    const oldTime = endOld - startOld;

    log("green", `Fetched ${allStatements.length} statements`);
    log("green", `Query time: ${oldTime.toFixed(2)}ms`);

    const unvotedStatementsJS = allStatements.filter(s => !votedIds.includes(s.id));
    log("green", `After JS filtering: ${unvotedStatementsJS.length} unvoted statements`);

    // 5. Test NEW approach (SQL-side filtering with MD5)
    log("blue", "\n5. TESTING NEW APPROACH (SQL-side filtering + MD5 ordering)");
    const batchNumber = 1;
    const seedString = poll.randomSeed
      ? `${userId}-${poll.randomSeed}-${batchNumber}`
      : `${userId}-${poll.id}-${batchNumber}`;

    const startNew = performance.now();

    const optimizedStatements = await db
      .select()
      .from(statements)
      .where(and(
        eq(statements.pollId, poll.id),
        eq(statements.approved, true),
        votedIds.length > 0 ? notInArray(statements.id, votedIds) : undefined
      ))
      .orderBy(sql`md5(${statements.id}::text || ${seedString})`)
      .limit(10);

    const endNew = performance.now();
    const newTime = endNew - startNew;

    log("green", `Fetched ${optimizedStatements.length} statements`);
    log("green", `Query time: ${newTime.toFixed(2)}ms`);

    // 6. Test MD5 overhead specifically
    log("blue", "\n6. TESTING MD5 COMPUTATION OVERHEAD");
    const startMD5 = performance.now();

    const md5OnlyQuery = await db
      .select({ id: statements.id })
      .from(statements)
      .where(and(
        eq(statements.pollId, poll.id),
        eq(statements.approved, true),
        votedIds.length > 0 ? notInArray(statements.id, votedIds) : undefined
      ))
      .orderBy(sql`md5(${statements.id}::text || ${seedString})`);

    const endMD5 = performance.now();
    const md5Time = endMD5 - startMD5;

    log("green", `MD5 ordering on ${md5OnlyQuery.length} statements: ${md5Time.toFixed(2)}ms`);

    // 7. Test WITHOUT MD5 (just filter, no order)
    log("blue", "\n7. TESTING WITHOUT MD5 (SQL filtering only, no ordering)");
    const startNoMD5 = performance.now();

    const noMD5Query = await db
      .select()
      .from(statements)
      .where(and(
        eq(statements.pollId, poll.id),
        eq(statements.approved, true),
        votedIds.length > 0 ? notInArray(statements.id, votedIds) : undefined
      ))
      .limit(10);

    const endNoMD5 = performance.now();
    const noMD5Time = endNoMD5 - startNoMD5;

    log("green", `SQL filtering without MD5: ${noMD5Time.toFixed(2)}ms`);

    // 8. Summary and analysis
    log("cyan", "\n========================================");
    log("cyan", "PERFORMANCE SUMMARY");
    log("cyan", "========================================\n");

    log("blue", "Query Time Comparison:");
    log("magenta", `  Old approach (fetch all):     ${oldTime.toFixed(2)}ms`);
    log("magenta", `  New approach (SQL + MD5):     ${newTime.toFixed(2)}ms`);
    log("magenta", `  SQL filtering only (no MD5):  ${noMD5Time.toFixed(2)}ms`);
    log("magenta", `  MD5 overhead:                 ${(newTime - noMD5Time).toFixed(2)}ms`);

    const improvement = ((oldTime - newTime) / oldTime * 100).toFixed(1);
    if (newTime < oldTime) {
      log("green", `\nPERFORMANCE IMPROVEMENT: ${improvement}% faster`);
    } else {
      log("red", `\nPERFORMANCE REGRESSION: ${Math.abs(parseFloat(improvement))}% slower`);
    }

    // 9. Recommendations
    log("cyan", "\n========================================");
    log("cyan", "RECOMMENDATIONS");
    log("cyan", "========================================\n");

    if (poll.statementOrderMode !== "random") {
      log("yellow", "CRITICAL: Poll is NOT using 'random' mode!");
      log("yellow", "To test the optimization, update the poll's statementOrderMode to 'random':");
      log("blue", `UPDATE polls SET statement_order_mode = 'random' WHERE slug = '${pollSlug}';`);
    }

    if (counts.approved < 50) {
      log("yellow", "\nNOTE: Poll has only ${counts.approved} approved statements.");
      log("yellow", "Performance gains are minimal on small datasets.");
      log("yellow", "Test on a poll with 100+ statements to see real impact.");
    }

    if (votedIds.length === 0) {
      log("yellow", "\nNOTE: User has not voted yet (0 votes).");
      log("yellow", "The NOT IN clause is not being used. Performance is similar to fetching all.");
    }

    const md5Overhead = newTime - noMD5Time;
    if (md5Overhead > 50) {
      log("yellow", `\nWARNING: MD5 overhead is ${md5Overhead.toFixed(2)}ms.`);
      log("yellow", "Consider using a simpler hash function or pre-computed random values.");
    }

    if (newTime < 100) {
      log("green", "\nGOOD: Query time is under 100ms (acceptable for user interaction).");
    } else if (newTime < 500) {
      log("yellow", "\nMODERATE: Query time is ${newTime.toFixed(2)}ms (acceptable but not ideal).");
    } else {
      log("red", "\nPOOR: Query time is ${newTime.toFixed(2)}ms (may feel slow to users).");
    }

    log("cyan", "\n========================================\n");

  } catch (error) {
    log("red", `ERROR: ${error instanceof Error ? error.message : String(error)}`);
    console.error(error);
  } finally {
    process.exit(0);
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
if (args.length < 2) {
  console.error("Usage: npx tsx scripts/debug-performance.ts <poll-slug> <user-id>");
  console.error("Example: npx tsx scripts/debug-performance.ts my-poll-slug 123e4567-e89b-12d3-a456-426614174000");
  process.exit(1);
}

const [pollSlug, userId] = args;
debugPerformance(pollSlug, userId);
