# Poll Revisit Scenarios - Code Analysis Report

**Date:** 2025-10-04
**Scope:** Analysis of codebase compliance with TEST_SCENARIOS.md Section 5 (Poll Revisit Scenarios)

---

## Executive Summary

The codebase demonstrates **strong partial implementation** of poll revisit scenarios, with robust support for core voting progress tracking, session management, and poll state handling. However, several critical user-facing features and edge cases from the test scenarios are **NOT implemented**, particularly around welcoming messages, explicit continue/finish options on the poll page, and handling of deleted statements.

**Overall Compliance:** ~65% ✓ Implemented, ~35% ✗ Missing or Incomplete

---

## Detailed Analysis by Scenario Category

### ✅ **WELL IMPLEMENTED** - Anonymous User Revisits (Poll Still Open)

#### TC-REVISIT-001 to TC-REVISIT-003: Anonymous user returns with votes below/above threshold

**Status:** ✓ **MOSTLY IMPLEMENTED**

**Evidence:**
1. **Session Recognition** ([lib/utils/session.ts](lib/utils/session.ts:7-25))
   - Session cookie persists for 1 year
   - Automatically retrieved/created via `getOrCreateSessionId()`
   - Cookie name: `pulse_session_id`, httpOnly, secure in prod

2. **Progress Restoration** ([app/polls/[slug]/vote/page.tsx](app/polls/[slug]/vote/page.tsx:209-260))
   ```typescript
   // Lines 213-217: Loads voting progress
   const progressResult = await getVotingProgressAction(fetchedPoll.id, dbUser.id);
   const { totalVoted, totalStatements, currentBatch, thresholdReached } = progressResult.data;

   // Lines 229-248: Loads correct batch and resumes from next unvoted statement
   const batchResult = await getStatementBatchAction(fetchedPoll.id, dbUser.id, currentBatch);
   const manager = new StatementManager(batchResult.data, userVotesLookup, ...);
   ```

3. **Progress Tracking** ([lib/services/voting-service.ts](lib/services/voting-service.ts:386-413))
   - `getVotingProgress()` returns: `totalVoted`, `currentBatch`, `hasMoreStatements`, `thresholdReached`
   - Batch calculation: `Math.ceil(progress.votedStatements / 10) || 1`

**❌ MISSING FEATURES:**
- **No "Welcome back!" message** - Users don't see explicit confirmation they're resuming
- **No poll page continue button** - Must navigate directly to `/vote` route
- **No progress indicator on poll entry page** - Spec requires showing "X statements completed"

**Location of Issue:** [app/polls/[slug]/page.tsx](app/polls/[slug]/page.tsx:54-86) only shows "Start Voting" button, doesn't check for existing progress

---

#### TC-REVISIT-004: Anonymous user votes all but doesn't click Finish

**Status:** ✓ **IMPLEMENTED**

**Evidence:**
- Lines 247-259 in vote page handle case where no more statements available
- Redirects to insights if threshold reached
- Uses continuation page logic for completion detection

**✓ Correct Behavior:** System properly detects poll completion and redirects

---

#### TC-REVISIT-005: Anonymous user returns after viewing insights

**Status:** ⚠️ **PARTIALLY IMPLEMENTED**

**Evidence:**
- [app/polls/[slug]/insights/page.tsx](app/polls/[slug]/insights/page.tsx:69-118) generates/retrieves insights
- Insights cached in database via `user_poll_insights` table

**❌ MISSING:**
- Poll page doesn't detect "already completed" state
- No special UI for users who've finished (should show "View Your Insights" button on poll page)

---

#### TC-REVISIT-006: Cookie clearing (session lost)

**Status:** ✓ **CORRECTLY HANDLED**

**Evidence:**
- Lines 261-290 in vote page handle new anonymous users
- Creates fresh session, shows demographics modal
- No access to previous votes (expected behavior per spec)

---

### ✅ **WELL IMPLEMENTED** - Anonymous User Revisits (Poll Closed)

#### TC-REVISIT-007 to TC-REVISIT-009: Closed poll access for voters/non-voters

**Status:** ✓ **IMPLEMENTED**

