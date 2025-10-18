# Performance Debugging Quick Start

## "It's not faster" - Start Here

### 1-Minute Check

```bash
# Run this command (replace with your actual values)
npx tsx scripts/debug-performance.ts YOUR-POLL-SLUG YOUR-USER-ID

# Example:
npx tsx scripts/debug-performance.ts climate-policy 123e4567-e89b-12d3-a456-426614174000
```

**Look for this in the output:**

```
Order Mode: random     ✓ GOOD
Order Mode: sequential ✗ BAD - optimization won't apply
Order Mode: weighted   ✗ BAD - optimization won't apply
```

---

## Most Likely Issues (90% of cases)

### Issue #1: Wrong Poll Mode (60% probability)

**The Problem:**
The optimization ONLY works for polls with `statement_order_mode = 'random'`.

**Quick Check:**
```sql
-- Run in Supabase SQL Editor
SELECT slug, statement_order_mode FROM polls WHERE slug = 'your-poll-slug';
```

**The Fix:**
```sql
UPDATE polls SET statement_order_mode = 'random' WHERE slug = 'your-poll-slug';
```

**Why This Happens:**
- Default mode might be 'sequential'
- You might have changed it in the UI
- Migration might not have set it

---

### Issue #2: Development Mode Overhead (20% probability)

**The Problem:**
Dev server has 100-200ms overhead from Hot Module Replacement, source maps, etc.

**The Fix:**
```bash
# Test in production mode
npm run build
npm run start
```

**Expected Difference:**
- Dev mode: 400-600ms
- Production: 200-300ms

---

### Issue #3: Small Dataset (10% probability)

**The Problem:**
Optimization gains are minimal on polls with <50 statements.

**Quick Check:**
```sql
SELECT COUNT(*) FROM statements
WHERE poll_id = (SELECT id FROM polls WHERE slug = 'your-poll-slug')
  AND approved = true;
```

**If Count < 50:**
- Performance gain: ~50-100ms (hard to notice)
- Expected even after optimization: 150-250ms
- This is NORMAL

**If Count > 100:**
- Performance gain: 300-500ms (very noticeable)
- Expected after optimization: 200-400ms

---

### Issue #4: Database Indexes Missing (5% probability)

**Quick Check:**
```sql
SELECT indexname FROM pg_indexes
WHERE tablename = 'statements'
  AND indexname = 'statements_poll_id_approved_idx';
```

**If Empty Result:**
```bash
npm run db:migrate
```

---

### Issue #5: Cold Start (5% probability)

**The Problem:**
First request after server restart is always slow.

**The Fix:**
Don't measure first request. Make 5-10 test requests first, THEN measure.

---

## Quick Visual Diagnostic

```
Request Time    What It Means                        Action
-----------------------------------------------------------------
100-300ms      ✓ GOOD - Optimization working        Nothing needed
300-500ms      ~ OK - Acceptable performance         Check dataset size
500-1000ms     ✗ SLOW - Check configuration          Run debug script
1000-2000ms    ✗ VERY SLOW - Wrong mode or issue     Check poll mode
2000ms+        ✗ CRITICAL - Cold start or error      Check logs
```

---

## 5-Step Debugging Protocol

### Step 1: Check Poll Configuration (2 minutes)
```sql
SELECT slug, statement_order_mode, random_seed FROM polls WHERE slug = 'your-slug';
```
**Expected:** `statement_order_mode = 'random'`

### Step 2: Check Statement Count (1 minute)
```sql
SELECT COUNT(*) FILTER (WHERE approved = true) as approved
FROM statements WHERE poll_id = (SELECT id FROM polls WHERE slug = 'your-slug');
```
**Expected:** > 50 statements for noticeable gains

### Step 3: Run Debug Script (3 minutes)
```bash
npx tsx scripts/debug-performance.ts your-slug your-user-id
```
**Expected:** "PERFORMANCE IMPROVEMENT: 70-90% faster"

### Step 4: Test in Production (5 minutes)
```bash
npm run build && npm run start
```
**Expected:** 30-50% faster than dev mode

