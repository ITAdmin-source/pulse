/**
 * Unit Tests for Statement Weight Calculations
 *
 * Tests all weight calculation functions:
 * - Predictiveness (variance-based)
 * - Consensus Potential (classification-based)
 * - Recency Boost (time-based decay)
 * - Pass Rate Penalty (clarity score)
 * - Vote Count Boost (cold start)
 * - Combined weight calculations
 */

import { describe, it, expect } from "vitest";
import {
  calculatePredictiveness,
  calculateConsensusPotential,
  calculateRecencyBoost,
  calculatePassRatePenalty,
  calculateVoteCountBoost,
  calculateClusteringWeight,
  calculateColdStartWeight,
} from "../statement-weights";

describe("Statement Weight Calculations", () => {
  describe("calculatePredictiveness", () => {
    it("should return high score for high variance (groups strongly disagree)", () => {
      const groupAgreements = [0.9, 0.1, 0.85, 0.05]; // High variance
      const score = calculatePredictiveness(groupAgreements);
      expect(score).toBeGreaterThan(0.6);
      expect(score).toBeLessThanOrEqual(1.0);
    });

    it("should return low score for low variance (groups mostly agree)", () => {
      const groupAgreements = [0.52, 0.50, 0.48, 0.51]; // Low variance
      const score = calculatePredictiveness(groupAgreements);
      expect(score).toBeLessThan(0.1);
      expect(score).toBeGreaterThanOrEqual(0);
    });

    it("should return maximum score (1.0) for perfect polarization", () => {
      const groupAgreements = [1.0, 0.0]; // Maximum variance (0.25)
      const score = calculatePredictiveness(groupAgreements);
      expect(score).toBe(1.0);
    });

    it("should return 0 for identical group opinions", () => {
      const groupAgreements = [0.5, 0.5, 0.5, 0.5]; // Zero variance
      const score = calculatePredictiveness(groupAgreements);
      expect(score).toBe(0);
    });

    it("should return 0 for empty array", () => {
      expect(calculatePredictiveness([])).toBe(0);
    });

    it("should return 0 for single group", () => {
      expect(calculatePredictiveness([0.75])).toBe(0);
    });

    it("should handle typical clustering data (3 groups)", () => {
      const groupAgreements = [0.8, 0.3, 0.6]; // Moderate variance
      const score = calculatePredictiveness(groupAgreements);
      expect(score).toBeGreaterThan(0.1);
      expect(score).toBeLessThan(0.7);
    });
  });

  describe("calculateConsensusPotential", () => {
    it("should return 1.0 for positive_consensus statements", () => {
      const score = calculateConsensusPotential([0.8, 0.85, 0.9], "positive_consensus");
      expect(score).toBe(1.0);
    });

    it("should return 1.0 for negative_consensus statements", () => {
      const score = calculateConsensusPotential([0.1, 0.15, 0.05], "negative_consensus");
      expect(score).toBe(1.0);
    });

    it("should return 0.7 for bridge statements", () => {
      const score = calculateConsensusPotential([0.6, 0.4, 0.55], "bridge");
      expect(score).toBe(0.7);
    });

    it("should calculate ratio of strong opinions for normal statements", () => {
      // 2 out of 4 groups have strong opinions (>60% or <40%)
      const groupAgreements = [0.8, 0.7, 0.5, 0.2]; // 3 strong groups
      const score = calculateConsensusPotential(groupAgreements, "normal");
      expect(score).toBe(0.75); // 3/4
    });

    it("should return 0 when no groups have strong opinions", () => {
      const groupAgreements = [0.45, 0.50, 0.55, 0.48]; // All neutral
      const score = calculateConsensusPotential(groupAgreements, "normal");
      expect(score).toBe(0);
    });

    it("should return 1.0 when all groups have strong opinions", () => {
      const groupAgreements = [0.9, 0.1, 0.75, 0.25]; // All strong
      const score = calculateConsensusPotential(groupAgreements, "normal");
      expect(score).toBe(1.0);
    });

    it("should handle divisive statements", () => {
      const groupAgreements = [0.9, 0.1]; // Highly divisive
      const score = calculateConsensusPotential(groupAgreements, "divisive");
      expect(score).toBe(1.0); // Both groups have strong opinions
    });
  });

  describe("calculateRecencyBoost", () => {
    it("should return 2.0 for statements < 24 hours old", () => {
      const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000);
      const score = calculateRecencyBoost(twelveHoursAgo);
      expect(score).toBe(2.0);
    });

    it("should return close to 2.0 for statements ~24 hours old (boundary)", () => {
      const exactlyOneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const score = calculateRecencyBoost(exactlyOneDayAgo);
      expect(score).toBeGreaterThan(1.5);
      expect(score).toBeLessThan(2.0);
    });

    it("should return ~1.0 for statements 7 days old (half-life)", () => {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const score = calculateRecencyBoost(sevenDaysAgo);
      expect(score).toBeCloseTo(1.0, 1);
    });

    it("should return ~0.5 for statements 14 days old", () => {
      const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
      const score = calculateRecencyBoost(fourteenDaysAgo);
      expect(score).toBeCloseTo(0.5, 1);
    });

    it("should return ~0.25 for statements 21 days old", () => {
      const twentyOneDaysAgo = new Date(Date.now() - 21 * 24 * 60 * 60 * 1000);
      const score = calculateRecencyBoost(twentyOneDaysAgo);
      expect(score).toBeCloseTo(0.25, 1);
    });

    it("should never go below minimum (0.1)", () => {
      const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
      const score = calculateRecencyBoost(ninetyDaysAgo);
      expect(score).toBeGreaterThanOrEqual(0.1);
      expect(score).toBe(0.1);
    });

    it("should handle very old statements (365 days)", () => {
      const oneYearAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
      const score = calculateRecencyBoost(oneYearAgo);
      expect(score).toBe(0.1);
    });

    it("should be monotonically decreasing over time", () => {
      const dates = [
        new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),  // 1 day
        new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),  // 7 days
        new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // 14 days
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days
      ];

      const scores = dates.map(calculateRecencyBoost);

      // Each score should be less than the previous
      for (let i = 1; i < scores.length; i++) {
        expect(scores[i]).toBeLessThan(scores[i - 1]);
      }
    });
  });

  describe("calculatePassRatePenalty", () => {
    it("should return 1.0 for 0% pass rate (perfect clarity)", () => {
      const penalty = calculatePassRatePenalty({ agree: 10, disagree: 5, pass: 0 });
      expect(penalty).toBe(1.0);
    });

    it("should return ~0.55 for 50% pass rate", () => {
      const penalty = calculatePassRatePenalty({ agree: 5, disagree: 5, pass: 10 });
      expect(penalty).toBeCloseTo(0.55, 2);
    });

    it("should return 0.1 for 100% pass rate (minimum penalty)", () => {
      const penalty = calculatePassRatePenalty({ agree: 0, disagree: 0, pass: 10 });
      expect(penalty).toBe(0.1);
    });

    it("should return 0.5 for no votes (neutral)", () => {
      const penalty = calculatePassRatePenalty({ agree: 0, disagree: 0, pass: 0 });
      expect(penalty).toBe(0.5);
    });

    it("should handle low pass rate (10%)", () => {
      const penalty = calculatePassRatePenalty({ agree: 40, disagree: 50, pass: 10 });
      expect(penalty).toBeCloseTo(0.91, 2);
    });

    it("should handle high pass rate (80%)", () => {
      const penalty = calculatePassRatePenalty({ agree: 5, disagree: 5, pass: 40 });
      expect(penalty).toBeCloseTo(0.28, 2);
    });

    it("should be monotonically decreasing as pass rate increases", () => {
      const passRates = [0, 0.2, 0.4, 0.6, 0.8, 1.0];
      const penalties = passRates.map(pr => {
        const total = 100;
        const pass = Math.floor(pr * total);
        const agree = Math.floor((total - pass) / 2);
        const disagree = total - pass - agree;
        return calculatePassRatePenalty({ agree, disagree, pass });
      });

      // Each penalty should be less than or equal to the previous
      for (let i = 1; i < penalties.length; i++) {
        expect(penalties[i]).toBeLessThanOrEqual(penalties[i - 1]);
      }
    });
  });

  describe("calculateVoteCountBoost", () => {
    it("should boost statements with fewer votes than average", () => {
      const boost = calculateVoteCountBoost(5, 10); // 50% of average
      expect(boost).toBeGreaterThan(1.0);
      expect(boost).toBeCloseTo(1.5, 1); // Should be close to max boost
    });

    it("should penalize statements with more votes than average", () => {
      const boost = calculateVoteCountBoost(15, 10); // 150% of average
      expect(boost).toBeLessThan(1.0);
      expect(boost).toBeCloseTo(0.5, 1);
    });

    it("should return 1.0 for statements with average votes", () => {
      const boost = calculateVoteCountBoost(10, 10);
      expect(boost).toBe(1.0);
    });

    it("should cap at 1.5x maximum boost", () => {
      const boost = calculateVoteCountBoost(1, 100); // Very few votes
      expect(boost).toBe(1.5);
    });

    it("should cap at 0.5x minimum boost", () => {
      const boost = calculateVoteCountBoost(100, 10); // Many votes
      expect(boost).toBe(0.5);
    });

    it("should return 1.0 when average is 0 (edge case)", () => {
      const boost = calculateVoteCountBoost(5, 0);
      expect(boost).toBe(1.0);
    });

    it("should handle zero votes correctly", () => {
      const boost = calculateVoteCountBoost(0, 10);
      expect(boost).toBe(1.5); // Maximum boost for no votes
    });
  });

  describe("calculateClusteringWeight", () => {
    it("should calculate combined weight correctly (all factors)", () => {
      const groupAgreements = [0.9, 0.1]; // High variance
      const classificationType = "divisive";
      const createdAt = new Date(Date.now() - 12 * 60 * 60 * 1000); // 12 hours ago
      const votes = { agree: 10, disagree: 10, pass: 0 }; // Clear statement

      const result = calculateClusteringWeight(
        groupAgreements,
        classificationType,
        createdAt,
        votes
      );

      expect(result.mode).toBe("clustering");
      expect(result.predictiveness).toBeGreaterThan(0);
      expect(result.consensusPotential).toBeGreaterThan(0);
      expect(result.recencyBoost).toBe(2.0); // <24 hours
      expect(result.passRatePenalty).toBe(1.0); // 0% pass rate
      expect(result.combinedWeight).toBeGreaterThan(0);
      expect(result.voteCountBoost).toBeUndefined(); // Not used in clustering

      // Combined weight should be product of all factors
      const expected =
        result.predictiveness *
        result.consensusPotential *
        result.recencyBoost *
        result.passRatePenalty;

      expect(result.combinedWeight).toBeCloseTo(expected, 5);
    });

    it("should produce high weight for ideal statement (high predictiveness, new, clear)", () => {
      const result = calculateClusteringWeight(
        [0.9, 0.1], // Very divisive
        "divisive",
        new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
        { agree: 50, disagree: 50, pass: 0 } // Very clear
      );

      expect(result.combinedWeight).toBeGreaterThan(1.0); // Should be quite high
    });

    it("should produce low weight for old, low-variance, confusing statement", () => {
      const result = calculateClusteringWeight(
        [0.5, 0.5, 0.5], // No variance
        "normal",
        new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // 90 days ago
        { agree: 1, disagree: 1, pass: 20 } // Mostly passes
      );

      expect(result.combinedWeight).toBeLessThan(0.1);
    });

    it("should handle consensus statements correctly", () => {
      const result = calculateClusteringWeight(
        [0.9, 0.85, 0.88],
        "positive_consensus",
        new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        { agree: 30, disagree: 2, pass: 3 }
      );

      expect(result.consensusPotential).toBe(1.0);
      expect(result.mode).toBe("clustering");
    });
  });

  describe("calculateColdStartWeight", () => {
    it("should calculate combined weight correctly (3 factors)", () => {
      const createdAt = new Date(Date.now() - 12 * 60 * 60 * 1000);
      const votes = { agree: 5, disagree: 5, pass: 0 };
      const voteCount = 10;
      const avgVotes = 15;

      const result = calculateColdStartWeight(createdAt, votes, voteCount, avgVotes);

      expect(result.mode).toBe("cold_start");
      expect(result.predictiveness).toBe(0); // Not used
      expect(result.consensusPotential).toBe(0); // Not used
      expect(result.recencyBoost).toBe(2.0); // <24 hours
      expect(result.passRatePenalty).toBe(1.0); // 0% pass
      expect(result.voteCountBoost).toBeGreaterThan(1.0); // Below average votes
      expect(result.combinedWeight).toBeGreaterThan(0);

      // Combined weight should be product of 3 factors
      const expected =
        result.voteCountBoost! * result.recencyBoost * result.passRatePenalty;

      expect(result.combinedWeight).toBeCloseTo(expected, 5);
    });

    it("should boost new statements with few votes", () => {
      const result = calculateColdStartWeight(
        new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
        { agree: 2, disagree: 1, pass: 0 },
        3, // Few votes
        20 // High average
      );

      expect(result.combinedWeight).toBeGreaterThan(2.0);
      expect(result.voteCountBoost).toBeGreaterThan(1.0);
    });

    it("should penalize old statements with many votes", () => {
      const result = calculateColdStartWeight(
        new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // 90 days ago
        { agree: 50, disagree: 50, pass: 0 },
        100, // Many votes
        20 // Low average
      );

      expect(result.combinedWeight).toBeLessThan(0.1);
      expect(result.voteCountBoost).toBe(0.5); // Capped at minimum
      expect(result.recencyBoost).toBe(0.1); // Capped at minimum
    });

    it("should handle zero average votes", () => {
      const result = calculateColdStartWeight(
        new Date(Date.now() - 1 * 60 * 60 * 1000),
        { agree: 5, disagree: 5, pass: 0 },
        10,
        0 // No average yet
      );

      expect(result.voteCountBoost).toBe(1.0); // Default when avg is 0
      expect(result.combinedWeight).toBeGreaterThan(0);
    });
  });

  describe("Edge Cases and Boundaries", () => {
    it("should handle all zeros gracefully", () => {
      expect(calculatePredictiveness([0, 0, 0])).toBe(0);
      expect(calculatePassRatePenalty({ agree: 0, disagree: 0, pass: 0 })).toBe(0.5);
      expect(calculateVoteCountBoost(0, 0)).toBe(1.0);
    });

    it("should handle single-element arrays", () => {
      expect(calculatePredictiveness([0.5])).toBe(0);
      expect(calculateConsensusPotential([0.8], "normal")).toBe(1.0);
    });

    it("should handle extreme dates", () => {
      const veryOld = new Date(Date.now() - 1000 * 24 * 60 * 60 * 1000);
      expect(calculateRecencyBoost(veryOld)).toBe(0.1);

      const future = new Date(Date.now() + 24 * 60 * 60 * 1000);
      expect(calculateRecencyBoost(future)).toBe(2.0);
    });

    it("should never produce negative weights", () => {
      // Use valid group agreements (empty array produces 0 which is fine)
      const result1 = calculateClusteringWeight(
        [0.5, 0.5], // Valid group agreements
        "normal",
        new Date(Date.now() - 1000 * 24 * 60 * 60 * 1000),
        { agree: 0, disagree: 0, pass: 100 }
      );
      expect(result1.combinedWeight).toBeGreaterThanOrEqual(0);

      const result2 = calculateColdStartWeight(
        new Date(Date.now() - 1000 * 24 * 60 * 60 * 1000),
        { agree: 0, disagree: 0, pass: 100 },
        1000,
        10
      );
      expect(result2.combinedWeight).toBeGreaterThanOrEqual(0);
    });

    it("should produce weights in reasonable range (0-4.0)", () => {
      // Maximum possible: 1.0 * 1.0 * 2.0 * 1.0 = 2.0 (clustering)
      // Maximum cold start: 1.5 * 2.0 * 1.0 = 3.0

      const maxClustering = calculateClusteringWeight(
        [1.0, 0.0],
        "positive_consensus",
        new Date(),
        { agree: 100, disagree: 0, pass: 0 }
      );
      expect(maxClustering.combinedWeight).toBeLessThanOrEqual(4.0);

      const maxColdStart = calculateColdStartWeight(
        new Date(),
        { agree: 100, disagree: 0, pass: 0 },
        1,
        100
      );
      expect(maxColdStart.combinedWeight).toBeLessThanOrEqual(4.0);
    });
  });
});
