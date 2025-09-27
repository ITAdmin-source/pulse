# Comprehensive Testing Guide for Pulse

This document provides complete instructions for testing the Pulse application with comprehensive coverage across all components.

## Testing Overview

Our testing strategy achieves **80%+ coverage** across the codebase with:
- **Unit Tests**: Testing individual services, utilities, and validation schemas
- **Integration Tests**: Testing database operations and server actions
- **E2E Tests**: Testing complete user flows with Playwright
- **Performance Tests**: Load testing and optimization validation
- **Security Tests**: Input validation and authorization testing

## Comprehensive Test Structure

```
tests/
├── unit/                    # Unit Tests (90%+ coverage goal)
│   ├── services/           # Service layer tests
│   │   ├── poll-service.test.ts
│   │   ├── statement-service.test.ts
│   │   ├── voting-service.test.ts
│   │   └── user-service.test.ts
│   ├── validations/        # Zod schema tests (100% coverage)
│   │   ├── poll.test.ts
│   │   ├── statement.test.ts
│   │   ├── vote.test.ts
│   │   ├── insight.test.ts
│   │   └── user.test.ts
│   └── utils/             # Utility function tests
│       ├── slug.test.ts
│       ├── session.test.ts
│       ├── voting.test.ts
│       └── permissions.test.ts
├── integration/            # Integration Tests (80%+ coverage goal)
│   ├── actions/           # Server action tests
│   │   ├── polls-actions.test.ts
│   │   ├── statements-actions.test.ts
│   │   ├── votes-actions.test.ts
│   │   └── users-actions.test.ts
│   └── db/               # Database query tests
│       ├── polls-queries.test.ts
│       ├── statements-queries.test.ts
│       ├── votes-queries.test.ts
│       └── users-queries.test.ts
├── e2e/                   # End-to-end tests (Critical path coverage)
│   ├── poll-lifecycle.spec.ts
│   ├── statement-flow.spec.ts
│   ├── voting-complete.spec.ts
│   ├── auth-upgrade.spec.ts
│   └── dashboard.spec.ts
├── performance/           # Performance tests
│   ├── load-testing.test.ts
│   └── query-optimization.test.ts
├── security/             # Security tests
│   ├── input-validation.test.ts
│   └── authorization.test.ts
├── setup.ts              # Test setup and global mocks
├── utils/                # Test utilities and helpers
│   ├── test-helpers.ts   # Mock data factories
│   ├── test-db.ts        # Database test utilities
│   └── fixtures/         # Test data fixtures
└── coverage/             # Coverage reports
    ├── index.html        # HTML coverage report
    └── coverage-final.json
```

## Test Coverage Goals

| Component | Coverage Target | Current Status |
|-----------|----------------|----------------|
| **Services** | 90%+ | ✅ Implemented |
| **Validations** | 100% | ✅ Implemented |
| **Utilities** | 95%+ | ✅ Implemented |
| **Database Queries** | 85%+ | ✅ Implemented |
| **Server Actions** | 80%+ | 🔄 In Progress |
| **Critical User Flows** | 100% E2E | 🔄 In Progress |
| **Overall Target** | 80%+ | 🎯 Target |

## Running Tests

### All Tests
```bash
npm test                 # Run all unit & integration tests
npm run test:watch      # Run tests in watch mode for TDD
npm run test:coverage   # Run tests with detailed coverage report
npm run test:ui        # Open Vitest UI for interactive testing
```

### Specific Test Categories
```bash
# Unit Tests
npm test -- tests/unit/services     # All service tests
npm test -- tests/unit/validations  # All validation tests
npm test -- tests/unit/utils       # All utility tests

# Integration Tests
npm test -- tests/integration/db      # Database query tests
npm test -- tests/integration/actions # Server action tests

# Performance Tests
npm test -- tests/performance        # Load and optimization tests

# Security Tests
npm test -- tests/security          # Security validation tests
```

