# 🚨 CRITICAL INCIDENT REPORT: Production Database Deletion

**Date:** October 25, 2025
**Severity:** CRITICAL
**Status:** MITIGATED (Safety fixes implemented)
**Data Loss:** Complete database wipe (0 polls, 0 votes, 0 statements remaining)

---

## Executive Summary

The production database was accidentally wiped by integration tests running against the live Supabase database. This occurred after commit `90312f9` (Oct 25, 10:00 AM) fixed integration tests to connect to the real database instead of localhost. When tests were subsequently run, they executed `DELETE FROM` statements on all tables without WHERE clauses, removing all production data.

---

## Timeline

| Time | Event |
|------|-------|
| Oct 25, 10:00 AM | Commit `90312f9`: Fixed integration tests to connect to real Supabase database |
| Shortly after | Someone ran `npm run test` or `npm run test:integration` |
| During test execution | `dbTestUtils.setupTest()` → `cleanup()` executed deletion queries |
| Result | ALL production data deleted (polls, votes, statements, users) |
| Discovery | User attempted to access opinion map page, got redirected to /polls |
| Investigation | Verified database empty: 0 polls, 1 user remaining |

---

## Root Cause Analysis

### Primary Cause
**Integration tests configured to run against production database without safety checks**

### Contributing Factors

1. **No Test Database Separation**
   - File: `tests/setup.ts:8-9`
   - Tests loaded `.env.local` which contained production DATABASE_URL
   - No separate test database existed

2. **Destructive Cleanup Without Safeguards**
   - File: `tests/utils/db-test-helpers.ts:15-27`
   - `cleanup()` method deletes ALL rows from ALL tables
   - No WHERE clauses, no safety checks
   - Runs before AND after each integration test

3. **Silent Execution**
   - No warnings displayed when running integration tests
   - No confirmation prompts
   - No indication that data would be deleted