**Evidence:**
1. **Poll Closure Detection** ([app/polls/[slug]/page.tsx](app/polls/[slug]/page.tsx:31-36))
   ```typescript
   const isClosed = poll.status === "closed" ||
                    (poll.endTime && new Date(poll.endTime) < new Date());
   if (isClosed) redirect(`/polls/${slug}/closed`);
   ```

2. **Closed Poll Page** ([app/polls/[slug]/closed/page.tsx](app/polls/[slug]/closed/page.tsx))
   - Lines 64-81: Fetches user votes and checks participation
   - Lines 118-171: Shows insights for voters (if threshold met)
   - Lines 172-194: Shows results-only view for non-voters
   - Lines 78-80: Correctly calculates `hasInsights = votes >= threshold`

3. **Vote Preservation** - All votes remain accessible via `getVotesByUserIdAction()`

**✓ Correct Implementation:** Matches spec exactly for TC-REVISIT-007, TC-REVISIT-008, TC-REVISIT-009

---

### ✅ **WELL IMPLEMENTED** - Authenticated User Revisits

#### TC-REVISIT-010 to TC-REVISIT-012: Cross-device sync and progress restoration

**Status:** ✓ **IMPLEMENTED**

**Evidence:**
1. **User Context** ([contexts/user-context.tsx](contexts/user-context.tsx:26-73))
   - Fetches database user via `/api/user/current`
   - Works across devices (linked to Clerk user ID)
   - Lines 39-62: Auto-upgrade flow for anonymous→authenticated

2. **Cross-Device Progress** ([lib/services/voting-service.ts](lib/services/voting-service.ts:149-167))
   ```typescript
   getUserVotesForPoll(userId: string, pollId: string): Promise<Vote[]>
   // Uses database-backed votes, accessible from any device
   ```

3. **Progress Sync** - Vote page loads progress for authenticated users identically to anonymous (lines 204-260)

**✓ Correct Implementation:** Full cross-device support via database-backed user system

**❌ MISSING:** Same UI issues as anonymous users (no welcome message, no poll page continue button)

---

#### TC-REVISIT-013: New statements added after user completed voting

**Status:** ✗ **NOT IMPLEMENTED**

**Evidence:**
- No code to detect newly added statements
- No notification system for poll updates
- Vote page only loads unvoted statements, but doesn't inform user of new additions

**Impact:** **CRITICAL MISSING FEATURE** - Users can't discover new content added to polls they've already voted on

---

### ⚠️ **PARTIALLY IMPLEMENTED** - Edge Cases

#### TC-REVISIT-E001: Unpublished poll access

**Status:** ✓ **IMPLEMENTED**

**Evidence:**
- Lines 177-182 in vote page check `poll.status !== "published"`
- Returns error message: "This poll is not currently active"
- Redirects to poll page (which shows "Poll Not Available")

**✓ Correct Behavior:** Gracefully handles unpublished polls

---

#### TC-REVISIT-E002: Deleted statements handling

**Status:** ✗ **NOT IMPLEMENTED**

**Evidence:**
- No code to recalculate vote count after statements deleted
- Vote page loads progress based on current votes, but doesn't handle:
  - Threshold recalculation when votes on deleted statements removed
  - User notification about statement deletions

**Location:** [lib/services/voting-service.ts](lib/services/voting-service.ts:201-245) - `getUserVotingProgress()` doesn't filter deleted statements

**Impact:** **BUG RISK** - If statements are deleted, user's vote count becomes invalid but system doesn't update threshold status

---

#### TC-REVISIT-E003: Poll closes during page load

**Status:** ✓ **IMPLEMENTED**

**Evidence:**
- Lines 184-198 in vote page handle poll closing with grace period
- 10-minute grace period allows users to finish current session
- After grace period, redirects to closed page

**✓ Correct Implementation:** Matches spec TC-VOTE-E005 and TC-REVISIT-E003

---

#### TC-REVISIT-E004: Authenticated user revisits after anonymous voting

**Status:** ✓ **IMPLEMENTED**

**Evidence:**
- Lines 39-62 in [contexts/user-context.tsx](contexts/user-context.tsx:39-62)
- Auto-upgrade flow transfers votes from session to account
- Creates new session if user logs out (correct per spec)

**✓ Correct Implementation:** Proper session isolation between authenticated/anonymous states

---

#### TC-REVISIT-E005: Insight generation interruption

