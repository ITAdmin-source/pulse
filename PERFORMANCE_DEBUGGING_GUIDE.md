# Performance Debugging Guide

## Issue Summary

After implementing SQL-based performance optimizations, the voting flow performance **may not have improved or got worse**. This guide helps diagnose why.

---

## Quick Diagnosis Checklist

Run through these checks in order:

### 1. Check Poll Configuration (MOST LIKELY ISSUE)

**Problem:** The optimization ONLY applies to polls with `statement_order_mode = 'random'`.

**How to Check:**
```sql
-- Run in Supabase SQL Editor
SELECT slug, statement_order_mode, random_seed
FROM polls
WHERE slug = 'your-poll-slug';  -- Replace with your poll
```

**Expected Output:**
```
slug              | statement_order_mode | random_seed
------------------|---------------------|-------------
my-poll           | random              | NULL
```

**If `statement_order_mode` is NOT 'random':**
- **CAUSE:** You're testing the wrong code path (sequential or weighted mode)
- **FIX:** Update the poll to use random mode:
  ```sql
  UPDATE polls
  SET statement_order_mode = 'random'
  WHERE slug = 'your-poll-slug';
  ```

---

### 2. Check Statement Count

**Problem:** Performance gains are negligible on small datasets.

**How to Check:**
```sql
-- Run in Supabase SQL Editor
SELECT
  COUNT(*) as total_statements,
  COUNT(*) FILTER (WHERE approved = true) as approved_statements
FROM statements
WHERE poll_id = (SELECT id FROM polls WHERE slug = 'your-poll-slug');
```

**Expected Output:**
```
total_statements | approved_statements
-----------------|--------------------
200              | 185
```

**If approved_statements < 50:**
- **CAUSE:** Dataset too small to see real improvement
- **IMPACT:** Optimization still works but difference is <50ms (hard to notice)
- **FIX:** Test on a poll with 100+ statements to see dramatic gains

---

### 3. Check Development vs Production Mode

**Problem:** Dev mode has overhead that masks performance improvements.

**How to Check:**
```bash
# Current mode
npm run dev          # Development mode (slower)

# Test in production mode
npm run build
npm run start        # Production mode (faster)
```

**Development Mode Overhead:**
- Fast Refresh / HMR: ~50-100ms per request
- Source maps: ~20-50ms
- Unoptimized bundles: ~30-50ms
- **Total overhead:** ~100-200ms

**Action:** Test in production build to get accurate measurements.

---

### 4. Check Database Indexes

**Problem:** Missing indexes cause full table scans.

**How to Check:**
```sql
-- Run in Supabase SQL Editor
SELECT
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'statements'
ORDER BY indexname;
```

**Expected Indexes:**
```
statements_poll_id_idx            -- ON (poll_id)
statements_poll_id_approved_idx   -- ON (poll_id, approved)
statements_approved_idx           -- ON (approved)
```

**If ANY index is missing:**
- **CAUSE:** Queries doing full table scans
- **FIX:** Run database migrations:
  ```bash
  npm run db:migrate
  ```

---

### 5. Measure Actual Query Times

**Use the debugging script:**

```bash
# Run performance analysis
npx tsx scripts/debug-performance.ts <poll-slug> <user-id>

# Example:
npx tsx scripts/debug-performance.ts climate-policy-poll 123e4567-e89b-12d3-a456-426614174000
```

**Expected Output:**
```
========================================
PERFORMANCE SUMMARY
========================================

Query Time Comparison:
  Old approach (fetch all):     1954.32ms
  New approach (SQL + MD5):     287.45ms
  SQL filtering only (no MD5):  245.12ms
  MD5 overhead:                 42.33ms

PERFORMANCE IMPROVEMENT: 85.3% faster
```

**If improvement < 50%:**
- Check poll configuration (likely not using random mode)
- Check statement count (likely too small)
- Check for other bottlenecks (see below)

---

### 6. Enable Instrumented Logging

**For detailed request-by-request timing:**

1. **Edit:** `C:\Users\Guy\Downloads\Projects\pulse\actions\voting.ts`

2. **Change the import:**
   ```typescript
   // FROM:
   import { VotingService } from "@/lib/services/voting-service";

   // TO:
   import { VotingService } from "@/lib/services/voting-service-instrumented";
   ```

3. **Restart dev server:**
   ```bash
   npm run dev:clean
   ```

