# Testing Guide

Comprehensive guide to the Pulse testing infrastructure and best practices.

---

## Table of Contents

1. [Test Categories](#test-categories)
2. [Running Tests](#running-tests)
3. [Infrastructure Tests](#infrastructure-tests)
4. [Integration Tests](#integration-tests)
5. [Unit Tests](#unit-tests)
6. [E2E Tests](#e2e-tests)
7. [CI/CD Integration](#cicd-integration)
8. [Best Practices](#best-practices)

---

## Test Categories

Pulse uses a multi-layered testing strategy with **four distinct test categories**:

### 1. Unit Tests (`tests/unit/`)
- **Purpose:** Test individual functions, services, and utilities in isolation
- **Speed:** Fast (< 5 seconds for full suite)
- **Database:** No database required (uses mocks)
- **Run Frequency:** On every code change
- **Command:** `npm run test:quick`

**Coverage Thresholds:**
- Services: 90%+ coverage required
- Validations: 100% coverage required
- Utils: 85%+ coverage required

### 2. Integration Tests (`tests/integration/`)
- **Purpose:** Test service interactions with database queries and workflows
- **Speed:** Medium (~10-20 seconds)
- **Database:** Requires running PostgreSQL database
- **Run Frequency:** Before commits, on PR
- **Command:** `npm run test:integration`

**What They Test:**
- Service → Query → Database interactions
- Multi-step workflows (demographics gating, voting flow)
- Database constraints and business rules
- Anonymous-to-authenticated upgrade flows

### 3. E2E Tests (`tests/e2e/`)
- **Purpose:** Test complete user workflows through the browser
- **Speed:** Slow (~30-60 seconds)
- **Database:** Requires running database and dev server
- **Run Frequency:** Before major releases
- **Command:** `npm run test:e2e`

**Framework:** Playwright

### 4. Infrastructure Tests (`scripts/`)
- **Purpose:** Validate database connection health and stability
- **Speed:** Medium to slow (10-20 seconds)
- **Database:** Requires live Supabase connection
- **Run Frequency:** Manual, pre-deployment, scheduled maintenance
- **Commands:** `npm run db:health`, `npm run db:stress`

**What They Test:**
- Connection configuration correctness
- Connection latency and performance
- Concurrent connection handling
- Pool behavior and exhaustion scenarios
- Connection recovery after idle periods

---

## Running Tests

### Quick Reference

```bash
# Development (fast feedback)
npm run test:quick              # Unit tests only (~5s)
npm run test:watch              # Watch mode for active development

# Pre-commit (comprehensive)
npm run test:all                # Unit + Integration + E2E (~60s)

# Specific test suites
npm run test:integration        # Integration tests only
npm run test:e2e                # E2E tests only
npm run test:coverage           # Generate coverage report

# Infrastructure (manual/scheduled)
npm run db:health               # Quick connection health check (~10s)
npm run db:stress               # Comprehensive stress test (~20s)
npm run test:infrastructure     # All infrastructure tests (~30s)
```

### Development Workflow

**During Active Development:**
```bash
npm run test:watch
# Keep this running in a terminal while coding
# Tests auto-run on file changes
```

**Before Committing:**
```bash
npm run test:all
# Ensures all tests pass before pushing
```

**When Database Changes Are Made:**
```bash
npm run test:integration
npm run db:health
# Verifies DB queries and connection health
```

---

## Infrastructure Tests

### Overview

Infrastructure tests validate the **database connection layer** itself, separate from application logic. Created during Supabase connection stability diagnosis (Oct 2025).

**Two Scripts:**
1. **Health Check** (`check-supabase-health.ts`) - Quick diagnostic
2. **Stress Test** (`test-connection-stress.ts`) - Comprehensive load testing

### Health Check (`npm run db:health`)

**6 Automated Tests:**
1. Basic Connection (minimal config)
2. Connection with `prepare: false` (Transaction Mode compatibility)
3. Connection Latency (5 sequential queries, avg timing)
4. Concurrent Connections (10 parallel queries)
5. Pool Behavior (idle timeout and reconnection)
6. Active Database Connections (pool usage monitoring)

**Output Example:**
```
✅ Test 1: Basic Connection - 671ms
✅ Test 2: Connection with prepare: false - 532ms
✅ Test 3: Connection Latency (avg 218ms)
✅ Test 4: Concurrent Connections (10 parallel) - 737ms
✅ Test 5: Pool Behavior - 7014ms
✅ Test 6: Active Database Connections - 537ms

Success Rate: 100% (6/6 tests passed)
```

**When to Run:**
- ✅ Before changing database configuration
- ✅ After updating `DATABASE_URL` or connection settings
- ✅ Pre-deployment verification (production)
- ✅ Weekly scheduled maintenance
- ✅ When investigating connection issues
- ❌ NOT on every PR (unless DB config changed)
- ❌ NOT during typical development

### Stress Test (`npm run db:stress`)

**350 Requests Across 6 Scenarios:**
1. 50 Rapid Sequential Requests
2. 100 Requests with 10 Concurrent
3. 50 Requests with 20 Concurrent (high concurrency)
4. 30 Database-Intensive Queries
5. 100 Concurrent Requests (pool exhaustion test)
6. Post-Idle Recovery Test (after 10-second idle)

**Output Example:**
```
Total Requests: 350
✅ Successful: 350 (100%)
❌ Failed: 0
Throughput: 21 req/sec

✅ Test 1: 50 Rapid Sequential - 100% (avg 157ms)
✅ Test 2: 100 w/ 10 Concurrent - 100% (avg 250ms)
✅ Test 3: 50 w/ 20 Concurrent - 100% (avg 393ms)
✅ Test 4: 30 DB-Intensive Queries - 100% (avg 150ms)
✅ Test 5: 100 Concurrent (pool exhaustion) - 100% (avg 1770ms)
✅ Test 6: Post-Idle Recovery - 100% (avg 242ms)
```

**When to Run:**
- ✅ Monthly scheduled maintenance
- ✅ After major database configuration changes
- ✅ Before critical production deployments
- ✅ When load testing infrastructure
- ❌ NOT on every PR (too slow, 15-20 seconds)
- ❌ NOT during active development

### Configuration Validation

Both scripts automatically validate connection configuration:

```
✅ Port 6543 (Transaction Mode) - correct for serverless
⚠️  WARNING: Port 5432 should NOT use ?pgbouncer=true
```

**Common Issues Detected:**
- Port/parameter mismatch (5432 with `?pgbouncer=true`)
- Missing `prepare: false` for Transaction Mode
- Pool size too large for serverless
- High latency (>100ms average)
- Connection pool exhaustion

---

## Integration Tests

### Database Requirements

Integration tests require a **running PostgreSQL database** (Supabase or local).

**Environment Setup:**
```bash
# .env.local must contain valid DATABASE_URL
DATABASE_URL=postgresql://...pooler.supabase.com:6543/postgres?pgbouncer=true
```

**Database State Management:**
- Tests use `DatabaseTestHelper` for isolated test data
- Automatic cleanup after each test (no pollution)
- Seeding utilities for common test scenarios

### Key Integration Test Suites

1. **Demographics Gating** (`tests/integration/workflows/demographics-gating.test.ts`)
   - 12 comprehensive tests
   - Tests mandatory demographics flow
   - Boundary conditions (9 vs 10 votes)
   - Anonymous user upgrade with demographics transfer

2. **Vote Immutability** (enforced in service layer)
   - Votes cannot be changed once cast
   - Duplicate vote attempts rejected
   - Unique constraint per (user_id, statement_id)

3. **Statement Manager** (`tests/unit/services/statement-manager.test.ts`)
   - 33 comprehensive tests
   - Statement batching logic (10 per batch)
   - Progress tracking and navigation
   - Edge cases (exactly 10 statements, fewer than 10)

### Running Integration Tests

```bash
# All integration tests
npm run test:integration

# Specific integration test file
npx vitest run tests/integration/workflows/demographics-gating.test.ts

# Watch mode for integration tests
npx vitest tests/integration --watch
```

---

## Unit Tests

### Philosophy

Unit tests focus on **isolated business logic** without external dependencies.

**What to Mock:**
- Database queries (mock return values)
- External APIs (Clerk, AI services)
- File system operations
- Network requests

**What NOT to Mock:**
- Internal utility functions
- Zod validation schemas
- Pure business logic

### Coverage Requirements

Defined in `vitest.config.ts`:

```typescript
thresholds: {
  'lib/services/**': {
    branches: 90, functions: 90, lines: 90, statements: 90
  },
  'lib/validations/**': {
    branches: 100, functions: 100, lines: 100, statements: 100
  },
  'lib/utils/**': {
    branches: 85, functions: 85, lines: 85, statements: 85
  },
}
```

**Critical Services:**
- VotingService - 90%+ coverage (vote immutability, progress tracking)
- PollService - 90%+ coverage (lifecycle management, slug generation)
- UserService - 90%+ coverage (anonymous upgrade, role management)

### Running Unit Tests

```bash
# Fast unit test run (no coverage)
npm run test:quick

# With coverage report
npm run test:coverage

# Watch mode
npm run test:watch

# Specific test file
npx vitest run tests/unit/services/voting-service.test.ts
```

---

## E2E Tests

### Playwright Configuration

E2E tests use **Playwright** for browser automation.

**Browsers Tested:**
- Chromium (primary)
- Firefox
- WebKit (Safari)

### Running E2E Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run in headed mode (see browser)
npx playwright test --headed

# Run specific test
npx playwright test tests/e2e/voting-flow.spec.ts

# Generate test code (interactive)
npx playwright codegen http://localhost:3000
```

### E2E Test Best Practices

1. **Test complete user journeys** (not individual components)
2. **Use data-testid attributes** for stable selectors
3. **Mock external services** (avoid real API calls)
4. **Clean up test data** after each test
5. **Use fixtures** for common setup (logged-in user, test poll)

---

## CI/CD Integration

### Current CI/CD Strategy

**On Every PR:**
```bash
npm run lint           # Code quality checks
npm run build          # TypeScript compilation
npm run test:quick     # Fast unit tests
```

**On Merge to Main:**
```bash
npm run test:all       # All application tests
```

**Pre-Deployment:**
```bash
npm run db:health      # Connection verification
npm run build          # Production build
```

### Recommended GitHub Actions Workflow

**For Database Configuration Changes:**
- Trigger: PRs modifying `db/db.ts`, connection scripts, or `.env.local.example`
- Run: `npm run db:health` (not stress test, too slow)
- Fail deployment if health check fails

**Scheduled Maintenance:**
- Weekly: `npm run db:health` (Sunday midnight UTC)
- Monthly: `npm run db:stress` (1st of month)
- Alert team if failures detected

---

## Best Practices

### Test Design Principles

1. **Isolate tests** - Each test should be independent
2. **Fail fast, fail clearly** - Descriptive error messages
3. **Test behavior, not implementation** - Focus on what, not how
4. **Mock external dependencies** - Clerk, Supabase RPC, AI services
5. **Use AAA pattern** - Arrange, Act, Assert
6. **Clean up after tests** - No state pollution

### Test Naming Conventions

```typescript
describe('ServiceName', () => {
  describe('methodName', () => {
    it('should do expected thing when condition', async () => {
      // Test implementation
    })

    it('should throw error when invalid input', async () => {
      // Error case
    })
  })
})
```

### Infrastructure Test Best Practices

1. **Run health check before changing DB config** - Baseline current state
2. **Run stress test after major changes** - Verify stability under load
3. **Monitor latency trends** - Average should be < 100ms
4. **Check active connections** - Should match expected pool size
5. **Investigate 100% immediately** - Any failure indicates critical issue

### Coverage Best Practices

**Prioritize Critical Paths:**
- ✅ Vote immutability enforcement (100% coverage)
- ✅ Demographics gating logic (100% coverage)
- ✅ Statement batching (100% coverage)
- ✅ Anonymous user upgrade (100% coverage)
- ✅ Poll lifecycle transitions (100% coverage)

**Acceptable Lower Coverage:**
- UI components (focus on critical interactions)
- Test utilities (self-validating)
- Migration scripts (one-time execution)

---

## Troubleshooting

### Common Issues

**"Integration tests failing - database connection refused"**
- Verify `DATABASE_URL` in `.env.local`
- Check database is running (Supabase or local PostgreSQL)
- Run `npm run db:health` to diagnose

**"Infrastructure tests passing but app connection failing"**
- Check Node.js version (should be 20+)
- Verify singleton pattern in `db/db.ts`
- Review dev server logs for connection errors

**"E2E tests timing out"**
- Increase timeout in playwright.config.ts
- Check dev server is running (`npm run dev`)
- Verify test database has seeded data

**"Coverage thresholds not met"**
- Run `npm run test:coverage` to see detailed report
- Focus on uncovered critical paths first
- Add tests for error scenarios and edge cases

---

## Additional Resources

**Documentation:**
- [Supabase Connection Troubleshooting](./SUPABASE_CONNECTION_TROUBLESHOOTING.md)
- [Connection Diagnosis Report](./CONNECTION_DIAGNOSIS_REPORT.md)
- [Connection Fix Summary](./CONNECTION_FIX_SUMMARY.md)

**Test Utilities:**
- `tests/utils/db-test-helpers.ts` - Database test helpers
- `tests/utils/custom-matchers.ts` - Custom Vitest matchers
- `tests/setup.ts` - Global test configuration

**Health Endpoints:**
- `/api/health/db` - Basic database health check
- `/api/test/database-connection` - Detailed connection test

---

**Last Updated:** October 19, 2025
**Maintained By:** QA Team
**Version:** 2.0
