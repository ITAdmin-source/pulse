# Pulse - Use Cases & User Workflows

**Version:** 1.3
**Purpose:** Comprehensive documentation of all user workflows for UX/UI design

---

## Table of Contents

1. [User Personas & Roles](#user-personas--roles)
2. [Core User Journeys](#core-user-journeys)
3. [Poll Creator Workflows](#poll-creator-workflows)
4. [Admin & Manager Workflows](#admin--manager-workflows)
5. [Key Features & Business Logic](#key-features--business-logic)
6. [Technical Constraints & Rules](#technical-constraints--rules)

---

## User Personas & Roles

### 1. Anonymous Visitor
- **Identity:** No account, no session tracking
- **Access:** Can browse published polls (read-only)
- **Limitations:** Cannot vote or submit statements

### 2. Anonymous Participant
- **Identity:** Tracked via browser session (session_id)
- **Lifecycle:** Created in database only when they take their first action (vote or submit statement)
- **Access:** Can vote and submit statements on published polls
- **Data:** Voting history and submitted statements tied to session
- **Demographics:** Optional - can provide age group, gender, ethnicity, political party without authenticating
- **Upgrade Path:** Can authenticate later to preserve their participation data

### 3. Authenticated User
- **Identity:** Signed in via Clerk (clerk_user_id)
- **Profile:** Name, picture, social links (cached from Clerk)
- **Demographics:** Optional age group, gender, ethnicity, political party
- **Access:** Full participation rights, persistent identity
- **Benefits:** Access to personal insights, demographics tracking, profile management

### 4. Poll Creator/Owner
- **Role:** System-assigned when user creates a poll
- **Permissions:**
  - Full control over their polls
  - Edit poll settings
  - Approve/reject statements
  - Publish/close polls
  - View analytics
  - Assign poll managers
  - Transfer ownership
- **Scope:** Per-poll (can own multiple polls)
- **Voting:** Can vote on their own polls as a regular participant using the card-based interface
- **Admin View:** Can access admin panel to view all statements and distributions without voting

### 5. Poll Manager
- **Role:** Assigned by poll owner
- **Permissions:**
  - Approve/reject statements
  - View poll analytics
  - Edit poll settings (but cannot delete poll or transfer ownership)
- **Scope:** Per-poll (can manage multiple polls)
- **Voting:** Can vote on managed polls as a regular participant using the card-based interface
- **Admin View:** Can access admin panel to view all statements and distributions without voting

### 6. System Administrator
- **Role:** Database-assigned global role
- **Permissions:** All permissions across all polls
- **Scope:** System-wide
- **Voting:** Can vote on any poll as a regular participant using the card-based interface
- **Admin View:** Can access admin panel for any poll to view all statements and distributions without voting

---

## Core User Journeys

### Journey 1: Anonymous Participation

#### Entry Points
- User discovers a published poll via direct link
- User browses public poll listing

#### Flow: First-Time Visitor
1. **Landing on Poll**
   - User views poll question and description
   - System generates browser session (no DB record yet)
   - UI displays "Start Voting" or similar CTA

2. **Demographics Collection (Optional)**
   - **Shown BEFORE the first statement card appears**
   - Completely optional - can skip or dismiss
   - Options: age group, gender, ethnicity, political party
   - Available to both anonymous and authenticated users
   - **One-time only:** Cannot be changed after initial submission
   - **Not requested again if user upgrades** from anonymous to authenticated
   - **User Creation Timing:** User record is created when demographics are saved OR on first vote (whichever comes first)
   - Stored with user record once created

3. **Card-Based Statement View**
   - **Visual Metaphor:** Card deck with Stories progress bar
     - Each statement is a **card in the deck**
     - Each poll is a complete **card deck**
     - Voting is like **sorting cards** (deciding which cards you like or not)
     - Adding statements is like **adding cards to the deck**
   - User sees **one statement at a time** displayed as a **card**
   - Clean interface showing:
     - **Stories-style progress bar** at top (segmented bars showing position in the deck)
     - **Statement card** (centered, prominent)
       - Statement text prominently displayed
       - **Two primary buttons ON the card:** Agree and Disagree (with custom labels if set)
       - Card may have visual styling (shadow, border, background)
     - **Pass/Unsure button BELOW the card** (secondary, less prominent)
       - Default label: "Pass" or "Unsure"
       - Can be customized per poll
       - Positioned under the card, not on it
   - **No vote distribution shown yet**
   - No back/review options visible

4. **First Vote Action**
   - User clicks one of three buttons:
     - **Agree** (on card, primary action)
     - **Disagree** (on card, primary action)
     - **Pass/Unsure** (below card, secondary action)
   - **System creates user record in database** (with session_id)
   - Vote is recorded
   - **Vote is final and irreversible** - no changing votes later
   - **Vote distribution reveals immediately:**
     - Animated reveal of percentages
     - Visual representation (horizontal bars, animated counters)
     - Shows: X% agree, Y% disagree, Z% neutral
     - Total vote count displayed
     - User's vote highlighted or indicated

5. **Automatic Transition to Next Statement**
   - After viewing statistics for a few seconds (e.g., 3-5 seconds)
   - **Automatic transition to next statement** (no manual control needed)
   - Optional: User can manually advance with "Next" button for faster progression
   - **No "back" button** - forward-only progression
   - Previous vote statistics disappear
   - New statement card appears (clean slate, no distributions shown)
   - Progress bar updates (next segment fills)

6. **Continued Voting**
   - Process repeats for each statement in sequence
   - Vote → See results → Auto-advance to next
   - Stories-style progress bar shows overall completion
   - Minimum threshold reminder may appear: "Vote on at least N more statements to see your insights"
   - **No ability to review or change previous votes**
   - One-way journey through all statements

6a. **Statement Batching (10 at a time)**
   - When poll has more than 10 approved statements:
     - User sees first batch of 10 statements
     - After voting on 10th statement, **continuation page appears**
   - **Continuation Page:**
     - Shows progress summary ("You've voted on 10 statements so far" or 20, 30, etc.)
     - Displays vote distribution summary (Agree: X, Disagree: Y, Unsure: Z)
     - Does NOT show total remaining or total count (keeps exploration open-ended)
     - Two options:
       - **Continue Voting** (primary) → Load next batch of up to 10 statements
       - **Finish & See Results** (secondary) → End voting session, generate insights
     - User must choose one option (no skip/dismiss)
   - **Cumulative counting system:**
     - Batch 1: Shows "Statement 1 of 10", "2 of 10"... "10 of 10"
     - Batch 2: Shows "Statement 11 of 20", "12 of 20"... "20 of 20"
     - Batch 3: Shows "Statement 21 of 30", "22 of 30"... "30 of 30"
     - Final batch: Continues pattern (e.g., "31 of 32", "32 of 32")
   - **Progress bar resets visually** after each batch but counter remains cumulative
   - **Finish button remains available** throughout voting (enabled after threshold reached)
   - Process repeats every 10 statements until poll exhausted or user finishes

7. **Completion Options**
   - User can vote through **all statements** in the poll, OR
   - User can press **"Finish" button** at any time to end early
   - Finish button always available (in header or as skip option)
   - If user finishes before threshold: may see "Vote on X more for insights" prompt with option to continue or exit

8. **Insight Generation After Completion**
   - **When user finishes** (all statements voted OR pressed Finish):
     - System checks if voting threshold reached (default: 5 statements)
     - **If threshold met:**
       - System generates AI-powered personal insights
       - Loading state: "Analyzing your responses..."
       - Personal insight screen appears with analysis
       - Shows title and detailed body text
       - Option to share, save, or continue to results summary
     - **If threshold not met:**
       - Message: "Vote on X more statements to unlock your personalized insights"
       - Option to continue voting or exit

9. **Optional: Statement Submission** (if poll allows)
   - **Available during voting via popup/modal**
   - Accessible via "Submit Statement" button in header/menu
   - Opens popup overlay without leaving voting flow
   - User writes statement in modal
   - Submits statement:
     - If auto-approval enabled: statement added to voting queue for other users
     - If moderation required: statement enters approval queue
     - User receives feedback about submission status
   - **Returns to voting flow** at the same statement they were on
   - Can submit multiple statements during voting session

10. **Session Persistence**
    - Votes persist across browser sessions via session ID
    - If user closes browser mid-voting and returns, their progress is restored
    - Resumes from **next unvoted statement** (cannot review past votes)
    - Progress bar reflects completed statements

#### Flow: Returning Anonymous User (Incomplete Session)
1. **Session Recognition:**
   - Browser session recognized (via session_id cookie)
   - Previous votes and progress restored from database

2. **Visual Restoration:**
   - **Progress bar immediately shows completed segments** (e.g., 3 of 10 filled)
   - User sees: "Welcome back! Continue voting where you left off"
   - Clear indication of progress: "You've voted on 3 statements"

3. **Resume Voting:**
   - Automatically shows **next unvoted statement** (statement #4 in example)
   - Continues exactly as if they never left
   - Same forward-only flow
   - **Cannot review or change previous votes**

4. **Completion Options:**
   - Can continue voting through remaining statements
   - Can press Finish button to see insights (if threshold already met)
   - If threshold not yet met, must vote on more statements

5. **No Restart Option:**
   - Cannot reset or start poll over
   - Previous votes are locked in

---

### Journey 2: Authentication & Account Upgrade

#### Scenario A: New User Signs Up
1. **From Poll Participation**
   - Anonymous user has been participating
   - Sees prompt: "Sign up to save your progress across devices"
   - Clicks sign up button

2. **Clerk Authentication**
   - Redirected to Clerk sign-up flow
   - Completes registration (email/password or social auth)
   - Returns to application

3. **Account Creation (JWT-based)**
   - System receives Clerk JWT token
   - Creates authenticated user record in database
   - Links Clerk user ID to new account

4. **Anonymous Data Upgrade** (if applicable)
   - If user had previous anonymous session:
     - System transfers votes to authenticated account
     - System transfers submitted statements
     - System transfers insights (if generated)
     - **Demographics NOT re-requested** (already collected or skipped)
     - Session ID cleared, Clerk ID linked
     - User sees: "Your votes and statements have been saved to your account"

5. **Profile Enhancement**
   - User can optionally complete profile
   - Profile picture and name cached from Clerk
   - Can add social media link
   - **Cannot modify previously submitted demographics**

#### Scenario B: Authentication During Active Voting Session
1. **Mid-Voting Authentication:**
   - Anonymous user is voting (e.g., voted on 5 of 10 statements)
   - Clicks "Sign Up" or "Login" button in header
   - **Current voting progress is saved** in browser temporarily

2. **Authentication Flow:**
   - Redirected to Clerk sign-up/login
   - Completes authentication
   - Returns to application

3. **Seamless Resume:**
   - System transfers anonymous votes to authenticated account
   - **User resumes from exact same statement** they were on before authenticating
   - Progress bar shows same progress (e.g., still at statement 6)
   - Voting flow continues without interruption
   - User sees brief confirmation: "Your progress has been saved to your account"

4. **No Data Loss:**
   - All votes preserved
   - Submitted statements preserved
   - Demographics preserved (if provided)
   - Session continues seamlessly

#### Scenario C: Existing User Returns
1. **Sign In**
   - User clicks sign in
   - Clerk authentication flow
   - Returns to application

2. **Session Recognition**
   - System identifies user by Clerk ID
   - Loads user's complete voting history
   - Restores profile and demographics

3. **Cross-Device Continuity**
   - Can access participation data from any device
   - Insights available across sessions
   - Can view completed polls with vote summaries and insights

---

### Journey 3: Poll Discovery & Browsing

#### Public Poll Listing
1. **Homepage/Poll Directory**
   - User sees list of published polls
   - Each poll shows:
     - Question/title
     - Description
     - Status (active/closed)
     - Participation stats (voters, statements)
     - Time remaining (if applicable)

2. **Filtering & Search**
   - Filter by status (active/closed)
   - Search by keywords in question/description
   - Sort by recent, popular, ending soon

3. **Poll Entry**
   - Click poll to enter voting interface
   - **No preview of statements or distributions**
   - Goes directly to card-based voting flow
   - May show poll description/instructions first

#### Direct Link Access
1. **Shareable URLs**
   - Each poll has unique slug: `/polls/{slug}`
   - Can be shared on social media
   - Direct entry to voting interface

---

### Journey 4: Voting Experience

#### Card-Based Story-Style Voting Interface
1. **Initial View**
   - **Instagram-style segmented progress bar** at top of screen
     - Each segment represents one statement
     - Filled segments = voted statements
     - Current segment animates/pulses
     - Empty segments = upcoming statements
   - Poll question displayed at top (persistent header)
   - **Statement displayed as a card** (centered, prominent)
     - Large, focused card with statement text
     - Card styling: shadow, rounded corners, modern design
     - Feels like Instagram Stories or Tinder cards
   - **Two primary voting buttons ON the card:**
     - **Agree** button (left side or top, customizable label like "Support")
     - **Disagree** button (right side or bottom, customizable label like "Oppose")
   - **Pass/Unsure button BELOW the card:**
     - Secondary, less prominent styling
     - Default label: "Pass" or "Unsure" (customizable)
     - Clearly separated from primary actions
   - **"Finish" button** in header (exit option)
   - **No vote distribution visible initially**
   - **No back button or review option**

2. **Vote Interaction**
   - User clicks one of three buttons:
     - **Agree** (on card, primary)
     - **Disagree** (on card, primary)
     - **Pass/Unsure** (below card, secondary)
   - Vote is recorded immediately
   - **Vote is final and irreversible** - no changing later
   - **Vote distribution reveals with animation:**
     - Animated transition (slide, fade, expand)
     - Percentage breakdown: X% agree, Y% disagree, Z% neutral
     - Visual representation (horizontal bars with animated fill, animated counters)
     - Total vote count: "Based on N votes"
     - User's vote highlighted with distinct styling
     - Progress bar segment fills for current statement

3. **Automatic Transition to Next Statement**
   - Results remain visible for 3-5 seconds
   - User sees how their vote compares to others
   - **Automatic advance** to next statement after timer
   - Optional: "Next" button for users who want to skip ahead
   - **No "Previous" or "Back" button** - forward-only flow
   - Results fade out smoothly
   - Next statement card slides in
   - New card appears clean (no distributions)
   - Progress bar updates (next segment becomes active)

4. **Continued Voting Flow**
   - Process repeats for each statement in sequence
   - Vote → See results (3-5s) → Auto-advance to next
   - **Linear, one-way progression** through all statements
   - Progress bar provides visual sense of completion
   - **No ability to go back or review previous votes**
   - **Statement Selection Logic:**
     - Currently: Random selection from unvoted statements
     - Future: Intelligent selection based on user's voting patterns (similar to Pol.is algorithm)
     - Ensures each user sees statements in potentially different order
     - No statement shown twice to same user

5. **Progress Tracking**
   - **Instagram-style segmented progress bar** (primary indicator)
   - Optional text: "Statement X of Y"
   - Threshold reminder may appear: "Vote on Z more to unlock insights"
   - Clear visual of how far through poll

6. **Completion Trigger**
   - User can **vote through all statements** to auto-complete, OR
   - **Press "Finish" button** to end early
   - **Finish button behavior:**
     - **Disabled until threshold reached** (e.g., grayed out until 5 votes cast)
     - **Enabled once threshold met** (becomes clickable)
     - Always visible in header/menu with state indicator
     - Shows tooltip: "Vote on X more to finish" when disabled

7. **Post-Completion: Insight Generation & Results Summary**
   - System checks if threshold reached (default: 5 statements)
   - **If threshold met:**
     - Loading screen: "Analyzing your responses..."
     - AI generates personalized insight
     - **Personal Insight screen appears:**
       - Title (summary of user's position)
       - Body (detailed analysis of user's voting patterns)
       - Visual design matching poll theme
       - Actions: Share Insight, Save (if authenticated), View Results Summary
     - **Poll Results Summary (accessible after viewing insight):**
       - AI-generated text summarizing main takeaways from ALL votes on ALL statements
       - Shows overall poll trends and consensus
       - Read-only summary view
       - Option to return to poll listing
   - **If threshold NOT met:**
     - This scenario should not occur since Finish button is disabled until threshold met
     - Safety fallback: Message with option to exit

8. **Voting Rules**
   - One vote per statement per user
   - **No vote changes** - all votes final
   - Votes on approved statements only
   - Cannot vote on own submitted statements (optional business rule)
   - **No backward navigation** once vote cast

#### Vote Distribution Display Rules
- **Before voting:** No distribution shown (clean card)
- **After voting:** Distribution reveals with animation
- **Timing:** Visible for 3-5 seconds, then auto-advances
- **Components:**
  - Percentage breakdown (agree/disagree/neutral)
  - Animated horizontal bars or visual representation
  - Total vote count
  - User's vote clearly indicated
- **Visibility:** Only after user commits their vote (no peeking)

---

### Journey 5: Statement Submission

#### Prerequisites
- Poll must allow user statements (`allowUserStatements = true`)
- Poll must be in published/active state
- User can be anonymous or authenticated

#### Flow
1. **Access Submission Interface**
   - User sees "Submit a statement" option (if enabled)
   - Clicks to open submission form

2. **Writing Statement**
   - Text input field
   - Character limit guidance (recommended)
   - Preview of how it will appear

3. **Submission**
   - User submits statement
   - **If auto-approval enabled:**
     - Statement appears immediately in voting list
     - User receives: "Your statement is now live"
   - **If moderation required:**
     - Statement enters approval queue
     - User receives: "Your statement is pending approval"
     - Statement not visible to others yet

4. **Post-Submission**
   - User can continue voting on other statements
   - If authenticated: can track submission status
   - Submitted statements tied to user ID

5. **Approval Notification** (if moderation enabled)
   - When approved: statement appears in poll
   - When rejected: statement deleted (not shown to user)
   - No notification currently implemented (potential feature)

---

### Journey 6: Personal Insights

#### Trigger Conditions
- **User completes voting session** (votes on all statements OR presses "Finish" button)
- User has voted on minimum required statements (threshold, default: 5)

#### Generation Process
1. **Triggered After Completion**
   - User finishes voting by completing all statements OR pressing "Finish"
   - System checks if threshold met
   - If met: insight generation begins immediately

2. **Generation Flow**
   - Loading screen appears: "Analyzing your responses..."
   - System analyzes user's voting pattern
   - Compares with aggregate poll data
   - Identifies alignment/divergence patterns
   - Generates AI-powered insight text (title + body)

3. **Insight Display**
   - **Full-screen personal insight presentation:**
     - **Title:** Summary headline of user's position
     - **Body:** Detailed analysis of voting patterns
     - **Timestamp:** When insight was generated
     - Visual design consistent with poll theme
   - **Actions available:**
     - Share insight (social media, link)
     - Save insight (if authenticated)
     - **View Poll Results Summary** (see Journey 7 below)
     - Return to poll listing

4. **Persistence for Anonymous Users**
   - **Insight shown once at completion, then lost unless user authenticates**
   - If anonymous user closes browser after seeing insight, cannot retrieve it later
   - Insight only accessible again if user authenticates (upgrades anonymous account)
   - Encourages users to sign up to preserve insights

5. **Persistence for Authenticated Users**
   - Insights stored per user per poll in database
   - Latest insight only (no history)
   - **Accessible across sessions and devices**
   - Available in user dashboard
   - Deleted if user or poll deleted

6. **No Regeneration**
   - Since votes are final and cannot be changed, insights are generated once
   - No need to regenerate based on vote updates

#### Content Structure
- How user's votes align with majority/minority
- Identification of user's thematic positions
- Unique perspectives highlighted
- Potential demographic correlations (if demographics provided)
- Comparison to other participants' patterns

---

### Journey 7: Poll Results Summary

#### Purpose
- **Poll-level summary** of aggregate voting patterns across all statements
- Different from personal insights (which are user-specific)
- AI-generated analysis of overall poll trends and consensus

#### Trigger Conditions
- Poll has sufficient participation data
- Accessed after user completes voting and views personal insight

#### Generation Process
1. **Data Collection**
   - All votes from all users on all approved statements in poll
   - Vote distributions across all statements
   - Participation metrics (total voters, vote counts)
   - Demographic patterns (if applicable)

2. **AI Analysis**
   - Identify main themes and consensus areas
   - Detect polarizing vs. unifying statements
   - Find demographic patterns (if data available)
   - Extract key takeaways and trends

3. **Text Generation**
   - AI generates comprehensive summary text
   - Highlights main findings
   - Describes overall poll sentiment
   - Notes significant patterns or divisions

#### Storage & Updates
- **One summary per poll** (not per user)
- **NEW DATABASE TABLE REQUIRED:** `poll_results_summaries`
  - `poll_id` (UUID, primary key, foreign key to polls)
  - `summary_text` (TEXT, AI-generated summary)
  - `generated_at` (TIMESTAMP, when summary was created)
  - `participant_count` (INTEGER, number of voters at generation time)
  - `vote_count` (INTEGER, total votes at generation time)
- **Regenerated periodically** as new votes come in (e.g., every 10 new voters)
- Latest summary replaces previous version (UPDATE operation)

#### Display & Access
1. **From Personal Insight Screen:**
   - User clicks "View Poll Results Summary" after seeing personal insight
   - Transitions to results summary view

2. **Results Summary View:**
   - Full-screen text display
   - AI-generated summary of poll-wide patterns
   - Read-only view
   - Shows timestamp of summary generation
   - Displays participation stats (X voters, Y total votes)

3. **Accessing Later:**
   - **Authenticated users:** Can access from user dashboard for completed polls
   - **Anonymous users:** Lost after leaving page (unless they authenticate)
   - Available for both active and closed polls

4. **Closed Poll Access:**
   - **For voters (users who participated):**
     - Can view their personal insight (if they reached threshold)
     - Can view Poll Results Summary (overall trends) via "View Poll Results" button
     - Can view their vote summary: Read-only list of all their votes on each statement
     - No ability to change votes (already final during voting)
   - **For non-voters (users who did not participate):**
     - Can still access closed polls
     - NO personal insights (didn't vote)
     - NO vote history (didn't participate)
     - CAN view Poll Results Summary (public results) via "View Poll Results" button
     - Informational message: "This poll has ended. You can view the results and insights."

#### Content Structure
- Overall poll sentiment and consensus areas
- Most agreed/disagreed statements
- Divisive topics (statements with split opinions)
- Demographic patterns (if applicable)
- Key themes and trends
- Participation statistics

---

## Poll Creator Workflows

### Workflow 1: Poll Creation

#### Entry Point
- Authenticated user accesses "Create Poll" interface
- Must be signed in (anonymous users cannot create polls)

#### Step 1: Basic Information
1. **Poll Question** (required)
   - Main question/topic
   - Used to generate URL slug
2. **Description** (optional)
   - Additional context
   - Instructions for participants

#### Step 2: Control Settings
1. **User Statement Submission**
   - Toggle: Allow users to submit statements
   - Default: disabled

2. **Auto-Approval**
   - Toggle: Auto-approve user statements
   - Only relevant if submission enabled
   - Default: disabled (moderation required)

3. **Voting Threshold**
   - Minimum statements user must vote on
   - Default: 5
   - Minimum: 1
   - Used for insights and participation counting

4. **Voting Goal** (optional)
   - Target number of total votes
   - Displayed to participants as progress
   - Does not affect poll functionality

#### Step 3: Button Labels (Optional)
- Customize voting button text per poll:
  - **Agree Button:** Default "Agree" → Custom (e.g., "Support", "Yes", "For") - displayed ON card
  - **Disagree Button:** Default "Disagree" → Custom (e.g., "Oppose", "No", "Against") - displayed ON card
  - **Pass/Unsure Button:** Default "Pass" or "Unsure" → Custom (e.g., "Skip", "Not Sure") - displayed BELOW card
- Max length: 10 characters per label
- Note: Agree/Disagree are primary actions on card, Pass/Unsure is secondary action below card

#### Step 4: Scheduling (Optional)
1. **Start Time**
   - When poll becomes active
   - If not set: active immediately upon publishing

2. **End Time**
   - When poll closes to new votes
   - If not set: remains open indefinitely

#### Step 5: Initial Statements
- Creator adds seed statements
- **Minimum required: 6 statements** (mandatory to create poll)
- Recommended: 10-20 statements for better insights
- Statements auto-approved (created by owner)

#### Result
- Poll created in **draft** status
- Not visible to public
- Owner assigned automatically
- Unique slug generated from question

---

### Workflow 2: Poll Management

#### Accessing Poll Management
1. **Poll Dashboard**
   - Owner sees list of their polls
   - Shows status, participation stats, pending items

2. **Poll Detail View**
   - Full poll information
   - Statement list with approval status
   - Voting statistics
   - Management controls

#### Managing Statements

##### Viewing Statements
- **Approved:** Live statements participants can vote on
- **Pending:** Awaiting moderation
- **All Statements:** Complete list with status indicators

##### Moderation Actions
1. **Individual Approval**
   - Review pending statement
   - Click "Approve" → statement becomes visible
   - Click "Reject" → statement deleted permanently

2. **Bulk Actions**
   - Select multiple pending statements
   - Approve all selected
   - Reject all selected
   - Useful for high-volume moderation

3. **Editing Statements**
   - Owner can edit statement text
   - Changes reflected immediately
   - Existing votes preserved

4. **Deleting Statements**
   - Remove statement entirely
   - Cascades: all votes on statement deleted
   - Use with caution

#### Editing Poll Settings
1. **Update Metadata**
   - Change question, description
   - Modify button labels
   - Adjust threshold

2. **Control Toggles**
   - Enable/disable user submissions
   - Enable/disable auto-approval

3. **Scheduling Changes**
   - Extend end time
   - Change start time (if not yet started)

#### Poll Statistics & Analytics
- **Participation Metrics:**
  - Total unique voters
  - Total votes cast
  - Statements submitted by users
  - Pending moderation count

- **Engagement Metrics:**
  - Vote distribution across statements
  - Most agreed/disagreed statements
  - Participation over time (if tracking implemented)

- **Threshold Completion:**
  - Number of users who reached threshold
  - Average votes per user

---

### Workflow 3: Poll Publishing & Lifecycle

#### Draft State
- **Characteristics:**
  - Not visible to public
  - No participation allowed
  - Fully editable

- **Activities:**
  - Add/edit statements
  - Configure settings
  - Prepare for launch

#### Publishing Process
1. **Readiness Check** (recommended)
   - Sufficient statements (e.g., 10+)
   - Settings configured
   - Scheduling set (optional)

2. **Publish Action**
   - Owner clicks "Publish"
   - If start time set: poll becomes active at that time
   - If no start time: active immediately

3. **Published State**
   - Poll visible on public listings
   - Participation enabled
   - Statements votable
   - URL shareable

#### Active Poll Management
- **While Published:**
  - Owner continues moderating statements
  - Can add more statements
  - Monitor participation
  - **Can unpublish** to return poll to draft state

#### Unpublishing Process
1. **Unpublish Action**
   - Owner clicks "Unpublish" on published poll
   - Confirmation modal appears with warning
   - Shows impact: poll hidden, votes stopped, returns to draft
   - Shows current stats (voters, votes recorded)
   - Confirms existing votes preserved

2. **After Unpublishing:**
   - Poll status changes to DRAFT
   - Poll removed from public listings
   - No new votes accepted
   - Existing votes and analytics preserved
   - Owner can edit and republish later
   - Users cannot access poll until republished

#### Closing Process
1. **Automatic Closing**
   - Poll reaches end time (if set)
   - Voting disabled automatically
   - Poll marked as closed

2. **Manual Closing** (if implemented)
   - Owner can close poll before end time
   - Requires confirmation

#### Closed State
- **Characteristics:**
  - No new votes accepted
  - No new statements accepted
  - Results remain visible
  - Insights still accessible

- **Participant View:**
  - Can view results
  - Can see their votes and insights
  - Cannot modify votes

---

### Workflow 4: Role Management

#### Assigning Poll Managers
1. **Access Role Management**
   - Poll owner opens "Manage Roles" for their poll
   - Sees current managers

2. **Adding Manager**
   - Search for user by email or ID
   - Select user
   - Assign "Poll Manager" role
   - User granted management permissions for this poll

3. **Removing Manager**
   - Owner selects manager
   - Revokes role
   - Manager loses access

#### Transferring Ownership
1. **Transfer Process**
   - Owner selects "Transfer Ownership"
   - Chooses new owner (must be existing user)
   - Confirms transfer

2. **Result**
   - New user becomes poll owner
   - Previous owner loses ownership (optionally becomes manager)
   - Owner role reassigned in database

---

## Admin & Manager Workflows

### Workflow 1: System Admin Access

#### Scope
- System admin has all permissions across all polls
- Role assigned in database (not via UI)

#### Capabilities
1. **Poll Management**
   - View all polls (draft, published, closed)
   - Edit any poll settings
   - Delete any poll
   - Manage roles on any poll

2. **Moderation**
   - Access global moderation queue
   - Approve/reject statements across all polls
   - Bulk moderation actions

3. **User Management**
   - View user list
   - Manage user roles
   - View user participation data
   - (Implementation depends on admin UI)

---

### Workflow 2: Poll Manager Operations

#### Assigned Access
- Manager assigned to specific poll(s) by owner
- No system-wide access

#### Moderation Duties
1. **Statement Queue**
   - Access pending statements for managed polls
   - Review submission quality, relevance, appropriateness
   - Approve acceptable statements
   - Reject spam, off-topic, or inappropriate statements

2. **Moderation Interface**
   - List of pending statements
   - Statement text display
   - Submitter information (if available)
   - Approve/Reject buttons
   - Bulk selection option

#### Analytics Access
- View poll statistics (same as owner)
- Monitor participation metrics
- Access vote distributions

#### Settings Management
- Edit poll settings (question, description, controls)
- Cannot delete poll
- Cannot transfer ownership
- Cannot remove self or owner

---

### Workflow 3: Global Moderation Queue

#### Purpose
- Centralized view of all pending statements across all polls
- For system admins or global moderators

#### Interface
1. **Queue View**
   - List of all pending statements
   - Poll context for each statement
   - Submission timestamp
   - Submitter (if available)

2. **Filtering**
   - Filter by poll
   - Sort by age (oldest first priority)
   - Search statement text

3. **Actions**
   - Approve individual statements
   - Reject individual statements
   - Bulk approve
   - Bulk reject

#### Workflow
1. Admin opens moderation queue
2. Reviews statements in context of their polls
3. Approves quality contributions
4. Rejects inappropriate/off-topic submissions
5. Queue updates in real-time

---

## Key Features & Business Logic

### Feature 1: Dual Identity System

#### Anonymous Users
- **Creation Trigger:** First action (vote or statement submission)
- **Identifier:** Session ID (browser-based)
- **Persistence:** Tied to browser session
- **Data:** Votes, statements, insights
- **Limitation:** Not cross-device, can be lost if cookies cleared

#### Authenticated Users
- **Creation Trigger:** Sign-up or sign-in via Clerk
- **Identifier:** Clerk User ID
- **Persistence:** Permanent, cross-device
- **Data:** All anonymous data plus profile, demographics
- **Benefits:** Data preservation, enhanced features

#### Upgrade Mechanism
- Anonymous user authenticates
- System detects existing session
- Transfers all votes and statements to authenticated account
- Session ID cleared
- Clerk ID linked
- Seamless data migration

---

### Feature 2: Poll Lifecycle Management

#### State Transitions
```
Draft ←→ Published → Closed
```
(Unpublish returns poll from Published to Draft)

#### Draft State
- Created by default
- Not public
- No participation
- Fully editable
- Can be published or unpublished (returned from published state)

#### Published State
- Triggered by owner action
- Public visibility
- Participation enabled
- Limited editing
- **Can be unpublished** (returns to draft state)

#### Closed State
- Triggered by end time or manual action
- Read-only
- Results visible
- No new participation

#### Time-Based Activation
- **Start Time:** Poll activates at specified time
- **End Time:** Poll closes at specified time
- **Status Logic:**
  - Before start time: treated as draft
  - Between start and end: published
  - After end time: closed

---

### Feature 3: Statement Approval Workflow

#### Three States
1. **Pending** (`approved = null`)
   - Newly submitted by user
   - Not visible to participants
   - Awaits moderation

2. **Approved** (`approved = true`)
   - Visible in poll
   - Can be voted on
   - Included in analytics

3. **Rejected** (`approved = false`)
   - Immediately deleted (not archived)
   - Removed from database
   - No record kept

#### Auto-Approval Mode
- Poll setting: `autoApproveStatements = true`
- User submissions bypass moderation
- Appear immediately as approved
- Owner/managers can still edit or delete

#### Manual Moderation Mode
- Poll setting: `autoApproveStatements = false`
- All user submissions pending
- Require owner/manager approval
- Quality control maintained

---

### Feature 4: Voting Threshold System

#### Purpose
- Ensure meaningful participation
- Gate insights generation
- Track engagement quality

#### Configuration
- **Poll Setting:** `minStatementsVotedToEnd`
- **Default:** 5 statements
- **Minimum:** 1 statement
- **Set by:** Poll creator

#### Enforcement
1. **Insights Gating**
   - User must vote on threshold number of statements
   - Only then are personal insights generated
   - Prevents shallow engagement

2. **Participation Counting**
   - Users below threshold: not counted as "full participants"
   - Statistics distinguish engaged vs. casual voters

3. **Progress Display**
   - UI shows: "X of Y statements voted"
   - Reminds: "Z more votes needed for insights"
   - Motivates completion

---

### Feature 5: Personal Insights Generation

#### Triggering Events
- **User completes voting session** by voting on all statements OR pressing "Finish" button
- User has met minimum voting threshold (default: 5 statements)

#### Generation Process
1. **Data Collection**
   - User's votes on all statements
   - Vote values (-1, 0, 1)
   - Statement content
   - User demographics (if provided)

2. **Analysis**
   - Compare user votes to aggregate
   - Identify agreement patterns
   - Detect thematic positions
   - Calculate alignment scores
   - Compare to demographic groups (if applicable)

3. **AI Generation**
   - Generate insight title (summary)
   - Generate insight body (detailed analysis)
   - Store in database

4. **Immediate Display**
   - Loading screen during generation
   - Full-screen insight presentation when ready
   - User sees insight immediately after completion

#### Storage & Updates
- **Composite Key:** (user_id, poll_id)
- **Latest Only:** One insight per user per poll
- **No Regeneration:** Since votes are final and cannot be changed, insight generated once
- **Persistence:** Across sessions for authenticated users

#### Display
- **Shown immediately after completing voting session** (if threshold met)
- Full-screen presentation with title and body
- Actions: Share, Save, View Results
- Accessible later in user dashboard (if authenticated)
- Contextual to specific poll
- Read-only (system-generated)

---

### Feature 6: Vote Distribution & Analytics

#### Per-Statement Analytics
- **Vote Counts:**
  - Agree: count and percentage
  - Disagree: count and percentage
  - Neutral: count and percentage
  - Total votes

- **Display:**
  - **Only shown AFTER user votes** on that specific statement
  - Revealed with animation (3-5 second display)
  - Visual representation (bars, percentages, charts)
  - Not visible when viewing unvoted statement
  - Managers/owners can see distributions without voting

#### Per-Poll Analytics
- **Participation:**
  - Unique voters
  - Total votes cast
  - Average votes per user
  - Threshold completion rate

- **Statement Stats:**
  - Total statements
  - Approved statements
  - Pending moderation
  - User-submitted vs. owner-created

- **Engagement:**
  - Most agreed statements
  - Most disagreed statements
  - Most divisive statements (close to 50/50)

---

### Feature 7: Demographics & Profiling

#### Optional User Data
- **Age Group:** Predefined ranges
- **Gender:** Predefined options
- **Ethnicity:** Predefined categories
- **Political Party:** Predefined affiliations

#### Availability
- **Anonymous Participants:** Can provide demographics without authenticating
- **Authenticated Users:** Can provide or update demographics in profile
- **Collection Timing:**
  - Can be prompted before/during first voting session
  - Can be added later from profile/settings
  - Can be skipped entirely

#### Purpose
- Enable demographic analysis of voting patterns
- Identify group alignments
- Inform poll creators about audience
- Enhance insights generation
- Improve personalization (without requiring authentication)

#### Privacy & Control
- Entirely optional for all user types
- No authentication required to provide demographics
- User controls what to share
- Can update anytime
- Not required for participation
- Stored with user record (anonymous or authenticated)

#### Potential Features (Not Yet Implemented)
- Demographic breakdowns in analytics
- Group-based insights
- Audience composition reports
- Anonymous demographic comparison in insights

---

### Feature 8: Error Handling & Edge Cases

#### A. Insight Generation Fails (AI Error)
**Scenario:** AI service fails or times out during insight generation

**Handling:**
- Show error message: "We couldn't generate your insights right now. Please try again later."
- Provide "Retry" button for immediate retry
- Allow user to continue to Poll Results Summary anyway
- Insight marked as "pending generation" in database
- **For authenticated users:** Can access retry from their dashboard later
- **For anonymous users:** Retry only available in current session

#### B. User Loses Connection During Voting
**Scenario:** Network connection drops while user is voting

**Handling:**
- **Optimistic UI:** Vote saved locally in browser immediately
- When connection restored, sync votes to server automatically
- If sync fails after restoration, show: "Connection lost - your votes are saved locally"
- Next time user returns (same session), attempt to sync again
- **For authenticated users:** Can implement offline queue for better reliability
- **For anonymous users:** If browser closes before sync, votes are lost

#### C. All Statements Deleted While User Voting
**Scenario:** Admin/owner deletes statements while user is in voting session

**Handling:**
- If statements user hasn't voted on are deleted:
  - User sees message: "This poll has been updated. Returning to poll list."
  - User's existing votes are preserved in database
  - User can still see their insights if they met threshold
- Extremely rare edge case, handled gracefully
- No data loss for user

#### D. Poll Closes/Ends While User is Voting
**Scenario:** Poll reaches end_time or manually closed while user mid-voting

**Handling:**
- **User can continue voting on their current session**
- Votes cast before closing remain valid
- When user tries to move to next statement or press Finish:
  - Show message: "This poll has closed. Your votes have been saved."
  - Automatically take them to insights (if threshold met)
  - Or take them to poll results summary
- All votes counted despite poll closing
- Graceful user experience

---

## Technical Constraints & Rules

### Vote Value Constraints
- **Allowed Values:** Exactly -1, 0, 1
- **Meaning:**
  - `1` = Agree
  - `0` = Neutral/Unsure
  - `-1` = Disagree
- **Enforcement:** Database constraint
- **UI Mapping:** Three-button interface

### Vote Uniqueness & Finality
- **Rule:** One vote per user per statement
- **Enforcement:** Unique constraint (user_id, statement_id)
- **Finality:** Votes are irreversible - no changes allowed after submission
- **UI Behavior:** No back button, no review mode, forward-only progression
- **Technical Note:** While database supports upsert, UI prevents vote changes

### Cascade Deletes
- **Poll Deletion:**
  - Deletes all statements in poll
  - Deletes all votes on those statements
  - Deletes all insights for that poll
  - Deletes all roles for that poll

- **User Deletion:**
  - Deletes user's votes
  - Deletes user's statements
  - Deletes user's insights
  - Deletes user's roles

- **Statement Deletion:**
  - Deletes all votes on that statement
  - Statement removed from user view
  - Vote counts updated

### Slug Generation
- **Source:** Poll question text
- **Process:**
  - Lowercase
  - Remove special characters
  - Replace spaces with hyphens
  - Truncate to reasonable length
  - Ensure uniqueness (append number if needed)
- **Result:** URL-friendly identifier
- **Example:** "What is your favorite color?" → `what-is-your-favorite-color`

### Button Label Limits
- **Max Length:** 10 characters per label
- **Purpose:** Ensure UI consistency
- **Enforcement:** Database varchar constraint
- **Fallback:** Global defaults if not set

### Authentication Flow
- **Method:** Clerk JWT tokens (no webhooks)
- **Middleware:** Route protection via Clerk middleware
- **Public Routes:** Polls, voting interfaces, authentication pages
- **Protected Routes:** Dashboard, admin panels, poll creation
- **Session Management:** Browser session for anonymous, JWT for authenticated

### Performance Considerations
- **Profile Caching:** Clerk profiles cached 24 hours to reduce API calls
- **Supabase Pooling:** Connection pooling for database efficiency
- **Real-time Updates:** Vote counts updated on-demand (not live websocket)

---

## Summary for Designers

This document outlines the complete functionality of Pulse, a participatory polling platform. The system supports both anonymous and authenticated participation, with seamless upgrade paths. Key design areas include:

1. **Public-Facing Interfaces:**
   - Poll browsing and discovery
   - **Card-based story-style voting interface** (Instagram Stories inspiration)
     - One statement card at a time
     - Instagram-style segmented progress bar at top
     - Agree/Disagree buttons ON the card
     - Pass/Unsure button BELOW the card
   - **Post-vote result reveal** (animated distribution display after vote)
   - Statement submission forms
   - **Personal insights display** (full-screen presentation after completion)
   - Optional demographics collection (no auth required)
   - Authentication flows

2. **Creator/Management Interfaces:**
   - Poll creation wizard with button label customization
   - Statement moderation queue
   - Analytics dashboard
   - Settings management
   - Role assignment

3. **Admin Interfaces:**
   - Global moderation queue
   - System-wide analytics
   - User management
   - Poll oversight

4. **Key UX Principles:**
   - **One statement card at a time** - Instagram Stories-style focused experience
   - **Vote before reveal** - Statistics shown only after user commits their vote (no peeking)
   - **Automatic progression** - Smooth auto-advance from vote → results (3-5s) → next statement
   - **Forward-only flow** - No back button, no vote changes, irreversible progression
   - **Completion-triggered insights** - AI-generated insights appear after user finishes or votes all statements
   - Low-friction participation (anonymous allowed with optional demographics)
   - Progressive engagement (threshold-based insights)
   - Transparent results (animated distribution reveals)
   - Flexible poll configuration (owner control)
   - Role-based access (granular permissions)

5. **Critical Design Considerations:**
   - **Card Design:** Statement cards should feel like Instagram Stories/Tinder cards - modern, clean aesthetic
   - **Progress Bar:** Instagram-style segmented bar at top (one segment per statement)
   - **Button Hierarchy:**
     - Primary actions (Agree/Disagree) ON card with prominent styling
     - Secondary action (Pass/Unsure) BELOW card with subdued styling
   - **Vote Flow:** Clean card → Vote → Animated results → Auto-advance (3-5s) → Next clean card
   - **No Navigation Back:** Forward-only, no review mode, votes are final
   - **Finish Button:** Disabled until threshold, always visible with state indicator
   - **Insight Presentation:** Full-screen, polished display after completion with share/save options
   - **Poll Results Summary:** AI-generated poll-level summary accessible after personal insights
   - **Demographics:** One-time prompt before first card, cannot be changed later
   - **Accessibility:** Timer-based transitions should have manual "Next" override
   - **Error Handling:** Graceful fallbacks for AI failures, connection issues, poll closures

6. **Mobile-First Design:**
   - Primary use case is mobile/touch devices
   - Vertical layout optimized for portrait orientation
   - Large touch targets for vote buttons (on card and below)
   - Smooth animations and transitions
   - **No swipe gestures** - voting is button-based only

Design work should focus on creating an addictive, story-style voting experience inspired by Instagram Stories and Tinder, where users flow through statements one at a time, see immediate social feedback, and receive personalized insights at the end - all without the ability to second-guess their initial reactions.