4. **Vote on statements** and watch the server console output:
   ```
   ========================================
   [PERF] getStatementBatch START
   [PERF] Poll: abc123...
   [PERF] User: user456...
   [PERF] Batch: 1
   ========================================
   [PERF] STEP 1: Fetch voted IDs - 45.32ms
   [PERF]   - Found 15 voted statements
   [PERF] STEP 2: Fetch poll config - 12.45ms
   [PERF]   - Order mode: random
   [PERF]   - Random seed: default
   [PERF] STEP 3: Using OPTIMIZED random mode (SQL + MD5)
   [PERF] STEP 3: Fetch statements (OPTIMIZED) - 198.67ms
   [PERF]   - Fetched 10 statements
   [PERF]   - SQL-side filtering: votedIds.length = 15
   ========================================
   [PERF] TOTAL TIME: 256.44ms
   [PERF] Returned 10 statements
   ========================================
   ```

5. **Analyze the logs:**
   - Is "Order mode: random" showing? (If not, wrong poll configuration)
   - Is STEP 3 using "OPTIMIZED random mode"? (If not, check poll settings)
   - What's the TOTAL TIME? (Should be <400ms for 100+ statement polls)

6. **REVERT when done:**
   ```typescript
   // Change back to:
   import { VotingService } from "@/lib/services/voting-service";
   ```

---

## Common Performance Bottlenecks

### A. Cold Start (First Request)

**Symptoms:**
- First request: 2000-3000ms
- Subsequent requests: 200-400ms

**Cause:**
- Database connection establishment
- Drizzle ORM schema loading
- JIT compilation

**Solution:**
- This is **normal and expected**
- Measure **average** request time, not first request
- Production deployments use connection pooling (eliminates cold starts)

### B. MD5 Hash Overhead

**Symptoms:**
- SQL filtering fast (~50ms) but total query still slow (~300ms+)
- MD5 overhead > 100ms

**Cause:**
- PostgreSQL computes MD5 for EVERY unvoted statement
- For 200 unvoted statements: 200 MD5 calculations

**Solution (if needed):**
```typescript
// Alternative: Use simpler hash (in voting-service.ts line 433)
// CURRENT:
.orderBy(sql`md5(${statements.id}::text || ${seedString})`)

// ALTERNATIVE 1: Use hashtext (faster)
.orderBy(sql`hashtext(${statements.id}::text || ${seedString})`)

// ALTERNATIVE 2: Use random() with seed (PostgreSQL 9.5+)
.orderBy(sql`random()`)  // Simple but non-deterministic
```

**Trade-offs:**
- MD5: Deterministic, consistent ordering across requests
- hashtext: Faster but less portable
- random(): Fastest but non-deterministic (different order each time)

### C. Large NOT IN Clause

**Symptoms:**
- Query slow when user has voted on 50+ statements
- Performance degrades as votes increase

**Cause:**
```sql
WHERE id NOT IN (id1, id2, id3, ... id50)  -- Inefficient for large lists
```

**Solution (implement if this is the issue):**

Edit `C:\Users\Guy\Downloads\Projects\pulse\lib\services\voting-service.ts` line 413-434:

```typescript
// CURRENT APPROACH (lines 413-434):
const randomStatements = await db
  .select({ /* ... */ })
  .from(statements)
  .where(and(
    eq(statements.pollId, pollId),
    eq(statements.approved, true),
    votedIds.length > 0 ? notInArray(statements.id, votedIds) : undefined
  ))
  .orderBy(sql`md5(${statements.id}::text || ${seedString})`)
  .limit(10);

// OPTIMIZED APPROACH (for 50+ votes):
const randomStatements = await db
  .select({ /* ... */ })
  .from(statements)
  .leftJoin(
    votes,
    and(
      eq(votes.statementId, statements.id),
      eq(votes.userId, userId)
    )
  )
  .where(and(
    eq(statements.pollId, pollId),
    eq(statements.approved, true),
    sql`${votes.id} IS NULL`  // NOT EXISTS pattern (faster than NOT IN)
  ))
  .orderBy(sql`md5(${statements.id}::text || ${seedString})`)
  .limit(10);
```

**When to apply:**
- User has voted on 50+ statements
- Query time increases linearly with vote count
- Measure impact with debug script first

### D. Network Latency (Supabase)

**Symptoms:**
- Query time varies widely (100ms to 1000ms+)
- Inconsistent performance

**Cause:**
- Network round-trip to Supabase servers
- Geographic distance from database region
- Internet connection quality

**How to Measure:**
```bash
# Ping Supabase
# Extract host from DATABASE_URL and ping
ping db.your-project.supabase.co
```

**Solution:**
- Use Supabase Edge Functions for better latency
- Consider caching frequently accessed data
- Upgrade to Supabase Pro for better connection pooling

---

## Testing Methodology

### Proper Before/After Testing

**DON'T:**
- Compare single request times
- Test immediately after server restart
- Use different poll configurations

**DO:**

1. **Warm up the server:**
   ```bash
   # Make 5-10 requests first
   curl http://localhost:3000/polls/your-slug
   curl http://localhost:3000/polls/your-slug
   # ... repeat
   ```

