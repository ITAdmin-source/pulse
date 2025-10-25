import { afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { config } from 'dotenv'
import path from 'path'

// ═══════════════════════════════════════════════════════════════════════════
// 🚨 CRITICAL WARNING: INTEGRATION TESTS ARE DESTRUCTIVE! 🚨
// ═══════════════════════════════════════════════════════════════════════════
//
// Integration tests in this project DELETE ALL DATA from the database they
// connect to. This is by design for test isolation.
//
// ⚠️  NEVER run integration tests against production data!
//
// SAFE SETUP:
// 1. Create a SEPARATE test database in Supabase
// 2. Add TEST_DATABASE_URL to .env.local pointing to test database
// 3. Set ALLOW_DESTRUCTIVE_TESTS=true in test environment only
//
// SAFETY CHECKS:
// - Tests will FAIL if DATABASE_URL contains 'supabase.com'
// - Tests will FAIL if ALLOW_DESTRUCTIVE_TESTS is not set
// - Tests will FAIL if NODE_ENV is 'production'
//
// These safety checks are in tests/utils/db-test-helpers.ts
// ═══════════════════════════════════════════════════════════════════════════

// Load .env.local for integration tests
// ⚠️  Make sure this points to a TEST database, not production!
config({ path: path.resolve(__dirname, '../.env.local') })

// Import custom matchers
import './utils/custom-matchers'

// Cleanup after each test
afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

// Mock Next.js modules
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}))

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}))

// Mock Clerk environment variables for testing (if not in .env.local)
if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = 'test_key'
}
if (!process.env.CLERK_SECRET_KEY) {
  process.env.CLERK_SECRET_KEY = 'test_secret'
}

// Do NOT override DATABASE_URL - let it come from .env.local for integration tests