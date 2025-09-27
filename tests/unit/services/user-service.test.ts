import { describe, it, expect, beforeEach, vi } from 'vitest'
import { UserService } from '@/lib/services/user-service'
import { db } from '@/db/db'
import { users } from '@/db/schema'
import { createMockUser, TEST_CLERK_USER_ID, TEST_SESSION_ID } from '../../utils/test-helpers'

// Mock the database
vi.mock('@/db/db', () => ({
  db: {
    insert: vi.fn(),
    select: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}))

describe('UserService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('createUser', () => {
    it('should create a new user with clerk ID', async () => {
      const mockUser = createMockUser({ clerkUserId: TEST_CLERK_USER_ID })
      const mockInsert = {
        values: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([mockUser]),
      }
      vi.mocked(db.insert).mockReturnValue(mockInsert)

      const result = await UserService.createUser({ clerkUserId: TEST_CLERK_USER_ID })

      expect(db.insert).toHaveBeenCalledWith(users)
      expect(mockInsert.values).toHaveBeenCalledWith({
        clerkUserId: TEST_CLERK_USER_ID,
        sessionId: undefined,
        metadata: undefined,
      })
      expect(result).toEqual(mockUser)
    })

    it('should create a new anonymous user with session ID', async () => {
      const mockUser = createMockUser({ sessionId: TEST_SESSION_ID, clerkUserId: null })
      const mockInsert = {
        values: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([mockUser]),
      }
      vi.mocked(db.insert).mockReturnValue(mockInsert as any)

      const result = await UserService.createUser({ sessionId: TEST_SESSION_ID })

      expect(db.insert).toHaveBeenCalledWith(users)
      expect(mockInsert.values).toHaveBeenCalledWith({
        clerkUserId: undefined,
        sessionId: TEST_SESSION_ID,
        metadata: undefined,
      })
      expect(result).toEqual(mockUser)
    })
  })

  describe('findByClerkId', () => {
    it('should find a user by clerk ID', async () => {
      const mockUser = createMockUser({ clerkUserId: TEST_CLERK_USER_ID })
      const mockSelect = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([mockUser]),
      }
      vi.mocked(db.select).mockReturnValue(mockSelect as any)

      const result = await UserService.findByClerkId(TEST_CLERK_USER_ID)

      expect(db.select).toHaveBeenCalled()
      expect(mockSelect.from).toHaveBeenCalledWith(users)
      expect(mockSelect.where).toHaveBeenCalled()
      expect(mockSelect.limit).toHaveBeenCalledWith(1)
      expect(result).toEqual(mockUser)
    })

    it('should return null if user not found', async () => {
      const mockSelect = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([]),
      }
      vi.mocked(db.select).mockReturnValue(mockSelect as any)

      const result = await UserService.findByClerkId('nonexistent')

      expect(result).toBeNull()
    })
  })

  describe('findBySessionId', () => {
    it('should find a user by session ID', async () => {
      const mockUser = createMockUser({ sessionId: TEST_SESSION_ID, clerkUserId: null })
      const mockSelect = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([mockUser]),
      }
      vi.mocked(db.select).mockReturnValue(mockSelect as any)

      const result = await UserService.findBySessionId(TEST_SESSION_ID)

      expect(db.select).toHaveBeenCalled()
      expect(mockSelect.from).toHaveBeenCalledWith(users)
      expect(mockSelect.where).toHaveBeenCalled()
      expect(mockSelect.limit).toHaveBeenCalledWith(1)
      expect(result).toEqual(mockUser)
    })
  })

  describe('upgradeAnonymousUser', () => {
    it('should upgrade an anonymous user to authenticated', async () => {
      const anonymousUser = createMockUser({ sessionId: TEST_SESSION_ID, clerkUserId: null })
      const upgradedUser = createMockUser({ clerkUserId: TEST_CLERK_USER_ID, sessionId: null })

      // Mock findBySessionId
      const mockSelectSession = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([anonymousUser]),
      }

      // Mock findByClerkId (no existing user)
      const mockSelectClerk = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([]),
      }

      // Mock update
      const mockUpdate = {
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([upgradedUser]),
      }

      vi.mocked(db.select)
        .mockReturnValueOnce(mockSelectSession as any)
        .mockReturnValueOnce(mockSelectClerk as any)
      vi.mocked(db.update).mockReturnValue(mockUpdate as any)

      const result = await UserService.upgradeAnonymousUser({
        sessionId: TEST_SESSION_ID,
        clerkUserId: TEST_CLERK_USER_ID,
      })

      expect(db.update).toHaveBeenCalledWith(users)
      expect(mockUpdate.set).toHaveBeenCalledWith({
        clerkUserId: TEST_CLERK_USER_ID,
        sessionId: null,
        upgradedAt: expect.any(Date),
      })
      expect(result).toEqual(upgradedUser)
    })

    it('should throw error if anonymous user not found', async () => {
      const mockSelect = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([]),
      }
      vi.mocked(db.select).mockReturnValue(mockSelect as any)

      await expect(
        UserService.upgradeAnonymousUser({
          sessionId: 'nonexistent',
          clerkUserId: TEST_CLERK_USER_ID,
        })
      ).rejects.toThrow('Anonymous user not found')
    })

    it('should throw error if clerk user already exists', async () => {
      const anonymousUser = createMockUser({ sessionId: TEST_SESSION_ID, clerkUserId: null })
      const existingClerkUser = createMockUser({ clerkUserId: TEST_CLERK_USER_ID })

      // Mock findBySessionId
      const mockSelectSession = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([anonymousUser]),
      }

      // Mock findByClerkId (existing user)
      const mockSelectClerk = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([existingClerkUser]),
      }

      vi.mocked(db.select)
        .mockReturnValueOnce(mockSelectSession as any)
        .mockReturnValueOnce(mockSelectClerk as any)

      await expect(
        UserService.upgradeAnonymousUser({
          sessionId: TEST_SESSION_ID,
          clerkUserId: TEST_CLERK_USER_ID,
        })
      ).rejects.toThrow('User with this Clerk ID already exists')
    })
  })

  describe('getOrCreateAnonymousUser', () => {
    it('should return existing anonymous user if found', async () => {
      const existingUser = createMockUser({ sessionId: TEST_SESSION_ID, clerkUserId: null })
      const mockSelect = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([existingUser]),
      }
      vi.mocked(db.select).mockReturnValue(mockSelect as any)

      const result = await UserService.getOrCreateAnonymousUser(TEST_SESSION_ID)

      expect(result).toEqual(existingUser)
      expect(db.insert).not.toHaveBeenCalled()
    })

    it('should create new anonymous user if not found', async () => {
      const newUser = createMockUser({ sessionId: TEST_SESSION_ID, clerkUserId: null })

      // Mock findBySessionId (not found)
      const mockSelect = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([]),
      }
      vi.mocked(db.select).mockReturnValue(mockSelect as any)

      // Mock createUser
      const mockInsert = {
        values: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([newUser]),
      }
      vi.mocked(db.insert).mockReturnValue(mockInsert as any)

      const result = await UserService.getOrCreateAnonymousUser(TEST_SESSION_ID)

      expect(db.insert).toHaveBeenCalledWith(users)
      expect(result).toEqual(newUser)
    })
  })
})