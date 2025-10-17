import { describe, it, expect } from 'vitest';
import { StatementOrderingService } from '@/lib/services/statement-ordering-service';
import type { Statement, OrderingContext } from '@/lib/services/statement-ordering-service';

// Helper to create mock statements
function createMockStatements(count: number): Statement[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `statement-${i + 1}`,
    text: `Statement ${i + 1}`,
    pollId: 'test-poll',
    createdAt: new Date(2024, 0, i + 1),
  }));
}

describe('StatementOrderingService', () => {
  const mockStatements = createMockStatements(25);

  describe('Sequential Strategy', () => {
    it('should maintain createdAt order', async () => {
      const context: OrderingContext = {
        userId: 'user-1',
        pollId: 'test-poll',
        batchNumber: 1,
        pollConfig: { orderMode: 'sequential' },
      };

      const result = await StatementOrderingService.orderStatements(
        mockStatements,
        context
      );

      // Should maintain exact input order
      expect(result).toEqual(mockStatements);
      expect(result[0].id).toBe('statement-1');
      expect(result[24].id).toBe('statement-25');
    });
  });

  describe('Random Strategy', () => {
    it('should produce consistent order for same user + poll + batch', async () => {
      const context: OrderingContext = {
        userId: 'user-a',
        pollId: 'poll-1',
        batchNumber: 1,
        pollConfig: { orderMode: 'random' },
      };

      const result1 = await StatementOrderingService.orderStatements(
        mockStatements,
        context
      );

      const result2 = await StatementOrderingService.orderStatements(
        mockStatements,
        context
      );

      // Same seed = same order
      expect(result1).toEqual(result2);
    });

    it('should produce different order for different users', async () => {
      const contextUserA: OrderingContext = {
        userId: 'user-a',
        pollId: 'poll-1',
        batchNumber: 1,
        pollConfig: { orderMode: 'random' },
      };

      const contextUserB: OrderingContext = {
        userId: 'user-b',
        pollId: 'poll-1',
        batchNumber: 1,
        pollConfig: { orderMode: 'random' },
      };

      const resultA = await StatementOrderingService.orderStatements(
        mockStatements,
        contextUserA
      );

      const resultB = await StatementOrderingService.orderStatements(
        mockStatements,
        contextUserB
      );

      // Different users = different seeds = different orders
      expect(resultA).not.toEqual(resultB);

      // But both should contain all statements
      expect(resultA).toHaveLength(25);
      expect(resultB).toHaveLength(25);
      expect(new Set(resultA.map(s => s.id))).toEqual(new Set(mockStatements.map(s => s.id)));
      expect(new Set(resultB.map(s => s.id))).toEqual(new Set(mockStatements.map(s => s.id)));
    });

    it('should produce different order for different batches', async () => {
      const contextBatch1: OrderingContext = {
        userId: 'user-a',
        pollId: 'poll-1',
        batchNumber: 1,
        pollConfig: { orderMode: 'random' },
      };

      const contextBatch2: OrderingContext = {
        userId: 'user-a',
        pollId: 'poll-1',
        batchNumber: 2,
        pollConfig: { orderMode: 'random' },
      };

      const resultBatch1 = await StatementOrderingService.orderStatements(
        mockStatements,
        contextBatch1
      );

      const resultBatch2 = await StatementOrderingService.orderStatements(
        mockStatements,
        contextBatch2
      );

      // Different batches = different seeds = different orders
      expect(resultBatch1).not.toEqual(resultBatch2);
    });

    it('should respect randomSeed override', async () => {
      const contextWithSeed: OrderingContext = {
        userId: 'user-a',
        pollId: 'poll-1',
        batchNumber: 1,
        pollConfig: {
          orderMode: 'random',
          randomSeed: 'test-seed-123'
        },
      };

      const result1 = await StatementOrderingService.orderStatements(
        mockStatements,
        contextWithSeed
      );

      // Same user, same override seed, different batch = different order
      const contextDifferentBatch: OrderingContext = {
        userId: 'user-a',
        pollId: 'poll-1',
        batchNumber: 2,
        pollConfig: {
          orderMode: 'random',
          randomSeed: 'test-seed-123'
        },
      };

      const result2 = await StatementOrderingService.orderStatements(
        mockStatements,
        contextDifferentBatch
      );

      // Same override seed but different batch = different order
      expect(result1).not.toEqual(result2);

      // But calling twice with same seed = same order
      const result3 = await StatementOrderingService.orderStatements(
        mockStatements,
        contextWithSeed
      );
      expect(result1).toEqual(result3);
    });

    it('should shuffle all statements (none left unchanged at position)', async () => {
      const context: OrderingContext = {
        userId: 'user-a',
        pollId: 'poll-1',
        batchNumber: 1,
        pollConfig: { orderMode: 'random' },
      };

      const result = await StatementOrderingService.orderStatements(
        mockStatements,
        context
      );

      // At least some statements should be in different positions
      let changedPositions = 0;
      for (let i = 0; i < mockStatements.length; i++) {
        if (result[i].id !== mockStatements[i].id) {
          changedPositions++;
        }
      }

      // With 25 statements, expect at least 20 to be shuffled
      expect(changedPositions).toBeGreaterThan(20);
    });
  });

  describe('Weighted Strategy (Future)', () => {
    it('should fall back to random strategy', async () => {
      const context: OrderingContext = {
        userId: 'user-a',
        pollId: 'poll-1',
        batchNumber: 1,
        pollConfig: { orderMode: 'weighted' },
      };

      const result = await StatementOrderingService.orderStatements(
        mockStatements,
        context
      );

      // Should return statements (fallback to random)
      expect(result).toHaveLength(25);
      expect(new Set(result.map(s => s.id))).toEqual(new Set(mockStatements.map(s => s.id)));
    });
  });

  describe('Edge Cases', () => {
    it('should handle single statement', async () => {
      const singleStatement = [mockStatements[0]];
      const context: OrderingContext = {
        userId: 'user-a',
        pollId: 'poll-1',
        batchNumber: 1,
        pollConfig: { orderMode: 'random' },
      };

      const result = await StatementOrderingService.orderStatements(
        singleStatement,
        context
      );

      expect(result).toEqual(singleStatement);
    });

    it('should handle empty array', async () => {
      const emptyStatements: Statement[] = [];
      const context: OrderingContext = {
        userId: 'user-a',
        pollId: 'poll-1',
        batchNumber: 1,
        pollConfig: { orderMode: 'random' },
      };

      const result = await StatementOrderingService.orderStatements(
        emptyStatements,
        context
      );

      expect(result).toEqual([]);
    });

    it('should default to sequential for unknown order mode', async () => {
      const context: OrderingContext = {
        userId: 'user-a',
        pollId: 'poll-1',
        batchNumber: 1,
        pollConfig: { orderMode: 'unknown' as any },
      };

      const result = await StatementOrderingService.orderStatements(
        mockStatements,
        context
      );

      // Should fallback to sequential (maintains order)
      expect(result).toEqual(mockStatements);
    });
  });
});
