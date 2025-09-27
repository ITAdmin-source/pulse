import { describe, it, expect, beforeEach, vi } from 'vitest'
import { revalidatePath } from 'next/cache'
import {
  createPollAction,
  updatePollAction,
  deletePollAction,
  publishPollAction,
  unpublishPollAction,
  getPollsAction,
  getPollByIdAction,
  getPollBySlugAction,
  getPollsByStatusAction,
  getPollsByCreatorAction,
  getPublishedPollsAction,
  getActivePollsAction,
} from '@/actions/polls-actions'
import * as pollsQueries from '@/db/queries/polls-queries'
import { createMockPoll } from '../../utils/test-helpers'

// Mock Next.js revalidatePath
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

// Mock all polls queries
vi.mock('@/db/queries/polls-queries', () => ({
  createPoll: vi.fn(),
  updatePoll: vi.fn(),
  deletePoll: vi.fn(),
  publishPoll: vi.fn(),
  unpublishPoll: vi.fn(),
  getAllPolls: vi.fn(),
  getPollById: vi.fn(),
  getPollBySlug: vi.fn(),
  getPollsByStatus: vi.fn(),
  getPollsByCreator: vi.fn(),
  getPublishedPolls: vi.fn(),
  getActivePolls: vi.fn(),
}))

