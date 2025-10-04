# Pulse - Comprehensive Test Scenarios & Edge Cases

**Version:** 1.0
**Date:** 2025-10-04
**Purpose:** QA test coverage for all user workflows, standard cases, and edge cases

---

## Table of Contents

1. [Anonymous User Scenarios](#anonymous-user-scenarios)
2. [Authenticated User Scenarios](#authenticated-user-scenarios)
3. [Voting Interface Scenarios](#voting-interface-scenarios)
4. [Statement Submission Scenarios](#statement-submission-scenarios)
5. [Poll Revisit Scenarios](#poll-revisit-scenarios)
6. [Poll Creator/Owner Scenarios](#poll-creatorowner-scenarios)
7. [Admin & Manager Scenarios](#admin--manager-scenarios)
8. [Cross-Device & Session Scenarios](#cross-device--session-scenarios)
9. [Edge Cases & Error Conditions](#edge-cases--error-conditions)
10. [Performance & Load Scenarios](#performance--load-scenarios)
11. [Security & Permission Scenarios](#security--permission-scenarios)
12. [UI/UX Edge Cases](#uiux-edge-cases)
13. [Data Integrity Scenarios](#data-integrity-scenarios)

---

## Anonymous User Scenarios

### Standard Cases

#### TC-ANON-001: First-time visitor discovers poll
**Steps:**
1. User visits poll listing page without account
2. Browses published polls
3. Clicks on a poll card
4. Views poll question and description
5. Clicks "Start Voting"

**Expected:**
- No sign-in required
- Session generated (browser cookie)
- No user record created yet (lazy creation)
- Demographics modal appears before first statement card

#### TC-ANON-002: Anonymous user skips demographics
**Steps:**
1. User starts voting flow
2. Demographics modal appears
3. User clicks "Skip" button

**Expected:**
- Modal closes
- No demographics stored
- User record created with session_id only
- First statement card appears
- Demographics never requested again for this session

#### TC-ANON-003: Anonymous user provides partial demographics
**Steps:**
1. User starts voting flow
2. Demographics modal appears
3. User selects age group only (leaves other fields empty)
4. Clicks "Continue"

**Expected:**
- User record created with session_id
- Only age group saved
- Other demographic fields remain null
- First statement card appears

#### TC-ANON-004: Anonymous user provides full demographics
**Steps:**
1. User starts voting flow
2. Demographics modal appears
3. User fills all fields (age, gender, ethnicity, political party)
4. Clicks "Continue"

**Expected:**
- User record created with session_id
- All demographics saved
- First statement card appears
- Demographics locked for this session

#### TC-ANON-005: Anonymous user votes on 10 statements (reaches threshold)
**Steps:**
1. User votes on 10 statements in sequence
2. Votes are mixed (agree, disagree, unsure)
3. After 10th vote, user sees continuation page

**Expected:**
- Progress bar shows completion of first batch
- Continuation page displays:
  - "You've voted on 10 statements so far"
  - Vote distribution summary (X agree, Y disagree, Z unsure)
  - No total count shown
  - Continue Voting button (primary)
  - Finish & See Results button (secondary)

#### TC-ANON-006: Anonymous user finishes after minimum threshold
**Steps:**
1. User completes first batch (10 statements)
2. Continuation page appears
3. User clicks "Finish & See Results"

**Expected:**
- Loading screen: "Analyzing your responses..."
- Personal insight generated
- Insight screen displays with title and body
- Share and View Poll Results buttons visible
- No Save button (anonymous user)

#### TC-ANON-007: Anonymous user continues voting beyond threshold
**Steps:**
1. User completes first batch (10 statements)
2. Continuation page appears
3. User clicks "Continue Voting"

**Expected:**
- Next batch of up to 10 statements loads
- Progress bar resets visually
- Statement counter shows cumulative numbering (e.g., "Statement 11 of 20")
- User can vote on additional statements

#### TC-ANON-008: Anonymous user votes through all statements
**Steps:**
1. Poll has 32 approved statements
2. User votes through all batches without pressing Finish
3. After voting on statement 32, no more statements remain

**Expected:**
- Automatically triggers completion flow
- Insight generation begins
- No continuation page after final statement
- User sees personal insights

### Edge Cases

#### TC-ANON-E001: Anonymous user closes browser mid-voting (before threshold)
**Steps:**
1. User votes on 5 statements
2. Closes browser tab
3. Returns to same poll URL later (same browser, same session)

**Expected:**
- Session recognized via cookie
- Progress bar shows 5 completed segments
- Message: "Welcome back! Continue voting where you left off"
- Shows "You've voted on 5 statements"
- Resumes at statement 6
- Cannot review previous votes
- Finish button still disabled (threshold not met)

#### TC-ANON-E002: Anonymous user closes browser mid-voting (after threshold)
**Steps:**
1. User votes on 15 statements (threshold met)
2. Closes browser tab
3. Returns to same poll URL later

**Expected:**
- Session recognized
- Progress bar shows 15 completed segments
- Resumes at statement 16
- Finish button now enabled
- Can press Finish or continue voting

#### TC-ANON-E003: Anonymous user clears cookies mid-session
**Steps:**
1. User votes on 7 statements
2. Clears browser cookies/cache
3. Refreshes page or returns to poll

**Expected:**
- New session generated (old session ID lost)
- Previous votes NOT accessible
- Treated as new visitor
- Demographics modal appears again
- Starts from beginning

#### TC-ANON-E004: Demographics modal dismissed via X button
**Steps:**
1. User starts voting
2. Demographics modal appears
3. User clicks X (close button) instead of Skip or Continue

**Expected:**
- Same behavior as "Skip"
- Modal closes
- No demographics saved
- User record created on first vote
- First statement card appears

#### TC-ANON-E005: Anonymous user attempts to vote on poll with <10 statements
**Steps:**
1. Poll has only 8 approved statements
2. User starts voting
3. User votes on all 8 statements

**Expected:**
- Progress bar shows 8 segments
- No continuation page appears
- After 8th vote, Finish button enabled
- User must press Finish to see insights
- Threshold is "all statements" (8 in this case)

#### TC-ANON-E006: Anonymous user attempts to access closed poll (non-voter)
**Steps:**
1. User never voted on a poll
2. Poll closes (end_time reached)
3. User tries to access poll via direct link

**Expected:**
- Poll page loads with CLOSED badge
- Message: "This poll has ended. You can view the results and insights."
- View Poll Results button visible
- No personal insights (didn't participate)
- No vote history shown
- Can view aggregate poll results

#### TC-ANON-E007: Anonymous user with incomplete votes tries to access insights directly
**Steps:**
1. User votes on 6 statements (below 10 threshold)
2. User manually navigates to `/polls/[slug]/insights` URL

**Expected:**
- Redirect to voting page OR
- Error message: "Complete voting to see insights"
- Finish button still disabled

#### TC-ANON-E008: User creates session but never votes
**Steps:**
1. User opens poll, triggering session creation
2. Views demographics modal
3. Closes browser without voting

**Expected:**
- Session cookie exists
- No user record in database (lazy creation)
- On return, treated as new session
- Demographics modal appears again

#### TC-ANON-E009: Anonymous user on poll with exactly 10 statements
**Steps:**
1. Poll has exactly 10 approved statements
2. User votes on all 10

**Expected:**
- No continuation page (poll exhausted)
- After 10th vote, Finish button enabled
- User presses Finish to see insights
- Threshold met (10 = all statements)

---

## Authenticated User Scenarios

### Standard Cases

#### TC-AUTH-001: New user signs up from poll participation
**Steps:**
1. Anonymous user has voted on 5 statements
2. Clicks "Sign Up" button in header
3. Completes Clerk sign-up flow
4. Returns to application

**Expected:**
- Anonymous votes transferred to authenticated account
- Session ID cleared, Clerk ID linked
- User resumes at same statement (statement 6)
- Demographics NOT re-requested (already provided or skipped)
- Message: "Your progress has been saved to your account"
- Voting continues seamlessly

#### TC-AUTH-002: Existing user signs in on new device
**Steps:**
1. User previously voted on poll from Device A
2. Signs in on Device B
3. Navigates to same poll

**Expected:**
- Voting history loaded from account
- Progress bar shows completed votes
- Resumes from next unvoted statement
- Can access insights if threshold was met
- Cross-device continuity maintained

#### TC-AUTH-003: Authenticated user creates new poll
**Steps:**
1. Signed-in user clicks "Create Poll"
2. Completes 5-step wizard:
   - Step 1: Question and description
   - Step 2: Control settings
   - Step 3: Button labels (optional)
   - Step 4: Scheduling (optional)
   - Step 5: At least 6 initial statements
3. Clicks "Create Poll"

**Expected:**
- Poll created in DRAFT status
- User assigned as poll owner
- Unique slug generated
- Redirected to poll management page
- Poll not visible on public listing

#### TC-AUTH-004: Authenticated user completes voting and views insights
**Steps:**
1. User votes on 10+ statements
2. Clicks Finish button
3. Waits for insight generation

**Expected:**
- Loading screen appears
- AI generates personal insight
- Insight displayed with title and body
- Share button available
- Save button available (authenticated)
- View Poll Results button available

#### TC-AUTH-005: Authenticated user accesses saved insights later
**Steps:**
1. User previously completed voting and saw insights
2. Signs in days later
3. Navigates to poll

**Expected:**
- Insights accessible from user dashboard OR poll page
- Shows previously generated insight
- Can view poll results
- Can see their vote summary (read-only)

### Edge Cases

#### TC-AUTH-E001: User signs up with email already having anonymous votes
**Steps:**
1. Anonymous user votes on Poll A (5 votes)
2. Signs up with email X
3. Anonymous votes transferred to account
4. User signs out
5. Opens new incognito window
6. Votes anonymously on Poll B (3 votes)
7. Signs in with same email X

**Expected:**
- Poll A votes already linked to account
- Poll B votes transferred to account
- New anonymous session merged with existing account
- Both voting histories preserved

#### TC-AUTH-E002: Authenticated user manually navigates to /login while signed in
**Steps:**
1. User is already signed in
2. Manually types `/login` in URL bar

**Expected:**
- Clerk detects existing authentication
- Automatic redirect to home page `/`
- No error message
- Seamless experience

#### TC-AUTH-E003: Authenticated user manually navigates to /signup while signed in
**Steps:**
1. User is already signed in
2. Clicks "Sign Up" link or navigates to `/signup`

**Expected:**
- Clerk detects existing authentication
- Automatic redirect to home page `/`
- No error shown

#### TC-AUTH-E004: User signs out mid-voting session
**Steps:**
1. Authenticated user votes on 7 statements
2. Clicks sign out from UserButton
3. Redirected to home page
4. Navigates back to poll

**Expected:**
- New anonymous session created
- Previous votes (7) saved to account, NOT accessible in new session
- Treated as new anonymous user
- Must vote again from beginning
- Demographics modal appears again

#### TC-AUTH-E005: User tries to access another user's insights
**Steps:**
1. User A completes voting on poll
2. User A manually modifies URL to try accessing insights with different user ID

**Expected:**
- Access denied OR
- Redirected to own insights
- Cannot view other users' insights
- Security check enforced

#### TC-AUTH-E006: User deletes account after voting
**Steps:**
1. User completes voting on multiple polls
2. Deletes Clerk account

**Expected:**
- User record marked as deleted OR removed
- Cascade deletes: votes, statements, insights, roles
- Polls remain intact (votes anonymized or removed)
- Poll statistics updated (vote counts decrease)

#### TC-AUTH-E007: Authenticated user provides demographics again after upgrade
**Steps:**
1. Anonymous user skipped demographics
2. User signs up (upgrades to authenticated)
3. User navigates to profile settings
4. Attempts to add demographics

**Expected:**
- Demographics can be added from profile
- One-time restriction applies to voting flow only
- Profile settings allow demographic updates

---

## Voting Interface Scenarios

### Standard Cases

#### TC-VOTE-001: User votes Agree on statement
**Steps:**
1. User sees clean statement card
2. Clicks "Agree" button (on card)
3. Observes results

**Expected:**
- Vote recorded immediately
- Vote distribution reveals with animation
- Percentages shown (X% agree, Y% disagree, Z% unsure)
- Horizontal bars animate
- User's vote highlighted
- Total vote count displayed
- Auto-advance after 3-5 seconds

#### TC-VOTE-002: User votes Disagree on statement
**Steps:**
1. User sees clean statement card
2. Clicks "Disagree" button (on card)

**Expected:**
- Same behavior as TC-VOTE-001
- Vote value = -1
- Results reveal animation
- Auto-advance

#### TC-VOTE-003: User votes Pass/Unsure on statement
**Steps:**
1. User sees clean statement card
2. Clicks "Pass" or "Unsure" button (below card)

**Expected:**
- Vote recorded as neutral (value = 0)
- Results reveal animation
- Auto-advance after 3-5 seconds

#### TC-VOTE-004: User manually advances to next statement
**Steps:**
1. User votes on statement
2. Results appear
3. User clicks "Next" button before 3-5 second timer

**Expected:**
- Immediate transition to next statement
- Timer bypassed
- Progress bar updates

#### TC-VOTE-005: User observes progress bar during voting
**Steps:**
1. User votes through 5 statements
2. Observes progress bar

**Expected:**
- Instagram-style segmented bar at top
- Each segment represents one statement in current batch
- Filled segments = voted statements
- Current segment animates/pulses
- Empty segments = upcoming statements

#### TC-VOTE-006: Statement counter displays correctly
**Steps:**
1. Poll has 32 statements
2. User votes through batches
3. Observes statement counter

**Expected:**
- Batch 1: "Statement 1 of 10", "2 of 10"..."10 of 10"
- Continuation page appears
- Batch 2: "Statement 11 of 20", "12 of 20"..."20 of 20"
- Continuation page appears
- Batch 3: "Statement 21 of 30", "22 of 30"..."30 of 30"
- Continuation page appears
- Batch 4: "Statement 31 of 32", "32 of 32"
- No continuation page (poll exhausted)

#### TC-VOTE-007: User presses Finish button after threshold
**Steps:**
1. User votes on 10 statements (threshold met)
2. Finish button becomes enabled
3. User clicks Finish button

**Expected:**
- Voting session ends
- Insight generation begins
- Loading screen appears
- Personal insight displayed

### Edge Cases

#### TC-VOTE-E001: User loses internet connection during vote
**Steps:**
1. User clicks "Agree" button
2. Network drops before request completes
3. Vote not recorded on server

**Expected:**
- Optimistic UI: vote saved locally in browser
- Error message: "Connection lost - your votes are saved locally"
- When connection restored, vote synced automatically
- If browser closes before sync, vote lost for anonymous users
- For authenticated users, implement offline queue

#### TC-VOTE-E002: User loses connection and reconnects mid-voting
**Steps:**
1. User votes on 5 statements
2. Network drops
3. User continues voting (saved locally)
4. Network restored after voting on 3 more statements

**Expected:**
- All 8 votes synced to server when connection restored
- Progress bar updates
- User can continue voting
- Seamless recovery

#### TC-VOTE-E003: User tries to go back to previous statement
**Steps:**
1. User votes on statement 5
2. Tries to access statement 4 via browser back button OR UI navigation

**Expected:**
- No back button in UI (forward-only flow)
- Browser back button may go to previous page (poll listing)
- Cannot review or change previous votes
- Votes are final and irreversible

#### TC-VOTE-E004: Finish button behavior before threshold
**Steps:**
1. Poll has 15 statements
2. User votes on 7 statements (below threshold)
3. User attempts to click Finish button

**Expected:**
- Finish button disabled (grayed out)
- Tooltip on hover: "Complete the first 10 statements to finish"
- Button remains visible but not clickable

#### TC-VOTE-E005: Poll closes while user is voting
**Steps:**
1. User votes on 8 statements
2. Poll reaches end_time (poll closes)
3. User tries to vote on statement 9

**Expected:**
- User can continue voting on current session
- Votes cast before closing remain valid
- When user finishes or moves forward:
  - Message: "This poll has closed. Your votes have been saved."
  - Automatically taken to insights (if threshold met)
  - Or taken to poll results summary
- All votes counted despite poll closing

#### TC-VOTE-E006: All statements deleted while user voting
**Steps:**
1. User votes on 4 statements
2. Admin deletes all remaining statements
3. User tries to proceed to next statement

**Expected:**
- Message: "This poll has been updated. Returning to poll list."
- User's 4 votes preserved in database
- If threshold was met before deletion, insights still accessible
- Graceful handling, no data loss

#### TC-VOTE-E007: Vote distribution shows 100% on first vote
**Steps:**
1. User is first to vote on brand new statement
2. Votes "Agree"

**Expected:**
- Distribution shows: 100% agree, 0% disagree, 0% unsure
- Total votes: 1
- User's vote highlighted
- Correct percentage calculation

#### TC-VOTE-E008: User votes on poll with custom button labels
**Steps:**
1. Poll creator set custom labels:
   - Agree → "Support"
   - Disagree → "Oppose"
   - Pass → "Skip"
2. User enters voting interface

**Expected:**
- Statement card shows "Support" and "Oppose" buttons ON card
- "Skip" button shown BELOW card
- Voting logic unchanged (values still -1, 0, 1)
- Results use standard labels (Agree/Disagree/Unsure)

#### TC-VOTE-E009: Progress bar behavior with odd statement counts
**Steps:**
1. Poll has 23 statements
2. User votes through all batches

**Expected:**
- Batch 1: 10 segments (statements 1-10)
- Batch 2: 10 segments (statements 11-20)
- Batch 3: 3 segments (statements 21-23)
- Progress bar adapts to final batch size
- Cumulative counter shows "21 of 23", "22 of 23", "23 of 23"

#### TC-VOTE-E010: User rapidly clicks vote buttons (double-click)
**Steps:**
1. User double-clicks "Agree" button rapidly

**Expected:**
- Only one vote recorded
- Button disabled after first click
- Prevents duplicate votes
- Smooth transition to results

#### TC-VOTE-E011: Vote distribution with large numbers
**Steps:**
1. Statement has 10,000+ votes
2. User casts vote
3. Views distribution

**Expected:**
- Percentages calculated correctly
- Large numbers formatted (10,234 or 10.2k)
- Bars render proportionally
- No performance issues

#### TC-VOTE-E012: User votes on their own submitted statement
**Steps:**
1. User submits a statement (approved)
2. Statement appears in voting queue
3. User encounters their own statement

**Expected:**
- Business rule: user MAY or MAY NOT be able to vote on own statement (configurable)
- If disabled: statement skipped or shows message
- If enabled: user can vote normally

---

## Statement Submission Scenarios

### Standard Cases

#### TC-STMT-001: User submits statement (auto-approval enabled)
**Steps:**
1. User clicks "Submit Statement" during voting
2. Modal appears
3. User types statement text
4. Clicks "Submit"

**Expected:**
- Statement saved to database
- Statement immediately approved (approved = true)
- Message: "Your statement is now live"
- Statement appears in voting queue for other users
- Modal closes
- User returns to same voting card

#### TC-STMT-002: User submits statement (moderation required)
**Steps:**
1. Poll has auto_approve_statements = false
2. User submits statement

**Expected:**
- Statement saved as pending (approved = null)
- Message: "Your statement is pending approval"
- Statement NOT visible to other voters yet
- Owner/manager sees in moderation queue
- Modal closes

#### TC-STMT-003: User previews statement before submitting
**Steps:**
1. User opens submission modal
2. Types statement text
3. Observes preview card

**Expected:**
- Live preview shows statement formatted as card
- Preview updates as user types
- Matches voting card appearance

#### TC-STMT-004: User submits multiple statements in one session
**Steps:**
1. User submits statement A
2. Continues voting
3. Opens modal again
4. Submits statement B

**Expected:**
- Both statements saved
- Both tied to same user ID
- Can submit unlimited statements (no limit unless configured)

### Edge Cases

#### TC-STMT-E001: User submits empty statement
**Steps:**
1. User opens modal
2. Leaves text field empty
3. Attempts to click Submit

**Expected:**
- Submit button disabled
- Cannot submit empty statement
- No error message needed (button just disabled)

#### TC-STMT-E002: User exceeds character limit
**Steps:**
1. User types 250 characters (limit is 200)
2. Observes character counter

**Expected:**
- Character counter shows "250/200" in red or warning color
- Submit button disabled
- Cannot submit until under limit
- Text input may prevent further typing OR show warning

#### TC-STMT-E003: User closes modal without submitting
**Steps:**
1. User opens modal
2. Types partial statement
3. Clicks Cancel or X

**Expected:**
- Modal closes
- Statement NOT saved
- User returns to voting flow
- No data loss (voting progress intact)

#### TC-STMT-E004: Statement submission fails (network error)
**Steps:**
1. User completes statement
2. Clicks Submit
3. Network error occurs

**Expected:**
- Error message: "Submission failed. Please try again."
- Modal remains open
- Statement text preserved
- Retry button available
- User can attempt resubmission

#### TC-STMT-E005: User submits duplicate statement (exact match)
**Steps:**
1. User submits "We should lower taxes"
2. Later, submits "We should lower taxes" again (exact duplicate)

**Expected:**
- System MAY detect duplicate and show warning OR
- Allow duplicate (business decision)
- If duplicates allowed, both saved separately

#### TC-STMT-E006: User submits statement on closed poll
**Steps:**
1. Poll is active
2. User opens submission modal
3. Poll closes (end_time reached) while modal open
4. User clicks Submit

**Expected:**
- Submission rejected
- Message: "This poll has closed and is no longer accepting statements"
- Modal closes
- User directed to results

#### TC-STMT-E007: User submits statement containing profanity/inappropriate content
**Steps:**
1. User submits statement with offensive language
2. Poll has moderation enabled

**Expected:**
- Statement enters moderation queue (not auto-approved even if enabled)
- Optional: Profanity filter flags statement
- Owner/manager reviews and rejects
- Statement deleted (not archived)

#### TC-STMT-E008: Anonymous user submits statement then signs up
**Steps:**
1. Anonymous user submits 2 statements
2. User signs up (authentication upgrade)

**Expected:**
- Statements transferred to authenticated account
- User can track submission status
- Statements linked to Clerk user ID

---

## Poll Revisit Scenarios

This section covers scenarios where users return to a poll they previously interacted with, in various states of completion and poll lifecycle stages.

### Anonymous User Revisits (Poll Still Open)

#### TC-REVISIT-001: Anonymous user revisits after voting on 3 statements (below threshold)
**Steps:**
1. Anonymous user votes on 3 statements (threshold is 10)
2. Closes browser
3. Returns to poll page (same browser/session)
4. Poll is still open (before end_time)

**Expected:**
- Session recognized via cookie
- Poll page shows "Continue Voting" button
- Progress indicator shows "3 statements completed"
- Message: "Welcome back! You've voted on 3 statements so far"
- Clicking Continue returns to voting interface at statement 4
- Progress bar shows 3 completed segments
- Finish button still disabled (threshold not met)
- Cannot review previous votes

#### TC-REVISIT-002: Anonymous user revisits after completing exactly 10 statements (first batch end)
**Steps:**
1. Anonymous user votes on exactly 10 statements
2. Poll has 25 total statements
3. User closes browser at continuation page
4. Returns to poll page (same session)
5. Poll is still open

**Expected:**
- Session recognized
- Poll page shows TWO options:
  - "Continue Voting" (primary) - resumes at statement 11
  - "Finish & See Results" (secondary) - generates insights
- Progress shows "10 statements completed"
- Threshold met indicator shown
- User can choose to continue or finish

#### TC-REVISIT-003: Anonymous user revisits after voting 15 statements (mid second batch)
**Steps:**
1. Anonymous user votes on 15 statements (past threshold)
2. Poll has 30 total statements
3. Closes browser mid-second batch
4. Returns to poll page (same session)
5. Poll is still open

**Expected:**
- Session recognized
- Poll page shows TWO options:
  - "Continue Voting" (primary) - resumes at statement 16
  - "Finish & See Results" (secondary) - generates insights
- Progress shows "15 statements completed"
- Finish button enabled (threshold met)

#### TC-REVISIT-004: Anonymous user revisits after voting all statements but not clicking Finish
**Steps:**
1. Anonymous user votes on all 32 statements
2. User closes browser without clicking Finish
3. Returns to poll page (same session)
4. Poll is still open

**Expected:**
- Session recognized
- Poll page shows "View Your Insights" button (primary)
- Message: "You've completed voting! Click to see your personalized insights"
- No Continue Voting option (all statements exhausted)
- Clicking button generates insights (if not already generated)

#### TC-REVISIT-005: Anonymous user revisits after completing voting and viewing insights
**Steps:**
1. Anonymous user completes voting threshold
2. Clicks Finish, views insights
3. Closes browser
4. Returns to poll page (same session)
5. Poll is still open

**Expected:**
- Session recognized
- Poll page shows:
  - "View Your Insights" button (to see insights again)
  - "View Poll Results" button (to see aggregate results)
- No voting options (already completed)
- Insights cached and displayed immediately
- Message: "You've completed this poll"

#### TC-REVISIT-006: Anonymous user revisits after clearing cookies (session lost)
**Steps:**
1. Anonymous user votes on 12 statements
2. Clears browser cookies/cache
3. Returns to poll page
4. Poll is still open

**Expected:**
- New session created (old session lost)
- Treated as first-time visitor
- Poll page shows "Start Voting" button
- No access to previous 12 votes
- Must start from beginning
- Demographics modal appears again

### Anonymous User Revisits (Poll Closed)

#### TC-REVISIT-007: Anonymous non-voter revisits closed poll
**Steps:**
1. Anonymous user views poll but never votes
2. Poll closes (end_time reached)
3. User returns to poll page (same or new session)

**Expected:**
- Poll page shows "CLOSED" badge
- Message: "This poll has ended. View the results and insights."
- "View Poll Results" button available
- No personal insights (didn't participate)
- Can see aggregate poll results and summary
- No voting interface

#### TC-REVISIT-008: Anonymous voter revisits closed poll (threshold met)
**Steps:**
1. Anonymous user votes on 15 statements (threshold met)
2. Views insights
3. Poll closes
4. User returns to poll page (same session)

**Expected:**
- Poll page shows "CLOSED" badge
- "View Your Insights" button available
- "View Poll Results" button available
- Message: "This poll has ended. Your insights and results are available."
- Can access previously generated insights
- Can view aggregate results

#### TC-REVISIT-009: Anonymous voter revisits closed poll (threshold NOT met)
**Steps:**
1. Anonymous user votes on 6 statements (threshold is 10)
2. Poll closes before user completes threshold
3. User returns to poll page (same session)

**Expected:**
- Poll page shows "CLOSED" badge
- Message: "This poll has ended. You can view the results."
- "View Poll Results" button available
- No personal insights (threshold not met)
- Partial votes saved but insights not generated
- Cannot continue voting

### Authenticated User Revisits (Poll Still Open)

#### TC-REVISIT-010: Authenticated user revisits after voting 5 statements (below threshold)
**Steps:**
1. Authenticated user votes on 5 statements (threshold is 10)
2. Closes browser
3. Returns to poll page (same device or different device)
4. Poll is still open

**Expected:**
- User authenticated, history loaded
- Poll page shows "Continue Voting" button
- Progress indicator shows "5 statements completed"
- Message: "Welcome back! Continue where you left off"
- Clicking Continue resumes at statement 6
- Cross-device continuity works (same progress on all devices)
- Finish button disabled

#### TC-REVISIT-011: Authenticated user revisits after completing exactly 20 statements (second batch end)
**Steps:**
1. Authenticated user votes on exactly 20 statements
2. Poll has 35 total statements
3. User closes browser at continuation page
4. Returns to poll page from different device
5. Poll is still open

**Expected:**
- User authenticated, progress synced
- Poll page shows TWO options:
  - "Continue Voting" (primary) - resumes at statement 21
  - "Finish & See Results" (secondary) - generates insights
- Progress shows "20 statements completed"
- Cross-device sync working
- Threshold met (can finish)

#### TC-REVISIT-012: Authenticated user revisits after completing voting and saving insights
**Steps:**
1. Authenticated user completes voting (threshold met)
2. Views and saves insights to account
3. Closes browser
4. Returns to poll page from different device
5. Poll is still open

**Expected:**
- User authenticated
- Poll page shows:
  - "View Your Insights" button
  - "View Poll Results" button
- Saved insights accessible from any device
- No voting options (already completed)
- Message: "You've completed this poll"

#### TC-REVISIT-013: Authenticated user revisits after voting 30 statements but poll added 10 more
**Steps:**
1. Authenticated user votes on all 30 statements (all available at time)
2. User views insights
3. Poll owner adds 10 more approved statements
4. User returns to poll page
5. Poll is still open

**Expected:**
- User authenticated, progress loaded
- Poll page shows:
  - "New statements available!" notification
  - "Continue Voting" button (to vote on new 10 statements)
  - "View Your Insights" button (to see current insights)
- User can vote on newly added statements
- Insights will regenerate after new votes
- Old insights accessible until new ones generated

### Authenticated User Revisits (Poll Closed)

#### TC-REVISIT-014: Authenticated non-voter revisits closed poll
**Steps:**
1. Authenticated user viewed poll but never voted
2. Poll closes
3. User returns to poll page

**Expected:**
- Poll page shows "CLOSED" badge
- Message: "This poll has ended. View the results."
- "View Poll Results" button available
- No personal insights (didn't participate)
- Can see aggregate results
- No voting interface

#### TC-REVISIT-015: Authenticated voter revisits closed poll (threshold met)
**Steps:**
1. Authenticated user votes on 25 statements (threshold met)
2. Saved insights to account
3. Poll closes
4. User returns to poll page (any device)

**Expected:**
- Poll page shows "CLOSED" badge
- "View Your Insights" button available
- "View Poll Results" button available
- Message: "This poll has ended. Your insights and results are saved to your account."
- Insights accessible forever (saved to account)
- Can view aggregate results
- Cross-device access to insights

#### TC-REVISIT-016: Authenticated voter revisits closed poll (threshold NOT met)
**Steps:**
1. Authenticated user votes on 7 statements (threshold is 10)
2. Poll closes before completion
3. User returns to poll page

**Expected:**
- Poll page shows "CLOSED" badge
- Message: "This poll has ended. You can view the results."
- "View Poll Results" button available
- No personal insights (threshold not met)
- Partial vote history saved to account
- Can view own votes (read-only) in history
- Cannot complete voting

### Edge Cases - Revisit Scenarios

#### TC-REVISIT-E001: User revisits poll that was unpublished by owner
**Steps:**
1. User votes on 8 statements
2. Poll owner unpublishes poll (returns to draft)
3. User returns to poll page

**Expected:**
- Error page or message: "This poll is no longer available"
- OR: "This poll has been temporarily taken down"
- Votes preserved in database (owner can republish)
- User cannot access poll until republished
- Redirect to poll listing page

#### TC-REVISIT-E002: User revisits poll, some voted statements were deleted
**Steps:**
1. User votes on statements 1-10 (threshold met)
2. Owner deletes statements 3, 7, and 9
3. User returns to poll page
4. Poll is still open

**Expected:**
- User's votes on deleted statements removed
- Vote count now shows 7 statements (not 10)
- Threshold recalculated: if still met, Finish enabled; if not, disabled
- User can continue voting on remaining statements
- No error shown (graceful handling)

#### TC-REVISIT-E003: Anonymous user revisits at exact moment poll closes
**Steps:**
1. Anonymous user votes on 12 statements
2. Returns to poll page
3. Poll end_time reached during page load

**Expected:**
- Poll page shows "CLOSED" badge
- If threshold met (12 ≥ 10): "View Your Insights" available
- If threshold not met: "View Poll Results" only
- No voting interface
- Graceful transition to closed state

#### TC-REVISIT-E004: Authenticated user revisits poll they previously voted on anonymously
**Steps:**
1. User votes anonymously on 8 statements (Session A)
2. Signs up for account (votes transferred)
3. Continues voting to 15 statements as authenticated user
4. Signs out
5. Returns to poll page (new anonymous session B)

**Expected:**
- New anonymous session (Session B)
- No access to previous 15 votes (those are on account)
- Treated as first-time visitor
- "Start Voting" button shown
- Can vote again as different anonymous user
- Previous votes tied to account, not this session

#### TC-REVISIT-E005: User revisits poll page while insights are being generated
**Steps:**
1. User completes voting, clicks Finish
2. Insight generation starts (loading screen)
3. User closes browser mid-generation
4. Returns to poll page 30 seconds later

**Expected:**
- If generation completed: "View Your Insights" button shown
- If generation failed: Retry button available with error message
- If still generating: Resume loading screen OR
- Show "Insights are being generated" with retry option
- Graceful handling of interrupted generation

#### TC-REVISIT-E006: User revisits continuation page directly via URL
**Steps:**
1. User votes on 10 statements, sees continuation page
2. User bookmarks or copies continuation page URL
3. Closes browser
4. Directly navigates to continuation page URL

**Expected:**
- Redirect to poll page OR voting interface
- Continuation page is transient, not a standalone route
- User sees appropriate state (continue or finish options)
- No error, graceful handling

#### TC-REVISIT-E007: Multiple devices, one completes voting while other is mid-vote
**Steps:**
1. Authenticated user votes on 8 statements on Device A
2. Simultaneously, opens poll on Device B
3. On Device B, votes on statements 9-15 (completes threshold)
4. On Device A, tries to continue voting

**Expected:**
- Device A syncs state (realtime or on next action)
- Device A shows "You've completed voting on another device"
- Options: View Insights or View Results
- No voting interface on Device A
- Cross-device conflict resolved gracefully

#### TC-REVISIT-E008: User revisits poll with scheduled start time (not yet active)
**Steps:**
1. Poll created with start_time = tomorrow
2. User navigates to poll page

**Expected:**
- Poll page shows "Coming Soon" or countdown
- Message: "This poll will open on [date/time]"
- No voting interface
- User can bookmark or get notified when poll opens
- Poll details (question, description) may be visible

#### TC-REVISIT-E009: User revisits poll page after voting, poll now has custom button labels
**Steps:**
1. User votes on 5 statements (default labels: Agree/Disagree)
2. Poll owner changes button labels to Support/Oppose
3. User returns to continue voting

**Expected:**
- New votes use updated labels (Support/Oppose)
- Previous 5 votes unchanged in data (still -1, 0, 1 values)
- Visual consistency with new labels
- No data corruption
- Results display may use standardized labels

#### TC-REVISIT-E010: User revisits, poll owner changed question/description
**Steps:**
1. User votes on 10 statements on poll "Favorite Color?"
2. Owner changes question to "Best Color for Walls?"
3. User returns to continue voting

**Expected:**
- Updated question/description displayed
- User's previous votes remain valid
- Warning or notification about poll changes (optional)
- User can continue voting with context of new question
- Poll slug may or may not change (business rule)

---

## Poll Creator/Owner Scenarios

### Standard Cases

#### TC-CREATOR-001: User creates poll with minimum requirements
**Steps:**
1. User completes wizard with:
   - Question: "What is your favorite color?"
   - Description: blank
   - Settings: defaults
   - Button labels: defaults
   - Schedule: blank
   - Statements: exactly 6
2. Clicks "Create Poll"

**Expected:**
- Poll created in DRAFT status
- Unique slug generated
- User assigned as owner
- Poll not public
- Can proceed to management page

#### TC-CREATOR-002: User creates poll with all optional fields
**Steps:**
1. User completes wizard with:
   - Question and description
   - Custom button labels
   - Scheduled start/end times
   - 15 initial statements
2. Creates poll

**Expected:**
- All settings saved
- Custom labels stored
- Schedule configured
- Poll remains in DRAFT until start_time

#### TC-CREATOR-003: User publishes draft poll
**Steps:**
1. User creates poll (DRAFT)
2. Navigates to management page
3. Clicks "Publish"
4. Confirms in modal

**Expected:**
- Poll status changes to PUBLISHED
- Poll appears on public listing
- Voting enabled
- URL shareable
- Confirmation message shown

#### TC-CREATOR-004: User unpublishes active poll
**Steps:**
1. Poll is PUBLISHED with 234 voters and 1,547 votes
2. Owner clicks "Unpublish"
3. Confirmation modal appears showing stats
4. Owner confirms

**Expected:**
- Poll status changes to DRAFT
- Poll removed from public listings
- No new votes accepted
- Existing votes and analytics preserved
- Owner can edit and republish later
- Users cannot access poll until republished

#### TC-CREATOR-005: User moderates pending statements
**Steps:**
1. Poll has 5 pending statements
2. Owner reviews each
3. Approves 3, rejects 2

**Expected:**
- Approved statements (3) visible to voters
- Rejected statements (2) deleted permanently
- Moderation queue updated
- Voters see approved statements in voting flow

#### TC-CREATOR-006: User edits poll settings (draft)
**Steps:**
1. Owner edits draft poll
2. Changes question, description, button labels
3. Saves changes

**Expected:**
- All changes saved
- Slug may update if question changes significantly
- Poll remains in DRAFT

#### TC-CREATOR-007: User edits poll settings (published)
**Steps:**
1. Owner edits published poll
2. Attempts to change question

**Expected:**
- Limited editing (depends on business rules)
- May allow description/settings changes
- May prevent question changes
- Warning if changes affect active voting

#### TC-CREATOR-008: User assigns poll manager
**Steps:**
1. Owner opens Roles tab
2. Searches for user by email
3. Assigns "Poll Manager" role
4. Saves

**Expected:**
- User granted manager permissions
- Manager can approve/reject statements
- Manager can view analytics
- Manager cannot delete poll or transfer ownership

#### TC-CREATOR-009: User transfers poll ownership
**Steps:**
1. Owner selects "Transfer Ownership"
2. Chooses new owner
3. Confirms transfer

**Expected:**
- New user becomes poll owner
- Previous owner loses ownership
- Optionally becomes manager
- Confirmation message shown

#### TC-CREATOR-010: User views poll analytics
**Steps:**
1. Owner navigates to Analytics tab
2. Views metrics

**Expected:**
- Total voters displayed
- Total votes displayed
- Average votes per user
- Threshold completion rate
- Most agreed/disagreed statements
- Most divisive statements
- Export data button available

### Edge Cases

#### TC-CREATOR-E001: User tries to create poll with <6 statements
**Steps:**
1. User completes wizard
2. Adds only 5 statements
3. Attempts to click "Create Poll"

**Expected:**
- Create Poll button disabled
- Message: "Need at least 6 to create poll"
- Cannot proceed until 6+ statements added

#### TC-CREATOR-E002: User creates poll with very long question
**Steps:**
1. User enters 500-character question
2. Attempts to proceed

**Expected:**
- Character limit enforced (depends on schema)
- Truncation or validation error
- Question field may have max length

#### TC-CREATOR-E003: User creates poll with duplicate slug
**Steps:**
1. User creates poll: "What is your favorite color?"
2. Later, creates another: "What is your favorite color?"

**Expected:**
- Slug uniqueness enforced
- System appends number: "what-is-your-favorite-color-2"
- Both polls created successfully

#### TC-CREATOR-E004: User publishes poll with <10 statements
**Steps:**
1. User creates poll with 8 statements
2. Publishes poll

**Expected:**
- Poll published successfully
- Voting threshold = 8 (all statements)
- Users must vote on all 8 to finish
- Finish button disabled until all voted

#### TC-CREATOR-E005: User publishes poll with scheduled start time (future)
**Steps:**
1. User sets start_time to tomorrow
2. Publishes poll

**Expected:**
- Poll status = PUBLISHED but not active yet
- Poll not visible on public listing until start_time
- At start_time, poll becomes active automatically

#### TC-CREATOR-E006: User unpublishes poll, edits, and republishes
**Steps:**
1. User unpublishes active poll (234 voters)
2. Poll returns to DRAFT
3. User adds 10 more statements
4. User republishes

**Expected:**
- Existing 234 voters' data preserved
- New statements added to pool
- Existing voters see new statements (haven't voted on them yet)
- Voting continues seamlessly

#### TC-CREATOR-E007: User deletes statement with existing votes
**Steps:**
1. Statement has 500 votes
2. Owner deletes statement

**Expected:**
- Confirmation warning: "500 votes will be deleted"
- If confirmed, statement and all votes deleted
- Vote counts updated
- Voters who voted on it lose that vote from their history

#### TC-CREATOR-E008: User tries to delete poll with active voters
**Steps:**
1. Poll has 1,000 active voters
2. Owner attempts to delete poll

**Expected:**
- Confirmation modal with strong warning
- Shows impact: all votes, insights, statements deleted
- If confirmed, cascade delete occurs
- Poll, statements, votes, insights all removed

#### TC-CREATOR-E009: User bulk approves 50 statements
**Steps:**
1. Moderation queue has 50 pending statements
2. Owner selects all
3. Clicks "Bulk Approve"

**Expected:**
- All 50 statements approved
- All become visible to voters
- Moderation queue cleared
- Performance acceptable (no timeout)

#### TC-CREATOR-E010: User edits button labels to exceed 10 characters
**Steps:**
1. User tries to enter "Strongly Agree" (15 characters)
2. Attempts to save

**Expected:**
- Validation error: "Max 10 characters"
- Cannot save until shortened
- Suggestion to use "S. Agree" or similar

#### TC-CREATOR-E011: User creates poll without end time
**Steps:**
1. User sets start_time but leaves end_time blank
2. Publishes poll

**Expected:**
- Poll remains open indefinitely
- No automatic closing
- Owner must manually close poll

#### TC-CREATOR-E012: User sets end_time before start_time
**Steps:**
1. User sets start_time to tomorrow
2. Sets end_time to today
3. Attempts to save

**Expected:**
- Validation error: "End time must be after start time"
- Cannot save invalid schedule

#### TC-CREATOR-E013: User enables auto-approve but disables user statements
**Steps:**
1. User toggles "Allow user statements" OFF
2. Toggles "Auto-approve" ON
3. Attempts to save

**Expected:**
- Validation warning or auto-disable auto-approve
- Auto-approve only relevant when user statements enabled

#### TC-CREATOR-E014: Poll owner tries to vote in admin view
**Steps:**
1. Owner navigates to admin poll view
2. Sees all statements with distributions
3. Attempts to vote

**Expected:**
- No voting interface in admin view
- Owner can vote separately as regular participant
- Admin view is read-only analytics

---

## Admin & Manager Scenarios

### Standard Cases

#### TC-ADMIN-001: System admin accesses global moderation queue
**Steps:**
1. Admin logs in
2. Navigates to `/admin/moderation`
3. Views all pending statements across all polls

**Expected:**
- List of all pending statements
- Poll context for each
- Submission timestamp
- Submitter info (if available)
- Approve/Reject buttons
- Bulk actions available

#### TC-ADMIN-002: System admin approves statement from another poll
**Steps:**
1. Admin sees statement pending for Poll X (not owned by admin)
2. Reviews statement
3. Clicks Approve

**Expected:**
- Statement approved
- Visible to Poll X voters
- Admin has system-wide permissions

#### TC-ADMIN-003: Poll manager moderates statements for assigned poll
**Steps:**
1. Manager assigned to Poll A
2. Manager navigates to Poll A management
3. Views pending statements
4. Approves/rejects

**Expected:**
- Manager sees only Poll A statements
- Can moderate Poll A only
- No access to other polls
- Cannot delete Poll A or transfer ownership

#### TC-ADMIN-004: Poll manager edits poll settings
**Steps:**
1. Manager opens Settings tab for assigned poll
2. Changes description
3. Toggles user submissions
4. Saves

**Expected:**
- Changes saved
- Manager can edit most settings
- Cannot transfer ownership
- Cannot delete poll

### Edge Cases

#### TC-ADMIN-E001: Admin deletes poll owned by another user
**Steps:**
1. Admin accesses poll owned by User X
2. Deletes poll

**Expected:**
- Poll and all data deleted (cascade)
- User X loses ownership
- Confirmation required
- System admin override successful

#### TC-ADMIN-E002: Manager tries to delete poll they manage
**Steps:**
1. Manager assigned to Poll A
2. Attempts to delete Poll A

**Expected:**
- Action not available (button hidden or disabled)
- Error if manually attempted: "Insufficient permissions"
- Only owner or system admin can delete

#### TC-ADMIN-E003: Manager tries to assign another manager
**Steps:**
1. Manager assigned to Poll A
2. Attempts to assign another manager to Poll A

**Expected:**
- Action not available OR
- Error: "Only poll owner can manage roles"

#### TC-ADMIN-E004: Owner removes manager while manager is active
**Steps:**
1. Manager is viewing Poll A management page
2. Owner removes manager role
3. Manager attempts action

**Expected:**
- Manager's next action fails
- Redirect to unauthorized page
- Error: "You no longer have access to this poll"

#### TC-ADMIN-E005: Global moderation queue with 1,000+ pending statements
**Steps:**
1. Admin accesses moderation queue
2. 1,000+ pending statements exist

**Expected:**
- Pagination or infinite scroll implemented
- Performance acceptable
- Filtering options available (by poll, date)
- Bulk actions functional

---

## Cross-Device & Session Scenarios

### Standard Cases

#### TC-CROSS-001: Authenticated user votes on mobile, views on desktop
**Steps:**
1. User votes on poll via mobile device
2. Signs in on desktop
3. Navigates to same poll

**Expected:**
- Voting history synced
- Progress bar shows completed votes
- Resumes from next unvoted statement
- Insights accessible if threshold met

#### TC-CROSS-002: Anonymous user votes on Device A, signs up on Device B
**Steps:**
1. Anonymous user votes on poll from Device A
2. On Device B, user signs up with email
3. On Device A, user signs in with same email

**Expected:**
- Device A anonymous session upgraded
- Device A votes merged with account
- Device B has no prior votes
- Cross-device sync once authenticated

### Edge Cases

#### TC-CROSS-E001: User has two anonymous sessions simultaneously
**Steps:**
1. User opens poll in Browser A (Chrome)
2. Votes on 5 statements
3. Opens same poll in Browser B (Firefox)
4. Votes on 7 statements
5. Signs up in Browser A
6. Signs in Browser B with same account

**Expected:**
- Browser A: 5 votes transferred to account
- Browser B: 7 votes transferred to account
- Total 12 votes on account (if voting on different statements)
- If voting on same statements, conflict resolution needed

#### TC-CROSS-E002: User votes anonymously, clears cookies, signs up
**Steps:**
1. Anonymous user votes on 10 statements
2. Clears cookies (session lost)
3. Signs up for account
4. Navigates to same poll

**Expected:**
- Previous 10 votes NOT transferred (session lost)
- Treated as new authenticated user
- Must vote again from beginning

#### TC-CROSS-E003: User accesses poll from mobile app (future consideration)
**Steps:**
1. User votes on poll via web
2. Opens native mobile app
3. Signs in

**Expected:**
- Cross-platform data sync
- Voting history accessible
- Consistent experience

---

## Edge Cases & Error Conditions

### Insight Generation Failures

#### TC-ERROR-001: AI insight generation fails
**Steps:**
1. User completes voting (threshold met)
2. Clicks Finish
3. AI service times out or errors

**Expected:**
- Error message: "We couldn't generate your insights right now. Please try again later."
- Retry button available
- User can still view Poll Results Summary
- For authenticated users: retry available from dashboard later
- For anonymous users: retry only in current session

#### TC-ERROR-002: Insight generation takes very long (>30 seconds)
**Steps:**
1. User finishes voting
2. Insight generation exceeds 30 seconds

**Expected:**
- Loading screen with patience message
- Optional: timeout after 60 seconds
- Fallback to error state
- Retry option

#### TC-ERROR-003: Poll results summary generation fails
**Steps:**
1. User tries to view poll results
2. AI summary not generated or failed

**Expected:**
- Error state or fallback message
- Basic statistics still shown (vote counts, participation)
- Retry or "Summary unavailable" message

### Network & Performance Issues

#### TC-ERROR-004: User on slow network (3G)
**Steps:**
1. User on 3G connection votes on statements
2. Observes load times

**Expected:**
- Acceptable performance (statement loads <5 seconds)
- Loading indicators shown
- Graceful degradation
- Optimistic UI for votes

#### TC-ERROR-005: Server returns 500 error during voting
**Steps:**
1. User votes on statement
2. Server returns 500 Internal Server Error

**Expected:**
- Error message: "Something went wrong. Please try again."
- Vote not recorded
- User can retry
- Voting progress preserved

#### TC-ERROR-006: Database connection lost mid-request
**Steps:**
1. User submits vote
2. Database connection drops

**Expected:**
- Error message shown
- Vote not recorded
- Retry mechanism
- User can attempt again

### Data Validation Issues

#### TC-ERROR-007: User sends malformed vote value
**Steps:**
1. User (via API manipulation) sends vote value = 2 (invalid)
2. Attempts to cast vote

**Expected:**
- Validation error: "Invalid vote value"
- Vote rejected
- Database constraint enforces -1, 0, 1 only

#### TC-ERROR-008: User attempts to vote twice on same statement
**Steps:**
1. User votes on statement 5 (Agree)
2. Via API manipulation, attempts to vote again on statement 5 (Disagree)

**Expected:**
- Unique constraint violation
- Second vote rejected
- First vote preserved
- Error: "You've already voted on this statement"

#### TC-ERROR-009: User submits statement with SQL injection attempt
**Steps:**
1. User enters: `DROP TABLE statements; --` in statement submission
2. Submits

**Expected:**
- Input sanitized
- Statement saved as literal text
- No SQL executed
- Security measures prevent injection

### Timing & Race Conditions

#### TC-ERROR-010: Poll closes exactly when user clicks vote button
**Steps:**
1. Poll end_time is 3:00:00 PM
2. User clicks vote at 2:59:59 PM
3. Vote request processed at 3:00:01 PM

**Expected:**
- Vote accepted (user initiated before close)
- OR vote rejected with clear message
- Consistent behavior defined

#### TC-ERROR-011: Two managers approve same statement simultaneously
**Steps:**
1. Statement pending approval
2. Manager A clicks Approve at 3:00:00
3. Manager B clicks Approve at 3:00:00

**Expected:**
- Only one approval recorded
- Both managers see success
- Statement approved once
- No duplicate approvals

#### TC-ERROR-012: User votes while statement is being deleted
**Steps:**
1. User sees statement 10
2. Admin deletes statement 10
3. User clicks vote

**Expected:**
- Vote rejected gracefully
- Error: "This statement is no longer available"
- User advances to next statement
- No broken state

### Browser & Client Issues

#### TC-ERROR-013: User with JavaScript disabled
**Steps:**
1. User disables JavaScript
2. Attempts to use voting interface

**Expected:**
- Graceful degradation OR
- Message: "JavaScript required for voting"
- Core functionality depends on JS

#### TC-ERROR-014: User with very small screen (320px)
**Steps:**
1. User on 320px width device
2. Navigates voting interface

**Expected:**
- Responsive design scales down
- Buttons remain clickable
- Text readable
- No horizontal scroll

#### TC-ERROR-015: User with very large screen (4K)
**Steps:**
1. User on 3840px width screen
2. Views voting interface

**Expected:**
- Content max-width applied
- Card centered
- No excessive stretching
- Readable and usable

#### TC-ERROR-016: User on outdated browser (IE11)
**Steps:**
1. User opens app in IE11 or other outdated browser

**Expected:**
- Graceful degradation OR
- Message: "Please use a modern browser"
- Core functionality may not work

### Accessibility Issues

#### TC-ERROR-017: User with screen reader navigates voting
**Steps:**
1. User with screen reader accesses voting interface
2. Attempts to vote

**Expected:**
- All elements have proper ARIA labels
- Vote buttons announce correctly
- Results announced after voting
- Focus management correct

#### TC-ERROR-018: User with reduced motion preference
**Steps:**
1. User enables `prefers-reduced-motion`
2. Votes on statements

**Expected:**
- Card transitions use fade only (no slide)
- Progress bar changes instant (no animation)
- No pulsing animations
- Results appear without animation

#### TC-ERROR-019: User with high contrast mode
**Steps:**
1. User enables high contrast mode
2. Views voting interface

**Expected:**
- All text readable
- Buttons have clear borders
- Focus indicators visible
- Color not sole indicator of state

---

## Performance & Load Scenarios

#### TC-PERF-001: Poll with 1,000 statements
**Steps:**
1. Poll created with 1,000 approved statements
2. User starts voting

**Expected:**
- Statements loaded in batches (10 at a time)
- No lag or timeout
- Smooth batching experience
- Performance acceptable

#### TC-PERF-002: Poll with 10,000 voters
**Steps:**
1. Poll has 10,000 unique voters
2. User votes and views distribution

**Expected:**
- Vote counts display correctly
- Percentages accurate
- No delay in showing results
- Database queries optimized

#### TC-PERF-003: 100 users voting simultaneously
**Steps:**
1. 100 users access same poll
2. All vote on same statement simultaneously

**Expected:**
- All votes recorded
- No conflicts or lost votes
- Vote distribution updates correctly
- Acceptable response time (<2 seconds)

#### TC-PERF-004: User with 100+ completed polls
**Steps:**
1. Authenticated user has completed 100 polls
2. Views dashboard with insights

**Expected:**
- Dashboard loads within reasonable time
- Pagination or lazy loading implemented
- No timeout
- Smooth UX

#### TC-PERF-005: Moderation queue with 5,000 pending statements
**Steps:**
1. Admin views global moderation queue
2. 5,000 pending statements exist

**Expected:**
- Pagination implemented
- Initial load <5 seconds
- Filtering functional
- Bulk actions work without timeout

---

## Security & Permission Scenarios

#### TC-SEC-001: Anonymous user tries to create poll
**Steps:**
1. Anonymous user navigates to `/polls/create`
2. Attempts to access creation wizard

**Expected:**
- Redirect to sign-in page
- OR message: "Sign in to create polls"
- Access denied

#### TC-SEC-002: Non-owner tries to access poll management
**Steps:**
1. User A creates poll
2. User B (not owner/manager) navigates to `/polls/[slug]/manage`

**Expected:**
- Access denied
- Redirect to unauthorized page
- Error: "You don't have permission to manage this poll"

#### TC-SEC-003: User tries to vote on draft poll
**Steps:**
1. Poll in DRAFT status
2. User manually navigates to `/polls/[slug]/vote`

**Expected:**
- Access denied OR
- Message: "This poll is not yet published"
- Redirect to poll list

#### TC-SEC-004: User tries to SQL injection in poll question
**Steps:**
1. User creates poll with question: `'; DROP TABLE polls; --`
2. Submits

**Expected:**
- Input sanitized
- Question saved as literal text
- No SQL executed

#### TC-SEC-005: User tries XSS in statement submission
**Steps:**
1. User submits statement: `<script>alert('XSS')</script>`
2. Statement approved and shown to voters

**Expected:**
- Script tags escaped
- Rendered as plain text
- No script execution

#### TC-SEC-006: User manually modifies API request to vote with invalid value
**Steps:**
1. User intercepts vote request
2. Changes vote value from 1 to 5
3. Sends request

**Expected:**
- Server-side validation rejects
- Error: "Invalid vote value"
- Vote not recorded

#### TC-SEC-007: User tries to access another user's vote history
**Steps:**
1. User A completes voting
2. User B tries to access User A's votes via API

**Expected:**
- Access denied
- Error: "Unauthorized"
- Votes are private

#### TC-SEC-008: User tries to approve statement without permissions
**Steps:**
1. Regular user (not owner/manager)
2. Attempts to call approve API directly

**Expected:**
- Permission check fails
- Error: "Insufficient permissions"
- Statement remains pending

#### TC-SEC-009: User tries CSRF attack
**Steps:**
1. Attacker crafts malicious form
2. Tricks user into submitting vote request

**Expected:**
- CSRF tokens validated
- Request rejected if token missing/invalid
- Security measures in place

#### TC-SEC-010: User enumerates poll slugs to find unlisted polls
**Steps:**
1. User tries accessing `/polls/secret-poll-slug`
2. Poll is DRAFT or private

**Expected:**
- If DRAFT: access denied
- Message: "Poll not found" or "Poll not published"
- No data leak

---

## UI/UX Edge Cases

#### TC-UX-001: Very long statement text (500+ characters)
**Steps:**
1. Poll has statement with 500 characters
2. User views statement card

**Expected:**
- Text wraps within card
- Card expands vertically OR
- Scroll enabled within card
- Remains readable

#### TC-UX-002: Statement with special characters/emojis
**Steps:**
1. Statement includes: "🚀 Let's go to Mars! 🌕 #SpaceX"
2. User views and votes

**Expected:**
- Emojis render correctly
- Special characters display properly
- No encoding issues
- Vote functions normally

#### TC-UX-003: Poll question with 200 characters
**Steps:**
1. Poll question is very long
2. User views voting interface

**Expected:**
- Question truncated in header
- Full question accessible (hover/tooltip)
- Voting interface remains usable

#### TC-UX-004: Demographics dropdown with 50+ options
**Steps:**
1. Political party dropdown has 50+ parties
2. User opens dropdown

**Expected:**
- Search/filter option available
- Scrollable list
- Performance acceptable
- Easy selection

#### TC-UX-005: User rapidly switches between polls
**Steps:**
1. User votes on Poll A
2. Navigates to Poll B
3. Starts voting on Poll B
4. Returns to Poll A
5. Progress preserved on both

**Expected:**
- Progress tracked separately per poll
- No data loss
- Smooth transitions
- Session management correct

#### TC-UX-006: Mobile landscape orientation
**Steps:**
1. User rotates device to landscape
2. Views voting interface

**Expected:**
- Layout adjusts
- Card remains usable
- Buttons accessible
- No broken layout

#### TC-UX-007: Dark mode / Light mode switching (if supported)
**Steps:**
1. User switches system theme
2. App adjusts theme

**Expected:**
- Theme changes applied
- Consistent styling
- No readability issues
- Preferences saved

#### TC-UX-008: User zooms in 200%
**Steps:**
1. User zooms browser to 200%
2. Uses voting interface

**Expected:**
- Layout remains functional
- Text readable
- Buttons clickable
- Acceptable UX

#### TC-UX-009: Statement with only whitespace
**Steps:**
1. User submits statement: "     " (spaces only)
2. Attempts to submit

**Expected:**
- Validation rejects
- Error: "Statement cannot be empty"
- Submit button disabled

#### TC-UX-010: Poll title with leading/trailing spaces
**Steps:**
1. User creates poll: "  What is your favorite color?  "
2. Saves

**Expected:**
- Spaces trimmed automatically
- Slug generated correctly
- Clean title displayed

---

## Data Integrity Scenarios

#### TC-DATA-001: User votes are immutable
**Steps:**
1. User votes Agree on statement 5
2. User attempts to change vote to Disagree (via UI or API)

**Expected:**
- Vote change rejected
- Original vote preserved
- Error or action not available

#### TC-DATA-002: Cascade delete on poll deletion
**Steps:**
1. Poll has 100 statements, 1,000 votes, 50 insights
2. Owner deletes poll

**Expected:**
- Poll deleted
- All 100 statements deleted
- All 1,000 votes deleted
- All 50 insights deleted
- Roles deleted
- Database integrity maintained

#### TC-DATA-003: Cascade delete on user deletion
**Steps:**
1. User has voted on 20 polls, submitted 10 statements
2. User deletes account

**Expected:**
- User record deleted
- All votes deleted
- All submitted statements deleted
- All insights deleted
- All roles deleted
- Polls remain intact

#### TC-DATA-004: Unique slug enforcement
**Steps:**
1. Poll A created with slug "favorite-color"
2. Poll B created with same question

**Expected:**
- Poll B slug: "favorite-color-2"
- Both polls exist
- No collision

#### TC-DATA-005: Vote value constraint enforcement
**Steps:**
1. Via direct DB manipulation, attempt to insert vote with value 3

**Expected:**
- Database constraint violation
- Insert rejected
- Only -1, 0, 1 allowed

#### TC-DATA-006: Statement approval state transitions
**Steps:**
1. Statement created (approved = null)
2. Approved (approved = true)
3. Attempt to change to rejected (approved = false)

**Expected:**
- Approved statements can be edited or deleted
- State transition to rejected should delete (not update)
- Business logic enforced

#### TC-DATA-007: User role assignment uniqueness
**Steps:**
1. User assigned as manager to Poll A
2. Attempt to assign same user as manager again

**Expected:**
- Unique constraint enforced
- No duplicate role assignments
- Error handled gracefully

#### TC-DATA-008: Anonymous to authenticated transition data integrity
**Steps:**
1. Anonymous user votes on 5 polls
2. Submits 3 statements
3. Provides demographics
4. Signs up

**Expected:**
- All 5 poll vote histories transferred
- All 3 statements transferred
- Demographics transferred
- Session ID cleared
- Clerk ID linked
- No data loss

#### TC-DATA-009: Insight regeneration on vote changes (future)
**Steps:**
1. User completes voting, sees insight
2. User votes on additional statements (if allowed)
3. Insight should regenerate

**Expected:**
- Latest insight replaces previous
- Only one insight per user/poll
- Composite key enforced

#### TC-DATA-010: Poll results cache invalidation
**Steps:**
1. Poll results summary generated
2. 100 new votes added
3. User views poll results

**Expected:**
- Cache invalidated (24-hour rule or vote count threshold)
- New summary generated
- Updated data shown

---

## Conclusion

This test scenarios document covers:
- **Standard use cases** for all user personas
- **Edge cases** for voting, statements, authentication, and poll management
- **Poll revisit scenarios** covering all states (open/closed, various completion levels)
- **Error conditions** including network, validation, and timing issues
- **Performance scenarios** with high load and large datasets
- **Security scenarios** covering permissions and attack vectors
- **UI/UX edge cases** for various devices and accessibility
- **Data integrity scenarios** ensuring database consistency

QA teams should execute these scenarios across:
- Multiple browsers (Chrome, Firefox, Safari, Edge)
- Multiple devices (mobile, tablet, desktop)
- Different network conditions (WiFi, 3G, 4G, offline)
- Various user states (anonymous, authenticated, admin)
- Edge cases specifically marked with `-E` codes

**Testing Priority:**
- **Critical:** All TC-VOTE, TC-AUTH, TC-ANON, TC-REVISIT scenarios
- **High:** All TC-CREATOR, TC-ERROR scenarios
- **Medium:** TC-ADMIN, TC-CROSS, TC-PERF scenarios
- **Low:** TC-UX, TC-DATA scenarios (important but lower user impact)

**Total Test Scenarios:** 180+
- Anonymous User: 8 standard + 9 edge cases
- Authenticated User: 5 standard + 7 edge cases
- Voting Interface: 7 standard + 12 edge cases
- Statement Submission: 4 standard + 8 edge cases
- **Poll Revisit: 16 standard + 10 edge cases (NEW)**
- Poll Creator/Owner: 10 standard + 14 edge cases
- Admin & Manager: 4 standard + 5 edge cases
- Cross-Device & Session: 2 standard + 3 edge cases
- Error Conditions: 19 scenarios
- Performance & Load: 5 scenarios
- Security & Permissions: 10 scenarios
- UI/UX Edge Cases: 10 scenarios
- Data Integrity: 10 scenarios

**Note:** This document is based on the USE_CASES.md and UX_UI_SPEC.md specifications. Additional scenarios may emerge during implementation and should be added to this document.
