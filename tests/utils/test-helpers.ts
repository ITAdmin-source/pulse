import { vi } from 'vitest'
import type { User, Poll, Statement, Vote } from '@/db/schema'

// Mock data factories
export const createMockUser = (overrides?: Partial<User>): User => ({
  id: '123e4567-e89b-12d3-a456-426614174000',
  clerkUserId: 'user_test123',
  sessionId: null,
  createdAt: new Date(),
  upgradedAt: null,
  metadata: null,
  ...overrides,
})

export const createMockPoll = (overrides?: Partial<Poll>): Poll => ({
  id: '123e4567-e89b-12d3-a456-426614174001',
  slug: 'test-poll',
  question: 'Test Poll Question',
  description: 'A test poll description',
  createdBy: '123e4567-e89b-12d3-a456-426614174000',
  createdAt: new Date(),
  status: 'draft',
  allowUserStatements: false,
  autoApproveStatements: false,
  startTime: new Date(),
  endTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
  votingGoal: null,
  supportButtonLabel: null,
  opposeButtonLabel: null,
  unsureButtonLabel: null,
  minStatementsVotedToEnd: 5,
  ...overrides,
})

export const createMockStatement = (overrides?: Partial<Statement>): Statement => ({
  id: '123e4567-e89b-12d3-a456-426614174002',
  pollId: '123e4567-e89b-12d3-a456-426614174001',
  text: 'This is a test statement',
  submittedBy: '123e4567-e89b-12d3-a456-426614174000',
  createdAt: new Date(),
  approved: true,
  approvedBy: '123e4567-e89b-12d3-a456-426614174000',
  approvedAt: new Date(),
  ...overrides,
})

export const createMockVote = (overrides?: Partial<Vote>): Vote => ({
  id: '123e4567-e89b-12d3-a456-426614174003',
  userId: '123e4567-e89b-12d3-a456-426614174000',
  statementId: '123e4567-e89b-12d3-a456-426614174002',
  value: 1, // Agree
  createdAt: new Date(),
  ...overrides,
})

// Mock Next.js server functions
export const mockRevalidatePath = vi.fn()
export const mockRevalidateTag = vi.fn()

// Mock Clerk auth
export const mockAuth = () => ({
  userId: 'user_test123',
  sessionId: 'session_test123',
  orgId: null,
})

// Test constants
export const TEST_USER_ID = '123e4567-e89b-12d3-a456-426614174000'
export const TEST_POLL_ID = '123e4567-e89b-12d3-a456-426614174001'
export const TEST_STATEMENT_ID = '123e4567-e89b-12d3-a456-426614174002'
export const TEST_CLERK_USER_ID = 'user_test123'
export const TEST_SESSION_ID = 'session_test123'