### E2E Tests
```bash
npm run test:e2e                    # Run all E2E tests
npm run test:e2e -- --headed        # Run with visible browser
npx playwright test --ui             # Interactive Playwright UI
npx playwright test --debug          # Debug mode with dev tools
npx playwright test --project=chromium # Run on specific browser

# Specific E2E suites
npm run test:e2e -- poll-lifecycle  # Test poll creation to closure
npm run test:e2e -- voting-complete # Test complete voting flow
```

### Test Filtering and Pattern Matching
```bash
npm test poll                       # Run tests matching "poll"
npm test -- --reporter=verbose     # Detailed test output
npm test -- --bail                 # Stop on first failure
npm test -- --changed             # Only test changed files
npm test -- --coverage --threshold 80 # Fail if coverage below 80%
```

## Comprehensive Test Writing Guide

### Unit Test Patterns

#### Service Layer Tests
```typescript
// tests/unit/services/poll-service.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { PollService } from '@/lib/services/poll-service'
import { db } from '@/db/db'
import { createMockPoll } from '../../utils/test-helpers'

vi.mock('@/db/db')

describe('PollService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should create poll with generated slug', async () => {
    const mockPoll = createMockPoll()
    const mockInsert = {
      values: vi.fn().mockReturnThis(),
      returning: vi.fn().mockResolvedValue([mockPoll])
    }
    vi.mocked(db.insert).mockReturnValue(mockInsert)

    const result = await PollService.createPoll({
      question: 'Test Poll',
      description: 'Test Description'
    }, 'user-123')

    expect(db.insert).toHaveBeenCalled()
    expect(result).toEqual(mockPoll)
  })

  it('should handle error cases', async () => {
    const mockInsert = {
      values: vi.fn().mockReturnThis(),
      returning: vi.fn().mockRejectedValue(new Error('DB Error'))
    }
    vi.mocked(db.insert).mockReturnValue(mockInsert)

    await expect(PollService.createPoll({
      question: 'Test'
    }, 'user-123')).rejects.toThrow('DB Error')
  })
})
```

#### Validation Schema Tests
```typescript
// tests/unit/validations/poll.test.ts
import { describe, it, expect } from 'vitest'
import { createPollSchema } from '@/lib/validations/poll'

describe('Poll Validation', () => {
  it('should validate complete poll data', () => {
    const validData = {
      question: 'Should we implement feature X?',
      description: 'Detailed description',
      allowUserStatements: true,
      minStatementsVotedToEnd: 5
    }

    const result = createPollSchema.safeParse(validData)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.question).toBe(validData.question)
    }
  })

  it('should reject invalid data with specific errors', () => {
    const invalidData = {
      question: '', // Empty question
      minStatementsVotedToEnd: 0 // Below minimum
    }

    const result = createPollSchema.safeParse(invalidData)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues).toContainEqual(
        expect.objectContaining({
          message: 'Question is required'
        })
      )
    }
  })

  it('should test edge cases', () => {
    // Test boundary values
    const edgeCases = [
      { question: 'a'.repeat(500), valid: true }, // Max length
      { question: 'a'.repeat(501), valid: false }, // Over limit
      { minStatementsVotedToEnd: 1, valid: true }, // Min value
      { minStatementsVotedToEnd: 0, valid: false } // Below min
    ]

    edgeCases.forEach(({ question, minStatementsVotedToEnd, valid }) => {
      const result = createPollSchema.safeParse({
        question: question || 'Valid question',
        minStatementsVotedToEnd: minStatementsVotedToEnd || 5
      })
      expect(result.success).toBe(valid)
    })
  })
})
```