**Status:** ⚠️ **PARTIALLY HANDLED**

**Evidence:**
- [app/polls/[slug]/insights/page.tsx](app/polls/[slug]/insights/page.tsx:69-118)
- Lines 70-82: Checks for existing insight, generates if missing
- Lines 83-116: Shows retry options if generation fails

**❌ MISSING:**
- No loading state detection (if generation is still in progress from previous session)
- No background job system to resume interrupted generation
- Relies on page reload to retry

---

#### TC-REVISIT-E006: Direct continuation page URL access

**Status:** ✗ **NOT IMPLEMENTED**

**Evidence:**
- Continuation page is a component, not a route ([components/voting/continuation-page.tsx](components/voting/continuation-page.tsx))
- No route protection exists because there's no URL to protect
- However, spec implies this should be a bookmarkable state

**Impact:** **MINOR** - Not critical since continuation page is transient state

---

#### TC-REVISIT-E007: Multi-device voting conflict

**Status:** ⚠️ **PARTIALLY HANDLED**

**Evidence:**
- Vote page loads fresh progress on each page load (lines 213-217)
- No real-time sync or conflict detection
- User would see updated state only on next page refresh

**❌ MISSING:**
- Real-time state sync between devices
- Conflict notification ("You've completed voting on another device")

**Impact:** **MEDIUM** - Edge case, but could confuse users

---

#### TC-REVISIT-E008: Scheduled poll (not yet active)

**Status:** ✗ **NOT IMPLEMENTED**

**Evidence:**
- Vote page checks `poll.status !== "published"` (line 178)
- But no special handling for future `start_time`
- No countdown or "Coming Soon" message

**Location:** [app/polls/[slug]/page.tsx](app/polls/[slug]/page.tsx:31-52) doesn't check `startTime`

