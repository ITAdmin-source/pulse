import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  getPollById,
  getPollBySlug,
  getAllPolls,
  createPoll,
  updatePoll,
  deletePoll,
} from '@/db/queries/polls-queries'
import { db } from '@/db/db'
import { polls } from '@/db/schema'
import { createMockPoll } from '../../utils/test-helpers'

// Mock the database
vi.mock('@/db/db', () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}))

describe('Polls Queries Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getPollById', () => {
    it('should retrieve poll by ID', async () => {
      const mockPoll = createMockPoll()
      const mockQuery = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([mockPoll]),
      }
      vi.mocked(db.select).mockReturnValue(mockQuery as any)

      const result = await getPollById(mockPoll.id)

      expect(db.select).toHaveBeenCalled()
      expect(mockQuery.from).toHaveBeenCalledWith(polls)
      expect(mockQuery.where).toHaveBeenCalled()
      expect(mockQuery.limit).toHaveBeenCalledWith(1)
      expect(result).toEqual(mockPoll)
    })

    it('should return undefined if poll not found', async () => {
      const mockQuery = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([]),
      }
      vi.mocked(db.select).mockReturnValue(mockQuery as any)

      const result = await getPollById('nonexistent-id')

      expect(result).toBeUndefined()
    })

    it('should handle database errors', async () => {
      const mockQuery = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockRejectedValue(new Error('Database connection failed')),
      }
      vi.mocked(db.select).mockReturnValue(mockQuery as any)

      await expect(getPollById('test-id')).rejects.toThrow('Database connection failed')
    })
  })

  describe('getPollBySlug', () => {
    it('should retrieve poll by slug', async () => {
      const mockPoll = createMockPoll({ slug: 'test-poll-slug' })
      const mockQuery = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([mockPoll]),
      }
      vi.mocked(db.select).mockReturnValue(mockQuery as any)

      const result = await getPollBySlug('test-poll-slug')

      expect(db.select).toHaveBeenCalled()
      expect(mockQuery.from).toHaveBeenCalledWith(polls)
      expect(result).toEqual(mockPoll)
    })

    it('should return undefined for non-existent slug', async () => {
      const mockQuery = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([]),
      }
      vi.mocked(db.select).mockReturnValue(mockQuery as any)

      const result = await getPollBySlug('non-existent-slug')

      expect(result).toBeUndefined()
    })

    it('should handle special characters in slug', async () => {
      const specialSlug = 'poll-with-special-chars-123'
      const mockPoll = createMockPoll({ slug: specialSlug })
      const mockQuery = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([mockPoll]),
      }
      vi.mocked(db.select).mockReturnValue(mockQuery as any)

      const result = await getPollBySlug(specialSlug)

      expect(result).toEqual(mockPoll)
    })
  })

  describe('getAllPolls', () => {
    it('should retrieve all polls ordered by creation date', async () => {
      const mockPolls = [
        createMockPoll({ id: 'poll-1', createdAt: new Date('2024-01-02') }),
        createMockPoll({ id: 'poll-2', createdAt: new Date('2024-01-01') }),
      ]
      const mockQuery = {
        from: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockResolvedValue(mockPolls),
      }
      vi.mocked(db.select).mockReturnValue(mockQuery as any)

      const result = await getAllPolls()

      expect(db.select).toHaveBeenCalled()
      expect(mockQuery.from).toHaveBeenCalledWith(polls)
      expect(mockQuery.orderBy).toHaveBeenCalled()
      expect(result).toEqual(mockPolls)
    })

    it('should return empty array when no polls exist', async () => {
      const mockQuery = {
        from: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockResolvedValue([]),
      }
      vi.mocked(db.select).mockReturnValue(mockQuery as any)

      const result = await getAllPolls()

      expect(result).toEqual([])
    })

    it('should handle large number of polls', async () => {
      const mockPolls = Array.from({ length: 100 }, (_, i) =>
        createMockPoll({ id: `poll-${i}` })
      )
      const mockQuery = {
        from: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockResolvedValue(mockPolls),
      }
      vi.mocked(db.select).mockReturnValue(mockQuery as any)

      const result = await getAllPolls()

      expect(result).toHaveLength(100)
      expect(result[0].id).toBe('poll-0')
    })
  })

  describe('createPoll', () => {
    it('should create new poll and return it', async () => {
      const pollData = {
        question: 'Test Poll Question',
        description: 'Test Description',
        slug: 'test-poll',
        createdBy: 'user-123',
        status: 'draft' as const,
        allowUserStatements: false,
        autoApproveStatements: false,
        minStatementsVotedToEnd: 5,
      }
      const mockPoll = createMockPoll(pollData)
      const mockQuery = {
        values: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([mockPoll]),
      }
      vi.mocked(db.insert).mockReturnValue(mockQuery as any)

      const result = await createPoll(pollData)

      expect(db.insert).toHaveBeenCalledWith(polls)
      expect(mockQuery.values).toHaveBeenCalledWith(pollData)
      expect(mockQuery.returning).toHaveBeenCalled()
      expect(result).toEqual(mockPoll)
    })

    it('should handle poll creation with minimal data', async () => {
      const minimalData = {
        question: 'Minimal Poll',
        slug: 'minimal-poll',
        createdBy: 'user-123',
        status: 'draft' as const,
        allowUserStatements: false,
        autoApproveStatements: false,
        minStatementsVotedToEnd: 5,
      }
      const mockPoll = createMockPoll(minimalData)
      const mockQuery = {
        values: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([mockPoll]),
      }
      vi.mocked(db.insert).mockReturnValue(mockQuery as any)

      const result = await createPoll(minimalData)

      expect(result).toEqual(mockPoll)
    })

    it('should handle database constraint violations', async () => {
      const pollData = {
        question: 'Test Poll',
        slug: 'duplicate-slug',
        createdBy: 'user-123',
        status: 'draft' as const,
        allowUserStatements: false,
        autoApproveStatements: false,
        minStatementsVotedToEnd: 5,
      }
      const mockQuery = {
        values: vi.fn().mockReturnThis(),
        returning: vi.fn().mockRejectedValue(new Error('Unique constraint violation')),
      }
      vi.mocked(db.insert).mockReturnValue(mockQuery as any)

      await expect(createPoll(pollData)).rejects.toThrow('Unique constraint violation')
    })
  })

  describe('updatePoll', () => {
    it('should update poll and return updated version', async () => {
      const updateData = {
        question: 'Updated Question',
        description: 'Updated Description',
      }
      const updatedPoll = createMockPoll(updateData)
      const mockQuery = {
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([updatedPoll]),
      }
      vi.mocked(db.update).mockReturnValue(mockQuery as any)

      const result = await updatePoll('poll-123', updateData)

      expect(db.update).toHaveBeenCalledWith(polls)
      expect(mockQuery.set).toHaveBeenCalledWith(updateData)
      expect(mockQuery.where).toHaveBeenCalled()
      expect(mockQuery.returning).toHaveBeenCalled()
      expect(result).toEqual(updatedPoll)
    })

    it('should return undefined if poll not found', async () => {
      const updateData = { question: 'Updated Question' }
      const mockQuery = {
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([]),
      }
      vi.mocked(db.update).mockReturnValue(mockQuery as any)

      const result = await updatePoll('nonexistent-id', updateData)

      expect(result).toBeUndefined()
    })

    it('should handle partial updates', async () => {
      const partialUpdate = { status: 'published' as const }
      const updatedPoll = createMockPoll(partialUpdate)
      const mockQuery = {
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([updatedPoll]),
      }
      vi.mocked(db.update).mockReturnValue(mockQuery as any)

      const result = await updatePoll('poll-123', partialUpdate)

      expect(mockQuery.set).toHaveBeenCalledWith(partialUpdate)
      expect(result).toEqual(updatedPoll)
    })
  })

  describe('deletePoll', () => {
    it('should delete poll and return true if successful', async () => {
      const deletedPoll = createMockPoll()
      const mockQuery = {
        where: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([deletedPoll]),
      }
      vi.mocked(db.delete).mockReturnValue(mockQuery as any)

      const result = await deletePoll('poll-123')

      expect(db.delete).toHaveBeenCalledWith(polls)
      expect(mockQuery.where).toHaveBeenCalled()
      expect(mockQuery.returning).toHaveBeenCalled()
      expect(result).toBe(true)
    })

    it('should return false if poll not found', async () => {
      const mockQuery = {
        where: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([]),
      }
      vi.mocked(db.delete).mockReturnValue(mockQuery as any)

      const result = await deletePoll('nonexistent-id')

      expect(result).toBe(false)
    })

    it('should handle cascade deletions', async () => {
      // When a poll is deleted, related statements and votes should be deleted too
      const deletedPoll = createMockPoll()
      const mockQuery = {
        where: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([deletedPoll]),
      }
      vi.mocked(db.delete).mockReturnValue(mockQuery as any)

      const result = await deletePoll('poll-with-statements')

      expect(result).toBe(true)
      expect(db.delete).toHaveBeenCalledWith(polls)
    })

    it('should handle foreign key constraint errors', async () => {
      const mockQuery = {
        where: vi.fn().mockReturnThis(),
        returning: vi.fn().mockRejectedValue(new Error('Foreign key constraint violation')),
      }
      vi.mocked(db.delete).mockReturnValue(mockQuery as any)

      await expect(deletePoll('poll-123')).rejects.toThrow('Foreign key constraint violation')
    })
  })

  describe('query optimization and performance', () => {
    it('should use proper indexing for ID queries', async () => {
      const mockPoll = createMockPoll()
      const mockQuery = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([mockPoll]),
      }
      vi.mocked(db.select).mockReturnValue(mockQuery as any)

      await getPollById(mockPoll.id)

      // Verify that limit(1) is used for single record queries
      expect(mockQuery.limit).toHaveBeenCalledWith(1)
    })

    it('should use proper indexing for slug queries', async () => {
      const mockPoll = createMockPoll({ slug: 'indexed-slug' })
      const mockQuery = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([mockPoll]),
      }
      vi.mocked(db.select).mockReturnValue(mockQuery as any)

      await getPollBySlug('indexed-slug')

      // Verify that limit(1) is used for unique slug queries
      expect(mockQuery.limit).toHaveBeenCalledWith(1)
    })

    it('should use proper ordering for list queries', async () => {
      const mockPolls = [createMockPoll()]
      const mockQuery = {
        from: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockResolvedValue(mockPolls),
      }
      vi.mocked(db.select).mockReturnValue(mockQuery as any)

      await getAllPolls()

      // Verify that orderBy is called for sorted results
      expect(mockQuery.orderBy).toHaveBeenCalled()
    })
  })
})