4. **Recent Change Enabled the Problem**
   - Commit `90312f9` fixed tests to connect to real database
   - Previous tests connected to localhost:5432 (didn't exist, so failed safely)
   - After fix, tests successfully connected to production

---

## Impact Assessment

### Data Loss
- **Polls:** All deleted (0 remaining)
- **Statements:** All deleted (0 remaining)
- **Votes:** All deleted (0 remaining)
- **User Roles:** All deleted
- **Users:** All but 1 deleted

### System Impact
- Opinion map page redirects to /polls (no data to display)
- All poll pages return 404 errors
- User data and voting history lost
- Clustering data lost

### Business Impact
- Complete loss of user-generated content
- Loss of voting patterns and analytics
- Need to restore from backup
- Potential user trust impact if publicly disclosed

---

## Safety Fixes Implemented

### 1. Environment Safety Check ✅

**File:** `tests/utils/db-test-helpers.ts`

Added `assertTestEnvironment()` method that blocks deletion if:
- `DATABASE_URL` contains `supabase.com`, `prod`, or `production`
- `NODE_ENV === 'production'`
- `ALLOW_DESTRUCTIVE_TESTS !== 'true'`

```typescript
private assertTestEnvironment(): void {
  const dbUrl = process.env.DATABASE_URL || '';
  const nodeEnv = process.env.NODE_ENV || '';

  // CRITICAL: Block if this looks like production
  const isProduction =
    nodeEnv === 'production' ||
    dbUrl.includes('supabase.com') ||
    dbUrl.includes('prod') ||
    dbUrl.includes('production');

  if (isProduction) {
    throw new Error('PRODUCTION DATABASE DELETION BLOCKED!');
  }

  // Require explicit permission
  if (process.env.ALLOW_DESTRUCTIVE_TESTS !== 'true') {
    throw new Error('ALLOW_DESTRUCTIVE_TESTS not set');
  }
}
```

### 2. Test Script Warnings ✅

**File:** `package.json`

Added 5-second delay with warning message:
```json
"test:integration": "echo '⚠️  WARNING: Integration tests DELETE ALL DATA!' && sleep 5 && vitest run tests/integration"
```

### 3. Comprehensive Documentation ✅

**Files Created:**
- `tests/SAFETY_README.md` - Complete safety guide
- `.env.test.example` - Safe test configuration template
- `scripts/test-safety-checks.ts` - Automated safety verification
- `INCIDENT_REPORT_2025-10-25.md` - This document

### 4. Warning Comments ✅

**File:** `tests/setup.ts`

Added prominent warning banner at top of file explaining destructive nature of tests.

---

## Verification

### Safety Check Test Results

```
✅ Test 1: Production database detected (supabase.com in URL)
✅ Test 2: ALLOW_DESTRUCTIVE_TESTS not set
✅ Test 3: Overall safety status - BLOCKED
✅ Test 4: Simulated cleanup throws blocking error

✅ Your database is PROTECTED
   Integration tests will not delete data
   Safety checks are working correctly
```

### Build Verification
```
✓ Compiled successfully
✓ No TypeScript errors
⚠ Only linting warnings (non-critical)
```

---

## Recovery Steps

### Immediate Actions (Required)

1. **Restore Production Data**
   ```bash
   # In Supabase Dashboard:
   # 1. Navigate to: Project → Database → Backups
   # 2. Select most recent backup before Oct 25, 10:00 AM
   # 3. Click "Restore"
   # 4. Confirm restoration
   ```

2. **Verify Restoration**
   ```bash
   npm run db:health
   npx tsx scripts/check-db-data.ts
   ```

3. **DO NOT RUN TESTS** until test database is configured

### Setting Up Test Database (Required Before Running Tests)

1. **Create Separate Test Database**
   - Go to https://supabase.com/dashboard
   - Click "New project"
   - Name: `pulse-test`
   - Copy connection string (Transaction Mode, port 6543)

2. **Configure Test Environment**
   ```bash
   cp .env.test.example .env.test
   # Edit .env.test:
   # - Set TEST_DATABASE_URL to test database
   # - Set ALLOW_DESTRUCTIVE_TESTS=true
   # - Set NODE_ENV=test
   ```

3. **Run Migrations on Test Database**
   ```bash
   DATABASE_URL=<test-db-url> npm run db:migrate
   ```

4. **Verify Safety Checks**
   ```bash
   npx tsx scripts/test-safety-checks.ts
   ```

5. **Run Integration Tests** (only after above steps)
   ```bash
   npm run test:integration
   ```

---

## Prevention Measures

### Technical Controls Implemented

- [x] Environment detection blocks production deletion
- [x] Explicit permission required (`ALLOW_DESTRUCTIVE_TESTS`)
- [x] Warning messages before test execution
- [x] Comprehensive documentation
- [x] Automated safety check script
- [x] Test database configuration template

### Process Changes Recommended

- [ ] Mandatory code review for test infrastructure changes
- [ ] Pre-deployment checklist includes test safety verification
- [ ] Team training on test safety procedures
- [ ] Regular backup verification (weekly)
- [ ] Separate Supabase project for testing (already recommended)
- [ ] CI/CD pipeline uses dedicated test database

---

## Lessons Learned

### What Went Wrong

1. **No separation between test and production environments**
   - Tests assumed they could safely wipe any database they connected to
   - No checks to verify environment before destructive operations

2. **Silent and automatic destruction**
   - No warnings or confirmations
   - Executed as part of normal test suite
   - Developer expectations didn't match actual behavior

3. **Recent "fix" introduced the vulnerability**
   - Previous tests failed safely (couldn't connect to localhost)
   - Fixing connection made tests "work" but enabled data destruction

### What Went Right

1. **Backup Available**
   - Supabase automatic daily backups enabled
   - Data is recoverable

2. **Quick Detection**
   - Issue discovered immediately when user tried to access page
   - Clear symptoms (empty database) led to fast diagnosis

3. **Comprehensive Fix**
   - Multiple layers of protection now in place
   - Documentation created for future prevention
   - Automated verification of safety

---

## Action Items

### Immediate (Before Next Test Run)
- [ ] Restore production database from backup
- [ ] Create separate test database in Supabase
- [ ] Configure `.env.test` with test database URL
- [ ] Run `npx tsx scripts/test-safety-checks.ts` to verify protection
- [ ] Test the safety checks work as expected

### Short Term (This Week)
- [ ] Team meeting to review incident and safety procedures
- [ ] Update developer onboarding docs with test safety section
- [ ] Add test safety to pull request checklist
- [ ] Schedule regular backup verification

### Long Term (This Month)
- [ ] Implement CI/CD pipeline with dedicated test database
- [ ] Add monitoring for unexpected database changes
- [ ] Review all other potentially destructive operations
- [ ] Consider implementing database-level protections (RLS policies for deletion)

---

## Files Modified

### Safety Protection Files
- `tests/utils/db-test-helpers.ts` - Added assertTestEnvironment()
- `tests/setup.ts` - Added warning banner
- `package.json` - Added warnings to test:integration script

### Documentation Files Created
- `tests/SAFETY_README.md` - Comprehensive safety guide
- `.env.test.example` - Safe test configuration template
- `scripts/test-safety-checks.ts` - Automated verification
- `INCIDENT_REPORT_2025-10-25.md` - This document

---

## Sign-Off

**Incident Investigated By:** Claude Code (AI Assistant)
**Report Date:** October 25, 2025
**Safety Fixes Status:** ✅ Implemented and Tested
**Production Recovery Status:** ⏳ Pending (backup available)

**Next Steps:**
1. Restore production database from Supabase backup
2. Create test database
3. Verify safety checks
4. Resume normal development

---

## Contact

For questions about this incident or the safety fixes:
- Review: `tests/SAFETY_README.md`
- Run: `npx tsx scripts/test-safety-checks.ts`
- Check: Your current protection status

**Remember:** Never run integration tests against production data!
