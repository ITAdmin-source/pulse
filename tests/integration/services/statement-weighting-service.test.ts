import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { dbTestUtils, type DatabaseTestHelper } from '../../utils/db-test-helpers';
import { StatementWeightingService } from '@/lib/services/statement-weighting-service';
import { ClusteringService } from '@/lib/services/clustering-service';
import { db } from '@/db/db';
import {
  polls,
  statements,
  users,
  votes,
  pollClusteringMetadata,
  statementClassifications,
  statementWeights
} from '@/db/schema';
import { eq, inArray } from 'drizzle-orm';

/**
 * Integration Tests for Statement Weighting Service
 *
 * Tests the full integration of weight calculation, caching, and mode switching
 * with real database operations.
 *
 * Test Coverage:
 * - Mode selection (cold start vs clustering)
 * - Cache behavior (hit/miss/invalidation)
 * - Weight calculation accuracy
 * - Error handling and fallbacks
 */

describe('StatementWeightingService Integration', () => {
  let helper: DatabaseTestHelper;

  beforeEach(async () => {
    helper = await dbTestUtils.setupTest();
  });

  afterEach(async () => {
    await dbTestUtils.teardownTest(helper);
  });

  describe('Mode Selection', () => {
    it('should use cold start mode for poll with <20 users', async () => {
      // Seed basic data
      const basicData = await helper.seedBasicData();
      const poll = basicData.polls[0];
      const testStatements = basicData.statements.filter(s => s.pollId === poll.id);

      // Create 15 users with votes
      const timestamp = Date.now();
      for (let i = 0; i < 15; i++) {
        const [user] = await db.insert(users).values({
          clerkUserId: `test-user-coldstart-${i}-${timestamp}`,
        }).returning();

        // Vote on first 5 statements
        for (let j = 0; j < Math.min(5, testStatements.length); j++) {
          await db.insert(votes).values({
            userId: user.id,
            statementId: testStatements[j].id,
            pollId: poll.id,
            value: 1,
          });
        }
      }

      // Get weights
      const statementIds = testStatements.map(s => s.id);
      const weights = await StatementWeightingService.getStatementWeights(
        poll.id,
        statementIds
      );

      // Verify cold start mode
      expect(weights).toHaveLength(statementIds.length);
      expect(weights[0].components.mode).toBe('cold_start');
      expect(weights[0].components.voteCountBoost).toBeDefined();
      expect(weights[0].components.recencyBoost).toBeDefined();
      expect(weights[0].components.passRatePenalty).toBeDefined();
      // Cold start should NOT have predictiveness
      expect(weights[0].components.predictiveness).toBeUndefined();
    });

    it('should use clustering mode for poll with 20+ users', async () => {
      // Seed basic data
      const basicData = await helper.seedBasicData();
      const poll = basicData.polls[0];
      const testStatements = basicData.statements.filter(s => s.pollId === poll.id);

      // Create 25 users with votes
      const timestamp = Date.now();
      const createdUsers = [];
      for (let i = 0; i < 25; i++) {
        const [user] = await db.insert(users).values({
          clerkUserId: `test-user-clustering-${i}-${timestamp}`,
        }).returning();
        createdUsers.push(user);

        // Vote on first 10 statements with varied opinions
        for (let j = 0; j < Math.min(10, testStatements.length); j++) {
          await db.insert(votes).values({
            userId: user.id,
            statementId: testStatements[j].id,
            pollId: poll.id,
            value: i % 3 === 0 ? 1 : i % 3 === 1 ? -1 : 0, // Mix of agree/disagree/pass
          });
        }
      }

      // Create clustering metadata
      await db.insert(pollClusteringMetadata).values({
        pollId: poll.id,
        totalUsers: 25,
        numClusters: 3,
        clusteringAlgorithm: 'kmeans',
        dimensionalityReduction: 'pca',
        pcaComponents: [[0.5, 0.3, 0.2], [0.2, 0.5, 0.3]],
        varianceExplained: [0.6, 0.3],
        meanVector: [0.1, 0.2, 0.3],
        variance: 0.85,
        silhouetteScore: 0.65,
        status: 'completed',
      });

      // Create statement classifications
      for (let i = 0; i < testStatements.length; i++) {
        await db.insert(statementClassifications).values({
          statementId: testStatements[i].id,
          pollId: poll.id,
          classificationType: i % 4 === 0 ? 'positive_consensus' : i % 4 === 1 ? 'divisive' : i % 4 === 2 ? 'bridge' : 'normal',
          groupAgreements: [0.8, 0.2, 0.5],
          averageAgreement: 0.5,
          standardDeviation: 0.3,
        });
      }

      // Get weights
      const statementIds = testStatements.map(s => s.id);
      const weights = await StatementWeightingService.getStatementWeights(
        poll.id,
        statementIds
      );

      // Verify clustering mode
      expect(weights).toHaveLength(statementIds.length);
      expect(weights[0].components.mode).toBe('clustering');
      expect(weights[0].components.predictiveness).toBeDefined();
      expect(weights[0].components.consensusPotential).toBeDefined();
      expect(weights[0].components.recencyBoost).toBeDefined();
      expect(weights[0].components.passRatePenalty).toBeDefined();
      // Clustering should NOT have voteCountBoost
      expect(weights[0].components.voteCountBoost).toBeUndefined();
    });

    it('should switch modes when poll crosses 20-user threshold', async () => {
      // Seed basic data
      const basicData = await helper.seedBasicData();
      const poll = basicData.polls[0];
      const testStatements = basicData.statements.filter(s => s.pollId === poll.id);

      // First: Create 19 users (cold start)
      const timestamp = Date.now();
      for (let i = 0; i < 19; i++) {
        const [user] = await db.insert(users).values({
          clerkUserId: `test-user-switch-${i}-${timestamp}`,
        }).returning();

        for (let j = 0; j < Math.min(5, testStatements.length); j++) {
          await db.insert(votes).values({
            userId: user.id,
            statementId: testStatements[j].id,
            pollId: poll.id,
            value: 1,
          });
        }
      }

      // Get weights (should be cold start)
      const statementIds = testStatements.map(s => s.id);
      const weights1 = await StatementWeightingService.getStatementWeights(
        poll.id,
        statementIds
      );

      expect(weights1[0].components.mode).toBe('cold_start');

      // Now add 20th user and clustering data
      const [user20] = await db.insert(users).values({
        clerkUserId: `test-user-switch-20-${timestamp}`,
      }).returning();

      for (let j = 0; j < Math.min(5, testStatements.length); j++) {
        await db.insert(votes).values({
          userId: user20.id,
          statementId: testStatements[j].id,
          pollId: poll.id,
          value: 1,
        });
      }

      // Create clustering metadata (simulating clustering computation)
      await db.insert(pollClusteringMetadata).values({
        pollId: poll.id,
        totalUsers: 20,
        numClusters: 3,
        clusteringAlgorithm: 'kmeans',
        dimensionalityReduction: 'pca',
        pcaComponents: [[0.5, 0.3], [0.2, 0.5]],
        varianceExplained: [0.6, 0.3],
        meanVector: [0.1, 0.2],
        variance: 0.85,
        silhouetteScore: 0.65,
        status: 'completed',
      });

      for (const stmt of testStatements) {
        await db.insert(statementClassifications).values({
          statementId: stmt.id,
          pollId: poll.id,
          classificationType: 'normal',
          groupAgreements: [0.5, 0.5, 0.5],
          averageAgreement: 0.5,
          standardDeviation: 0.1,
        });
      }

      // Invalidate cache (simulating what clustering service does)
      await db.delete(statementWeights).where(eq(statementWeights.pollId, poll.id));

      // Get weights again (should be clustering mode)
      const weights2 = await StatementWeightingService.getStatementWeights(
        poll.id,
        statementIds
      );

      expect(weights2[0].components.mode).toBe('clustering');
    });
  });

  describe('Cache Behavior', () => {
    it('should cache weights after first calculation', async () => {
      const basicData = await helper.seedBasicData();
      const poll = basicData.polls[0];
      const testStatements = basicData.statements.filter(s => s.pollId === poll.id).slice(0, 3);

      // First call: Calculate and cache
      const statementIds = testStatements.map(s => s.id);
      await StatementWeightingService.getStatementWeights(poll.id, statementIds);

      // Check that weights are now in database
      const cachedWeights = await db
        .select()
        .from(statementWeights)
        .where(eq(statementWeights.pollId, poll.id));

      expect(cachedWeights.length).toBeGreaterThan(0);
      expect(cachedWeights.length).toBeLessThanOrEqual(statementIds.length);
    });

    it('should return cached weights on subsequent calls', async () => {
      const basicData = await helper.seedBasicData();
      const poll = basicData.polls[0];
      const testStatements = basicData.statements.filter(s => s.pollId === poll.id).slice(0, 3);

      const statementIds = testStatements.map(s => s.id);

      // First call
      const weights1 = await StatementWeightingService.getStatementWeights(poll.id, statementIds);

      // Second call (should use cache)
      const start = Date.now();
      const weights2 = await StatementWeightingService.getStatementWeights(poll.id, statementIds);
      const duration = Date.now() - start;

      // Should be fast (cached)
      expect(duration).toBeLessThan(100);

      // Results should be identical
      expect(weights2).toEqual(weights1);
    });

    it('should invalidate cache on clustering recomputation', async () => {
      const basicData = await helper.seedBasicData();
      const poll = basicData.polls[0];
      const testStatements = basicData.statements.filter(s => s.pollId === poll.id).slice(0, 3);

      const statementIds = testStatements.map(s => s.id);

      // Calculate and cache weights
      await StatementWeightingService.getStatementWeights(poll.id, statementIds);

      // Verify cache exists
      let cachedWeights = await db
        .select()
        .from(statementWeights)
        .where(eq(statementWeights.pollId, poll.id));
      expect(cachedWeights.length).toBeGreaterThan(0);

      // Invalidate (simulating clustering service)
      await StatementWeightingService.invalidateWeights(poll.id);

      // Verify cache cleared
      cachedWeights = await db
        .select()
        .from(statementWeights)
        .where(eq(statementWeights.pollId, poll.id));
      expect(cachedWeights).toHaveLength(0);
    });

    it('should handle partial cache (mix of cached and uncached)', async () => {
      const basicData = await helper.seedBasicData();
      const poll = basicData.polls[0];
      const testStatements = basicData.statements.filter(s => s.pollId === poll.id).slice(0, 5);

      // Cache first 3 statements
      const firstThreeIds = testStatements.slice(0, 3).map(s => s.id);
      await StatementWeightingService.getStatementWeights(poll.id, firstThreeIds);

      // Request all 5 (last 2 are uncached)
      const allFiveIds = testStatements.map(s => s.id);
      const weights = await StatementWeightingService.getStatementWeights(poll.id, allFiveIds);

      expect(weights).toHaveLength(5);

      // Verify all 5 are now cached
      const cachedWeights = await db
        .select()
        .from(statementWeights)
        .where(eq(statementWeights.pollId, poll.id));
      expect(cachedWeights.length).toBe(5);
    });
  });

  describe('Error Handling', () => {
    it('should fallback to neutral weights on database error', async () => {
      const basicData = await helper.seedBasicData();
      const poll = basicData.polls[0];
      const testStatements = basicData.statements.filter(s => s.pollId === poll.id).slice(0, 2);

      // Mock a database error by using invalid poll ID
      const weights = await StatementWeightingService.getStatementWeights(
        'invalid-poll-id',
        testStatements.map(s => s.id)
      );

      // Should still return results with fallback weights
      expect(weights).toHaveLength(2);
      expect(weights[0].weight).toBe(0.5); // Fallback neutral weight
    });

    it('should handle missing classification data gracefully', async () => {
      const basicData = await helper.seedBasicData();
      const poll = basicData.polls[0];
      const testStatements = basicData.statements.filter(s => s.pollId === poll.id).slice(0, 3);

      // Create 25 users (eligible for clustering)
      const timestamp = Date.now();
      for (let i = 0; i < 25; i++) {
        const [user] = await db.insert(users).values({
          clerkUserId: `test-user-missingclass-${i}-${timestamp}`,
        }).returning();

        for (let j = 0; j < testStatements.length; j++) {
          await db.insert(votes).values({
            userId: user.id,
            statementId: testStatements[j].id,
            pollId: poll.id,
            value: 1,
          });
        }
      }

      // Create clustering metadata but NO classifications
      await db.insert(pollClusteringMetadata).values({
        pollId: poll.id,
        totalUsers: 25,
        numClusters: 3,
        clusteringAlgorithm: 'kmeans',
        dimensionalityReduction: 'pca',
        pcaComponents: [[0.5, 0.3], [0.2, 0.5]],
        varianceExplained: [0.6, 0.3],
        meanVector: [0.1, 0.2],
        variance: 0.85,
        silhouetteScore: 0.65,
        status: 'completed',
      });

      // Get weights (should handle missing classifications)
      const weights = await StatementWeightingService.getStatementWeights(
        poll.id,
        testStatements.map(s => s.id)
      );

      // Should still return weights (with fallback consensus potential)
      expect(weights).toHaveLength(3);
      expect(weights[0].weight).toBeGreaterThan(0);
    });
  });

  describe('Weight Calculation Properties', () => {
    it('should never produce negative weights', async () => {
      const basicData = await helper.seedBasicData();
      const poll = basicData.polls[0];
      const testStatements = basicData.statements.filter(s => s.pollId === poll.id);

      // Create various vote patterns
      const timestamp = Date.now();
      for (let i = 0; i < 5; i++) {
        const [user] = await db.insert(users).values({
          clerkUserId: `test-user-negweights-${i}-${timestamp}`,
        }).returning();

        // Create different voting patterns
        for (let j = 0; j < Math.min(5, testStatements.length); j++) {
          await db.insert(votes).values({
            userId: user.id,
            statementId: testStatements[j].id,
            pollId: poll.id,
            value: j === 0 ? 1 : j === 1 ? -1 : 0, // Mix of agree, disagree, pass
          });
        }
      }

      const weights = await StatementWeightingService.getStatementWeights(
        poll.id,
        testStatements.map(s => s.id)
      );

      // All weights should be positive
      weights.forEach(w => {
        expect(w.weight).toBeGreaterThan(0);
      });
    });
  });
});
