import { describe, it, expect, beforeEach, vi } from 'vitest'
import { PollService } from '@/lib/services/poll-service'
import { db } from '@/db/db'
import { polls, userRoles } from '@/db/schema'
import { createMockPoll, TEST_USER_ID } from '../../utils/test-helpers'
import { generateUniqueSlug } from '@/lib/utils/slug'

// Mock the database
vi.mock('@/db/db', () => ({
  db: {
    insert: vi.fn(),
    select: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}))

// Mock slug generation
vi.mock('@/lib/utils/slug', () => ({
  generateUniqueSlug: vi.fn(),
}))

describe('PollService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(generateUniqueSlug).mockReturnValue('test-poll-slug')
  })

  describe('createPoll', () => {
    it('should create a new poll with generated slug', async () => {
      const mockPoll = createMockPoll({ slug: 'test-poll-slug' })
      const pollData = {
        question: 'Test Poll Question',
        description: 'Test description',
        allowUserStatements: false,
        autoApproveStatements: false,
        minStatementsVotedToEnd: 5,
      }

      // Mock getAllSlugs
      const mockSelectSlugs = {
        from: vi.fn().mockReturnThis(),
        select: vi.fn().mockResolvedValue([]),
      }
      vi.mocked(db.select).mockReturnValue(mockSelectSlugs as any)

      // Mock poll insertion
      const mockInsertPoll = {
        values: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([mockPoll]),
      }
      vi.mocked(db.insert).mockReturnValueOnce(mockInsertPoll as any)

      // Mock user role insertion
      const mockInsertRole = {
        values: vi.fn().mockReturnThis(),
      }
      vi.mocked(db.insert).mockReturnValueOnce(mockInsertRole as any)

      const result = await PollService.createPoll(pollData, TEST_USER_ID)

      expect(generateUniqueSlug).toHaveBeenCalledWith('Test Poll Question', [])
      expect(db.insert).toHaveBeenCalledWith(polls)
      expect(mockInsertPoll.values).toHaveBeenCalledWith({
        ...pollData,
        slug: 'test-poll-slug',
        createdBy: TEST_USER_ID,
      })
      expect(db.insert).toHaveBeenCalledWith(userRoles)
      expect(mockInsertRole.values).toHaveBeenCalledWith({
        userId: TEST_USER_ID,
        role: 'poll_owner',
        pollId: mockPoll.id,
      })
      expect(result).toEqual(mockPoll)
    })

    it('should validate poll data before creation', async () => {
      const invalidData = {
        question: '', // Invalid: empty question
        description: 'Test description',
      }

      await expect(
        PollService.createPoll(invalidData as any, TEST_USER_ID)
      ).rejects.toThrow()
    })
  })

  describe('updatePoll', () => {
    it('should update existing poll', async () => {
      const mockPoll = createMockPoll({ question: 'Updated Question' })
      const updateData = {
        id: mockPoll.id,
        question: 'Updated Question',
        description: 'Updated description',
      }

      const mockUpdate = {
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([mockPoll]),
      }
      vi.mocked(db.update).mockReturnValue(mockUpdate as any)

      const result = await PollService.updatePoll(updateData)

      expect(db.update).toHaveBeenCalledWith(polls)
      expect(mockUpdate.set).toHaveBeenCalledWith({
        question: 'Updated Question',
        description: 'Updated description',
      })
      expect(result).toEqual(mockPoll)
    })

    it('should throw error if poll not found', async () => {
      const updateData = {
        id: 'nonexistent-id',
        question: 'Updated Question',
      }

      const mockUpdate = {
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([]),
      }
      vi.mocked(db.update).mockReturnValue(mockUpdate as any)

      await expect(PollService.updatePoll(updateData)).rejects.toThrow('Poll not found')
    })
  })

  describe('findById', () => {
    it('should find poll by ID', async () => {
      const mockPoll = createMockPoll()
      const mockSelect = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([mockPoll]),
      }
      vi.mocked(db.select).mockReturnValue(mockSelect as any)

      const result = await PollService.findById(mockPoll.id)

      expect(db.select).toHaveBeenCalled()
      expect(mockSelect.from).toHaveBeenCalledWith(polls)
      expect(result).toEqual(mockPoll)
    })

    it('should return null if poll not found', async () => {
      const mockSelect = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([]),
      }
      vi.mocked(db.select).mockReturnValue(mockSelect as any)

      const result = await PollService.findById('nonexistent-id')

      expect(result).toBeNull()
    })
  })

  describe('findBySlug', () => {
    it('should find poll by slug', async () => {
      const mockPoll = createMockPoll({ slug: 'test-slug' })
      const mockSelect = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([mockPoll]),
      }
      vi.mocked(db.select).mockReturnValue(mockSelect as any)

      const result = await PollService.findBySlug('test-slug')

      expect(result).toEqual(mockPoll)
    })
  })

  describe('publishPoll', () => {
    it('should publish draft poll', async () => {
      const mockPoll = createMockPoll({ status: 'published' })
      const publishData = {
        id: mockPoll.id,
        startTime: new Date(),
        endTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      }

      const mockUpdate = {
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([mockPoll]),
      }
      vi.mocked(db.update).mockReturnValue(mockUpdate as any)

      const result = await PollService.publishPoll(publishData)

      expect(mockUpdate.set).toHaveBeenCalledWith({
        status: 'published',
        startTime: publishData.startTime,
        endTime: publishData.endTime,
      })
      expect(result).toEqual(mockPoll)
    })
  })

  describe('deletePoll', () => {
    it('should delete poll by ID', async () => {
      const mockDelete = {
        where: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([createMockPoll()]),
      }
      vi.mocked(db.delete).mockReturnValue(mockDelete as any)

      const result = await PollService.deletePoll('test-id')

      expect(db.delete).toHaveBeenCalledWith(polls)
      expect(result).toBe(true)
    })

    it('should return false if poll not found', async () => {
      const mockDelete = {
        where: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([]),
      }
      vi.mocked(db.delete).mockReturnValue(mockDelete as any)

      const result = await PollService.deletePoll('nonexistent-id')

      expect(result).toBe(false)
    })
  })

  describe('searchPolls', () => {
    it('should search polls with filters', async () => {
      const mockPolls = [createMockPoll(), createMockPoll({ id: 'poll-2' })]
      const searchParams = {
        search: 'test',
        status: 'published' as const,
        limit: 20,
        offset: 0,
      }

      const mockSelect = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        offset: vi.fn().mockResolvedValue(mockPolls),
      }
      vi.mocked(db.select).mockReturnValue(mockSelect as any)

      const result = await PollService.searchPolls(searchParams)

      expect(db.select).toHaveBeenCalled()
      expect(result).toEqual(mockPolls)
    })
  })

  describe('getPollStatistics', () => {
    it('should calculate poll statistics', async () => {
      const pollId = 'test-poll-id'
      const mockStats = {
        totalStatements: 5,
        totalVotes: 100,
        totalParticipants: 25,
        statementStats: [],
      }

      // Mock the complex query
      const mockSelect = {
        from: vi.fn().mockReturnThis(),
        leftJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        groupBy: vi.fn().mockReturnThis(),
        select: vi.fn().mockResolvedValue([
          { totalStatements: 5, totalVotes: 100, totalParticipants: 25 }
        ]),
      }
      vi.mocked(db.select).mockReturnValue(mockSelect as any)

      const result = await PollService.getPollStatistics(pollId)

      expect(result).toMatchObject({
        totalStatements: expect.any(Number),
        totalVotes: expect.any(Number),
        totalParticipants: expect.any(Number),
      })
    })
  })
})