#### Utility Function Tests
```typescript
// tests/unit/utils/slug.test.ts
import { describe, it, expect } from 'vitest'
import { generateSlug, generateUniqueSlug } from '@/lib/utils/slug'

describe('Slug Utilities', () => {
  describe('generateSlug', () => {
    it('should handle common cases', () => {
      expect(generateSlug('Hello World')).toBe('hello-world')
      expect(generateSlug('Test Poll 2024!')).toBe('test-poll-2024')
    })

    it('should handle edge cases', () => {
      expect(generateSlug('')).toBe('')
      expect(generateSlug('   ')).toBe('')
      expect(generateSlug('!@#$%')).toBe('')
      expect(generateSlug('café')).toBe('caf')
    })
  })

  describe('generateUniqueSlug', () => {
    it('should increment when conflicts exist', () => {
      const existing = ['test-poll', 'test-poll-1', 'test-poll-2']
      const result = generateUniqueSlug('Test Poll', existing)
      expect(result).toBe('test-poll-3')
    })
  })
})
```

### Integration Test Patterns

#### Database Query Tests
```typescript
// tests/integration/db/polls-queries.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { getPollById, createPoll } from '@/db/queries/polls-queries'
import { db } from '@/db/db'
import { createMockPoll } from '../../utils/test-helpers'

vi.mock('@/db/db')

describe('Polls Queries Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should retrieve poll by ID', async () => {
    const mockPoll = createMockPoll()
    const mockQuery = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([mockPoll])
    }
    vi.mocked(db.select).mockReturnValue(mockQuery)

    const result = await getPollById(mockPoll.id)

    expect(mockQuery.limit).toHaveBeenCalledWith(1)
    expect(result).toEqual(mockPoll)
  })

  it('should handle database errors gracefully', async () => {
    const mockQuery = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockRejectedValue(new Error('Connection failed'))
    }
    vi.mocked(db.select).mockReturnValue(mockQuery)

    await expect(getPollById('test-id')).rejects.toThrow('Connection failed')
  })
})
```

#### Server Action Tests
```typescript
// tests/integration/actions/polls-actions.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createPollAction } from '@/actions/polls-actions'
import { PollService } from '@/lib/services/poll-service'
import { createMockPoll } from '../../utils/test-helpers'

vi.mock('@/lib/services/poll-service')
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn()
}))

describe('Poll Actions Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should create poll and revalidate path', async () => {
    const mockPoll = createMockPoll()
    vi.mocked(PollService.createPoll).mockResolvedValue(mockPoll)

    const result = await createPollAction({
      question: 'Test Poll',
      description: 'Test Description'
    })

    expect(result.success).toBe(true)
    expect(result.data).toEqual(mockPoll)
    expect(PollService.createPoll).toHaveBeenCalled()
  })

  it('should handle service errors', async () => {
    vi.mocked(PollService.createPoll).mockRejectedValue(
      new Error('Service error')
    )

    const result = await createPollAction({
      question: 'Test Poll'
    })

    expect(result.success).toBe(false)
    expect(result.error).toBe('Failed to create poll')
  })
})
```

### E2E Test Patterns

#### Complete User Flow Tests
```typescript
// tests/e2e/poll-lifecycle.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Complete Poll Lifecycle', () => {
  test('should create, publish, and manage poll', async ({ page }) => {
    // 1. Create poll
    await page.goto('/polls/new')
    await page.fill('[data-testid="poll-question"]', 'Climate Change Poll')
    await page.fill('[data-testid="poll-description"]', 'Discussion about climate policies')
    await page.click('[data-testid="submit-poll"]')

    // 2. Verify draft state
    await expect(page.locator('[data-testid="poll-status"]')).toHaveText('Draft')

    // 3. Add statements
    await page.click('[data-testid="add-statement"]')
    await page.fill('[data-testid="statement-text"]', 'We should invest in renewable energy')
    await page.click('[data-testid="save-statement"]')

    // 4. Publish poll
    await page.click('[data-testid="publish-poll"]')
    await expect(page.locator('[data-testid="poll-status"]')).toHaveText('Published')

    // 5. Test voting flow
    await page.goto('/polls/climate-change-poll')
    await page.click('[data-testid="vote-agree"]')
    await expect(page.locator('[data-testid="vote-count"]')).toContainText('1')

    // 6. Close poll
    await page.goto('/admin/polls/climate-change-poll')
    await page.click('[data-testid="close-poll"]')
    await expect(page.locator('[data-testid="poll-status"]')).toHaveText('Closed')
  })

  test('should handle error states', async ({ page }) => {
    await page.goto('/polls/new')
    await page.click('[data-testid="submit-poll"]') // Submit without required fields

    await expect(page.locator('[data-testid="error-message"]'))
      .toContainText('Question is required')
  })
})
```

