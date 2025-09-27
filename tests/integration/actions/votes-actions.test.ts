import { describe, it, expect, beforeEach, vi } from 'vitest'
import { revalidatePath } from 'next/cache'
import {
  createVoteAction,
  updateVoteAction,
  upsertVoteAction,
  deleteVoteAction,
  getVotesAction,
  getVotesByStatementIdAction,
  getVotesByUserIdAction,
  getVoteByIdAction,
  getVoteByUserAndStatementAction,
  getUserVoteCountForPollAction,
  hasUserMetVotingThresholdAction,
} from '@/actions/votes-actions'
import * as votesQueries from '@/db/queries/votes-queries'
import { createMockVote } from '../../utils/test-helpers'

// Mock Next.js revalidatePath
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

// Mock all votes queries
vi.mock('@/db/queries/votes-queries', () => ({
  createVote: vi.fn(),
  updateVote: vi.fn(),
  upsertVote: vi.fn(),
  deleteVote: vi.fn(),
  getAllVotes: vi.fn(),
  getVoteById: vi.fn(),
  getVotesByStatementId: vi.fn(),
  getVotesByUserId: vi.fn(),
  getVoteByUserAndStatement: vi.fn(),
  getUserVoteCountForPoll: vi.fn(),
  hasUserMetVotingThreshold: vi.fn(),
}))

