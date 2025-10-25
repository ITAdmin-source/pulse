# 🚨 TEST SAFETY GUIDE - READ BEFORE RUNNING TESTS

## CRITICAL: Integration Tests Are Destructive!

**Integration tests in this project DELETE ALL DATA from the connected database.**

This is by design for test isolation, but it means you must **NEVER** run integration tests against production data.

---

## What Happened (October 25, 2025)

Our production database was accidentally wiped when someone ran integration tests that connected to the live Supabase database. The tests executed:

```sql
DELETE FROM votes;
DELETE FROM user_roles;
DELETE FROM statements;
DELETE FROM polls;
DELETE FROM users;
```

This deleted all production data because:
1. Tests were configured to use production DATABASE_URL
2. No safety checks existed to prevent this
3. The cleanup runs before/after EVERY test

---

## Safety Protections Now In Place

### 🛡️ Automatic Safety Checks

The following safety checks are now enforced in `tests/utils/db-test-helpers.ts`:

1. **Production Detection**: Tests will FAIL if DATABASE_URL contains:
   - `supabase.com`
   - `prod`
   - `production`

2. **Environment Check**: Tests will FAIL if:
   - `NODE_ENV === 'production'`

3. **Explicit Permission Required**: Tests will FAIL unless:
   - `ALLOW_DESTRUCTIVE_TESTS=true` is set

**These checks run BEFORE any database deletion occurs.**

---

## How to Run Integration Tests Safely

### Option 1: Separate Test Database (RECOMMENDED)

1. **Create a test database in Supabase:**
   - Go to Supabase Dashboard
   - Create a new project called `pulse-test`
   - Copy the connection string (Transaction Mode, port 6543)

2. **Configure environment:**
   ```bash
   # In .env.local (or .env.test)
   TEST_DATABASE_URL=postgresql://postgres.[REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true
   ALLOW_DESTRUCTIVE_TESTS=true
   ```

3. **Update test setup:**
   ```typescript
   // tests/setup.ts
   config({
     path: process.env.TEST_DATABASE_URL
       ? '.env.test'  // Use test database
       : '.env.local' // Fallback (will be blocked by safety checks)
   })
   ```

4. **Run tests:**
   ```bash
   npm run test:integration
   ```

### Option 2: Local PostgreSQL (ALTERNATIVE)

1. **Install PostgreSQL locally**

2. **Create test database:**
   ```bash
   createdb pulse_test
   ```

3. **Run migrations:**
   ```bash
   DATABASE_URL=postgresql://localhost:5432/pulse_test npm run db:migrate
   ```

4. **Configure environment:**
   ```bash
   # In .env.test
   DATABASE_URL=postgresql://localhost:5432/pulse_test
   ALLOW_DESTRUCTIVE_TESTS=true
   ```

5. **Run tests:**
   ```bash
   npm run test:integration
   ```

---

## What Tests Will Do

### Unit Tests (`npm run test:quick`)
✅ **SAFE** - No database interaction, all mocked

### Integration Tests (`npm run test:integration`)
⚠️ **DESTRUCTIVE** - Requires safety checks to pass

**For EACH test:**
1. `beforeEach` → `setupTest()` → **DELETE ALL DATA**
2. Run test with fresh data
3. `afterEach` → `teardownTest()` → **DELETE ALL DATA**

**Affected tables:**
- `votes`
- `user_roles`
- `statements`
- `polls`
- `users`

---

## Safety Check Errors

### Error 1: Production Database Detected

```
╔═══════════════════════════════════════════════════════════════════════╗
║  🚨 CRITICAL ERROR: PRODUCTION DATABASE DELETION BLOCKED! 🚨          ║
║  DATABASE_URL contains 'supabase.com'                                 ║
╚═══════════════════════════════════════════════════════════════════════╝
```

**Solution:** Create a separate test database. Do NOT disable this check.

### Error 2: ALLOW_DESTRUCTIVE_TESTS Not Set

```
╔═══════════════════════════════════════════════════════════════════════╗
║  🚨 SAFETY CHECK: ALLOW_DESTRUCTIVE_TESTS not set                     ║
║  Set ALLOW_DESTRUCTIVE_TESTS=true to proceed                          ║
╚═══════════════════════════════════════════════════════════════════════╝
```

**Solution:** Only set this variable when using a dedicated test database:
```bash
ALLOW_DESTRUCTIVE_TESTS=true npm run test:integration
```

---

## Emergency: Bypassing Safety Checks

**⚠️ DANGER: Only do this if you understand the risks!**

If you need to bypass safety checks temporarily (e.g., running tests in a Docker container with a disposable database):

1. Understand that ALL DATA will be deleted
2. Set environment variables:
   ```bash
   ALLOW_DESTRUCTIVE_TESTS=true
   NODE_ENV=test
   ```
3. Ensure DATABASE_URL points to a disposable database

**NEVER bypass these checks with production data!**

---

## Best Practices

### ✅ DO:
- Create a separate test database
- Set `ALLOW_DESTRUCTIVE_TESTS=true` only in test environments
- Use unit tests for most testing (faster, safer)
- Commit `.env.test.example` with safe test configuration
- Document test database setup for team members

### ❌ DON'T:
- Run integration tests against production
- Set `ALLOW_DESTRUCTIVE_TESTS=true` in production
- Disable safety checks
- Share production DATABASE_URL in test configs
- Commit `.env.test` or `.env.local` to git

---

## File Locations

- **Safety checks:** `tests/utils/db-test-helpers.ts`
- **Test setup:** `tests/setup.ts`
- **Test configuration:** `vitest.config.ts`
- **Integration tests:** `tests/integration/`

---

## Questions?

If you're unsure whether it's safe to run tests:

1. Check `DATABASE_URL` in your environment
2. Verify it doesn't point to production
3. Ensure you have a backup
4. When in doubt, **ask before running tests**

---

## Recovery

If production data was accidentally deleted:

1. **Stop immediately** - don't run more tests
2. **Restore from backup:**
   - Supabase Dashboard → Database → Backups
   - Choose the most recent backup before deletion
3. **Implement safety fixes** (already done in this commit)
4. **Verify test configuration** before running tests again

---

## Incident Prevention Checklist

- [ ] Separate test database created
- [ ] TEST_DATABASE_URL configured
- [ ] ALLOW_DESTRUCTIVE_TESTS only in test environment
- [ ] Safety checks tested and working
- [ ] Team members trained on test safety
- [ ] Documentation reviewed
- [ ] Backup verification procedure in place

---

**Remember: Integration tests are powerful but dangerous. Use them wisely!**
