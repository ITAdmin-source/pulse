import { describe, it, expect, beforeEach, vi } from 'vitest'
import { getOrCreateSessionId, clearSessionId, getSessionId } from '@/lib/utils/session'
import { v4 as uuidv4 } from 'uuid'

// Mock Next.js cookies
vi.mock('next/headers', () => ({
  cookies: vi.fn().mockResolvedValue({
    get: vi.fn(),
    set: vi.fn(),
    delete: vi.fn(),
  }),
}))

// Mock uuid
vi.mock('uuid', () => ({
  v4: vi.fn(),
}))

describe('Session Utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset process.env for each test
    process.env.NODE_ENV = 'test'
  })

  describe('getOrCreateSessionId', () => {
    it('should return existing session ID if present', async () => {
      const existingSessionId = 'existing-session-123'
      const mockCookieStore = await vi.mocked(vi.importActual('next/headers')).cookies()
      mockCookieStore.get.mockReturnValue({ value: existingSessionId })

      const result = await getOrCreateSessionId()

      expect(mockCookieStore.get).toHaveBeenCalledWith('pulse_session_id')
      expect(result).toBe(existingSessionId)
      expect(mockCookieStore.set).not.toHaveBeenCalled()
      expect(uuidv4).not.toHaveBeenCalled()
    })

    it('should create new session ID if none exists', async () => {
      const newSessionId = 'new-session-456'
      mockCookieStore.get.mockReturnValue(undefined)
      vi.mocked(uuidv4).mockReturnValue(newSessionId)

      const result = await getOrCreateSessionId()

      expect(mockCookieStore.get).toHaveBeenCalledWith('pulse_session_id')
      expect(uuidv4).toHaveBeenCalled()
      expect(mockCookieStore.set).toHaveBeenCalledWith(
        'pulse_session_id',
        newSessionId,
        {
          maxAge: 60 * 60 * 24 * 365, // 1 year
          httpOnly: true,
          secure: false, // NODE_ENV is 'test'
          sameSite: 'lax',
        }
      )
      expect(result).toBe(newSessionId)
    })

    it('should set secure cookie in production', async () => {
      process.env.NODE_ENV = 'production'
      const newSessionId = 'new-session-prod'
      mockCookieStore.get.mockReturnValue(undefined)
      vi.mocked(uuidv4).mockReturnValue(newSessionId)

      await getOrCreateSessionId()

      expect(mockCookieStore.set).toHaveBeenCalledWith(
        'pulse_session_id',
        newSessionId,
        {
          maxAge: 60 * 60 * 24 * 365,
          httpOnly: true,
          secure: true, // Production environment
          sameSite: 'lax',
        }
      )
    })

    it('should set non-secure cookie in development', async () => {
      process.env.NODE_ENV = 'development'
      const newSessionId = 'new-session-dev'
      mockCookieStore.get.mockReturnValue(undefined)
      vi.mocked(uuidv4).mockReturnValue(newSessionId)

      await getOrCreateSessionId()

      expect(mockCookieStore.set).toHaveBeenCalledWith(
        'pulse_session_id',
        newSessionId,
        {
          maxAge: 60 * 60 * 24 * 365,
          httpOnly: true,
          secure: false, // Development environment
          sameSite: 'lax',
        }
      )
    })

    it('should handle cookie with empty value', async () => {
      mockCookieStore.get.mockReturnValue({ value: '' })
      const newSessionId = 'new-session-empty'
      vi.mocked(uuidv4).mockReturnValue(newSessionId)

      const result = await getOrCreateSessionId()

      expect(uuidv4).toHaveBeenCalled()
      expect(mockCookieStore.set).toHaveBeenCalled()
      expect(result).toBe(newSessionId)
    })

    it('should handle cookie with null value', async () => {
      mockCookieStore.get.mockReturnValue({ value: null })
      const newSessionId = 'new-session-null'
      vi.mocked(uuidv4).mockReturnValue(newSessionId)

      const result = await getOrCreateSessionId()

      expect(uuidv4).toHaveBeenCalled()
      expect(mockCookieStore.set).toHaveBeenCalled()
      expect(result).toBe(newSessionId)
    })

    it('should use correct cookie configuration', async () => {
      mockCookieStore.get.mockReturnValue(undefined)
      const newSessionId = 'config-test-session'
      vi.mocked(uuidv4).mockReturnValue(newSessionId)

      await getOrCreateSessionId()

      const setCookieCall = mockCookieStore.set.mock.calls[0]
      expect(setCookieCall[0]).toBe('pulse_session_id')
      expect(setCookieCall[1]).toBe(newSessionId)
      expect(setCookieCall[2]).toEqual({
        maxAge: 31536000, // 365 days in seconds
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
      })
    })
  })

  describe('clearSessionId', () => {
    it('should delete session cookie', async () => {
      await clearSessionId()

      expect(mockCookieStore.delete).toHaveBeenCalledWith('pulse_session_id')
    })

    it('should call delete even if cookie does not exist', async () => {
      mockCookieStore.get.mockReturnValue(undefined)

      await clearSessionId()

      expect(mockCookieStore.delete).toHaveBeenCalledWith('pulse_session_id')
    })
  })

  describe('getSessionId', () => {
    it('should return session ID if present', async () => {
      const sessionId = 'test-session-789'
      mockCookieStore.get.mockReturnValue({ value: sessionId })

      const result = await getSessionId()

      expect(mockCookieStore.get).toHaveBeenCalledWith('pulse_session_id')
      expect(result).toBe(sessionId)
    })

    it('should return undefined if no session cookie', async () => {
      mockCookieStore.get.mockReturnValue(undefined)

      const result = await getSessionId()

      expect(mockCookieStore.get).toHaveBeenCalledWith('pulse_session_id')
      expect(result).toBeUndefined()
    })

    it('should return undefined if cookie has no value', async () => {
      mockCookieStore.get.mockReturnValue({})

      const result = await getSessionId()

      expect(result).toBeUndefined()
    })

    it('should return empty string if cookie value is empty', async () => {
      mockCookieStore.get.mockReturnValue({ value: '' })

      const result = await getSessionId()

      expect(result).toBe('')
    })

    it('should handle cookie value that is null', async () => {
      mockCookieStore.get.mockReturnValue({ value: null })

      const result = await getSessionId()

      expect(result).toBeNull()
    })

    it('should not modify or create cookies', async () => {
      mockCookieStore.get.mockReturnValue({ value: 'test-session' })

      await getSessionId()

      expect(mockCookieStore.set).not.toHaveBeenCalled()
      expect(mockCookieStore.delete).not.toHaveBeenCalled()
      expect(uuidv4).not.toHaveBeenCalled()
    })
  })

  describe('session cookie constants', () => {
    it('should use correct cookie name', async () => {
      mockCookieStore.get.mockReturnValue({ value: 'test' })

      await getSessionId()

      expect(mockCookieStore.get).toHaveBeenCalledWith('pulse_session_id')
    })

    it('should use correct max age (1 year)', async () => {
      mockCookieStore.get.mockReturnValue(undefined)
      vi.mocked(uuidv4).mockReturnValue('test-session')

      await getOrCreateSessionId()

      const expectedMaxAge = 60 * 60 * 24 * 365 // 1 year in seconds
      expect(mockCookieStore.set).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        expect.objectContaining({ maxAge: expectedMaxAge })
      )
    })
  })

  describe('error handling', () => {
    it('should handle uuid generation failure gracefully', async () => {
      mockCookieStore.get.mockReturnValue(undefined)
      vi.mocked(uuidv4).mockImplementation(() => {
        throw new Error('UUID generation failed')
      })

      await expect(getOrCreateSessionId()).rejects.toThrow('UUID generation failed')
    })

    it('should handle cookie store errors gracefully', async () => {
      mockCookieStore.get.mockImplementation(() => {
        throw new Error('Cookie store error')
      })

      await expect(getSessionId()).rejects.toThrow('Cookie store error')
    })
  })
})