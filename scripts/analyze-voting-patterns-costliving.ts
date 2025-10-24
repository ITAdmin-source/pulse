/**
 * Script to analyze voting patterns for costLiving poll
 * Diagnoses why PCA variance is low (39.3%)
 */

import "dotenv/config";
import { db } from "../db/db";
import { polls, statements, votes } from "../db/schema";
import { eq, and, inArray } from "drizzle-orm";

interface StatementStats {
  statementId: string;
  text: string;
  agree: number;
  disagree: number;
  pass: number;
  total: number;
  agreePercent: number;
  disagreePercent: number;
  passPercent: number;
  consensus: number; // 0-100, higher = more consensus
  polarization: number; // 0-100, higher = more polarized
}

async function analyzeVotingPatterns() {
  console.log("=".repeat(70));
  console.log("  VOTING PATTERN ANALYSIS FOR 'costLiving' POLL");
  console.log("  Diagnosing Low PCA Variance (39.3% vs 40% threshold)");
  console.log("=".repeat(70));
  console.log("");

  try {
    // Find poll
    const pollResult = await db
      .select()
      .from(polls)
      .where(eq(polls.slug, "costLiving"))
      .limit(1);

    if (pollResult.length === 0) {
      console.log("❌ Poll not found!");
      return;
    }

    const poll = pollResult[0];
    const pollId = poll.id;

    // Get all approved statements
    const statementsResult = await db
      .select()
      .from(statements)
      .where(
        and(
          eq(statements.pollId, pollId),
          eq(statements.approved, true)
        )
      )
      .orderBy(statements.createdAt);

    if (statementsResult.length === 0) {
      console.log("❌ No statements found!");
      return;
    }

    const statementIds = statementsResult.map(s => s.id);

    // Get all votes
    const allVotes = await db
      .select({
        statementId: votes.statementId,
        value: votes.value,
      })
      .from(votes)
      .where(inArray(votes.statementId, statementIds));

    // Analyze each statement
    const statementStats: StatementStats[] = [];

    for (const stmt of statementsResult) {
      const stmtVotes = allVotes.filter(v => v.statementId === stmt.id);

      const agree = stmtVotes.filter(v => v.value === 1).length;
      const disagree = stmtVotes.filter(v => v.value === -1).length;
      const pass = stmtVotes.filter(v => v.value === 0).length;
      const total = stmtVotes.length;

      const agreePercent = (agree / total) * 100;
      const disagreePercent = (disagree / total) * 100;
      const passPercent = (pass / total) * 100;

      // Consensus: How much people agree (either all agree or all disagree)
      const maxAgreement = Math.max(agreePercent, disagreePercent);
      const consensus = maxAgreement;

      // Polarization: How evenly split are agree/disagree (ignoring pass)
      const activeVotes = agree + disagree;
      const polarization = activeVotes > 0
        ? (Math.min(agree, disagree) / activeVotes) * 200 // 0-100 scale
        : 0;

      statementStats.push({
        statementId: stmt.id,
        text: stmt.text,
        agree,
        disagree,
        pass,
        total,
        agreePercent,
        disagreePercent,
        passPercent,
        consensus,
        polarization,
      });
    }

    // Calculate overall statistics
    const avgConsensus = statementStats.reduce((sum, s) => sum + s.consensus, 0) / statementStats.length;
    const avgPolarization = statementStats.reduce((sum, s) => sum + s.polarization, 0) / statementStats.length;
    const avgPassRate = statementStats.reduce((sum, s) => sum + s.passPercent, 0) / statementStats.length;

    const highConsensusCount = statementStats.filter(s => s.consensus > 70).length;
    const highPolarizationCount = statementStats.filter(s => s.polarization > 40).length;
    const highPassRateCount = statementStats.filter(s => s.passPercent > 30).length;

    console.log("OVERALL STATISTICS:");
    console.log(`   Total statements: ${statementStats.length}`);
    console.log(`   Average consensus: ${avgConsensus.toFixed(1)}% ${avgConsensus > 70 ? "⚠️  (too high)" : "✅"}`);
    console.log(`   Average polarization: ${avgPolarization.toFixed(1)}%`);
    console.log(`   Average pass rate: ${avgPassRate.toFixed(1)}% ${avgPassRate > 30 ? "⚠️  (high)" : "✅"}`);
    console.log("");
    console.log(`   High consensus statements (>70%): ${highConsensusCount}/${statementStats.length} ${highConsensusCount > 10 ? "⚠️  (too many)" : ""}`);
    console.log(`   High polarization statements (>40%): ${highPolarizationCount}/${statementStats.length}`);
    console.log(`   High pass rate statements (>30%): ${highPassRateCount}/${statementStats.length} ${highPassRateCount > 5 ? "⚠️  (concerning)" : ""}`);
    console.log("");

    // Diagnosis
    console.log("=".repeat(70));
    console.log("  DIAGNOSIS: Why is PCA variance low?");
    console.log("=".repeat(70));
    console.log("");

    if (avgConsensus > 70) {
      console.log("⚠️  PRIMARY CAUSE: HIGH CONSENSUS");
      console.log("   When most statements have >70% agreement in one direction,");
      console.log("   there's insufficient variance for PCA to find distinct patterns.");
      console.log("");
      console.log("   This is EXPECTED behavior - the poll is measuring agreement");
      console.log("   rather than diverse opinions.");
      console.log("");
    }

    if (avgPassRate > 30) {
      console.log("⚠️  CONTRIBUTING FACTOR: HIGH PASS RATE");
      console.log("   Many users are skipping statements (pass vote),");
      console.log("   which reduces the signal available for clustering.");
      console.log("");
    }

    if (highPolarizationCount < 5) {
      console.log("⚠️  CONTRIBUTING FACTOR: LOW POLARIZATION");
      console.log("   Few statements create genuine debate (50/50 splits).");
      console.log("   Without disagreement, clustering has nothing to separate.");
      console.log("");
    }

    // Show detailed breakdown
    console.log("=".repeat(70));
    console.log("  STATEMENT-BY-STATEMENT BREAKDOWN");
    console.log("=".repeat(70));
    console.log("");

    // Sort by consensus (descending) to show most problematic first
    statementStats.sort((a, b) => b.consensus - a.consensus);

    for (let i = 0; i < statementStats.length; i++) {
      const s = statementStats[i];
      const truncatedText = s.text.length > 60 ? s.text.substring(0, 57) + "..." : s.text;

      console.log(`${i + 1}. "${truncatedText}"`);
      console.log(`   Agree: ${s.agreePercent.toFixed(1)}% | Disagree: ${s.disagreePercent.toFixed(1)}% | Pass: ${s.passPercent.toFixed(1)}%`);
      console.log(`   Consensus: ${s.consensus.toFixed(1)}% ${s.consensus > 80 ? "🔴 (very high)" : s.consensus > 70 ? "🟠 (high)" : "🟢"}`);
      console.log(`   Polarization: ${s.polarization.toFixed(1)}% ${s.polarization > 40 ? "✅ (good debate)" : "⚠️  (one-sided)"}`);
      console.log("");
    }

    console.log("=".repeat(70));
    console.log("  RECOMMENDATIONS");
    console.log("=".repeat(70));
    console.log("");

    if (avgConsensus > 70 && highPolarizationCount < 5) {
      console.log("✅ VERDICT: This poll is NOT suitable for opinion clustering");
      console.log("");
      console.log("   The error message is CORRECT and EXPECTED:");
      console.log("   'PCA quality too low: 39.3% variance explained'");
      console.log("");
      console.log("   This poll measures CONSENSUS, not DIVERSE OPINIONS.");
      console.log("");
      console.log("RECOMMENDED ACTIONS:");
      console.log("   1. Accept that opinion map is not meaningful for this poll");
      console.log("   2. Display alternative results view (consensus statements)");
      console.log("   3. Lower PCA threshold to 30% for consensus-heavy polls");
      console.log("   4. Add UI message: 'This poll shows strong consensus - opinion");
      console.log("      clustering is not meaningful'");
      console.log("");
    } else if (avgPassRate > 40) {
      console.log("⚠️  VERDICT: Data quality issue (too many pass votes)");
      console.log("");
      console.log("RECOMMENDED ACTIONS:");
      console.log("   1. Encourage users to vote agree/disagree instead of pass");
      console.log("   2. Add UI prompt: 'Please vote on at least 80% of statements'");
      console.log("   3. Consider excluding users with >50% pass rate from clustering");
      console.log("");
    } else {
      console.log("⚠️  VERDICT: Borderline case (39.3% vs 40% threshold)");
      console.log("");
      console.log("RECOMMENDED ACTIONS:");
      console.log("   1. Lower threshold to 35% for edge cases");
      console.log("   2. Add warning in UI: 'Clustering quality is marginal'");
      console.log("   3. Wait for more votes to increase variance");
      console.log("");
    }

    console.log("=".repeat(70));

  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    process.exit(0);
  }
}

analyzeVotingPatterns();