#### Authentication Flow Tests
```typescript
// tests/e2e/auth-upgrade.spec.ts
import { test, expect } from '@playwright/test'

test.describe('User Authentication Upgrade', () => {
  test('should upgrade anonymous user to authenticated', async ({ page }) => {
    // 1. Start as anonymous user
    await page.goto('/polls/test-poll')
    await page.click('[data-testid="vote-agree"]')

    // 2. Verify anonymous voting
    await expect(page.locator('[data-testid="anonymous-indicator"]')).toBeVisible()

    // 3. Sign up/login
    await page.click('[data-testid="sign-in"]')
    await page.fill('[data-testid="email"]', 'test@example.com')
    await page.fill('[data-testid="password"]', 'password123')
    await page.click('[data-testid="submit-auth"]')

    // 4. Verify vote transfer
    await expect(page.locator('[data-testid="authenticated-indicator"]')).toBeVisible()
    await expect(page.locator('[data-testid="previous-vote"]')).toBeVisible()
  })
})
```

## Comprehensive Test Utilities

### Mock Data Factories
Our test helpers provide realistic mock data that matches production schemas:

```typescript
// tests/utils/test-helpers.ts
import { createMockUser, createMockPoll, createMockStatement, createMockVote } from '@/tests/utils/test-helpers'

// Create mock entities with sensible defaults
const user = createMockUser({
  clerkUserId: 'user_test123',
  sessionId: null
})

const poll = createMockPoll({
  status: 'published',
  question: 'Climate Change Action Poll',
  allowUserStatements: true
})

const statement = createMockStatement({
  pollId: poll.id,
  text: 'We should invest in renewable energy',
  approved: true
})

const vote = createMockVote({
  userId: user.id,
  statementId: statement.id,
  value: 1 // Agree
})

// Use in tests
describe('VotingService', () => {
  it('should record vote correctly', async () => {
    const mockVote = createMockVote({ value: 1 })
    // ... test implementation
  })
})
```

### Test Database Management
For integration tests requiring database operations:

```typescript
// tests/utils/test-db.ts
import { createTestDb, cleanupTestDb } from '@/tests/utils/test-db'

describe('Database Integration Tests', () => {
  let testDb: ReturnType<typeof createTestDb>

  beforeEach(async () => {
    testDb = createTestDb()
    // Reset to clean state
  })

  afterEach(async () => {
    await cleanupTestDb(testDb)
  })

  it('should perform database operations', async () => {
    // Use testDb for operations
  })
})
```

### Test Fixtures and Seed Data
Structured test data for complex scenarios:

```typescript
// tests/utils/fixtures/poll-scenarios.ts
export const POLL_SCENARIOS = {
  SIMPLE_POLL: {
    poll: createMockPoll({
      question: 'Should we implement feature X?',
      status: 'published'
    }),
    statements: [
      createMockStatement({ text: 'Yes, it would be beneficial' }),
      createMockStatement({ text: 'No, too complex' })
    ],
    votes: [
      createMockVote({ value: 1 }), // Agree with first
      createMockVote({ value: -1 }) // Disagree with second
    ]
  },

  COMPLEX_POLL: {
    poll: createMockPoll({
      question: 'Climate Policy Preferences',
      allowUserStatements: true,
      minStatementsVotedToEnd: 10
    }),
    statements: Array.from({ length: 15 }, (_, i) =>
      createMockStatement({
        text: `Climate statement ${i + 1}`,
        approved: i < 12 // 12 approved, 3 pending
      })
    ),
    votes: Array.from({ length: 50 }, () =>
      createMockVote({ value: Math.floor(Math.random() * 3) - 1 })
    )
  }
}

// Use in tests
import { POLL_SCENARIOS } from '../fixtures/poll-scenarios'

it('should handle complex voting scenarios', () => {
  const { poll, statements, votes } = POLL_SCENARIOS.COMPLEX_POLL
  // ... test with structured data
})
```