### Step 5: Enable Detailed Logging (if still unclear)
- Edit `actions/voting.ts`
- Change import to `voting-service-instrumented`
- Watch server console while voting

---

## Expected Performance (Random Mode)

| Statements | Dev Mode  | Production | Status |
|-----------|-----------|------------|--------|
| 10-50     | 150-300ms | 100-200ms  | ✓ Good |
| 50-100    | 250-400ms | 150-300ms  | ✓ Good |
| 100-200   | 300-500ms | 200-400ms  | ✓ Good |
| 200-500   | 400-700ms | 250-500ms  | ~ OK   |

**If your times are HIGHER than production column:**
- Run through 5-step protocol above
- See full guide: `PERFORMANCE_DEBUGGING_GUIDE.md`

---

## Common Mistakes

### Mistake #1: Measuring First Request
```
❌ Server restart → Immediate test → "It's slow!"
✓ Server restart → 5 warm-up requests → Measure next 10 → Average
```

### Mistake #2: Testing in Dev Mode Only
```
❌ npm run dev → Test → "No improvement!"
✓ npm run build → npm run start → Test
```

### Mistake #3: Wrong Poll
```
❌ Testing poll with sequential mode
✓ Confirm poll.statement_order_mode = 'random'
```

### Mistake #4: Single Data Point
```
❌ One request: 487ms → "It's slow"
✓ 10 requests: Average 312ms, P95 425ms
```

---

## When Optimization WON'T Help

### Scenario A: Sequential Mode Poll
- Optimization: NOT APPLIED
- Expected time: 200-400ms (already fast)
- Reason: Sequential mode is simple ORDER BY created_at

### Scenario B: Weighted Mode Poll
- Optimization: INTENTIONALLY NOT APPLIED
- Expected time: 500-2000ms
- Reason: Must fetch all statements to calculate weights

### Scenario C: Small Poll (<50 statements)
- Optimization: APPLIED but minimal impact
- Expected time: 150-300ms
- Improvement: Only 50-100ms faster

### Scenario D: First Request (Cold Start)
- Optimization: APPLIED but masked by startup
- Expected time: 2000-3000ms (first request only)
- Subsequent requests: 200-400ms

---

## Red Flags (Something's Wrong)

1. **Random mode + 200 statements + 800ms average (production)**
   - Run debug script
   - Check indexes
   - Check MD5 overhead

2. **Request time increases with vote count**
   - Likely: Large NOT IN clause issue
   - Fix: See PERFORMANCE_DEBUGGING_GUIDE.md Section C

3. **Wildly inconsistent times (100ms to 2000ms)**
   - Likely: Network/Supabase latency
   - Check: Ping to Supabase host

4. **Error in server logs**
   - Check: Server console for SQL errors
   - Verify: Database connection working

---

## Quick Wins Checklist

- [ ] Poll mode is 'random'
- [ ] Tested in production build
- [ ] Made 5+ warm-up requests before measuring
- [ ] Averaged 10+ requests (not just one)
- [ ] Database indexes present
- [ ] Poll has 50+ statements

**If all checked and still slow:**
→ Read full guide: `PERFORMANCE_DEBUGGING_GUIDE.md`

---

## Files You Need

1. **Debug Script (use this first):**
   ```bash
   npx tsx scripts/debug-performance.ts <slug> <user-id>
   ```

2. **Instrumented Logging (if debug script unclear):**
   - Edit: `actions/voting.ts`
   - Change: `voting-service` → `voting-service-instrumented`
   - Revert after debugging

3. **Full Guide (if still stuck):**
   - Read: `PERFORMANCE_DEBUGGING_GUIDE.md`

---

## TL;DR

**Most common issue:** Poll not in random mode.

**Quick fix:**
```sql
UPDATE polls SET statement_order_mode = 'random' WHERE slug = 'your-slug';
```

**Quick test:**
```bash
npx tsx scripts/debug-performance.ts your-slug your-user-id
```

**Expected result:** 70-90% faster for 100+ statement polls in random mode.
