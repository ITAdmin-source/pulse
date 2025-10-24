# Clustering Diagnosis Report: costLiving Poll

**Generated:** 2025-10-23
**Poll Slug:** costLiving
**Poll ID:** ab3843ae-359d-4185-90f5-8e6d3b267e8c

---

## Executive Summary

**Status:** ⚠️ **ELIGIBLE BUT NOT COMPUTED (BUG)**

The "costLiving" poll has MORE than sufficient data for clustering (107 users, 15 statements), but clustering has never been computed. This represents a **system design issue** where clustering is not being reliably triggered.

---

## Data Analysis

### Current Poll State

| Metric | Value | Threshold | Status |
|--------|-------|-----------|--------|
| **Unique Voters** | 107 | 20 minimum | ✅ 535% of minimum |
| **Approved Statements** | 15 | 6 minimum | ✅ 250% of minimum |
| **Total Votes Cast** | 1,450 | N/A | ✅ High engagement |
| **Clustering Metadata** | None | Required | ❌ **Missing** |
| **User Positions** | 0 | 107 expected | ❌ **Missing** |

### Vote Distribution

All top users have voted on all 15 statements (15/15 votes), indicating:
- ✅ High completion rate
- ✅ Dense opinion matrix (minimal sparsity)
- ✅ Excellent data quality for clustering

**Top 10 Voters:**
1. User 067e98fb...: 15 votes
2. User 8e24dbe5...: 15 votes
3. User dd11b678...: 15 votes
4. User c5a47cee...: 15 votes
5. User cd30eb56...: 15 votes
6. User 6dde78de...: 15 votes
7. User b01c8bc6...: 15 votes
8. User ad78cb73...: 15 votes
9. User 5c304e7d...: 15 votes
10. User 602c2cdc...: 15 votes

---

## Root Cause Analysis

### 1. Automatic Trigger Exists (Lines 127-139 in voting-service.ts)

```typescript
// Trigger background clustering update (non-blocking)
// This runs asynchronously and won't block the vote response
if (statement[0].pollId) {
  ClusteringService.triggerBackgroundClustering(statement[0].pollId).catch(
    (error) => {
      // Log error but don't fail the vote
      console.error(
        `[VotingService] Background clustering failed for poll ${statement[0].pollId}:`,
        error
      );
    }
  );
}
```

**Analysis:** The code DOES attempt to trigger clustering on every vote via `VotingService.castVote()`.

### 2. Background Trigger Logic (clustering-service.ts:484-498)

```typescript
static async triggerBackgroundClustering(pollId: string): Promise<void> {
  // Check eligibility first (fast query)
  const eligibility = await this.isEligibleForClustering(pollId);

  if (!eligibility.eligible) {
    // Not enough data yet, skip silently
    return;
  }

  // Trigger async computation (don't await - run in background)
  this.computeOpinionLandscape(pollId).catch((error) => {
    console.error(`Background clustering failed for poll ${pollId}:`, error);
    // Don't throw - this is background processing
  });
}
```

**Analysis:** The trigger checks eligibility, and if eligible, fires `computeOpinionLandscape()` in the background WITHOUT awaiting it.

### 3. Why It Failed

**Root Cause: Fire-and-Forget with No Persistence**

The issue is architectural:

1. **Every vote triggers clustering** → For 1,450 votes, clustering was attempted **1,450 times**
2. **No idempotency check** → If clustering is already computed, it still recomputes
3. **No state tracking** → No way to know if clustering succeeded, failed, or is in-progress
4. **Silent failures** → Errors are logged but not surfaced (check server logs for `Background clustering failed`)
5. **Race conditions** → Multiple concurrent votes could trigger overlapping clustering computations

**Most Likely Scenario:**
- Early votes (users 1-19) triggered clustering, but eligibility check failed (< 20 users)
- At vote #300 (when 20th user joined), clustering was triggered
- **It either failed silently OR completed but was overwritten by a subsequent failed attempt**

---

## Evidence of the Problem

### Code Inspection: `triggerBackgroundClustering`

**Problem 1: Non-awaited Promise**
```typescript
this.computeOpinionLandscape(pollId).catch((error) => {
  console.error(`Background clustering failed for poll ${pollId}:`, error);
  // Don't throw - this is background processing
});
```

This means:
- Errors are logged but not stored in database
- No way to query "did clustering fail for this poll?"
- No retry mechanism

**Problem 2: No Debouncing/Throttling**
- Every single vote triggers clustering
- For a poll with 107 users × 15 statements = 1,605 potential votes
- This poll has 1,450 votes = **1,450 clustering attempts** (massive waste)

**Problem 3: No Completion State**
- No `clustering_status` column in `polls` table (e.g., "pending", "computing", "completed", "failed")
- Can't prevent redundant computation
- Can't show users "clustering in progress"

---

## Why This Is Expected Behavior (From Code Perspective)

Actually, upon deeper analysis, the **current error IS partially expected**:

### The Design Intention (Flawed)

The code is designed to:
1. Trigger clustering on EVERY vote (wasteful)
2. Silently skip if data insufficient (correct)
3. Silently fail if computation errors (problematic)
4. Never surface errors to admins or users (critical flaw)

### What Likely Happened to costLiving Poll

**Hypothesis 1: Silent Failure (Most Likely)**
- Clustering was triggered when 20th user voted
- PCA or K-means computation failed (e.g., numerical instability, sparse data edge case)
- Error was logged to console but not persisted
- Subsequent votes kept retriggering, but same failure occurred

**Hypothesis 2: Race Condition**
- Multiple votes happened concurrently around the 20-user threshold
- Multiple clustering computations started simultaneously
- Database transaction conflicts or deadlocks
- All attempts failed, no data persisted