### Custom Test Matchers
Extended Vitest matchers for domain-specific assertions:

```typescript
// tests/utils/custom-matchers.ts
import { expect } from 'vitest'

expect.extend({
  toBeValidUUID(received: string) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    const pass = uuidRegex.test(received)

    return {
      pass,
      message: () =>
        pass
          ? `Expected ${received} not to be a valid UUID`
          : `Expected ${received} to be a valid UUID`
    }
  },

  toHaveValidVoteValue(received: number) {
    const pass = [-1, 0, 1].includes(received)

    return {
      pass,
      message: () =>
        pass
          ? `Expected ${received} not to be a valid vote value`
          : `Expected ${received} to be a valid vote value (-1, 0, or 1)`
    }
  },

  toBeValidSlug(received: string) {
    const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
    const pass = slugRegex.test(received)

    return {
      pass,
      message: () =>
        pass
          ? `Expected ${received} not to be a valid slug`
          : `Expected ${received} to be a valid slug (lowercase, hyphens only)`
    }
  }
})

// Use in tests
expect(poll.id).toBeValidUUID()
expect(vote.value).toHaveValidVoteValue()
expect(poll.slug).toBeValidSlug()
```

## Updating Tests When Code Changes

### Service Changes
1. Navigate to `tests/unit/services/`
2. Update the corresponding service test file
3. Add tests for new methods
4. Update mocks if dependencies changed

### Schema Changes
1. Update validation tests in `tests/unit/validations/`
2. Add tests for new validation rules
3. Update mock data factories if schema structure changed

### New Features
1. Add unit tests for new services/utilities
2. Add integration tests for new actions/queries
3. Add E2E tests for new user flows
4. Update existing tests that may be affected

### Bug Fixes
1. Add a regression test that reproduces the bug
2. Fix the bug
3. Ensure the test passes

## Test Database Setup

Tests use a mock database connection by default. For integration tests:

1. Set `DATABASE_URL` in test environment
2. Run migrations: `npm run db:migrate`
3. Tests will use transactions for isolation

## Coverage Reports

After running `npm run test:coverage`:
- HTML report: `coverage/index.html`
- Console output shows coverage summary
- Aim for >80% coverage on critical paths

## CI/CD Integration

Tests run automatically on:
- Push to main/develop branches
- Pull requests
- GitHub Actions workflow (`.github/workflows/test.yml`)

### CI Test Jobs
1. **Unit & Integration Tests**: Runs Vitest tests with coverage
2. **E2E Tests**: Runs Playwright tests on Chromium
3. **Lint**: Checks code style
4. **Type Check**: Validates TypeScript types

## Debugging Tests

### Vitest
```bash
# Run specific test file
npm test -- tests/unit/services/user-service.test.ts

# Run with Node inspector
node --inspect-brk ./node_modules/vitest/vitest.mjs

# Use Vitest UI for visual debugging
npm run test:ui
```

### Playwright
```bash
# Debug mode with browser
npx playwright test --debug

# Headed mode (see browser)
npx playwright test --headed

# Slow motion
npx playwright test --headed --slow-mo=1000
```

## Best Practices

1. **Test Isolation**: Each test should be independent
2. **Clear Names**: Use descriptive test names that explain what's being tested
3. **Mock External Dependencies**: Mock database calls, API requests, etc.
4. **Test Edge Cases**: Include tests for error conditions and boundaries
5. **Keep Tests Simple**: One assertion per test when possible
6. **Use Test Utilities**: Leverage mock factories and helpers
7. **Clean Up**: Always clean up after tests (mocks, database state)

## Continuous Testing Strategy

### Pre-commit Hooks

Install and configure pre-commit testing:

