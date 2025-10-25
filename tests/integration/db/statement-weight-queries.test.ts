import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { dbTestUtils, type DatabaseTestHelper } from '../../utils/db-test-helpers';
import {
  getCachedWeightsForStatements,
  upsertStatementWeights,
  invalidateStatementWeights,
} from '@/db/queries/statement-weight-queries';
import { db } from '@/db/db';
import { statementWeights, users, votes } from '@/db/schema';
import { eq } from 'drizzle-orm';

/**
 * Integration Tests for Statement Weight Queries
 *
 * Tests database operations for weight caching system.
 *
 * Test Coverage:
 * - Cache retrieval (getCachedWeightsForStatements)
 * - Cache persistence (upsertStatementWeights)
 * - Cache invalidation (invalidateStatementWeights)
 * - Edge cases (empty arrays, missing data)
 */

describe('Statement Weight Queries Integration', () => {
  let helper: DatabaseTestHelper;

  beforeEach(async () => {
    helper = await dbTestUtils.setupTest();
  });

  afterEach(async () => {
    await dbTestUtils.teardownTest(helper);
  });

  describe('getCachedWeightsForStatements', () => {
    it('should retrieve cached weights for multiple statements', async () => {
      const basicData = await helper.seedBasicData();
      const poll = basicData.polls[0];
      const testStatements = basicData.statements.filter(s => s.pollId === poll.id).slice(0, 3);

      // Insert cached weights
      const weightsToInsert = testStatements.map(stmt => ({
        pollId: poll.id,
        statementId: stmt.id,
        predictiveness: 0.6,
        consensusPotential: 0.7,
        recencyBoost: 1.5,
        passRatePenalty: 0.9,
        voteCountBoost: null,
        combinedWeight: 0.75,
        mode: 'clustering' as const,
        agreeCount: 10,
        disagreeCount: 5,
        passCount: 2,
      }));

      await db.insert(statementWeights).values(weightsToInsert);

      // Retrieve cached weights
      const cachedWeights = await getCachedWeightsForStatements(
        poll.id,
        testStatements.map(s => s.id)
      );

      expect(cachedWeights.size).toBe(3);

      for (const stmt of testStatements) {
        const weight = cachedWeights.get(stmt.id);
        expect(weight).toBeDefined();
        expect(weight!.combinedWeight).toBe(0.75);
        expect(weight!.mode).toBe('clustering');
        expect(weight!.predictiveness).toBe(0.6);
      }
    });

    it('should return empty map when no cached weights exist', async () => {
      const basicData = await helper.seedBasicData();
      const poll = basicData.polls[0];
      const testStatements = basicData.statements.filter(s => s.pollId === poll.id).slice(0, 2);

      const cachedWeights = await getCachedWeightsForStatements(
        poll.id,
        testStatements.map(s => s.id)
      );

      expect(cachedWeights.size).toBe(0);
    });

    it('should return partial results when only some weights are cached', async () => {
      const basicData = await helper.seedBasicData();
      const poll = basicData.polls[0];
      const testStatements = basicData.statements.filter(s => s.pollId === poll.id).slice(0, 4);

      // Cache only first 2 statements
      const weightsToInsert = testStatements.slice(0, 2).map(stmt => ({
        pollId: poll.id,
        statementId: stmt.id,
        predictiveness: 0.5,
        consensusPotential: 0.5,
        recencyBoost: 1.0,
        passRatePenalty: 1.0,
        voteCountBoost: null,
        combinedWeight: 0.5,
        mode: 'clustering' as const,
        agreeCount: 8,
        disagreeCount: 8,
        passCount: 4,
      }));

      await db.insert(statementWeights).values(weightsToInsert);

      // Request all 4
      const cachedWeights = await getCachedWeightsForStatements(
        poll.id,
        testStatements.map(s => s.id)
      );

      // Should only get 2
      expect(cachedWeights.size).toBe(2);
      expect(cachedWeights.has(testStatements[0].id)).toBe(true);
      expect(cachedWeights.has(testStatements[1].id)).toBe(true);
      expect(cachedWeights.has(testStatements[2].id)).toBe(false);
      expect(cachedWeights.has(testStatements[3].id)).toBe(false);
    });
  });

  describe('upsertStatementWeights', () => {
    it('should insert new weights into database', async () => {
      const basicData = await helper.seedBasicData();
      const poll = basicData.polls[0];
      const testStatements = basicData.statements.filter(s => s.pollId === poll.id).slice(0, 2);

      const weightsToInsert = testStatements.map(stmt => ({
        pollId: poll.id,
        statementId: stmt.id,
        predictiveness: 0.8,
        consensusPotential: 0.3,
        recencyBoost: 1.2,
        passRatePenalty: 0.95,
        voteCountBoost: 1.1,
        combinedWeight: 0.65,
        mode: 'cold_start' as const,
        agreeCount: 15,
        disagreeCount: 3,
        passCount: 2,
      }));

      await upsertStatementWeights(weightsToInsert);

      // Verify inserted
      const inserted = await db
        .select()
        .from(statementWeights)
        .where(eq(statementWeights.pollId, poll.id));

      expect(inserted).toHaveLength(2);
      expect(inserted[0].combinedWeight).toBe(0.65);
      expect(inserted[0].mode).toBe('cold_start');
      expect(inserted[0].voteCountBoost).toBe(1.1);
    });

    it('should update existing weights on conflict', async () => {
      const basicData = await helper.seedBasicData();
      const poll = basicData.polls[0];
      const stmt = basicData.statements.filter(s => s.pollId === poll.id)[0];

      // Insert initial weight
      const initialWeight = {
        pollId: poll.id,
        statementId: stmt.id,
        predictiveness: 0.5,
        consensusPotential: 0.5,
        recencyBoost: 1.0,
        passRatePenalty: 1.0,
        voteCountBoost: null,
        combinedWeight: 0.5,
        mode: 'clustering' as const,
        agreeCount: 10,
        disagreeCount: 10,
        passCount: 5,
      };

      await db.insert(statementWeights).values(initialWeight);

      // Upsert with new values
      const updatedWeight = {
        pollId: poll.id,
        statementId: stmt.id,
        predictiveness: 0.9,
        consensusPotential: 0.2,
        recencyBoost: 1.8,
        passRatePenalty: 0.7,
        voteCountBoost: null,
        combinedWeight: 0.85,
        mode: 'clustering' as const,
        agreeCount: 20,
        disagreeCount: 5,
        passCount: 3,
      };

      await upsertStatementWeights([updatedWeight]);

      // Verify updated
      const result = await db
        .select()
        .from(statementWeights)
        .where(eq(statementWeights.statementId, stmt.id));

      expect(result).toHaveLength(1);
      expect(result[0].combinedWeight).toBe(0.85);
      expect(result[0].predictiveness).toBe(0.9);
      expect(result[0].agreeCount).toBe(20);
    });
  });

  describe('invalidateStatementWeights', () => {
    it('should delete all weights for a poll', async () => {
      const basicData = await helper.seedBasicData();
      const poll = basicData.polls[0];
      const testStatements = basicData.statements.filter(s => s.pollId === poll.id).slice(0, 3);

      // Insert weights
      const weightsToInsert = testStatements.map(stmt => ({
        pollId: poll.id,
        statementId: stmt.id,
        predictiveness: 0.6,
        consensusPotential: 0.6,
        recencyBoost: 1.0,
        passRatePenalty: 1.0,
        voteCountBoost: null,
        combinedWeight: 0.6,
        mode: 'clustering' as const,
        agreeCount: 12,
        disagreeCount: 8,
        passCount: 4,
      }));

      await db.insert(statementWeights).values(weightsToInsert);

      // Verify inserted
      let weights = await db
        .select()
        .from(statementWeights)
        .where(eq(statementWeights.pollId, poll.id));
      expect(weights).toHaveLength(3);

      // Invalidate
      await invalidateStatementWeights(poll.id);

      // Verify deleted
      weights = await db
        .select()
        .from(statementWeights)
        .where(eq(statementWeights.pollId, poll.id));
      expect(weights).toHaveLength(0);
    });

    it('should only delete weights for specified poll', async () => {
      const basicData = await helper.seedBasicData();

      // Use two different polls
      const poll1 = basicData.polls[0];
      const poll2 = basicData.polls[1] || basicData.polls[0]; // Fallback to same poll if only one exists

      const stmt1 = basicData.statements.filter(s => s.pollId === poll1.id)[0];
      const stmt2 = basicData.statements.filter(s => s.pollId === poll2.id)[0];

      // Insert weights for both polls
      await db.insert(statementWeights).values([
        {
          pollId: poll1.id,
          statementId: stmt1.id,
          predictiveness: 0.5,
          consensusPotential: 0.5,
          recencyBoost: 1.0,
          passRatePenalty: 1.0,
          voteCountBoost: null,
          combinedWeight: 0.5,
          mode: 'clustering' as const,
          agreeCount: 10,
          disagreeCount: 10,
          passCount: 5,
        },
        {
          pollId: poll2.id,
          statementId: stmt2.id,
          predictiveness: 0.6,
          consensusPotential: 0.6,
          recencyBoost: 1.0,
          passRatePenalty: 1.0,
          voteCountBoost: null,
          combinedWeight: 0.6,
          mode: 'clustering' as const,
          agreeCount: 12,
          disagreeCount: 8,
          passCount: 4,
        },
      ]);

      // Invalidate only poll1
      await invalidateStatementWeights(poll1.id);

      // Verify poll1 deleted
      const poll1Weights = await db
        .select()
        .from(statementWeights)
        .where(eq(statementWeights.pollId, poll1.id));
      expect(poll1Weights).toHaveLength(0);

      // Verify poll2 still exists (if different poll)
      if (poll1.id !== poll2.id) {
        const poll2Weights = await db
          .select()
          .from(statementWeights)
          .where(eq(statementWeights.pollId, poll2.id));
        expect(poll2Weights).toHaveLength(1);
      }
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty statement array', async () => {
      const basicData = await helper.seedBasicData();
      const poll = basicData.polls[0];

      const cachedWeights = await getCachedWeightsForStatements(poll.id, []);
      expect(cachedWeights.size).toBe(0);
    });

    it('should handle non-existent poll ID gracefully', async () => {
      const cachedWeights = await getCachedWeightsForStatements(
        'non-existent-poll-id',
        ['stmt-1', 'stmt-2']
      );
      expect(cachedWeights.size).toBe(0);

      // Should not throw when invalidating non-existent poll
      await expect(
        invalidateStatementWeights('non-existent-poll-id')
      ).resolves.not.toThrow();
    });
  });
});
