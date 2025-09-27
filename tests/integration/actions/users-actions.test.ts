import { describe, it, expect, beforeEach, vi } from 'vitest'
import { revalidatePath } from 'next/cache'
import {
  createUserAction,
  updateUserAction,
  deleteUserAction,
  getUsersAction,
  getUserByIdAction,
  getUserByClerkIdAction,
  getUserBySessionIdAction,
  upgradeUserAction,
} from '@/actions/users-actions'
import * as usersQueries from '@/db/queries/users-queries'
import { createMockUser } from '../../utils/test-helpers'

// Mock Next.js revalidatePath
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

// Mock all users queries
vi.mock('@/db/queries/users-queries', () => ({
  createUser: vi.fn(),
  updateUser: vi.fn(),
  deleteUser: vi.fn(),
  getAllUsers: vi.fn(),
  getUserById: vi.fn(),
  getUserByClerkId: vi.fn(),
  getUserBySessionId: vi.fn(),
  upgradeUser: vi.fn(),
}))

describe('Users Actions Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('createUserAction', () => {
    it('should create user and revalidate users path', async () => {
      const userData = {
        sessionId: 'session-123',
        clerkUserId: null,
        isAnonymous: true,
      }
      const mockUser = createMockUser(userData)
      vi.mocked(usersQueries.createUser).mockResolvedValue(mockUser)

      const result = await createUserAction(userData)

      expect(usersQueries.createUser).toHaveBeenCalledWith(userData)
      expect(revalidatePath).toHaveBeenCalledWith('/users')
      expect(result).toEqual({ success: true, data: mockUser })
    })

    it('should handle database errors', async () => {
      const userData = {
        sessionId: 'session-123',
        clerkUserId: null,
        isAnonymous: true,
      }
      vi.mocked(usersQueries.createUser).mockRejectedValue(new Error('Database error'))

      const result = await createUserAction(userData)

      expect(result).toEqual({ success: false, error: 'Failed to create user' })
      expect(revalidatePath).not.toHaveBeenCalled()
    })
  })

  describe('updateUserAction', () => {
    it('should update user successfully', async () => {
      const updateData = { isAnonymous: false }
      const mockUser = createMockUser(updateData)
      vi.mocked(usersQueries.updateUser).mockResolvedValue(mockUser)

      const result = await updateUserAction('user-123', updateData)

      expect(usersQueries.updateUser).toHaveBeenCalledWith('user-123', updateData)
      expect(revalidatePath).toHaveBeenCalledWith('/users')
      expect(result).toEqual({ success: true, data: mockUser })
    })

    it('should handle user not found', async () => {
      vi.mocked(usersQueries.updateUser).mockResolvedValue(undefined)

      const result = await updateUserAction('nonexistent-id', { isAnonymous: false })

      expect(result).toEqual({ success: false, error: 'User not found' })
      expect(revalidatePath).not.toHaveBeenCalled()
    })

    it('should handle database errors', async () => {
      vi.mocked(usersQueries.updateUser).mockRejectedValue(new Error('Database error'))

      const result = await updateUserAction('user-123', { isAnonymous: false })

      expect(result).toEqual({ success: false, error: 'Failed to update user' })
    })
  })

  describe('deleteUserAction', () => {
    it('should delete user successfully', async () => {
      vi.mocked(usersQueries.deleteUser).mockResolvedValue(true)

      const result = await deleteUserAction('user-123')

      expect(usersQueries.deleteUser).toHaveBeenCalledWith('user-123')
      expect(revalidatePath).toHaveBeenCalledWith('/users')
      expect(result).toEqual({ success: true })
    })

    it('should handle user not found', async () => {
      vi.mocked(usersQueries.deleteUser).mockResolvedValue(false)

      const result = await deleteUserAction('nonexistent-id')

      expect(result).toEqual({ success: false, error: 'User not found' })
      expect(revalidatePath).not.toHaveBeenCalled()
    })

    it('should handle database errors', async () => {
      vi.mocked(usersQueries.deleteUser).mockRejectedValue(new Error('Database error'))

      const result = await deleteUserAction('user-123')

      expect(result).toEqual({ success: false, error: 'Failed to delete user' })
    })
  })

  describe('getUsersAction', () => {
    it('should fetch all users successfully', async () => {
      const mockUsers = [createMockUser(), createMockUser({ id: 'user-2' })]
      vi.mocked(usersQueries.getAllUsers).mockResolvedValue(mockUsers)

      const result = await getUsersAction()

      expect(usersQueries.getAllUsers).toHaveBeenCalled()
      expect(result).toEqual({ success: true, data: mockUsers })
    })

    it('should handle database errors', async () => {
      vi.mocked(usersQueries.getAllUsers).mockRejectedValue(new Error('Database error'))

      const result = await getUsersAction()

      expect(result).toEqual({ success: false, error: 'Failed to fetch users' })
    })
  })

  describe('getUserByIdAction', () => {
    it('should fetch user by ID successfully', async () => {
      const mockUser = createMockUser()
      vi.mocked(usersQueries.getUserById).mockResolvedValue(mockUser)

      const result = await getUserByIdAction('user-123')

      expect(usersQueries.getUserById).toHaveBeenCalledWith('user-123')
      expect(result).toEqual({ success: true, data: mockUser })
    })

    it('should handle user not found', async () => {
      vi.mocked(usersQueries.getUserById).mockResolvedValue(undefined)

      const result = await getUserByIdAction('nonexistent-id')

      expect(result).toEqual({ success: false, error: 'User not found' })
    })

    it('should handle database errors', async () => {
      vi.mocked(usersQueries.getUserById).mockRejectedValue(new Error('Database error'))

      const result = await getUserByIdAction('user-123')

      expect(result).toEqual({ success: false, error: 'Failed to fetch user' })
    })
  })

  describe('getUserByClerkIdAction', () => {
    it('should fetch user by Clerk ID successfully', async () => {
      const mockUser = createMockUser({ clerkUserId: 'clerk-123' })
      vi.mocked(usersQueries.getUserByClerkId).mockResolvedValue(mockUser)

      const result = await getUserByClerkIdAction('clerk-123')

      expect(usersQueries.getUserByClerkId).toHaveBeenCalledWith('clerk-123')
      expect(result).toEqual({ success: true, data: mockUser })
    })

    it('should handle user not found', async () => {
      vi.mocked(usersQueries.getUserByClerkId).mockResolvedValue(undefined)

      const result = await getUserByClerkIdAction('nonexistent-clerk-id')

      expect(result).toEqual({ success: false, error: 'User not found' })
    })

    it('should handle database errors', async () => {
      vi.mocked(usersQueries.getUserByClerkId).mockRejectedValue(new Error('Database error'))

      const result = await getUserByClerkIdAction('clerk-123')

      expect(result).toEqual({ success: false, error: 'Failed to fetch user' })
    })
  })

  describe('getUserBySessionIdAction', () => {
    it('should fetch user by session ID successfully', async () => {
      const mockUser = createMockUser({ sessionId: 'session-456' })
      vi.mocked(usersQueries.getUserBySessionId).mockResolvedValue(mockUser)

      const result = await getUserBySessionIdAction('session-456')

      expect(usersQueries.getUserBySessionId).toHaveBeenCalledWith('session-456')
      expect(result).toEqual({ success: true, data: mockUser })
    })

    it('should handle user not found', async () => {
      vi.mocked(usersQueries.getUserBySessionId).mockResolvedValue(undefined)

      const result = await getUserBySessionIdAction('nonexistent-session-id')

      expect(result).toEqual({ success: false, error: 'User not found' })
    })

    it('should handle database errors', async () => {
      vi.mocked(usersQueries.getUserBySessionId).mockRejectedValue(new Error('Database error'))

      const result = await getUserBySessionIdAction('session-456')

      expect(result).toEqual({ success: false, error: 'Failed to fetch user' })
    })
  })

  describe('upgradeUserAction', () => {
    it('should upgrade user successfully', async () => {
      const upgradedUser = createMockUser({
        isAnonymous: false,
        clerkUserId: 'clerk-upgraded',
      })
      vi.mocked(usersQueries.upgradeUser).mockResolvedValue(upgradedUser)

      const result = await upgradeUserAction('user-123')

      expect(usersQueries.upgradeUser).toHaveBeenCalledWith('user-123')
      expect(revalidatePath).toHaveBeenCalledWith('/users')
      expect(result).toEqual({ success: true, data: upgradedUser })
    })

    it('should handle user not found', async () => {
      vi.mocked(usersQueries.upgradeUser).mockResolvedValue(undefined)

      const result = await upgradeUserAction('nonexistent-id')

      expect(result).toEqual({ success: false, error: 'User not found' })
      expect(revalidatePath).not.toHaveBeenCalled()
    })

    it('should handle database errors', async () => {
      vi.mocked(usersQueries.upgradeUser).mockRejectedValue(new Error('Database error'))

      const result = await upgradeUserAction('user-123')

      expect(result).toEqual({ success: false, error: 'Failed to upgrade user' })
    })
  })

  describe('user lifecycle workflows', () => {
    it('should handle anonymous user creation and upgrade', async () => {
      // Create anonymous user
      const anonymousUserData = {
        sessionId: 'session-abc',
        clerkUserId: null,
        isAnonymous: true,
      }
      const anonymousUser = createMockUser(anonymousUserData)
      vi.mocked(usersQueries.createUser).mockResolvedValue(anonymousUser)

      const createResult = await createUserAction(anonymousUserData)
      expect(createResult.success).toBe(true)
      expect(createResult.data?.isAnonymous).toBe(true)

      // Upgrade to authenticated user
      const upgradedUser = createMockUser({
        ...anonymousUserData,
        isAnonymous: false,
        clerkUserId: 'clerk-new',
      })
      vi.mocked(usersQueries.upgradeUser).mockResolvedValue(upgradedUser)

      const upgradeResult = await upgradeUserAction(anonymousUser.id)
      expect(upgradeResult.success).toBe(true)
      expect(upgradeResult.data?.isAnonymous).toBe(false)
      expect(upgradeResult.data?.clerkUserId).toBe('clerk-new')
    })

    it('should handle different user lookup methods', async () => {
      const userId = 'user-123'
      const clerkId = 'clerk-456'
      const sessionId = 'session-789'

      const mockUser = createMockUser({
        id: userId,
        clerkUserId: clerkId,
        sessionId: sessionId,
      })

      vi.mocked(usersQueries.getUserById).mockResolvedValue(mockUser)
      vi.mocked(usersQueries.getUserByClerkId).mockResolvedValue(mockUser)
      vi.mocked(usersQueries.getUserBySessionId).mockResolvedValue(mockUser)

      // All lookup methods should return the same user
      const byIdResult = await getUserByIdAction(userId)
      const byClerkIdResult = await getUserByClerkIdAction(clerkId)
      const bySessionIdResult = await getUserBySessionIdAction(sessionId)

      expect(byIdResult.success).toBe(true)
      expect(byClerkIdResult.success).toBe(true)
      expect(bySessionIdResult.success).toBe(true)

      expect(byIdResult.data?.id).toBe(userId)
      expect(byClerkIdResult.data?.id).toBe(userId)
      expect(bySessionIdResult.data?.id).toBe(userId)
    })
  })

  describe('error logging patterns', () => {
    it('should log specific error messages for different operations', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      vi.mocked(usersQueries.createUser).mockRejectedValue(new Error('Create error'))
      vi.mocked(usersQueries.updateUser).mockRejectedValue(new Error('Update error'))
      vi.mocked(usersQueries.getUserByClerkId).mockRejectedValue(new Error('Fetch error'))

      await createUserAction({ sessionId: 'test', clerkUserId: null, isAnonymous: true })
      await updateUserAction('user-123', { isAnonymous: false })
      await getUserByClerkIdAction('clerk-123')

      expect(consoleSpy).toHaveBeenCalledWith('Error creating user:', expect.any(Error))
      expect(consoleSpy).toHaveBeenCalledWith('Error updating user:', expect.any(Error))
      expect(consoleSpy).toHaveBeenCalledWith('Error fetching user by Clerk ID:', expect.any(Error))

      consoleSpy.mockRestore()
    })
  })

  describe('revalidation patterns', () => {
    it('should revalidate users path for modification operations', async () => {
      const mockUser = createMockUser()
      vi.mocked(usersQueries.createUser).mockResolvedValue(mockUser)
      vi.mocked(usersQueries.updateUser).mockResolvedValue(mockUser)
      vi.mocked(usersQueries.upgradeUser).mockResolvedValue(mockUser)
      vi.mocked(usersQueries.deleteUser).mockResolvedValue(true)

      await createUserAction({ sessionId: 'test', clerkUserId: null, isAnonymous: true })
      await updateUserAction('user-123', { isAnonymous: false })
      await upgradeUserAction('user-123')
      await deleteUserAction('user-123')

      expect(revalidatePath).toHaveBeenCalledWith('/users')
      expect(revalidatePath).toHaveBeenCalledTimes(4)
    })

    it('should not revalidate for read operations', async () => {
      const mockUsers = [createMockUser()]
      const mockUser = createMockUser()

      vi.mocked(usersQueries.getAllUsers).mockResolvedValue(mockUsers)
      vi.mocked(usersQueries.getUserById).mockResolvedValue(mockUser)
      vi.mocked(usersQueries.getUserByClerkId).mockResolvedValue(mockUser)
      vi.mocked(usersQueries.getUserBySessionId).mockResolvedValue(mockUser)

      await getUsersAction()
      await getUserByIdAction('user-123')
      await getUserByClerkIdAction('clerk-123')
      await getUserBySessionIdAction('session-123')

      expect(revalidatePath).not.toHaveBeenCalled()
    })
  })

  describe('user data validation patterns', () => {
    it('should handle anonymous users correctly', async () => {
      const anonymousUser = createMockUser({
        sessionId: 'session-anon',
        clerkUserId: null,
        isAnonymous: true,
      })
      vi.mocked(usersQueries.createUser).mockResolvedValue(anonymousUser)

      const result = await createUserAction({
        sessionId: 'session-anon',
        clerkUserId: null,
        isAnonymous: true,
      })

      expect(result.success).toBe(true)
      expect(result.data?.isAnonymous).toBe(true)
      expect(result.data?.clerkUserId).toBeNull()
      expect(result.data?.sessionId).toBe('session-anon')
    })

    it('should handle authenticated users correctly', async () => {
      const authenticatedUser = createMockUser({
        sessionId: null,
        clerkUserId: 'clerk-auth',
        isAnonymous: false,
      })
      vi.mocked(usersQueries.createUser).mockResolvedValue(authenticatedUser)

      const result = await createUserAction({
        sessionId: null,
        clerkUserId: 'clerk-auth',
        isAnonymous: false,
      })

      expect(result.success).toBe(true)
      expect(result.data?.isAnonymous).toBe(false)
      expect(result.data?.clerkUserId).toBe('clerk-auth')
      expect(result.data?.sessionId).toBeNull()
    })
  })
})