describe('Polls Actions Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('createPollAction', () => {
    it('should create poll and return success', async () => {
      const pollData = {
        question: 'Test Poll',
        slug: 'test-poll',
        createdBy: 'user-123',
        status: 'draft' as const,
        allowUserStatements: false,
        autoApproveStatements: false,
        minStatementsVotedToEnd: 5,
      }
      const mockPoll = createMockPoll(pollData)
      vi.mocked(pollsQueries.createPoll).mockResolvedValue(mockPoll)

      const result = await createPollAction(pollData)

      expect(pollsQueries.createPoll).toHaveBeenCalledWith(pollData)
      expect(revalidatePath).toHaveBeenCalledWith('/polls')
      expect(revalidatePath).toHaveBeenCalledWith('/admin/polls')
      expect(result).toEqual({ success: true, data: mockPoll })
    })

    it('should handle database errors', async () => {
      const pollData = {
        question: 'Test Poll',
        slug: 'test-poll',
        createdBy: 'user-123',
        status: 'draft' as const,
        allowUserStatements: false,
        autoApproveStatements: false,
        minStatementsVotedToEnd: 5,
      }
      vi.mocked(pollsQueries.createPoll).mockRejectedValue(new Error('Database error'))

      const result = await createPollAction(pollData)

      expect(result).toEqual({ success: false, error: 'Failed to create poll' })
      expect(revalidatePath).not.toHaveBeenCalled()
    })
  })

  describe('updatePollAction', () => {
    it('should update poll and revalidate paths', async () => {
      const updateData = { question: 'Updated Question' }
      const mockPoll = createMockPoll({ ...updateData, slug: 'test-poll' })
      vi.mocked(pollsQueries.updatePoll).mockResolvedValue(mockPoll)

      const result = await updatePollAction('poll-123', updateData)

      expect(pollsQueries.updatePoll).toHaveBeenCalledWith('poll-123', updateData)
      expect(revalidatePath).toHaveBeenCalledWith('/polls')
      expect(revalidatePath).toHaveBeenCalledWith('/admin/polls')
      expect(revalidatePath).toHaveBeenCalledWith('/polls/test-poll')
      expect(result).toEqual({ success: true, data: mockPoll })
    })

    it('should handle poll not found', async () => {
      vi.mocked(pollsQueries.updatePoll).mockResolvedValue(undefined)

      const result = await updatePollAction('nonexistent-id', { question: 'Test' })

      expect(result).toEqual({ success: false, error: 'Poll not found' })
      expect(revalidatePath).not.toHaveBeenCalled()
    })

    it('should handle database errors', async () => {
      vi.mocked(pollsQueries.updatePoll).mockRejectedValue(new Error('Database error'))

      const result = await updatePollAction('poll-123', { question: 'Test' })

      expect(result).toEqual({ success: false, error: 'Failed to update poll' })
    })
  })

  describe('deletePollAction', () => {
    it('should delete poll successfully', async () => {
      vi.mocked(pollsQueries.deletePoll).mockResolvedValue(true)

      const result = await deletePollAction('poll-123')

      expect(pollsQueries.deletePoll).toHaveBeenCalledWith('poll-123')
      expect(revalidatePath).toHaveBeenCalledWith('/polls')
      expect(revalidatePath).toHaveBeenCalledWith('/admin/polls')
      expect(result).toEqual({ success: true })
    })

    it('should handle poll not found', async () => {
      vi.mocked(pollsQueries.deletePoll).mockResolvedValue(false)

      const result = await deletePollAction('nonexistent-id')

      expect(result).toEqual({ success: false, error: 'Poll not found' })
      expect(revalidatePath).not.toHaveBeenCalled()
    })

    it('should handle database errors', async () => {
      vi.mocked(pollsQueries.deletePoll).mockRejectedValue(new Error('Database error'))

      const result = await deletePollAction('poll-123')

      expect(result).toEqual({ success: false, error: 'Failed to delete poll' })
    })
  })

  describe('publishPollAction', () => {
    it('should publish poll and revalidate paths', async () => {
      const mockPoll = createMockPoll({ status: 'published', slug: 'test-poll' })
      vi.mocked(pollsQueries.publishPoll).mockResolvedValue(mockPoll)

      const result = await publishPollAction('poll-123')

      expect(pollsQueries.publishPoll).toHaveBeenCalledWith('poll-123')
      expect(revalidatePath).toHaveBeenCalledWith('/polls')
      expect(revalidatePath).toHaveBeenCalledWith('/admin/polls')
      expect(revalidatePath).toHaveBeenCalledWith('/polls/test-poll')
      expect(result).toEqual({ success: true, data: mockPoll })
    })

    it('should handle poll not found', async () => {
      vi.mocked(pollsQueries.publishPoll).mockResolvedValue(undefined)

      const result = await publishPollAction('nonexistent-id')

      expect(result).toEqual({ success: false, error: 'Poll not found' })
    })
  })

  describe('unpublishPollAction', () => {
    it('should unpublish poll and revalidate paths', async () => {
      const mockPoll = createMockPoll({ status: 'draft', slug: 'test-poll' })
      vi.mocked(pollsQueries.unpublishPoll).mockResolvedValue(mockPoll)

      const result = await unpublishPollAction('poll-123')

      expect(pollsQueries.unpublishPoll).toHaveBeenCalledWith('poll-123')
      expect(revalidatePath).toHaveBeenCalledWith('/polls')
      expect(revalidatePath).toHaveBeenCalledWith('/admin/polls')
      expect(revalidatePath).toHaveBeenCalledWith('/polls/test-poll')
      expect(result).toEqual({ success: true, data: mockPoll })
    })
  })

  describe('getPollsAction', () => {
    it('should fetch all polls successfully', async () => {
      const mockPolls = [createMockPoll(), createMockPoll({ id: 'poll-2' })]
      vi.mocked(pollsQueries.getAllPolls).mockResolvedValue(mockPolls)

      const result = await getPollsAction()

      expect(pollsQueries.getAllPolls).toHaveBeenCalled()
      expect(result).toEqual({ success: true, data: mockPolls })
    })

    it('should handle database errors', async () => {
      vi.mocked(pollsQueries.getAllPolls).mockRejectedValue(new Error('Database error'))

      const result = await getPollsAction()

      expect(result).toEqual({ success: false, error: 'Failed to fetch polls' })
    })
  })

  describe('getPollByIdAction', () => {
    it('should fetch poll by ID successfully', async () => {
      const mockPoll = createMockPoll()
      vi.mocked(pollsQueries.getPollById).mockResolvedValue(mockPoll)

      const result = await getPollByIdAction('poll-123')

      expect(pollsQueries.getPollById).toHaveBeenCalledWith('poll-123')
      expect(result).toEqual({ success: true, data: mockPoll })
    })

    it('should handle poll not found', async () => {
      vi.mocked(pollsQueries.getPollById).mockResolvedValue(undefined)

      const result = await getPollByIdAction('nonexistent-id')

      expect(result).toEqual({ success: false, error: 'Poll not found' })
    })

    it('should handle database errors', async () => {
      vi.mocked(pollsQueries.getPollById).mockRejectedValue(new Error('Database error'))

      const result = await getPollByIdAction('poll-123')

      expect(result).toEqual({ success: false, error: 'Failed to fetch poll' })
    })
  })

  describe('getPollBySlugAction', () => {
    it('should fetch poll by slug successfully', async () => {
      const mockPoll = createMockPoll({ slug: 'test-poll' })
      vi.mocked(pollsQueries.getPollBySlug).mockResolvedValue(mockPoll)

      const result = await getPollBySlugAction('test-poll')

      expect(pollsQueries.getPollBySlug).toHaveBeenCalledWith('test-poll')
      expect(result).toEqual({ success: true, data: mockPoll })
    })

    it('should handle poll not found', async () => {
      vi.mocked(pollsQueries.getPollBySlug).mockResolvedValue(undefined)

      const result = await getPollBySlugAction('nonexistent-slug')

      expect(result).toEqual({ success: false, error: 'Poll not found' })
    })
  })

  describe('getPollsByStatusAction', () => {
    it('should fetch polls by status successfully', async () => {
      const mockPolls = [createMockPoll({ status: 'published' })]
      vi.mocked(pollsQueries.getPollsByStatus).mockResolvedValue(mockPolls)

      const result = await getPollsByStatusAction('published')

      expect(pollsQueries.getPollsByStatus).toHaveBeenCalledWith('published')
      expect(result).toEqual({ success: true, data: mockPolls })
    })

    it('should handle database errors', async () => {
      vi.mocked(pollsQueries.getPollsByStatus).mockRejectedValue(new Error('Database error'))

      const result = await getPollsByStatusAction('draft')

      expect(result).toEqual({ success: false, error: 'Failed to fetch polls' })
    })
  })

  describe('getPollsByCreatorAction', () => {
    it('should fetch polls by creator successfully', async () => {
      const mockPolls = [createMockPoll({ createdBy: 'user-123' })]
      vi.mocked(pollsQueries.getPollsByCreator).mockResolvedValue(mockPolls)

      const result = await getPollsByCreatorAction('user-123')

      expect(pollsQueries.getPollsByCreator).toHaveBeenCalledWith('user-123')
      expect(result).toEqual({ success: true, data: mockPolls })
    })
  })

  describe('getPublishedPollsAction', () => {
    it('should fetch published polls successfully', async () => {
      const mockPolls = [createMockPoll({ status: 'published' })]
      vi.mocked(pollsQueries.getPublishedPolls).mockResolvedValue(mockPolls)

      const result = await getPublishedPollsAction()

      expect(pollsQueries.getPublishedPolls).toHaveBeenCalled()
      expect(result).toEqual({ success: true, data: mockPolls })
    })
  })

  describe('getActivePollsAction', () => {
    it('should fetch active polls successfully', async () => {
      const mockPolls = [createMockPoll({ status: 'published' })]
      vi.mocked(pollsQueries.getActivePolls).mockResolvedValue(mockPolls)

      const result = await getActivePollsAction()

      expect(pollsQueries.getActivePolls).toHaveBeenCalled()
      expect(result).toEqual({ success: true, data: mockPolls })
    })
  })

  describe('error handling patterns', () => {
    it('should log errors to console', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      vi.mocked(pollsQueries.createPoll).mockRejectedValue(new Error('Test error'))

      await createPollAction({
        question: 'Test Poll',
        slug: 'test-poll',
        createdBy: 'user-123',
        status: 'draft',
        allowUserStatements: false,
        autoApproveStatements: false,
        minStatementsVotedToEnd: 5,
      })

      expect(consoleSpy).toHaveBeenCalledWith('Error creating poll:', expect.any(Error))
      consoleSpy.mockRestore()
    })

    it('should not revalidate paths on errors', async () => {
      vi.mocked(pollsQueries.updatePoll).mockRejectedValue(new Error('Database error'))

      await updatePollAction('poll-123', { question: 'Test' })

      expect(revalidatePath).not.toHaveBeenCalled()
    })
  })

  describe('revalidation patterns', () => {
    it('should revalidate correct paths for poll modifications', async () => {
      const mockPoll = createMockPoll({ slug: 'test-poll-slug' })
      vi.mocked(pollsQueries.updatePoll).mockResolvedValue(mockPoll)

      await updatePollAction('poll-123', { question: 'Updated' })

      expect(revalidatePath).toHaveBeenCalledWith('/polls')
      expect(revalidatePath).toHaveBeenCalledWith('/admin/polls')
      expect(revalidatePath).toHaveBeenCalledWith('/polls/test-poll-slug')
    })

    it('should revalidate only general paths for read operations', async () => {
      const mockPolls = [createMockPoll()]
      vi.mocked(pollsQueries.getAllPolls).mockResolvedValue(mockPolls)

      await getPollsAction()

      // Read operations should not trigger revalidation
      expect(revalidatePath).not.toHaveBeenCalled()
    })
  })
})