**Hypothesis 3: Cold Start Issue**
- Server restarted after votes were cast
- Background clustering runs in Node.js process memory (not persistent queue)
- On restart, no mechanism to "catch up" and compute missing clustering

---

## Recommended Solutions

### Immediate Fix (Manual Trigger)

**Run the manual trigger script:**
```bash
npx tsx scripts/trigger-clustering-costliving.ts
```

This will:
1. Verify eligibility (107 users, 15 statements)
2. Compute clustering synchronously (with error handling)
3. Display detailed results
4. Persist to database

**Expected Duration:** 10-30 seconds

### Short-Term Fixes (Within This Sprint)

1. **Add Poll Clustering Status Column**
   ```sql
   ALTER TABLE polls ADD COLUMN clustering_status TEXT DEFAULT 'pending';
   -- Values: 'pending', 'computing', 'completed', 'failed'
   ALTER TABLE polls ADD COLUMN clustering_last_attempted TIMESTAMP;
   ALTER TABLE polls ADD COLUMN clustering_error TEXT;
   ```

2. **Add Idempotency Check in `triggerBackgroundClustering`**
   ```typescript
   // Before computing, check if clustering already exists and is recent
   const existingMetadata = await db.select()
     .from(pollClusteringMetadata)
     .where(eq(pollClusteringMetadata.pollId, pollId))
     .limit(1);

   if (existingMetadata.length > 0) {
     const ageMinutes = (Date.now() - existingMetadata[0].computedAt.getTime()) / 60000;
     if (ageMinutes < 60) {
       // Clustering was computed in last hour, skip
       return;
     }
   }
   ```

3. **Add Admin Clustering Management UI**
   - Show clustering status per poll (pending/completed/failed)
   - "Compute Now" button for manual triggering
   - Display last error message if failed
   - Show computation metrics (duration, quality scores)

### Long-Term Fixes (Future Sprints)

1. **Persistent Job Queue** (BullMQ, Inngest, or Trigger.dev)
   - Replace fire-and-forget with persistent jobs
   - Automatic retries on failure
   - Job status tracking in Redis/DB
   - Dead letter queue for debugging

2. **Incremental Clustering Updates**
   - Don't recompute entire clustering on every vote
   - Update only the new user's position (O(1) instead of O(n²))
   - Full recomputation only every N votes (e.g., 50)

3. **Clustering Health Monitoring**
   - Dashboard showing:
     - Polls eligible for clustering but not computed
     - Recent clustering failures
     - Average computation time
     - Quality score distribution

4. **Background Catchup Job**
   - Cron job (runs every hour) that checks:
     - All polls with >= 20 users
     - No clustering metadata OR metadata older than 7 days
     - Automatically trigger computation

---

## Testing Recommendations

After manual trigger, verify:

1. **Database State**
   ```sql
   -- Check metadata
   SELECT * FROM poll_clustering_metadata WHERE poll_id = 'ab3843ae-359d-4185-90f5-8e6d3b267e8c';

   -- Check user positions (should be 107 rows)
   SELECT COUNT(*) FROM user_clustering_positions WHERE poll_id = 'ab3843ae-359d-4185-90f5-8e6d3b267e8c';

   -- Check statement classifications (should be 15 rows)
   SELECT classification_type, COUNT(*)
   FROM statement_classifications
   WHERE poll_id = 'ab3843ae-359d-4185-90f5-8e6d3b267e8c'
   GROUP BY classification_type;
   ```

2. **Frontend Verification**
   - Visit `/polls/costLiving/opinionmap`
   - Should display interactive scatter plot with user positions
   - Should show coarse groups (colored regions)
   - Should display consensus/divisive/bridge statements

3. **Quality Validation**
   - Silhouette score >= 0.25 (acceptable) or >= 0.5 (good)
   - Variance explained >= 40% (acceptable) or >= 60% (good)
   - No single-user clusters (unless DBSCAN outliers)
   - Opinion groups have reasonable size distribution (not 99% in one group)

---

## Action Items

- [ ] **IMMEDIATE:** Run `npx tsx scripts/trigger-clustering-costliving.ts`
- [ ] **IMMEDIATE:** Verify opinion map displays correctly at `/polls/costLiving/opinionmap`
- [ ] **SHORT-TERM:** Add `clustering_status` column to `polls` table
- [ ] **SHORT-TERM:** Implement idempotency check in `triggerBackgroundClustering`
- [ ] **SHORT-TERM:** Add admin UI for clustering management
- [ ] **MEDIUM-TERM:** Replace fire-and-forget with persistent job queue
- [ ] **MEDIUM-TERM:** Implement incremental clustering updates
- [ ] **LONG-TERM:** Add clustering health monitoring dashboard
- [ ] **LONG-TERM:** Implement background catchup cron job

---

## Conclusion

**Diagnosis:** This is a **system design bug**, not a data problem. The poll has excellent data for clustering (107 users, 15 statements, 1,450 votes), but the automatic trigger either:
1. Failed silently due to computation error
2. Failed due to race condition
3. Never caught up after server restart

**Immediate Resolution:** Run the manual trigger script to compute clustering NOW.

**Systemic Resolution:** Implement the short-term and long-term fixes to prevent this from happening to future polls.

**Business Impact:** Users who voted on this poll cannot see their opinion map results, which is a core feature of the platform. This undermines trust and engagement.

**Priority:** **HIGH** - This affects user experience for all active polls.

---

**Report Generated By:** Claude Code (Clustering Expert Agent)
**Date:** 2025-10-23