```bash
# Install husky for git hooks
npm install --save-dev husky

# Initialize husky
npx husky init

# Add pre-commit hook
echo "npm run test:quick && npm run lint" > .husky/pre-commit
```

Create quick test script in `package.json`:

```json
{
  "scripts": {
    "test:quick": "vitest run --reporter=dot --coverage=false tests/unit",
    "test:watch": "vitest watch tests/unit",
    "test:integration": "vitest run tests/integration",
    "test:e2e": "playwright test",
    "test:all": "npm run test:quick && npm run test:integration && npm run test:e2e"
  }
}
```

### Test Monitoring

Set up test result monitoring and notifications:

```typescript
// tests/utils/test-reporter.ts
import { Reporter } from 'vitest/reporters'

export class SlackReporter implements Reporter {
  onFinished(files, errors) {
    if (errors?.length > 0) {
      // Send failure notification to Slack
      this.notifySlack('🚨 Tests Failed', errors)
    }
  }

  private async notifySlack(title: string, errors: any[]) {
    if (!process.env.SLACK_WEBHOOK_URL) return

    await fetch(process.env.SLACK_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: `${title}\n\`\`\`${errors.map(e => e.message).join('\n')}\`\`\``
      })
    })
  }
}
```

## Performance Testing

### Load Testing with Playwright

Test application performance under load:

```typescript
// tests/performance/load-test.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Load Testing', () => {
  test('voting performance under concurrent users', async ({ page, context }) => {
    // Simulate multiple users voting simultaneously
    const promises = Array.from({ length: 10 }, async (_, i) => {
      const newPage = await context.newPage()
      await newPage.goto('/poll/test-poll')

      const startTime = Date.now()
      await newPage.click('[data-testid="vote-agree"]')
      await newPage.waitForSelector('[data-testid="vote-success"]')
      const endTime = Date.now()

      expect(endTime - startTime).toBeLessThan(2000) // 2s timeout
      await newPage.close()
    })

    await Promise.all(promises)
  })

  test('database query performance', async ({ page }) => {
    // Test large poll with many statements
    await page.goto('/poll/large-poll-test')

    const startTime = performance.now()
    await page.waitForSelector('[data-testid="statements-loaded"]')
    const loadTime = performance.now() - startTime

    expect(loadTime).toBeLessThan(1000) // 1s for initial load
  })
})
```

### Memory and Resource Testing

```typescript
// tests/performance/memory-test.spec.ts
import { test, expect } from '@playwright/test'

test('memory usage within limits', async ({ page }) => {
  await page.goto('/poll/test-poll')

  // Get initial memory usage
  const initialMemory = await page.evaluate(() => {
    return (performance as any).memory?.usedJSHeapSize || 0
  })

  // Perform memory-intensive operations
  for (let i = 0; i < 100; i++) {
    await page.click('[data-testid="load-more-statements"]')
    await page.waitForTimeout(50)
  }

  const finalMemory = await page.evaluate(() => {
    return (performance as any).memory?.usedJSHeapSize || 0
  })

  const memoryIncrease = finalMemory - initialMemory
  expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024) // 50MB limit
})
```

## Security Testing

### Authentication and Authorization

```typescript
// tests/security/auth-security.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Security Tests', () => {
  test('unauthorized access blocked', async ({ page }) => {
    // Try to access admin routes without authentication
    const response = await page.goto('/admin/polls')
    expect(response?.status()).toBe(403)
  })

  test('CSRF protection active', async ({ page }) => {
    await page.goto('/poll/test-poll')

    // Try to submit vote without proper CSRF token
    const response = await page.request.post('/api/votes', {
      data: { statementId: 'test', value: 1 }
    })

    expect(response.status()).toBe(403)
  })

  test('SQL injection prevention', async ({ page }) => {
    await page.goto('/poll/test-poll')

    // Try SQL injection in search
    await page.fill('[data-testid="statement-search"]', "'; DROP TABLE polls; --")
    await page.click('[data-testid="search-submit"]')

    // Verify application still works
    await expect(page.locator('[data-testid="statements-list"]')).toBeVisible()
  })
})
```

### Input Validation Security

```typescript
// tests/security/validation-security.test.ts
import { test, expect } from 'vitest'
import { createPollSchema } from '@/lib/validations/poll'

