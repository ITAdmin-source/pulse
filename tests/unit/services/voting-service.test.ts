import { describe, it, expect, beforeEach, vi } from 'vitest'
import { VotingService } from '@/lib/services/voting-service'
import { PollService } from '@/lib/services/poll-service'
import { db } from '@/db/db'
import { votes, statements, polls } from '@/db/schema'
import { createMockVote, createMockStatement, createMockPoll, TEST_USER_ID, TEST_STATEMENT_ID } from '../../utils/test-helpers'
import { calculateVoteDistribution } from '@/lib/utils/voting'

// Mock the database
vi.mock('@/db/db', () => ({
  db: {
    insert: vi.fn(),
    select: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}))

// Mock PollService
vi.mock('@/lib/services/poll-service', () => ({
  PollService: {
    isVotingActive: vi.fn(),
  },
}))

// Mock voting utils
vi.mock('@/lib/utils/voting', () => ({
  calculateVoteDistribution: vi.fn(),
  VoteValue: {
    DISAGREE: -1,
    NEUTRAL: 0,
    AGREE: 1,
  },
}))

describe('VotingService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('castVote', () => {
    it('should cast new vote on approved statement', async () => {
      const mockStatement = createMockStatement({ approved: true, pollId: 'test-poll-id' })
      const mockPoll = createMockPoll({ id: 'test-poll-id' })
      const mockVote = createMockVote({ value: 1 })
      const voteData = {
        statementId: TEST_STATEMENT_ID,
        userId: TEST_USER_ID,
        value: 1,
      }

      // Mock statement lookup
      const mockSelectStatement = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([mockStatement]),
      }
      vi.mocked(db.select).mockReturnValueOnce(mockSelectStatement as any)

      // Mock poll lookup
      const mockSelectPoll = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([mockPoll]),
      }
      vi.mocked(db.select).mockReturnValueOnce(mockSelectPoll as any)

      // Mock voting active check
      vi.mocked(PollService.isVotingActive).mockResolvedValue(true)

      // Mock vote insertion with conflict handling
      const mockInsert = {
        values: vi.fn().mockReturnThis(),
        onConflictDoUpdate: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([mockVote]),
      }
      vi.mocked(db.insert).mockReturnValue(mockInsert as any)

      const result = await VotingService.castVote(voteData)

      expect(db.select).toHaveBeenCalledTimes(2)
      expect(PollService.isVotingActive).toHaveBeenCalledWith(mockPoll)
      expect(db.insert).toHaveBeenCalledWith(votes)
      expect(result).toEqual(mockVote)
    })

    it('should throw error if statement not found', async () => {
      const voteData = {
        statementId: 'nonexistent-statement',
        userId: TEST_USER_ID,
        value: 1,
      }

      // Mock statement lookup returning empty
      const mockSelectStatement = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([]),
      }
      vi.mocked(db.select).mockReturnValue(mockSelectStatement as any)

      await expect(VotingService.castVote(voteData)).rejects.toThrow('Statement not found')
    })

    it('should throw error if statement not approved', async () => {
      const mockStatement = createMockStatement({ approved: false })
      const voteData = {
        statementId: TEST_STATEMENT_ID,
        userId: TEST_USER_ID,
        value: 1,
      }

      // Mock statement lookup
      const mockSelectStatement = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([mockStatement]),
      }
      vi.mocked(db.select).mockReturnValue(mockSelectStatement as any)

      await expect(VotingService.castVote(voteData)).rejects.toThrow('Cannot vote on unapproved statement')
    })

    it('should throw error if voting not active', async () => {
      const mockStatement = createMockStatement({ approved: true, pollId: 'test-poll-id' })
      const mockPoll = createMockPoll({ id: 'test-poll-id' })
      const voteData = {
        statementId: TEST_STATEMENT_ID,
        userId: TEST_USER_ID,
        value: 1,
      }

      // Mock statement lookup
      const mockSelectStatement = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([mockStatement]),
      }
      vi.mocked(db.select).mockReturnValueOnce(mockSelectStatement as any)

      // Mock poll lookup
      const mockSelectPoll = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([mockPoll]),
      }
      vi.mocked(db.select).mockReturnValueOnce(mockSelectPoll as any)

      // Mock voting inactive
      vi.mocked(PollService.isVotingActive).mockResolvedValue(false)

      await expect(VotingService.castVote(voteData)).rejects.toThrow('Voting is not active for this poll')
    })

    it('should validate vote value is within allowed range', async () => {
      const invalidVoteData = {
        statementId: TEST_STATEMENT_ID,
        userId: TEST_USER_ID,
        value: 5, // Invalid: should be -1, 0, or 1
      }

      await expect(VotingService.castVote(invalidVoteData)).rejects.toThrow()
    })
  })

  describe('updateVote', () => {
    it('should always throw error - votes are immutable', async () => {
      await expect(VotingService.updateVote()).rejects.toThrow(
        'Vote updates are not allowed - votes are final and irreversible'
      )
    })
  })

  describe('Vote Immutability', () => {
    it('should throw error when attempting to vote twice on same statement', async () => {
      const mockStatement = createMockStatement({ approved: true, pollId: 'test-poll-id' })
      const mockPoll = createMockPoll({ id: 'test-poll-id' })
      const voteData = {
        statementId: TEST_STATEMENT_ID,
        userId: TEST_USER_ID,
        value: 1,
      }

      // Mock statement lookup
      const mockSelectStatement = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([mockStatement]),
      }
      vi.mocked(db.select).mockReturnValueOnce(mockSelectStatement as any)

      // Mock poll lookup
      const mockSelectPoll = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([mockPoll]),
      }
      vi.mocked(db.select).mockReturnValueOnce(mockSelectPoll as any)

      // Mock voting active check
      vi.mocked(PollService.isVotingActive).mockResolvedValue(true)

      // Mock getUserVote to return existing vote
      const mockSelectExistingVote = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([createMockVote({ value: 1 })]),
      }
      vi.mocked(db.select).mockReturnValueOnce(mockSelectExistingVote as any)

      // Attempt to cast vote again on same statement
      await expect(VotingService.castVote(voteData)).rejects.toThrow(
        'Vote already cast - votes are final and cannot be changed'
      )
    })

    it('should allow vote on different statement by same user', async () => {
      const mockStatement = createMockStatement({ approved: true, pollId: 'test-poll-id' })
      const mockPoll = createMockPoll({ id: 'test-poll-id' })
      const mockVote = createMockVote({ value: 1 })
      const voteData = {
        statementId: 'different-statement-id',
        userId: TEST_USER_ID,
        value: 1,
      }

      // Mock statement lookup
      const mockSelectStatement = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([mockStatement]),
      }
      vi.mocked(db.select).mockReturnValueOnce(mockSelectStatement as any)

      // Mock poll lookup
      const mockSelectPoll = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([mockPoll]),
      }
      vi.mocked(db.select).mockReturnValueOnce(mockSelectPoll as any)

      // Mock voting active check
      vi.mocked(PollService.isVotingActive).mockResolvedValue(true)

      // Mock getUserVote to return null (no existing vote)
      const mockSelectNoVote = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([]),
      }
      vi.mocked(db.select).mockReturnValueOnce(mockSelectNoVote as any)

      // Mock vote insertion
      const mockInsert = {
        values: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([mockVote]),
      }
      vi.mocked(db.insert).mockReturnValue(mockInsert as any)

      const result = await VotingService.castVote(voteData)

      expect(result).toEqual(mockVote)
      expect(db.insert).toHaveBeenCalledWith(votes)
    })
  })

  describe('getUserVotes', () => {
    it('should return user votes for poll', async () => {
      const mockVotes = [
        createMockVote({ value: 1 }),
        createMockVote({ id: 'vote-2', value: -1 }),
      ]

      const mockSelect = {
        from: vi.fn().mockReturnThis(),
        innerJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockResolvedValue(mockVotes),
      }
      vi.mocked(db.select).mockReturnValue(mockSelect as any)

      const result = await VotingService.getUserVotes(TEST_USER_ID, 'test-poll-id')

      expect(db.select).toHaveBeenCalled()
      expect(result).toEqual(mockVotes)
    })
  })

  describe('getUserVotingProgress', () => {
    it('should calculate voting progress for user', async () => {
      const pollId = 'test-poll-id'
      const mockProgressData = {
        totalStatements: 10,
        votedStatements: 7,
        requiredVotes: 5,
      }

      // Mock the complex query for voting progress
      const mockSelect = {
        from: vi.fn().mockReturnThis(),
        leftJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        select: vi.fn().mockResolvedValue([mockProgressData]),
      }
      vi.mocked(db.select).mockReturnValue(mockSelect as any)

      const result = await VotingService.getUserVotingProgress(TEST_USER_ID, pollId)

      expect(result).toMatchObject({
        totalStatements: expect.any(Number),
        votedStatements: expect.any(Number),
        requiredVotes: expect.any(Number),
        hasMetRequirement: expect.any(Boolean),
        progressPercentage: expect.any(Number),
      })
    })
  })

  describe('getVoteDistribution', () => {
    it('should return vote distribution for statement', async () => {
      const mockVotes = [
        { value: 1, count: 5 },
        { value: -1, count: 3 },
        { value: 0, count: 2 },
      ]

      const mockSelect = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        groupBy: vi.fn().mockReturnThis(),
        select: vi.fn().mockResolvedValue(mockVotes),
      }
      vi.mocked(db.select).mockReturnValue(mockSelect as any)

      // Mock the utility function
      const mockDistribution = {
        agree: 5,
        disagree: 3,
        neutral: 2,
        total: 10,
        agreePercentage: 50,
        disagreePercentage: 30,
        neutralPercentage: 20,
      }
      vi.mocked(calculateVoteDistribution).mockReturnValue(mockDistribution)

      const result = await VotingService.getVoteDistribution(TEST_STATEMENT_ID)

      expect(calculateVoteDistribution).toHaveBeenCalledWith(mockVotes)
      expect(result).toEqual(mockDistribution)
    })
  })

  describe('deleteVote', () => {
    it('should delete vote by ID', async () => {
      const mockDelete = {
        where: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([createMockVote()]),
      }
      vi.mocked(db.delete).mockReturnValue(mockDelete as any)

      const result = await VotingService.deleteVote('test-vote-id')

      expect(db.delete).toHaveBeenCalledWith(votes)
      expect(result).toBe(true)
    })

    it('should return false if vote not found', async () => {
      const mockDelete = {
        where: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([]),
      }
      vi.mocked(db.delete).mockReturnValue(mockDelete as any)

      const result = await VotingService.deleteVote('nonexistent-vote')

      expect(result).toBe(false)
    })
  })

  describe('getPollVotingStats', () => {
    it('should calculate comprehensive voting statistics for poll', async () => {
      const pollId = 'test-poll-id'
      const mockStats = {
        totalVotes: 100,
        totalParticipants: 25,
        averageVotesPerParticipant: 4,
        statementBreakdown: [
          {
            statementId: 'stmt-1',
            text: 'Statement 1',
            agree: 15,
            disagree: 5,
            neutral: 5,
            total: 25,
          },
        ],
      }

      // Mock the complex aggregation query
      const mockSelect = {
        from: vi.fn().mockReturnThis(),
        innerJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        groupBy: vi.fn().mockReturnThis(),
        select: vi.fn().mockResolvedValue([mockStats]),
      }
      vi.mocked(db.select).mockReturnValue(mockSelect as any)

      const result = await VotingService.getPollVotingStats(pollId)

      expect(result).toMatchObject({
        totalVotes: expect.any(Number),
        totalParticipants: expect.any(Number),
        averageVotesPerParticipant: expect.any(Number),
      })
    })
  })

  describe('hasUserVoted', () => {
    it('should return true if user has voted on statement', async () => {
      const mockVote = [createMockVote()]

      const mockSelect = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue(mockVote),
      }
      vi.mocked(db.select).mockReturnValue(mockSelect as any)

      const result = await VotingService.hasUserVoted(TEST_USER_ID, TEST_STATEMENT_ID)

      expect(result).toBe(true)
    })

    it('should return false if user has not voted on statement', async () => {
      const mockSelect = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([]),
      }
      vi.mocked(db.select).mockReturnValue(mockSelect as any)

      const result = await VotingService.hasUserVoted(TEST_USER_ID, TEST_STATEMENT_ID)

      expect(result).toBe(false)
    })
  })
})