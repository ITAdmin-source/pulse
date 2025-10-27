# Development Guidelines

Complete development guidelines and best practices for Pulse platform.

## Getting Started

### Prerequisites

- Node.js 18+ (LTS recommended)
- npm or yarn
- Supabase account (PostgreSQL database)
- Clerk account (authentication)

### Initial Setup

1. **Clone repository**
   ```bash
   git clone <repository-url>
   cd pulse
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your credentials

   # Generate CRON_SECRET for background jobs:
   node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
   # Add to .env.local: CRON_SECRET=<generated-secret>
   ```

4. **Setup database**
   ```bash
   npm run db:migrate    # Apply migrations
   npm run db:health     # Verify connection
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

## Development Commands

### Core Commands

```bash
# Development
npm run dev              # Start dev server (http://localhost:3000)
npm run dev:clean        # Clean restart (Windows - kills processes, clears cache)
npm run build            # Production build (ALWAYS run before committing)
npm run start            # Start production server
npm run lint             # Run ESLint code quality check
```

### Database Management

```bash
# Schema & Migrations
npm run db:generate      # Generate migration from schema changes
npm run db:migrate       # Apply pending migrations to database

# Health & Diagnostics
npm run db:health        # Run 6 automated health checks (~10s)
npm run db:stress        # Run stress test with 350 requests (~20s)

# Security (RLS)
npx tsx scripts/check-rls-status.ts      # Check RLS status on all tables
npx tsx scripts/apply-rls-migration.ts   # Apply RLS policies (already applied)
```

### Testing

```bash
# Unit & Integration Tests
npm run test             # Run all tests
npm run test:watch       # Run tests in watch mode
npm run test:coverage    # Run tests with coverage report
npm run test:ui          # Run tests with Vitest UI
npm run test:quick       # Quick unit test run (no integration)
npm run test:integration # Run integration tests (requires DB)

# E2E Tests
npm run test:e2e         # Run Playwright E2E tests

# All Tests
npm run test:all         # Run all test suites
```

## Development Workflow

### For New Features

1. **Plan the feature**
   - Define requirements
   - Identify affected components
   - Consider database changes

2. **Start with services** (`lib/services/`)
   - Centralize business logic
   - Create or extend service class
   - Add validation with Zod

3. **Add validation** (`lib/validations/`)
   - Define Zod schemas
   - Type inference for TypeScript
   - Runtime validation

4. **Create Server Actions** (`actions/`)
   - Wrap service calls
   - Handle errors consistently
   - Add revalidation paths

5. **Build UI components**
   - Use v2.0 component patterns
   - Import strings from `lib/strings/he.ts`
   - Use design tokens from `lib/design-tokens-v2.ts`
   - Follow RTL principles

6. **Write tests**
   - Unit tests for services
   - Integration tests for workflows
   - E2E tests for critical paths

7. **Run quality checks**
   ```bash
   npm run lint           # Check code quality
   npm run build          # Verify TypeScript compilation
   npm run test           # Run all tests
   ```

### For Bug Fixes

1. **Reproduce the bug**
   - Create failing test
   - Document steps to reproduce

2. **Identify root cause**
   - Check service layer
   - Review database queries
   - Examine component logic

3. **Implement fix**
   - Fix in appropriate layer (service/action/component)
   - Ensure test passes

4. **Verify fix**
   - Run affected tests
   - Test manually
   - Check for regressions

5. **Document the fix**
   - Update comments if needed
   - Add test coverage

## Code Quality Standards

### TypeScript

```typescript
// ✅ Good - explicit types
interface PollData {
  title: string;
  description?: string;
  emoji?: string;
}

export async function createPoll(data: PollData): Promise<Poll> {
  // Implementation
}

// ❌ Bad - implicit any
export async function createPoll(data) {
  // Implementation
}
```

### Service Layer

```typescript
// ✅ Good - centralized business logic
export class PollService {
  static async createPoll(data: CreatePollInput): Promise<Poll> {
    // Validation
    const validated = createPollSchema.parse(data);

    // Business logic
    const slug = await generateUniqueSlug(validated.title);

    // Database operation
    const poll = await db.insert(polls).values({
      ...validated,
      slug,
    });

    return poll;
  }
}

// ❌ Bad - logic in action
export async function createPollAction(data: any) {
  const slug = data.title.toLowerCase().replace(/\s/g, '-');
  const poll = await db.insert(polls).values({ ...data, slug });
  return poll;
}
```

### Validation

```typescript
// ✅ Good - Zod schema
import { z } from 'zod';