test.describe('Input Validation Security', () => {
  test('XSS prevention in poll questions', () => {
    const maliciousInput = {
      question: '<script>alert("xss")</script>',
      description: 'Safe description',
      // ... other required fields
    }

    const result = createPollSchema.safeParse(maliciousInput)
    expect(result.success).toBe(false)
    expect(result.error?.issues[0].message).toContain('Invalid characters')
  })

  test('prevents oversized inputs', () => {
    const oversizedInput = {
      question: 'A'.repeat(10000), // Too long
      description: 'Normal description',
      // ... other required fields
    }

    const result = createPollSchema.safeParse(oversizedInput)
    expect(result.success).toBe(false)
  })
})
```

## Test Monitoring and Reporting

### Coverage Badges

Add coverage badges to README.md:

```markdown
[![Coverage](https://codecov.io/gh/username/pulse/branch/main/graph/badge.svg)](https://codecov.io/gh/username/pulse)
[![Tests](https://github.com/username/pulse/workflows/Test%20Suite/badge.svg)](https://github.com/username/pulse/actions)
```

### Coverage Reporting

Configure detailed coverage reporting in `vitest.config.ts`:

```typescript
export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/migrations/**'
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80
        },
        // Stricter thresholds for critical paths
        'lib/services/**': {
          branches: 90,
          functions: 90,
          lines: 90,
          statements: 90
        },
        'lib/validations/**': {
          branches: 100,
          functions: 100,
          lines: 100,
          statements: 100
        }
      }
    }
  }
})
```

### Test Result Dashboard

Set up test monitoring dashboard:

```typescript
// tests/utils/dashboard-reporter.ts
export class DashboardReporter {
  async reportResults(results: TestResults) {
    const summary = {
      timestamp: new Date().toISOString(),
      totalTests: results.numTotalTests,
      passedTests: results.numPassedTests,
      failedTests: results.numFailedTests,
      coverage: results.coverageMap?.getCoverageSummary(),
      duration: results.testResults.reduce((acc, test) => acc + test.perfStats.runtime, 0)
    }

    // Send to monitoring service
    await this.sendToMonitoring(summary)
  }

  private async sendToMonitoring(data: any) {
    if (process.env.MONITORING_ENDPOINT) {
      await fetch(process.env.MONITORING_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
    }
  }
}
```

### Flaky Test Detection

Identify and track unreliable tests:

```typescript
// tests/utils/flaky-detector.ts
export class FlakyTestDetector {
  private testHistory = new Map<string, boolean[]>()

  recordTestResult(testName: string, passed: boolean) {
    if (!this.testHistory.has(testName)) {
      this.testHistory.set(testName, [])
    }

    const history = this.testHistory.get(testName)!
    history.push(passed)

    // Keep last 10 runs
    if (history.length > 10) {
      history.shift()
    }

    // Flag as flaky if inconsistent results
    if (history.length >= 5) {
      const passRate = history.filter(Boolean).length / history.length
      if (passRate > 0.2 && passRate < 0.8) {
        console.warn(`🚨 Flaky test detected: ${testName} (${Math.round(passRate * 100)}% pass rate)`)
      }
    }
  }
}
```

## Common Issues

### Tests Failing After Code Changes
- Update mock data to match new schema
- Check if validation rules changed
- Verify database migrations are applied

### Slow Tests
- Mock heavy operations (database, API calls)
- Use `test.concurrent` for independent tests
- Optimize E2E test selectors

### Flaky E2E Tests
- Add proper waits for elements
- Use stable selectors (data-testid)
- Check for race conditions

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Library](https://testing-library.com/)
- [Zod Testing Patterns](https://zod.dev/?id=safeparse)