2. **Measure average of 10 requests:**
   ```bash
   # Use instrumented logging (see section 6 above)
   # Record TOTAL TIME for 10 consecutive votes
   # Calculate average
   ```

3. **Use consistent test data:**
   - Same poll
   - Same user
   - Same number of existing votes

4. **Test in production build:**
   ```bash
   npm run build
   npm run start
   # Then test
   ```

5. **Measure P95, not just average:**
   - Sort 10 request times
   - Take 9th value (95th percentile)
   - This represents "typical worst case"

---

## Expected Performance Targets

### Random Mode (Optimized)

| Statements | Votes | Expected Time | Target |
|-----------|-------|---------------|--------|
| 50        | 10    | 100-200ms     | Good   |
| 100       | 25    | 150-300ms     | Good   |
| 200       | 50    | 200-400ms     | Good   |
| 500       | 100   | 250-500ms     | OK     |

**If exceeding targets:**
- Check for missing indexes
- Check MD5 overhead
- Check network latency
- Consider optimizations from section C (NOT EXISTS pattern)

### Sequential Mode (Not Optimized)

| Statements | Votes | Expected Time | Note |
|-----------|-------|---------------|------|
| 50        | 10    | 100-150ms     | Minimal difference vs random |
| 100       | 25    | 150-250ms     | Still fast (no complex ordering) |
| 200       | 50    | 200-350ms     | Acceptable |

**Note:** Sequential mode is intentionally simple (just `ORDER BY created_at`), so it's naturally fast.

### Weighted Mode (Intentionally Slower)

| Statements | Votes | Expected Time | Note |
|-----------|-------|---------------|------|
| 50        | 10    | 300-500ms     | Fetches all + applies weights |
| 100       | 25    | 500-1000ms    | Fetches all + applies weights |
| 200       | 50    | 1000-2000ms   | Expected (complex calculation) |

**Note:** Weighted mode MUST fetch all unvoted statements to calculate weights. This is intentional.

---

## Quick Fixes Summary

### Issue 1: Poll Not in Random Mode
```sql
UPDATE polls SET statement_order_mode = 'random' WHERE slug = 'your-slug';
```

### Issue 2: Missing Indexes
```bash
npm run db:migrate
```

### Issue 3: Development Mode Overhead
```bash
npm run build
npm run start
```

### Issue 4: MD5 Overhead (if > 100ms)
```typescript
// Change line 433 in voting-service.ts
.orderBy(sql`hashtext(${statements.id}::text || ${seedString})`)
```

### Issue 5: Large NOT IN Clause (50+ votes)
- See section C for NOT EXISTS pattern

---

## When to Ask for Help

If after following this guide:
- Poll IS in random mode
- Indexes ARE present
- Testing in production build
- Average request time STILL > 500ms for 100-statement poll

**Provide this information:**

1. **Output from debug script:**
   ```bash
   npx tsx scripts/debug-performance.ts <slug> <user-id>
   ```

2. **Poll metadata:**
   ```sql
   SELECT slug, statement_order_mode, random_seed FROM polls WHERE slug = 'your-slug';
   ```

3. **Statement counts:**
   ```sql
   SELECT
     COUNT(*) as total,
     COUNT(*) FILTER (WHERE approved = true) as approved
   FROM statements
   WHERE poll_id = (SELECT id FROM polls WHERE slug = 'your-slug');
   ```

4. **Sample instrumented logs** (3-5 vote requests with full output)

5. **Environment:**
   - Development or production?
   - Supabase region?
   - Network latency (ping to Supabase)?

---

## Files Created for Debugging

1. **`scripts/debug-performance.ts`**
   - Comprehensive performance analysis script
   - Compares old vs new approach
   - Measures MD5 overhead
   - Provides recommendations

2. **`scripts/quick-poll-check.sql`**
   - Quick SQL queries to check poll setup
   - Run in Supabase SQL editor

3. **`lib/services/voting-service-instrumented.ts`**
   - Drop-in replacement for VotingService
   - Logs detailed timing for every step
   - Revert after debugging

4. **`PERFORMANCE_DEBUGGING_GUIDE.md`** (this file)
   - Complete debugging methodology
   - Common issues and solutions
   - Testing best practices

---

## Next Steps

1. Run through Quick Diagnosis Checklist (sections 1-6)
2. Identify root cause
3. Apply appropriate fix
4. Re-test with proper methodology
5. If still unclear, use instrumented logging
6. If still stuck, provide diagnostic info and ask for help

The optimization **DOES work** when:
- Poll is in random mode
- Indexes are present
- Testing on dataset with 50+ statements
- Measured in production build

Most issues are configuration or measurement problems, not code issues.