const voteSchema = z.object({
  statement_id: z.string().uuid(),
  vote_value: z.number().int().min(-1).max(1),
});

export async function castVote(data: unknown) {
  const validated = voteSchema.parse(data);
  // Safe to use validated data
}

// ❌ Bad - no validation
export async function castVote(data: any) {
  // Unsafe - could be anything
  await db.insert(votes).values(data);
}
```

### Error Handling

```typescript
// ✅ Good - consistent error handling
export async function createPollAction(data: CreatePollInput) {
  try {
    const result = await PollService.createPoll(data);
    revalidatePath('/polls');
    return { success: true, data: result };
  } catch (error) {
    console.error('Failed to create poll:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create poll'
    };
  }
}

// ❌ Bad - no error handling
export async function createPollAction(data: CreatePollInput) {
  const result = await PollService.createPoll(data);
  return result;
}
```

### Component Guidelines

```tsx
// ✅ Good - v2.0 patterns with design tokens
import { strings } from '@/lib/strings/he';
import { colors, spacing } from '@/lib/design-tokens-v2';

export function VoteButton() {
  return (
    <button className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-xl">
      {strings.voting.agree}
    </button>
  );
}

// ❌ Bad - hardcoded strings and styles
export function VoteButton() {
  return (
    <button style={{ backgroundColor: '#22c55e', padding: '12px 24px' }}>
      מסכים
    </button>
  );
}
```

### RTL Support

```tsx
// ✅ Good - logical properties
<div className="ms-4 me-2 ps-6 pe-4">
  {content}
</div>

// ❌ Bad - directional properties
<div className="ml-4 mr-2 pl-6 pr-4">
  {content}
</div>
```

## Background Jobs

### Clustering Queue (Supabase pg_cron)

Automatic clustering runs via database queue processed by Supabase pg_cron every minute.

#### Local Development

Jobs are enqueued automatically when voting (batch completion/milestones).

**Manual testing:**
```bash
# 1. Enqueue a test job
npx tsx scripts/enqueue-test-job.ts

# 2. Manually trigger processing (simulates pg_cron)
npx tsx scripts/trigger-cron-local.ts

# 3. Run comprehensive queue tests
npx tsx scripts/test-clustering-queue.ts
```

**Note:** Supabase pg_cron cannot reach `localhost`, so use manual trigger script instead.

#### Production Setup

**Prerequisites:**
1. CRON_SECRET in Vercel environment variables
2. pg_cron and pg_net extensions enabled in Supabase
3. SQL cron job scheduled (see `scripts/setup-supabase-cron.sql`)

**Monitoring:**
```sql
-- Check cron job exists
SELECT * FROM cron.job;

-- View execution history
SELECT * FROM cron.job_run_details
ORDER BY start_time DESC
LIMIT 10;

-- Check queue status
SELECT status, COUNT(*)
FROM clustering_queue
GROUP BY status;
```

#### Troubleshooting

**Jobs stuck in "pending":**
- Check pg_cron is scheduled: `SELECT * FROM cron.job`
- Verify URL and CRON_SECRET in cron schedule
- Check Vercel logs for endpoint calls

**Jobs stuck in "processing":**
- Indicates crash during computation
- Will automatically retry (up to 3 attempts)
- Check error_message after max attempts

**High failed count:**
- Query: `SELECT * FROM clustering_queue WHERE status = 'failed'`
- Check error_message column for details
- Common: "Insufficient users" (expected, not an error)

**No HTTP calls from pg_cron:**
- Verify pg_net extension enabled
- Check cron.job_run_details for errors
- Ensure Vercel endpoint is publicly accessible

## Testing Guidelines

### Unit Tests

**Test services and utilities in isolation:**

```typescript
// tests/services/poll-service.test.ts
import { describe, it, expect } from 'vitest';
import { PollService } from '@/lib/services/poll-service';

describe('PollService', () => {
  it('creates poll with valid data', async () => {
    const data = {
      title: 'Test Poll',
      description: 'Test Description',
    };

    const poll = await PollService.createPoll(data);

    expect(poll).toBeDefined();
    expect(poll.title).toBe(data.title);
    expect(poll.slug).toBeDefined();
  });

  it('throws error with invalid data', async () => {
    const data = { title: '' }; // Invalid - empty title

    await expect(
      PollService.createPoll(data)
    ).rejects.toThrow();
  });
});
```

### Integration Tests

**Test workflows with database:**

```typescript
// tests/integration/voting.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { VotingService } from '@/lib/services/voting-service';
import { db } from '@/db/db';

