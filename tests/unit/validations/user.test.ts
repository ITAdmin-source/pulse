import { describe, it, expect } from 'vitest'
import {
  createUserSchema,
  upgradeUserSchema,
  userProfileSchema,
  userDemographicsSchema,
  userRoleSchema,
} from '@/lib/validations/user'

describe('User Validation Schemas', () => {
  describe('createUserSchema', () => {
    it('should validate user creation with clerk ID', () => {
      const validData = {
        clerkUserId: 'user_abc123',
      }

      const result = createUserSchema.safeParse(validData)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.clerkUserId).toBe(validData.clerkUserId)
      }
    })

    it('should validate user creation with session ID', () => {
      const validData = {
        sessionId: 'session_xyz789',
      }

      const result = createUserSchema.safeParse(validData)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.sessionId).toBe(validData.sessionId)
      }
    })

    it('should validate user creation with both IDs', () => {
      const validData = {
        clerkUserId: 'user_abc123',
        sessionId: 'session_xyz789',
      }

      const result = createUserSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should validate user creation with metadata', () => {
      const validData = {
        clerkUserId: 'user_abc123',
        metadata: {
          source: 'web',
          referrer: 'google',
          deviceType: 'desktop',
        },
      }

      const result = createUserSchema.safeParse(validData)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.metadata).toEqual(validData.metadata)
      }
    })

    it('should reject user creation without either ID', () => {
      const invalidData = {
        metadata: { source: 'web' },
      }

      const result = createUserSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Either clerkUserId or sessionId must be provided')
      }
    })

    it('should reject user creation with empty values', () => {
      const invalidData = {
        clerkUserId: '',
        sessionId: '',
      }

      const result = createUserSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should accept complex metadata structures', () => {
      const validData = {
        sessionId: 'session_xyz789',
        metadata: {
          analytics: {
            utm_source: 'google',
            utm_medium: 'organic',
            utm_campaign: 'survey-2024',
          },
          preferences: {
            theme: 'dark',
            notifications: true,
          },
          timestamps: {
            firstVisit: '2024-01-01T10:00:00Z',
            lastActive: '2024-01-15T14:30:00Z',
          },
        },
      }

      const result = createUserSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })
  })

  describe('upgradeUserSchema', () => {
    it('should validate user upgrade data', () => {
      const validData = {
        sessionId: 'session_xyz789',
        clerkUserId: 'user_abc123',
      }

      const result = upgradeUserSchema.safeParse(validData)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.sessionId).toBe(validData.sessionId)
        expect(result.data.clerkUserId).toBe(validData.clerkUserId)
      }
    })

    it('should reject upgrade without session ID', () => {
      const invalidData = {
        clerkUserId: 'user_abc123',
      }

      const result = upgradeUserSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject upgrade without clerk user ID', () => {
      const invalidData = {
        sessionId: 'session_xyz789',
      }

      const result = upgradeUserSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject empty session ID', () => {
      const invalidData = {
        sessionId: '',
        clerkUserId: 'user_abc123',
      }

      const result = upgradeUserSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Session ID is required')
      }
    })

    it('should reject empty clerk user ID', () => {
      const invalidData = {
        sessionId: 'session_xyz789',
        clerkUserId: '',
      }

      const result = upgradeUserSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Clerk user ID is required')
      }
    })
  })

  describe('userProfileSchema', () => {
    it('should validate complete user profile', () => {
      const validData = {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        name: 'John Doe',
        picture: 'https://example.com/avatar.jpg',
        bio: 'Software engineer interested in civic engagement.',
        website: 'https://johndoe.com',
        twitter: '@johndoe',
        linkedin: 'https://linkedin.com/in/johndoe',
      }

      const result = userProfileSchema.safeParse(validData)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.name).toBe(validData.name)
        expect(result.data.bio).toBe(validData.bio)
      }
    })

    it('should validate minimal user profile', () => {
      const validData = {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Jane Smith',
      }

      const result = userProfileSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should reject invalid user ID', () => {
      const invalidData = {
        userId: 'not-a-uuid',
        name: 'John Doe',
      }

      const result = userProfileSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject empty name', () => {
      const invalidData = {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        name: '',
      }

      const result = userProfileSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Name is required')
      }
    })

    it('should reject name that is too long', () => {
      const invalidData = {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        name: 'a'.repeat(101), // Exceeds 100 character limit
      }

      const result = userProfileSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Name too long')
      }
    })

    it('should reject invalid picture URL', () => {
      const invalidData = {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        name: 'John Doe',
        picture: 'not-a-url',
      }

      const result = userProfileSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject bio that is too long', () => {
      const invalidData = {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        name: 'John Doe',
        bio: 'a'.repeat(501), // Exceeds 500 character limit
      }

      const result = userProfileSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Bio too long')
      }
    })

    it('should reject invalid website URL', () => {
      const invalidData = {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        name: 'John Doe',
        website: 'not-a-url',
      }

      const result = userProfileSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject twitter handle that is too long', () => {
      const invalidData = {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        name: 'John Doe',
        twitter: 'a'.repeat(51), // Exceeds 50 character limit
      }

      const result = userProfileSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Twitter handle too long')
      }
    })

    it('should accept valid social media handles', () => {
      const validData = {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        name: 'John Doe',
        twitter: '@johndoe',
      }

      const result = userProfileSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })
  })

  describe('userDemographicsSchema', () => {
    it('should validate complete demographics', () => {
      const validData = {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        ageGroupId: '123e4567-e89b-12d3-a456-426614174001',
        genderId: '123e4567-e89b-12d3-a456-426614174002',
        ethnicityId: '123e4567-e89b-12d3-a456-426614174003',
        politicalPartyId: '123e4567-e89b-12d3-a456-426614174004',
      }

      const result = userDemographicsSchema.safeParse(validData)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.ageGroupId).toBe(validData.ageGroupId)
        expect(result.data.genderId).toBe(validData.genderId)
      }
    })

    it('should validate partial demographics', () => {
      const validData = {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        ageGroupId: '123e4567-e89b-12d3-a456-426614174001',
      }

      const result = userDemographicsSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should validate demographics with user ID only', () => {
      const validData = {
        userId: '123e4567-e89b-12d3-a456-426614174000',
      }

      const result = userDemographicsSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should reject invalid user ID', () => {
      const invalidData = {
        userId: 'not-a-uuid',
        ageGroupId: '123e4567-e89b-12d3-a456-426614174001',
      }

      const result = userDemographicsSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject invalid demographic IDs', () => {
      const invalidData = {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        ageGroupId: 'not-a-uuid',
      }

      const result = userDemographicsSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })
  })

  describe('userRoleSchema', () => {
    it('should validate system admin role without poll ID', () => {
      const validData = {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        role: 'system_admin' as const,
      }

      const result = userRoleSchema.safeParse(validData)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.role).toBe('system_admin')
      }
    })

    it('should validate poll owner role with poll ID', () => {
      const validData = {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        role: 'poll_owner' as const,
        pollId: '123e4567-e89b-12d3-a456-426614174001',
      }

      const result = userRoleSchema.safeParse(validData)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.role).toBe('poll_owner')
        expect(result.data.pollId).toBe(validData.pollId)
      }
    })

    it('should validate poll manager role with poll ID', () => {
      const validData = {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        role: 'poll_manager' as const,
        pollId: '123e4567-e89b-12d3-a456-426614174001',
      }

      const result = userRoleSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should reject poll owner role without poll ID', () => {
      const invalidData = {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        role: 'poll_owner' as const,
      }

      const result = userRoleSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Poll ID is required for non-system admin roles')
      }
    })

    it('should reject poll manager role without poll ID', () => {
      const invalidData = {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        role: 'poll_manager' as const,
      }

      const result = userRoleSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Poll ID is required for non-system admin roles')
      }
    })

    it('should reject invalid role', () => {
      const invalidData = {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        role: 'invalid_role' as any,
        pollId: '123e4567-e89b-12d3-a456-426614174001',
      }

      const result = userRoleSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject invalid user ID', () => {
      const invalidData = {
        userId: 'not-a-uuid',
        role: 'poll_owner' as const,
        pollId: '123e4567-e89b-12d3-a456-426614174001',
      }

      const result = userRoleSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject invalid poll ID', () => {
      const invalidData = {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        role: 'poll_owner' as const,
        pollId: 'not-a-uuid',
      }

      const result = userRoleSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })
  })
})