import { describe, it, expect, beforeEach, vi } from 'vitest'
import { StatementManager } from '@/lib/services/statement-manager'
import { getStatementBatchAction } from '@/actions/votes-actions'

// Mock the action
vi.mock('@/actions/votes-actions', () => ({
  getStatementBatchAction: vi.fn(),
}))

// Mock voting utility
vi.mock('@/lib/utils/voting', () => ({
  getMinimumVotingThreshold: vi.fn((total: number) => Math.min(10, total)),
}))

// Helper to create mock statements
function createMockStatements(count: number, startId: number = 1) {
  return Array.from({ length: count }, (_, i) => ({
    id: `stmt-${startId + i}`,
    text: `Statement ${startId + i}`,
    pollId: 'test-poll-id',
    createdAt: new Date(),
    submittedBy: 'user-1',
    approved: true,
    approvedBy: 'admin-1',
    approvedAt: new Date(),
  }))
}

describe('StatementManager', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Constructor and Initialization', () => {
    it('should initialize with empty votes', () => {
      const statements = createMockStatements(10)
      const manager = new StatementManager(statements, {}, 'poll-1', 'user-1', 10)

      expect(manager.getTotalVoted()).toBe(0)
      expect(manager.getCurrentBatch()).toBe(1)
      expect(manager.getPositionInBatch()).toBe(0)
    })

    it('should calculate current batch based on existing votes', () => {
      const statements = createMockStatements(10, 11) // Batch 2 statements
      const existingVotes = {
        'stmt-1': 1 as 1,
        'stmt-2': -1 as -1,
        'stmt-3': 1 as 1,
        'stmt-4': 0 as 0,
        'stmt-5': 1 as 1,
        'stmt-6': -1 as -1,
        'stmt-7': 1 as 1,
        'stmt-8': 0 as 0,
        'stmt-9': 1 as 1,
        'stmt-10': -1 as -1,
      } // 10 votes = batch 1 complete

      const manager = new StatementManager(statements, existingVotes, 'poll-1', 'user-1', 20)

      expect(manager.getTotalVoted()).toBe(10)
      expect(manager.getCurrentBatch()).toBe(2)
      expect(manager.getPositionInBatch()).toBe(0) // Start of batch 2
    })

    it('should calculate position within batch correctly', () => {
      const statements = createMockStatements(10, 6) // Starting from stmt-6
      const existingVotes = {
        'stmt-1': 1 as 1,
        'stmt-2': -1 as -1,
        'stmt-3': 1 as 1,
        'stmt-4': 0 as 0,
        'stmt-5': 1 as 1,
      } // 5 votes in batch 1

      const manager = new StatementManager(statements, existingVotes, 'poll-1', 'user-1', 20)

      expect(manager.getCurrentBatch()).toBe(1)
      expect(manager.getPositionInBatch()).toBe(5) // 5th position in batch (0-indexed)
    })
  })

  describe('Batch Navigation', () => {
    it('should return first batch of 10 statements', () => {
      const statements = createMockStatements(10)
      const manager = new StatementManager(statements, {}, 'poll-1', 'user-1', 20)

      const progress = manager.getProgress()

      expect(progress.currentBatch).toBe(1)
      expect(progress.statementsInCurrentBatch).toBe(10)
    })

    it('should handle partial batches (< 10 statements remaining)', () => {
      const statements = createMockStatements(5, 11) // Only 5 statements left
      const existingVotes = Object.fromEntries(
        Array.from({ length: 10 }, (_, i) => [`stmt-${i + 1}`, 1 as 1])
      ) // Voted on first 10

      const manager = new StatementManager(statements, existingVotes, 'poll-1', 'user-1', 15)

      const progress = manager.getProgress()

      expect(progress.currentBatch).toBe(2)
      expect(progress.statementsInCurrentBatch).toBe(5) // Only 5 left
    })

    it('should advance to next batch after completing current batch', async () => {
      const batch1Statements = createMockStatements(10, 1)
      const batch2Statements = createMockStatements(10, 11)
      const manager = new StatementManager(batch1Statements, {}, 'poll-1', 'user-1', 20)

      // Vote on all 10 statements in batch 1
      for (let i = 0; i < 10; i++) {
        const stmt = manager.getNextStatement()
        expect(stmt).not.toBeNull()
        manager.recordVote(stmt!.id, 1)
        manager.advanceIndex()
      }

      expect(manager.isBatchComplete()).toBe(true)
      expect(manager.getCurrentBatch()).toBe(1)

      // Mock loading next batch
      vi.mocked(getStatementBatchAction).mockResolvedValue({
        success: true,
        data: batch2Statements,
      })

      const loaded = await manager.loadNextBatch()

      expect(loaded).toBe(true)
      expect(manager.getCurrentBatch()).toBe(2)
      expect(manager.getPositionInBatch()).toBe(0) // Reset to start
    })

    it('should return false when loading next batch with no more statements', async () => {
      const statements = createMockStatements(10)
      const manager = new StatementManager(statements, {}, 'poll-1', 'user-1', 10)

      // Mock no more statements
      vi.mocked(getStatementBatchAction).mockResolvedValue({
        success: true,
        data: [],
      })

      const loaded = await manager.loadNextBatch()

      expect(loaded).toBe(false)
      expect(manager.getCurrentBatch()).toBe(1) // Stays on current batch
    })
  })

  describe('Statement Navigation', () => {
    it('should return next unvoted statement', () => {
      const statements = createMockStatements(10)
      const manager = new StatementManager(statements, {}, 'poll-1', 'user-1', 10)

      const next = manager.getNextStatement()

      expect(next).not.toBeNull()
      expect(next!.id).toBe('stmt-1')
    })

    it('should skip already-voted statements', () => {
      const statements = createMockStatements(10)
      const votes = {
        'stmt-1': 1 as 1,
        'stmt-2': -1 as -1,
      }
      const manager = new StatementManager(statements, votes, 'poll-1', 'user-1', 10)

      const next = manager.getNextStatement()

      expect(next).not.toBeNull()
      expect(next!.id).toBe('stmt-3') // Skips 1 and 2
    })

    it('should return null when all statements voted on', () => {
      const statements = createMockStatements(5)
      const votes = Object.fromEntries(
        statements.map(s => [s.id, 1 as 1])
      )
      const manager = new StatementManager(statements, votes, 'poll-1', 'user-1', 5)

      const next = manager.getNextStatement()

      expect(next).toBeNull()
    })

    it('should get current statement without advancing index', () => {
      const statements = createMockStatements(10)
      const manager = new StatementManager(statements, {}, 'poll-1', 'user-1', 10)

      const current1 = manager.getCurrentStatement()
      const current2 = manager.getCurrentStatement()

      expect(current1).not.toBeNull()
      expect(current2).not.toBeNull()
      expect(current1!.id).toBe(current2!.id) // Same statement
    })
  })

  describe('Vote Recording', () => {
    it('should record vote locally', () => {
      const statements = createMockStatements(10)
      const manager = new StatementManager(statements, {}, 'poll-1', 'user-1', 10)

      expect(manager.getTotalVoted()).toBe(0)

      manager.recordVote('stmt-1', 1)

      expect(manager.getTotalVoted()).toBe(1)
      expect(manager.getUserVote('stmt-1')).toBe(1)
    })

    it('should update vote count after recording multiple votes', () => {
      const statements = createMockStatements(10)
      const manager = new StatementManager(statements, {}, 'poll-1', 'user-1', 10)

      manager.recordVote('stmt-1', 1)
      manager.recordVote('stmt-2', -1)
      manager.recordVote('stmt-3', 0)

      expect(manager.getTotalVoted()).toBe(3)
    })

    it('should check if user has voted on specific statement', () => {
      const statements = createMockStatements(10)
      const votes = {
        'stmt-1': 1 as 1,
      }
      const manager = new StatementManager(statements, votes, 'poll-1', 'user-1', 10)

      expect(manager.hasVotedOn('stmt-1')).toBe(true)
      expect(manager.hasVotedOn('stmt-2')).toBe(false)
    })
  })

  describe('Index Advancement', () => {
    it('should advance index and position', () => {
      const statements = createMockStatements(10)
      const manager = new StatementManager(statements, {}, 'poll-1', 'user-1', 10)

      expect(manager.getPositionInBatch()).toBe(0)

      manager.advanceIndex()

      expect(manager.getPositionInBatch()).toBe(1)
    })

    it('should advance through multiple statements', () => {
      const statements = createMockStatements(10)
      const manager = new StatementManager(statements, {}, 'poll-1', 'user-1', 10)

      for (let i = 0; i < 5; i++) {
        manager.advanceIndex()
      }

      expect(manager.getPositionInBatch()).toBe(5)
    })
  })

  describe('Batch Completion Detection', () => {
    it('should detect batch is not complete with unvoted statements', () => {
      const statements = createMockStatements(10)
      const manager = new StatementManager(statements, {}, 'poll-1', 'user-1', 10)

      expect(manager.isBatchComplete()).toBe(false)
    })

    it('should detect batch is complete when all statements voted on', () => {
      const statements = createMockStatements(10)
      const votes = Object.fromEntries(
        statements.map(s => [s.id, 1 as 1])
      )
      const manager = new StatementManager(statements, votes, 'poll-1', 'user-1', 10)

      expect(manager.isBatchComplete()).toBe(true)
    })

    it('should detect last statement in batch', () => {
      const statements = createMockStatements(10)
      const votes = Object.fromEntries(
        statements.slice(0, 9).map(s => [s.id, 1 as 1])
      ) // Voted on first 9, only stmt-10 left

      const manager = new StatementManager(statements, votes, 'poll-1', 'user-1', 10)

      // With 9 votes, currentIndex should be at position 9 (stmt-10, the last unvoted)
      // isLastStatementInBatch checks if after the current statement, there are no more
      // Since stmt-10 is the only unvoted statement, next would be null
      const current = manager.getNextStatement()
      expect(current?.id).toBe('stmt-10') // We're at the last unvoted statement

      expect(manager.isLastStatementInBatch()).toBe(true)
    })

    it('should detect not last statement in batch', () => {
      const statements = createMockStatements(10)
      const votes = {
        'stmt-1': 1 as 1,
        'stmt-2': -1 as -1,
      }
      const manager = new StatementManager(statements, votes, 'poll-1', 'user-1', 10)

      expect(manager.isLastStatementInBatch()).toBe(false)
    })
  })

  describe('Progress Tracking', () => {
    it('should calculate comprehensive progress information', () => {
      const statements = createMockStatements(10)
      const votes = {
        'stmt-1': 1 as 1,
        'stmt-2': -1 as -1,
        'stmt-3': 1 as 1,
      }
      const manager = new StatementManager(statements, votes, 'poll-1', 'user-1', 20)

      const progress = manager.getProgress()

      expect(progress.totalVoted).toBe(3)
      expect(progress.currentBatch).toBe(1)
      expect(progress.positionInBatch).toBe(3)
      expect(progress.statementsInCurrentBatch).toBe(10)
      expect(progress.threshold).toBe(10) // Fixed threshold
      expect(progress.canFinish).toBe(false) // Need 10 votes
      expect(progress.totalStatementsInPoll).toBe(20)
    })

    it('should indicate can finish after reaching threshold', () => {
      const statements = createMockStatements(10, 11)
      const votes = Object.fromEntries(
        Array.from({ length: 10 }, (_, i) => [`stmt-${i + 1}`, 1 as 1])
      ) // 10 votes
      const manager = new StatementManager(statements, votes, 'poll-1', 'user-1', 20)

      const progress = manager.getProgress()

      expect(progress.totalVoted).toBe(10)
      expect(progress.canFinish).toBe(true) // Reached threshold
    })

    it('should handle polls with fewer than 10 statements', () => {
      const statements = createMockStatements(6)
      const manager = new StatementManager(statements, {}, 'poll-1', 'user-1', 6)

      const progress = manager.getProgress()

      expect(progress.statementsInCurrentBatch).toBe(6)
      expect(progress.threshold).toBe(6) // All statements required
    })
  })

  describe('Vote Distribution', () => {
    it('should calculate vote distribution', () => {
      const statements = createMockStatements(10)
      const votes = {
        'stmt-1': 1 as 1,
        'stmt-2': 1 as 1,
        'stmt-3': -1 as -1,
        'stmt-4': 0 as 0,
        'stmt-5': 1 as 1,
      }
      const manager = new StatementManager(statements, votes, 'poll-1', 'user-1', 10)

      const distribution = manager.getVoteDistribution()

      expect(distribution.agreeCount).toBe(3)
      expect(distribution.disagreeCount).toBe(1)
      expect(distribution.unsureCount).toBe(1)
    })
  })

  describe('Completion Detection', () => {
    it('should detect when user has voted on all statements', () => {
      const statements = createMockStatements(10)
      const votes = Object.fromEntries(
        statements.map(s => [s.id, 1 as 1])
      )
      const manager = new StatementManager(statements, votes, 'poll-1', 'user-1', 10)

      expect(manager.hasVotedOnAll()).toBe(true)
    })

    it('should detect when user has not voted on all statements', () => {
      const statements = createMockStatements(10)
      const votes = {
        'stmt-1': 1 as 1,
        'stmt-2': -1 as -1,
      }
      const manager = new StatementManager(statements, votes, 'poll-1', 'user-1', 10)

      expect(manager.hasVotedOnAll()).toBe(false)
    })
  })

  describe('Vote Retrieval', () => {
    it('should get all votes as lookup object', () => {
      const statements = createMockStatements(10)
      const votes = {
        'stmt-1': 1 as 1,
        'stmt-2': -1 as -1,
        'stmt-3': 0 as 0,
      }
      const manager = new StatementManager(statements, votes, 'poll-1', 'user-1', 10)

      const allVotes = manager.getAllVotes()

      expect(allVotes).toEqual(votes)
      expect(allVotes).not.toBe(votes) // Should be a copy
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty statement list', () => {
      const manager = new StatementManager([], {}, 'poll-1', 'user-1', 0)

      expect(manager.getNextStatement()).toBeNull()
      expect(manager.isBatchComplete()).toBe(true)
    })

    it('should handle single statement poll', () => {
      const statements = createMockStatements(1)
      const manager = new StatementManager(statements, {}, 'poll-1', 'user-1', 1)

      const progress = manager.getProgress()

      expect(progress.statementsInCurrentBatch).toBe(1)
      expect(progress.threshold).toBe(1) // Min(10, 1) = 1
    })

    it('should handle exactly 10 statements (boundary condition)', () => {
      const statements = createMockStatements(10)
      const manager = new StatementManager(statements, {}, 'poll-1', 'user-1', 10)

      const progress = manager.getProgress()

      expect(progress.statementsInCurrentBatch).toBe(10)
      expect(progress.threshold).toBe(10)
      expect(progress.totalStatementsInPoll).toBe(10)
    })

    it('should handle exactly 11 statements (crosses batch boundary)', () => {
      const statements = createMockStatements(10, 1)
      const manager = new StatementManager(statements, {}, 'poll-1', 'user-1', 11)

      const progress = manager.getProgress()

      expect(progress.statementsInCurrentBatch).toBe(10)
      expect(progress.totalStatementsInPoll).toBe(11)
    })

    it('should handle voting on all statements in batch then loading empty next batch', async () => {
      const statements = createMockStatements(10)
      const manager = new StatementManager(statements, {}, 'poll-1', 'user-1', 10)

      // Vote on all 10
      for (let i = 0; i < 10; i++) {
        const stmt = manager.getNextStatement()
        manager.recordVote(stmt!.id, 1)
        manager.advanceIndex()
      }

      // Try to load next batch (should fail - no more statements)
      vi.mocked(getStatementBatchAction).mockResolvedValue({
        success: true,
        data: [],
      })

      const loaded = await manager.loadNextBatch()

      expect(loaded).toBe(false)
      expect(manager.hasVotedOnAll()).toBe(true)
    })

    it('should handle mid-batch voting (some voted, some not)', () => {
      const statements = createMockStatements(10)
      const votes = {
        'stmt-1': 1 as 1,
        'stmt-3': -1 as -1,
        'stmt-5': 0 as 0,
      } // Non-sequential votes
      const manager = new StatementManager(statements, votes, 'poll-1', 'user-1', 10)

      const next = manager.getNextStatement()

      expect(next!.id).toBe('stmt-2') // Should get first unvoted
    })
  })
})