describe('Voting Workflow', () => {
  beforeEach(async () => {
    // Setup test data
    await setupTestPoll();
  });

  it('allows user to cast vote', async () => {
    const vote = await VotingService.castVote({
      user_id: testUserId,
      statement_id: testStatementId,
      vote_value: 1,
    });

    expect(vote).toBeDefined();
    expect(vote.vote_value).toBe(1);
  });

  it('prevents duplicate votes', async () => {
    // Cast first vote
    await VotingService.castVote({
      user_id: testUserId,
      statement_id: testStatementId,
      vote_value: 1,
    });

    // Attempt duplicate
    await expect(
      VotingService.castVote({
        user_id: testUserId,
        statement_id: testStatementId,
        vote_value: -1,
      })
    ).rejects.toThrow();
  });
});
```

### E2E Tests

**Test critical user flows:**

```typescript
// tests/e2e/voting-flow.spec.ts
import { test, expect } from '@playwright/test';

test('complete voting flow', async ({ page }) => {
  // Navigate to poll
  await page.goto('/polls/test-poll');

  // Vote on first statement
  await page.click('[data-testid="vote-agree"]');

  // Verify progress
  const progress = await page.textContent('[data-testid="vote-progress"]');
  expect(progress).toContain('1/10');

  // Continue voting until threshold
  // ... more steps

  // Verify demographics modal appears
  await expect(page.locator('[data-testid="demographics-modal"]')).toBeVisible();
});
```

## Database Development

### Adding New Tables

Follow `NEW_TABLE_INSTRUCTIONS.md`:

1. **Define schema** in `db/schema/`
2. **Update schema index** (`db/schema/index.ts`)
3. **Create query functions** in `db/queries/`
4. **Build Server Actions** in `actions/`
5. **Generate migration** (`npm run db:generate`)
6. **Apply migration** (`npm run db:migrate`)
7. **ENABLE RLS** (critical security step)

### Migration Best Practices

```typescript
// ✅ Good - reversible migration
export async function up(db: Db) {
  await db.schema.createTable('new_table')
    .addColumn('id', 'uuid', (col) => col.primaryKey())
    .addColumn('created_at', 'timestamp', (col) => col.notNull().defaultTo(sql`now()`))
    .execute();
}

export async function down(db: Db) {
  await db.schema.dropTable('new_table').execute();
}
```

### Database Query Optimization

```typescript
// ✅ Good - use indexes and specific columns
const polls = await db
  .select({
    id: polls.id,
    title: polls.title,
    slug: polls.slug,
  })
  .from(polls)
  .where(eq(polls.status, 'published'))
  .orderBy(desc(polls.created_at))
  .limit(20);

// ❌ Bad - select all columns without filters
const polls = await db.select().from(polls);
```

## Git Workflow

### Branching Strategy

```bash
# Feature branches
git checkout -b feature/poll-analytics

# Bug fixes
git checkout -b fix/vote-duplication

# Release branches
git checkout -b release/v2.1.0
```

### Commit Messages

```bash
# ✅ Good - descriptive and specific
git commit -m "feat: add demographic heatmap to results page"
git commit -m "fix: prevent duplicate votes on same statement"
git commit -m "refactor: extract voting logic to VotingService"

# ❌ Bad - vague
git commit -m "updates"
git commit -m "fix bug"
git commit -m "changes"
```

### Pre-Commit Checklist

- [ ] Run `npm run lint` - No linting errors
- [ ] Run `npm run build` - Successful TypeScript compilation
- [ ] Run `npm run test` - All tests pass
- [ ] Review changes - No debug code or console.logs
- [ ] Update documentation - If needed

## Environment Management

### Development Environment

```bash
# .env.local (development)
DATABASE_URL=postgresql://...6543/postgres?pgbouncer=true
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
```

### Production Environment

```bash
# Production environment variables
DATABASE_URL=postgresql://...6543/postgres?pgbouncer=true
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...
NODE_ENV=production
```

**Important:**
- Never commit `.env.local` to git
- Use different Clerk keys for dev/prod
- Verify DATABASE_URL port (6543) and `?pgbouncer=true`

## Performance Optimization

### Database

```typescript
// ✅ Good - use connection pooling and indexes
// Connection already optimized in db/db.ts
// - Port 6543 (Transaction Mode)
// - Small pool size (2)
// - Singleton pattern in development