**Impact:** **LOW** - Feature works (poll won't be published), but UX could be improved

---

#### TC-REVISIT-E009 & E010: Poll metadata changes

**Status:** ⚠️ **PARTIALLY HANDLED**

**Evidence:**
- Vote page loads fresh poll data on each visit (lines 168-173)
- Updated question/labels reflected immediately
- No notification system for changes

**✓ Correct Behavior:** Changes take effect, no data corruption
**❌ MISSING:** User notification about changes (nice-to-have, not critical)

---

## Critical Missing Features Summary

### 🔴 **HIGH PRIORITY** (UX Blockers)

1. **Poll Entry Page Continue Button** (TC-REVISIT-001, TC-REVISIT-002, TC-REVISIT-003, TC-REVISIT-010)
   - **Location:** [app/polls/[slug]/page.tsx](app/polls/[slug]/page.tsx)
   - **Issue:** Always shows "Start Voting", never shows "Continue Voting" or completion status
   - **Fix Required:** Add logic to check user progress and show appropriate CTA:
     ```typescript
     if (userVotedCount > 0 && userVotedCount < threshold) {
       // Show "Continue Voting" + progress indicator
     } else if (userVotedCount >= threshold) {
       // Show "View Your Insights" + "View Poll Results"
     } else {
       // Show "Start Voting"
     }
     ```

2. **Welcome Back Message** (TC-REVISIT-001, TC-REVISIT-002, TC-REVISIT-010)
   - **Location:** [app/polls/[slug]/page.tsx](app/polls/[slug]/page.tsx) or voting interface
   - **Issue:** No user-facing confirmation when resuming
   - **Fix Required:** Add message component: "Welcome back! You've voted on X statements so far"

3. **New Statements Notification** (TC-REVISIT-013)
   - **Location:** [app/polls/[slug]/page.tsx](app/polls/[slug]/page.tsx) and vote page
   - **Issue:** Users who completed voting can't discover new statements added later
   - **Fix Required:**
     - Detect if new statements added since last vote
     - Show "New statements available!" banner
     - Offer "Continue Voting" option

### 🟡 **MEDIUM PRIORITY** (Bug Risks)

4. **Deleted Statements Handling** (TC-REVISIT-E002)
   - **Location:** [lib/services/voting-service.ts](lib/services/voting-service.ts:201-245)
   - **Issue:** Vote count includes deleted statements, threshold status may be incorrect
   - **Fix Required:**
     - Filter votes to only count approved statements
     - Recalculate `canFinish` based on valid votes only
     - Show notification if user's votes were affected

5. **Multi-Device Conflict Detection** (TC-REVISIT-E007)
   - **Location:** [app/polls/[slug]/vote/page.tsx](app/polls/[slug]/vote/page.tsx)
   - **Issue:** No real-time sync or notification
   - **Fix Required:** Add version checking or last-updated timestamp comparison

### 🟢 **LOW PRIORITY** (Nice-to-Have)

6. **Scheduled Poll UI** (TC-REVISIT-E008)
   - Show countdown and "Coming Soon" message for polls with future start times

7. **Poll Change Notifications** (TC-REVISIT-E009, E010)
   - Notify users when question/description changes

8. **Insight Generation Resume** (TC-REVISIT-E005)
   - Background job system to handle interrupted insight generation

---

## Code Quality Assessment

### ✅ **Strengths:**

1. **Robust Session Management**
   - 1-year cookie persistence
   - Automatic session creation
   - Clean anonymous→authenticated upgrade path

2. **Comprehensive Progress Tracking**
   - `StatementManager` centralizes navigation logic
   - Batch-based loading for performance
   - Accurate vote counting via database queries

3. **Proper State Restoration**
   - Votes persist across devices
   - Progress calculated on-demand from database
   - No client-side state corruption risks

4. **Closed Poll Handling**
   - Excellent differentiation between voters/non-voters
   - Correct access control (insights only for voters who met threshold)
   - Vote history preserved and accessible

### ⚠️ **Weaknesses:**

1. **Poll Page Entry Point**
   - Doesn't adapt to user state (always shows "Start Voting")
   - Missing progress indicators
   - No completion status display

2. **Statement Lifecycle Edge Cases**
   - Doesn't handle deleted statements gracefully
   - No mechanism to detect new statements for returning users

3. **Real-Time Sync**
   - No multi-device conflict detection
   - Relies on page refresh for state updates

4. **User Communication**
   - Missing "welcome back" messages
   - No notifications for poll updates

---

## Recommendations

### Immediate Actions (Before Launch):

1. **Implement Poll Entry Page State Detection**
   - Add `getVotingProgress()` call to poll page
   - Show contextual CTAs based on user state
   - Display progress indicators

2. **Fix Deleted Statements Bug**
   - Update `getUserVotingProgress()` to filter deleted statements
   - Add migration to clean up orphaned votes

3. **Add Welcome Message Component**
   - Create `<ResumeVotingBanner>` component
   - Show on poll page and vote page when resuming

### Future Enhancements:

4. **New Statement Detection System**
   - Track `last_voted_at` timestamp per user/poll
   - Compare with latest statement `created_at`
   - Add notification badge

5. **Real-Time State Sync**
   - Consider WebSocket or polling for active voting sessions
   - Show notifications for cross-device conflicts

6. **Background Insight Generation**
   - Move AI generation to async job queue
   - Add status tracking table
   - Implement retry logic

---

## Test Coverage Gaps

Based on analysis, the following test scenarios from TEST_SCENARIOS.md are **not adequately covered** by current code:

- **TC-REVISIT-001** to **TC-REVISIT-003**: Poll page doesn't show continue button ❌
- **TC-REVISIT-005**: Poll page doesn't detect completion state ❌
- **TC-REVISIT-013**: New statements not detected ❌
- **TC-REVISIT-E002**: Deleted statements not handled ❌
- **TC-REVISIT-E007**: No multi-device conflict detection ❌

**Suggested Test Additions:**
- E2E test for poll page state adaptation
- Integration test for deleted statement handling
- Unit test for `getUserVotingProgress()` with deleted statements

---

## Conclusion

The codebase has a **solid foundation** for poll revisit scenarios with excellent session management, progress tracking, and closed poll handling. However, **user-facing features** like adaptive poll page CTAs, welcome messages, and new statement detection are **missing**, which could lead to confusion and reduced engagement.

**Priority:** Address the poll entry page issues before launch, as this is the primary user entry point and currently doesn't reflect the system's robust progress tracking capabilities.

**Estimated Effort:**
- High Priority Fixes: 2-3 days
- Medium Priority Fixes: 3-4 days
- Low Priority Enhancements: 5-7 days

**Overall Grade:** B+ (Strong backend, needs frontend UX polish)
