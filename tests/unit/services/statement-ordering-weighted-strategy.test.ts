import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { StatementOrderingService } from '@/lib/services/statement-ordering-service';
import { StatementWeightingService } from '@/lib/services/statement-weighting-service';
import type { Statement, OrderingContext } from '@/lib/services/statement-ordering-service';

/**
 * Unit Tests for Weighted Statement Ordering Strategy
 *
 * Tests the WeightedStrategy implementation in statement-ordering-service.ts
 * focusing on deterministic seeding, weighted random selection, and integration
 * with StatementWeightingService.
 *
 * Test Coverage:
 * - Deterministic ordering (same seed = same order)
 * - Weighted distribution (higher weights more likely)
 * - Service integration (calls StatementWeightingService)
 * - Fallback behavior (handles weight calculation errors)
 * - Batch size handling
 */

describe('WeightedStrategy Unit Tests', () => {
  // Mock statements
  const createMockStatements = (count: number, pollId: string): Statement[] => {
    return Array.from({ length: count }, (_, i) => ({
      id: `stmt-${i}`,
      pollId,
      content: `Statement ${i}`,
      createdAt: new Date(),
      updatedAt: new Date(),
      userId: 'user-1',
      status: 'approved' as const,
      viewCount: 0,
      adminPinned: false,
    }));
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Deterministic Ordering', () => {
    it('should produce identical order for same user, poll, and batch', async () => {
      const pollId = 'test-poll-1';
      const userId = 'test-user-1';
      const statements = createMockStatements(20, pollId);

      // Mock StatementWeightingService to return uniform weights
      vi.spyOn(StatementWeightingService, 'getStatementWeights').mockResolvedValue(
        statements.map(s => ({
          statementId: s.id,
          weight: 0.5,
          components: {
            mode: 'clustering',
            predictiveness: 0.5,
            consensusPotential: 0.5,
            recencyBoost: 1.0,
            passRatePenalty: 1.0,
          },
        }))
      );

      // Get batch 1 twice
      const context: OrderingContext = {
        userId,
        pollId,
        batchNumber: 1,
        pollConfig: { orderMode: 'weighted' },
      };

      const batch1_attempt1 = await StatementOrderingService.orderStatements(statements, context);
      const batch1_attempt2 = await StatementOrderingService.orderStatements(statements, context);

      // Should be identical
      expect(batch1_attempt1.map(s => s.id)).toEqual(batch1_attempt2.map(s => s.id));
    });

    it('should produce different order for different batch numbers', async () => {
      const pollId = 'test-poll-2';
      const userId = 'test-user-2';
      const statements = createMockStatements(20, pollId);

      vi.spyOn(StatementWeightingService, 'getStatementWeights').mockResolvedValue(
        statements.map(s => ({
          statementId: s.id,
          weight: 0.5,
          components: {
            mode: 'clustering',
            predictiveness: 0.5,
            consensusPotential: 0.5,
            recencyBoost: 1.0,
            passRatePenalty: 1.0,
          },
        }))
      );

      const context1: OrderingContext = {
        userId,
        pollId,
        batchNumber: 1,
        pollConfig: { orderMode: 'weighted' },
      };

      const context2: OrderingContext = {
        userId,
        pollId,
        batchNumber: 2,
        pollConfig: { orderMode: 'weighted' },
      };

      const batch1 = await StatementOrderingService.orderStatements(statements, context1);
      const batch2 = await StatementOrderingService.orderStatements(statements, context2);

      // Should be different (highly unlikely to be same with 20 statements)
      expect(batch1.map(s => s.id)).not.toEqual(batch2.map(s => s.id));
    });

    it('should produce different order for different users', async () => {
      const pollId = 'test-poll-3';
      const statements = createMockStatements(20, pollId);

      vi.spyOn(StatementWeightingService, 'getStatementWeights').mockResolvedValue(
        statements.map(s => ({
          statementId: s.id,
          weight: 0.5,
          components: {
            mode: 'clustering',
            predictiveness: 0.5,
            consensusPotential: 0.5,
            recencyBoost: 1.0,
            passRatePenalty: 1.0,
          },
        }))
      );

      const contextUser1: OrderingContext = {
        userId: 'user-1',
        pollId,
        batchNumber: 1,
        pollConfig: { orderMode: 'weighted' },
      };

      const contextUser2: OrderingContext = {
        userId: 'user-2',
        pollId,
        batchNumber: 1,
        pollConfig: { orderMode: 'weighted' },
      };

      const batchUser1 = await StatementOrderingService.orderStatements(statements, contextUser1);
      const batchUser2 = await StatementOrderingService.orderStatements(statements, contextUser2);

      // Should be different (different user = different seed)
      expect(batchUser1.map(s => s.id)).not.toEqual(batchUser2.map(s => s.id));
    });
  });

  describe('Weighted Distribution', () => {
    it('should favor higher-weighted statements over many iterations', async () => {
      const pollId = 'test-poll-4';
      const userId = 'test-user-4';

      // Create statements: first 5 have high weight, last 5 have low weight
      const statements = createMockStatements(10, pollId);

      // Mock weights: first 5 statements get 0.9, last 5 get 0.1
      vi.spyOn(StatementWeightingService, 'getStatementWeights').mockResolvedValue(
        statements.map((s, i) => ({
          statementId: s.id,
          weight: i < 5 ? 0.9 : 0.1, // High weight for first 5, low for last 5
          components: {
            mode: 'clustering',
            predictiveness: i < 5 ? 0.9 : 0.1,
            consensusPotential: 0.5,
            recencyBoost: 1.0,
            passRatePenalty: 1.0,
          },
        }))
      );

      // Run 20 batches to test distribution
      const firstPositionCounts = new Map<string, number>();

      for (let batchNum = 1; batchNum <= 20; batchNum++) {
        const context: OrderingContext = {
          userId,
          pollId,
          batchNumber: batchNum,
          pollConfig: { orderMode: 'weighted' },
        };

        const batch = await StatementOrderingService.orderStatements(statements, context);
        const firstId = batch[0].id;
        firstPositionCounts.set(firstId, (firstPositionCounts.get(firstId) || 0) + 1);
      }

      // Count how many times high-weight statements appeared first
      let highWeightFirstCount = 0;
      for (let i = 0; i < 5; i++) {
        highWeightFirstCount += firstPositionCounts.get(`stmt-${i}`) || 0;
      }

      // High-weight statements should appear first more often
      // With 0.9 vs 0.1 weights, expect ~90% of first positions to be high-weight
      // Use 70% threshold to account for randomness
      expect(highWeightFirstCount).toBeGreaterThan(14); // 14/20 = 70%
    });
  });

  describe('Service Integration', () => {
    it('should call StatementWeightingService with correct parameters', async () => {
      const pollId = 'test-poll-5';
      const userId = 'test-user-5';
      const statements = createMockStatements(5, pollId);

      const getWeightsSpy = vi.spyOn(StatementWeightingService, 'getStatementWeights').mockResolvedValue(
        statements.map(s => ({
          statementId: s.id,
          weight: 0.5,
          components: {
            mode: 'clustering',
            predictiveness: 0.5,
            consensusPotential: 0.5,
            recencyBoost: 1.0,
            passRatePenalty: 1.0,
          },
        }))
      );

      const context: OrderingContext = {
        userId,
        pollId,
        batchNumber: 1,
        pollConfig: { orderMode: 'weighted' },
      };

      await StatementOrderingService.orderStatements(statements, context);

      // Verify service was called
      expect(getWeightsSpy).toHaveBeenCalledTimes(1);
      expect(getWeightsSpy).toHaveBeenCalledWith(
        pollId,
        statements.map(s => s.id)
      );
    });

    it('should fallback to random strategy on weight calculation error', async () => {
      const pollId = 'test-poll-6';
      const userId = 'test-user-6';
      const statements = createMockStatements(10, pollId);

      // Mock service to throw error
      vi.spyOn(StatementWeightingService, 'getStatementWeights').mockRejectedValue(
        new Error('Database connection failed')
      );

      const context: OrderingContext = {
        userId,
        pollId,
        batchNumber: 1,
        pollConfig: { orderMode: 'weighted' },
      };

      // Should not throw - should fallback to random
      const batch = await StatementOrderingService.orderStatements(statements, context);

      // Should still return batch
      expect(batch).toHaveLength(10);
      expect(batch.every(s => statements.includes(s))).toBe(true);
    });
  });
});