// Add indexes for frequent queries
await db.schema
  .createIndex('votes_user_id_idx')
  .on(votes)
  .column('user_id')
  .execute();
```

### Frontend

```tsx
// ✅ Good - lazy load heavy components
import dynamic from 'next/dynamic';

const HeavyChart = dynamic(
  () => import('@/components/results-v2/demographic-heatmap'),
  { loading: () => <LoadingSpinner /> }
);

// ✅ Good - memoize expensive computations
import { useMemo } from 'react';

const sortedStatements = useMemo(
  () => statements.sort((a, b) => b.votes - a.votes),
  [statements]
);
```

### Caching

```typescript
// ✅ Good - cache AI-generated content
export class AIService {
  private static cache = new Map<string, { data: any; expires: number }>();

  static async generateInsight(pollId: string, userId: string) {
    const cacheKey = `${pollId}-${userId}`;
    const cached = this.cache.get(cacheKey);

    if (cached && cached.expires > Date.now()) {
      return cached.data;
    }

    const insight = await this.generate(pollId, userId);

    this.cache.set(cacheKey, {
      data: insight,
      expires: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
    });

    return insight;
  }
}
```

## Debugging

### Development Tools

```bash
# Database debugging
npm run db:health        # Check connection health
npm run db:stress        # Test under load

# Next.js debugging
NEXT_PUBLIC_DEBUG=true npm run dev

# Verbose logging
DEBUG=* npm run dev
```

### Common Issues

#### Database Connection Errors

```bash
# Check connection health
npm run db:health

# Common fixes:
# 1. Verify port 6543 (not 5432)
# 2. Verify ?pgbouncer=true parameter
# 3. Check DATABASE_URL format
# 4. Restart development server
```

#### TypeScript Errors

```bash
# Clear Next.js cache
rm -rf .next

# Rebuild
npm run build

# Check types explicitly
npx tsc --noEmit
```

#### Test Failures

```bash
# Run specific test file
npm run test -- path/to/test.ts

# Run with verbose output
npm run test -- --reporter=verbose

# Update snapshots
npm run test -- -u
```

## Security Best Practices

### Input Validation

```typescript
// ✅ Always validate user input
import { z } from 'zod';

const userInputSchema = z.object({
  content: z.string().max(500).trim(),
  email: z.string().email(),
});

export async function handleUserInput(input: unknown) {
  const validated = userInputSchema.parse(input);
  // Safe to use validated data
}
```

### Rate Limiting

```typescript
// ✅ Apply rate limiting to public endpoints
import { voteLimiter } from '@/lib/utils/rate-limit';

export async function POST(request: Request) {
  const userId = await getUserId(request);

  const allowed = await voteLimiter.check(userId);
  if (!allowed) {
    return new Response('Rate limit exceeded', { status: 429 });
  }

  // Process request
}
```

### Authentication

```typescript
// ✅ Always verify authentication
import { auth } from '@clerk/nextjs';

export async function protectedAction() {
  const { userId } = auth();

  if (!userId) {
    throw new Error('Unauthorized');
  }

  // Process authenticated request
}
```

## Documentation

### Code Comments

```typescript
// ✅ Good - explain why, not what
/**
 * Uses Transaction Mode (port 6543) instead of Session Mode (5432)
 * because it supports 10,000+ concurrent connections vs 15-50.
 * Critical for Next.js serverless architecture.
 */
const connectionString = process.env.DATABASE_URL;

// ❌ Bad - redundant
// This is a connection string
const connectionString = process.env.DATABASE_URL;
```

### README Updates

- Update when adding major features
- Document new environment variables
- Add setup instructions for new dependencies

## Additional Resources

### Internal Documentation

- **[DATABASE.md](DATABASE.md)** - Database architecture
- **[ARCHITECTURE.md](ARCHITECTURE.md)** - System architecture
- **[UI_DESIGN.md](UI_DESIGN.md)** - Design system
- **[USE_CASES.md](../../USE_CASES.md)** - User journeys
- **[UX_UI_SPEC.md](../../UX_UI_SPEC.md)** - UX/UI specification

### External Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Drizzle ORM Documentation](https://orm.drizzle.team)
- [Clerk Documentation](https://clerk.com/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Vitest Documentation](https://vitest.dev)