describe('Votes Actions Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('createVoteAction', () => {
    it('should create vote and revalidate polls', async () => {
      const voteData = {
        userId: 'user-123',
        statementId: 'statement-456',
        value: 1 as const,
      }
      const mockVote = createMockVote(voteData)
      vi.mocked(votesQueries.createVote).mockResolvedValue(mockVote)

      const result = await createVoteAction(voteData)

      expect(votesQueries.createVote).toHaveBeenCalledWith(voteData)
      expect(revalidatePath).toHaveBeenCalledWith('/polls')
      expect(result).toEqual({ success: true, data: mockVote })
    })

    it('should handle database errors', async () => {
      const voteData = {
        userId: 'user-123',
        statementId: 'statement-456',
        value: 1 as const,
      }
      vi.mocked(votesQueries.createVote).mockRejectedValue(new Error('Database error'))

      const result = await createVoteAction(voteData)

      expect(result).toEqual({ success: false, error: 'Failed to create vote' })
      expect(revalidatePath).not.toHaveBeenCalled()
    })
  })

  describe('updateVoteAction', () => {
    it('should update vote successfully', async () => {
      const updateData = { value: -1 as const }
      const mockVote = createMockVote(updateData)
      vi.mocked(votesQueries.updateVote).mockResolvedValue(mockVote)

      const result = await updateVoteAction('vote-123', updateData)

      expect(votesQueries.updateVote).toHaveBeenCalledWith('vote-123', updateData)
      expect(revalidatePath).toHaveBeenCalledWith('/polls')
      expect(result).toEqual({ success: true, data: mockVote })
    })

    it('should handle vote not found', async () => {
      vi.mocked(votesQueries.updateVote).mockResolvedValue(undefined)

      const result = await updateVoteAction('nonexistent-id', { value: 1 })

      expect(result).toEqual({ success: false, error: 'Vote not found' })
      expect(revalidatePath).not.toHaveBeenCalled()
    })

    it('should handle database errors', async () => {
      vi.mocked(votesQueries.updateVote).mockRejectedValue(new Error('Database error'))

      const result = await updateVoteAction('vote-123', { value: 1 })

      expect(result).toEqual({ success: false, error: 'Failed to update vote' })
    })
  })

  describe('upsertVoteAction', () => {
    it('should upsert vote with valid value', async () => {
      const mockVote = createMockVote({
        userId: 'user-123',
        statementId: 'statement-456',
        value: 1,
      })
      vi.mocked(votesQueries.upsertVote).mockResolvedValue(mockVote)

      const result = await upsertVoteAction('user-123', 'statement-456', 1)

      expect(votesQueries.upsertVote).toHaveBeenCalledWith('user-123', 'statement-456', 1)
      expect(revalidatePath).toHaveBeenCalledWith('/polls')
      expect(result).toEqual({ success: true, data: mockVote })
    })

    it('should validate vote values', async () => {
      const result = await upsertVoteAction('user-123', 'statement-456', 2)

      expect(result).toEqual({
        success: false,
        error: 'Invalid vote value. Must be -1, 0, or 1',
      })
      expect(votesQueries.upsertVote).not.toHaveBeenCalled()
      expect(revalidatePath).not.toHaveBeenCalled()
    })

    it('should accept all valid vote values', async () => {
      const mockVote = createMockVote({ value: 0 })
      vi.mocked(votesQueries.upsertVote).mockResolvedValue(mockVote)

      // Test all valid values
      const validValues = [-1, 0, 1]
      for (const value of validValues) {
        const result = await upsertVoteAction('user-123', 'statement-456', value)
        expect(result.success).toBe(true)
      }
    })

    it('should reject all invalid vote values', async () => {
      const invalidValues = [-2, 0.5, 2, 10, -10]
      for (const value of invalidValues) {
        const result = await upsertVoteAction('user-123', 'statement-456', value)
        expect(result.success).toBe(false)
        expect(result.error).toContain('Invalid vote value')
      }
    })

    it('should handle database errors', async () => {
      vi.mocked(votesQueries.upsertVote).mockRejectedValue(new Error('Database error'))

      const result = await upsertVoteAction('user-123', 'statement-456', 1)

      expect(result).toEqual({ success: false, error: 'Failed to save vote' })
    })
  })

  describe('deleteVoteAction', () => {
    it('should delete vote successfully', async () => {
      vi.mocked(votesQueries.deleteVote).mockResolvedValue(true)

      const result = await deleteVoteAction('vote-123')

      expect(votesQueries.deleteVote).toHaveBeenCalledWith('vote-123')
      expect(revalidatePath).toHaveBeenCalledWith('/polls')
      expect(result).toEqual({ success: true })
    })

    it('should handle vote not found', async () => {
      vi.mocked(votesQueries.deleteVote).mockResolvedValue(false)

      const result = await deleteVoteAction('nonexistent-id')

      expect(result).toEqual({ success: false, error: 'Vote not found' })
      expect(revalidatePath).not.toHaveBeenCalled()
    })

    it('should handle database errors', async () => {
      vi.mocked(votesQueries.deleteVote).mockRejectedValue(new Error('Database error'))

      const result = await deleteVoteAction('vote-123')

      expect(result).toEqual({ success: false, error: 'Failed to delete vote' })
    })
  })

  describe('getVotesAction', () => {
    it('should fetch all votes successfully', async () => {
      const mockVotes = [createMockVote(), createMockVote({ id: 'vote-2' })]
      vi.mocked(votesQueries.getAllVotes).mockResolvedValue(mockVotes)

      const result = await getVotesAction()

      expect(votesQueries.getAllVotes).toHaveBeenCalled()
      expect(result).toEqual({ success: true, data: mockVotes })
    })

    it('should handle database errors', async () => {
      vi.mocked(votesQueries.getAllVotes).mockRejectedValue(new Error('Database error'))

      const result = await getVotesAction()

      expect(result).toEqual({ success: false, error: 'Failed to fetch votes' })
    })
  })

  describe('getVotesByStatementIdAction', () => {
    it('should fetch votes for statement successfully', async () => {
      const mockVotes = [createMockVote({ statementId: 'statement-123' })]
      vi.mocked(votesQueries.getVotesByStatementId).mockResolvedValue(mockVotes)

      const result = await getVotesByStatementIdAction('statement-123')

      expect(votesQueries.getVotesByStatementId).toHaveBeenCalledWith('statement-123')
      expect(result).toEqual({ success: true, data: mockVotes })
    })

    it('should handle database errors', async () => {
      vi.mocked(votesQueries.getVotesByStatementId).mockRejectedValue(new Error('Database error'))

      const result = await getVotesByStatementIdAction('statement-123')

      expect(result).toEqual({ success: false, error: 'Failed to fetch votes for statement' })
    })
  })

  describe('getVotesByUserIdAction', () => {
    it('should fetch votes for user successfully', async () => {
      const mockVotes = [createMockVote({ userId: 'user-123' })]
      vi.mocked(votesQueries.getVotesByUserId).mockResolvedValue(mockVotes)

      const result = await getVotesByUserIdAction('user-123')

      expect(votesQueries.getVotesByUserId).toHaveBeenCalledWith('user-123')
      expect(result).toEqual({ success: true, data: mockVotes })
    })

    it('should handle database errors', async () => {
      vi.mocked(votesQueries.getVotesByUserId).mockRejectedValue(new Error('Database error'))

      const result = await getVotesByUserIdAction('user-123')

      expect(result).toEqual({ success: false, error: 'Failed to fetch votes for user' })
    })
  })

  describe('getVoteByIdAction', () => {
    it('should fetch vote by ID successfully', async () => {
      const mockVote = createMockVote()
      vi.mocked(votesQueries.getVoteById).mockResolvedValue(mockVote)

      const result = await getVoteByIdAction('vote-123')

      expect(votesQueries.getVoteById).toHaveBeenCalledWith('vote-123')
      expect(result).toEqual({ success: true, data: mockVote })
    })

    it('should handle vote not found', async () => {
      vi.mocked(votesQueries.getVoteById).mockResolvedValue(undefined)

      const result = await getVoteByIdAction('nonexistent-id')

      expect(result).toEqual({ success: false, error: 'Vote not found' })
    })

    it('should handle database errors', async () => {
      vi.mocked(votesQueries.getVoteById).mockRejectedValue(new Error('Database error'))

      const result = await getVoteByIdAction('vote-123')

      expect(result).toEqual({ success: false, error: 'Failed to fetch vote' })
    })
  })

  describe('getVoteByUserAndStatementAction', () => {
    it('should fetch user vote for statement successfully', async () => {
      const mockVote = createMockVote({
        userId: 'user-123',
        statementId: 'statement-456',
      })
      vi.mocked(votesQueries.getVoteByUserAndStatement).mockResolvedValue(mockVote)

      const result = await getVoteByUserAndStatementAction('user-123', 'statement-456')

      expect(votesQueries.getVoteByUserAndStatement).toHaveBeenCalledWith('user-123', 'statement-456')
      expect(result).toEqual({ success: true, data: mockVote })
    })

    it('should handle vote not found (return success with undefined)', async () => {
      vi.mocked(votesQueries.getVoteByUserAndStatement).mockResolvedValue(undefined)

      const result = await getVoteByUserAndStatementAction('user-123', 'statement-456')

      expect(result).toEqual({ success: true, data: undefined })
    })

    it('should handle database errors', async () => {
      vi.mocked(votesQueries.getVoteByUserAndStatement).mockRejectedValue(new Error('Database error'))

      const result = await getVoteByUserAndStatementAction('user-123', 'statement-456')

      expect(result).toEqual({ success: false, error: 'Failed to fetch user vote for statement' })
    })
  })

  describe('getUserVoteCountForPollAction', () => {
    it('should fetch vote count for user in poll', async () => {
      vi.mocked(votesQueries.getUserVoteCountForPoll).mockResolvedValue(5)

      const result = await getUserVoteCountForPollAction('user-123', 'poll-456')

      expect(votesQueries.getUserVoteCountForPoll).toHaveBeenCalledWith('user-123', 'poll-456')
      expect(result).toEqual({ success: true, data: 5 })
    })

    it('should handle zero vote count', async () => {
      vi.mocked(votesQueries.getUserVoteCountForPoll).mockResolvedValue(0)

      const result = await getUserVoteCountForPollAction('user-123', 'poll-456')

      expect(result).toEqual({ success: true, data: 0 })
    })

    it('should handle database errors', async () => {
      vi.mocked(votesQueries.getUserVoteCountForPoll).mockRejectedValue(new Error('Database error'))

      const result = await getUserVoteCountForPollAction('user-123', 'poll-456')

      expect(result).toEqual({ success: false, error: 'Failed to fetch user vote count for poll' })
    })
  })

  describe('hasUserMetVotingThresholdAction', () => {
    it('should check if user met voting threshold', async () => {
      vi.mocked(votesQueries.hasUserMetVotingThreshold).mockResolvedValue(true)

      const result = await hasUserMetVotingThresholdAction('user-123', 'poll-456')

      expect(votesQueries.hasUserMetVotingThreshold).toHaveBeenCalledWith('user-123', 'poll-456')
      expect(result).toEqual({ success: true, data: true })
    })

    it('should handle user not meeting threshold', async () => {
      vi.mocked(votesQueries.hasUserMetVotingThreshold).mockResolvedValue(false)

      const result = await hasUserMetVotingThresholdAction('user-123', 'poll-456')

      expect(result).toEqual({ success: true, data: false })
    })

    it('should handle database errors', async () => {
      vi.mocked(votesQueries.hasUserMetVotingThreshold).mockRejectedValue(new Error('Database error'))

      const result = await hasUserMetVotingThresholdAction('user-123', 'poll-456')

      expect(result).toEqual({ success: false, error: 'Failed to check voting threshold' })
    })
  })

  describe('error logging patterns', () => {
    it('should log specific error messages', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      vi.mocked(votesQueries.createVote).mockRejectedValue(new Error('Test error'))

      await createVoteAction({
        userId: 'user-123',
        statementId: 'statement-456',
        value: 1,
      })

      expect(consoleSpy).toHaveBeenCalledWith('Error creating vote:', expect.any(Error))
      consoleSpy.mockRestore()
    })
  })

  describe('revalidation patterns', () => {
    it('should only revalidate polls path for vote operations', async () => {
      const mockVote = createMockVote()
      vi.mocked(votesQueries.createVote).mockResolvedValue(mockVote)

      await createVoteAction({
        userId: 'user-123',
        statementId: 'statement-456',
        value: 1,
      })

      expect(revalidatePath).toHaveBeenCalledWith('/polls')
      expect(revalidatePath).toHaveBeenCalledTimes(1)
    })

    it('should not revalidate for read operations', async () => {
      const mockVotes = [createMockVote()]
      vi.mocked(votesQueries.getAllVotes).mockResolvedValue(mockVotes)

      await getVotesAction()

      expect(revalidatePath).not.toHaveBeenCalled()
    })
  })

  describe('vote value validation edge cases', () => {
    it('should handle non-integer values', async () => {
      const result = await upsertVoteAction('user-123', 'statement-456', 1.5)
      expect(result.success).toBe(false)
    })

    it('should handle negative values outside range', async () => {
      const result = await upsertVoteAction('user-123', 'statement-456', -5)
      expect(result.success).toBe(false)
    })

    it('should handle positive values outside range', async () => {
      const result = await upsertVoteAction('user-123', 'statement-456', 3)
      expect(result.success).toBe(false)
    })
  })
})