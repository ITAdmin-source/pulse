# Pulse - UX/UI Specification Document

**Version:** 1.1
**Date:** 2025-10-02
**Purpose:** Complete frontend specification for designers and developers

**Changelog:**
- **v1.1 (2025-10-02)**: Implemented AdaptiveHeader system - unified context-aware navigation with 5 variants, removed duplicate headers across all pages

---

## Table of Contents

1. [Design System & Foundations](#design-system--foundations)
2. [Public-Facing Pages](#public-facing-pages)
3. [Authentication Pages](#authentication-pages)
4. [Voting Interface](#voting-interface)
5. [Results & Insights Pages](#results--insights-pages)
6. [Creator/Owner Pages](#creatorowner-pages)
7. [Admin Pages](#admin-pages)
8. [Shared Components](#shared-components)
9. [Responsive Behavior](#responsive-behavior)
10. [Animation & Interaction Specs](#animation--interaction-specs)

---

## Design System & Foundations

### Visual Style
- **Inspiration:** Card deck with Stories progress bar
  - Each statement is a card in the deck
  - Each poll is a complete card deck
  - Voting is like sorting cards (deciding which cards you like or not)
  - Adding statements is like adding cards to the deck
  - Progress bar shows position in the deck (Instagram Stories style)
- **Primary Colors:** TBD by designer
- **Secondary Colors:** TBD by designer
- **Typography:** Clean, modern sans-serif
- **Spacing System:** 4px base grid (4, 8, 16, 24, 32, 48, 64px)
- **Border Radius:** Cards: 16px, Buttons: 8px, Small elements: 4px

### Mobile-First Approach
- **Primary Target:** Mobile portrait (375px - 428px width)
- **Secondary Target:** Tablet portrait (768px - 1024px)
- **Desktop:** Optimized responsive experience
- **Touch Targets:** Minimum 44px × 44px

### Button Styles

#### Primary Buttons (Agree/Disagree on card)
- Large, prominent
- High contrast
- Clear visual feedback on press
- Positioned on statement card

#### Secondary Button (Pass/Unsure below card)
- Subdued styling
- Lower contrast
- Clear but not competing with primary actions

#### Disabled State (Finish button)
- Grayed out appearance
- Tooltip on hover/tap explaining why disabled
- State indicator showing progress

---

## Public-Facing Pages

### 1. Homepage / Poll Directory
**Route:** `/`

#### Layout
```
┌─────────────────────────┐
│      Header/Nav         │
├─────────────────────────┤
│   Welcome Section       │
│   - App description     │
│   - Key features        │
├─────────────────────────┤
│   Poll Filters          │
│   [Active] [Closed]     │
│   [Search: ______ ]     │
│   Sort: [Dropdown]      │
├─────────────────────────┤
│   Poll List             │
│   ┌─────────────────┐   │
│   │  Poll Card 1    │   │
│   │  - Question     │   │
│   │  - Description  │   │
│   │  - Stats        │   │
│   │  - Status badge │   │
│   └─────────────────┘   │
│   ┌─────────────────┐   │
│   │  Poll Card 2    │   │
│   └─────────────────┘   │
│                         │
│   [Load More]           │
└─────────────────────────┘
```

#### Components Needed
- **Header Component**
  - Logo/branding
  - Navigation menu (hamburger on mobile)
  - Sign In / Sign Up buttons (if not authenticated)
  - User menu (if authenticated)

- **Poll Card Component**
  - Poll question (headline)
  - Status badge (Active/Closed)
  - CTA button: "Vote Now" or "View Results"

- **Filter Bar Component**
  - Status filter (Active/Closed toggles)
  - Search input with icon
  - Sort dropdown (Recent, Popular, Ending Soon)
  - Clear filters button

#### States
- Loading state (skeleton screens)
- Empty state (no polls found)
- Error state (connection failed)

#### Interactions
- Click poll card → Navigate to voting interface (if active) or results (if closed)
- Filter changes → Update poll list
- Search input → Debounced search, update list
- Infinite scroll or pagination for poll list

---

### 2. Poll Entry / Landing Page
**Route:** `/polls/[slug]`

**IMPORTANT:** This page now adapts to 4 distinct user states based on voting progress. See detailed state guide in `POLL_PAGE_STATES_GUIDE.md`.

#### Layout States (Adaptive)

##### State A: New User (No Votes)
```
┌─────────────────────────┐
│   [< Back] [Sign In]    │
├─────────────────────────┤
│                         │
│   Poll Question         │
│   (Large, centered)     │
│                         │
│   Poll Description      │
│   (if provided)         │
│                         │
│   [Start Voting]        │
│   (Large CTA button)    │
│                         │
│   Helper text: Vote on  │
│   statements one at a   │
│   time and discover...  │
│                         │
└─────────────────────────┘
```

##### State B: In Progress (Below Threshold)
```
┌─────────────────────────┐
│   [< Back] [Sign In]    │
├─────────────────────────┤
│  ┌────────────────────┐ │
│  │ ℹ️  Welcome back!  │ │
│  │ You've voted on 5  │ │
│  │ of 15 statements   │ │
│  │ [5/15 statements]  │ │
│  └────────────────────┘ │
│                         │
│   Poll Question         │
│   (Large, centered)     │
│                         │
│   Poll Description      │
│   (if provided)         │
│                         │
│   [5/15 Statements]     │
│   (Badge)               │
│                         │
│   [Continue Voting]     │
│   (Large CTA button)    │
│                         │
│   Helper: Vote on 10    │
│   more to see insights  │
│                         │
└─────────────────────────┘
```

##### State C: Threshold Reached (Not All Voted)
```
┌─────────────────────────┐
│   [< Back] [Sign In]    │
├─────────────────────────┤
│  ┌────────────────────┐ │
│  │ ✨ Your insights   │ │
│  │ are ready!         │ │
│  │ You've voted on 10 │ │
│  │ statements...      │ │
│  └────────────────────┘ │
│                         │
│   Poll Question         │
│                         │
│   Poll Description      │
│                         │
│   [✨ Insights Ready]   │
│   (Badge)               │
│                         │
│   [View Your Insights]  │
│   (Primary CTA)         │
│                         │
│   [Continue Voting]     │
│   (Secondary button)    │
│                         │
│   Helper: You've        │
│   unlocked insights!    │
│                         │
└─────────────────────────┘
```

##### State D: Completed (All Statements Voted)
```
┌─────────────────────────┐
│   [< Back] [Sign In]    │
├─────────────────────────┤
│  ┌────────────────────┐ │
│  │ ✨ Poll completed! │ │
│  │ You've voted on    │ │
│  │ all 15 statements  │ │
│  └────────────────────┘ │
│                         │
│   Poll Question         │
│                         │
│   Poll Description      │
│                         │
│   [✨ Insights Ready]   │
│   (Badge)               │
│                         │
│   [View Your Insights]  │
│   (Primary CTA)         │
│                         │
│   [View Poll Results]   │
│   (Secondary button)    │
│                         │
│   Helper: You've        │
│   completed this poll!  │
│                         │
└─────────────────────────┘
```

#### Components Needed
- **Poll Header** (AdaptiveHeader - minimal variant)
  - Back button
  - Sign In button (if anonymous)
  - User avatar menu (if authenticated)

- **Welcome Back Banner** (NEW - `components/polls/welcome-back-banner.tsx`)
  - Three variants: in-progress, threshold-reached, completed
  - Info/Sparkles icon
  - Progress message
  - Optional badge showing vote count

- **Progress Badge** (NEW)
  - Shows "X/Y Statements" (in progress)
  - Shows "✨ Insights Ready" (threshold reached/completed)
  - Variant changes based on state

- **Poll Intro Section**
  - Poll question (H1)
  - Description text
  - Adaptive CTA buttons (changes based on state)
  - Helper text (adaptive)

#### State Detection Logic
1. **Check if user exists in database:**
   - Authenticated: Look up by Clerk ID
   - Anonymous: Look up by session ID

2. **If user exists, fetch voting progress:**
   - Total votes cast
   - Total statements in poll
   - Whether threshold reached

3. **Determine UI state:**
   - **State A:** No user OR votes = 0
   - **State B:** votes > 0 AND !thresholdReached
   - **State C:** thresholdReached AND votes < totalStatements
   - **State D:** votes >= totalStatements

4. **Render appropriate UI** based on state

#### Interactions

##### State A (New User)
- Click "Start Voting" → Navigate to `/polls/[slug]/vote`
- Show demographics modal (if first time)

##### State B (In Progress)
- Click "Continue Voting" → Navigate to `/polls/[slug]/vote`
- Resumes from next unvoted statement

##### State C (Threshold Reached)
- Click "View Your Insights" (Primary) → Navigate to `/polls/[slug]/insights`
- Click "Continue Voting" (Secondary) → Navigate to `/polls/[slug]/vote`

##### State D (Completed)
- Click "View Your Insights" (Primary) → Navigate to `/polls/[slug]/insights`
- Click "View Poll Results" (Secondary) → Navigate to `/polls/[slug]/results`
- No "Continue Voting" option (all statements done)

##### All States
- Back button → Return to poll directory
- Sign In → Redirect to authentication flow

---

## Authentication Pages

### 3. Sign In Page
**Route:** `/login`

#### Layout
```
┌─────────────────────────┐
│   [< Back to Polls]     │
├─────────────────────────┤
│                         │
│     Pulse Logo          │
│                         │
│   Welcome Back!         │
│                         │
│   [Sign in with Clerk]  │
│   (Clerk components)    │
│                         │
│   Don't have account?   │
│   [Sign Up]             │
│                         │
└─────────────────────────┘
```

#### Components Needed
- Clerk SignIn component
- Back navigation
- Link to sign up

---

### 4. Sign Up Page
**Route:** `/signup`

#### Layout
```
┌─────────────────────────┐
│   [< Back to Polls]     │
├─────────────────────────┤
│                         │
│     Pulse Logo          │
│                         │
│   Join Pulse            │
│                         │
│   [Sign up with Clerk]  │
│   (Clerk components)    │
│                         │
│   Already have account? │
│   [Sign In]             │
│                         │
└─────────────────────────┘
```

#### Components Needed
- Clerk SignUp component
- Back navigation
- Link to sign in

#### Authenticated User Behavior
**What happens if already signed-in user visits `/login` or `/signup`:**

1. **Automatic Redirect**
   - Clerk's SignIn/SignUp components detect existing authentication via JWT
   - User is automatically redirected to `fallbackRedirectUrl` (set to `/` home page)
   - No error message displayed - seamless user experience
   - Redirect happens immediately on page load

2. **Prevention Strategy**
   - Sign In/Sign Up buttons hidden when user authenticated (using `<SignedOut>` wrapper)
   - Only UserButton (avatar with sign-out menu) visible when signed in (using `<SignedIn>` wrapper)
   - Prevents most users from accidentally visiting auth pages when logged in

3. **Sign Out Flow**
   - User clicks UserButton (Clerk-provided avatar component) in header
   - Dropdown menu appears with:
     - User profile info
     - "Manage account" link
     - **"Sign out" button**
   - After sign out, redirects to `afterSignOutUrl` (set to `/` home page)
   - Sign In/Sign Up buttons reappear in header

---

## Voting Interface

### 5. Demographics Modal (Optional)
**Displayed before first statement card**

#### Layout
```
┌─────────────────────────┐
│  Help us understand you │
│                         │
│  Age Group (optional)   │
│  [Select ▼]             │
│                         │
│  Gender (optional)      │
│  [Select ▼]             │
│                         │
│  Ethnicity (optional)   │
│  [Select ▼]             │
│                         │
│  Political Party (opt)  │
│  [Select ▼]             │
│                         │
│  [Skip]      [Continue] │
│                         │
│                         │
│                         │
└─────────────────────────┘
```

#### Components Needed
- **Demographics Modal**
  - 4 dropdown selects (Age, Gender, Ethnicity, Political Party)
  - Skip button (text link)
  - Continue button (primary)
  - Close/dismiss X (top right)

#### Interactions
- All fields optional
- Skip → Close modal, create user (if not exists), proceed to voting
- Continue → Save demographics, create user (if not exists), close modal, proceed to voting
- Cannot be shown again to same user
- **User Creation Timing:** User is created when demographics are saved OR on first vote (whichever comes first)

---

### 6. Card-Based Voting Interface
**Route:** `/polls/[slug]/vote`

#### Layout
```
┌─────────────────────────┐
│ ▬▬▬▬░░░░░░░░░  [Finish] │ ← Progress bar
├─────────────────────────┤
│                         │
│   Poll Question         │
│   (Small, persistent)   │
│                         │
│  ┌─────────────────┐    │
│  │                 │    │
│  │   STATEMENT     │    │
│  │   TEXT HERE     │    │
│  │                 │    │
│  │  [Agree] [Disagree] │ ← ON card
│  │                 │    │
│  └─────────────────┘    │
│                         │
│     [Pass/Unsure]       │ ← BELOW card
│                         │
│   Statement 1 of 10     │ ← Cumulative count
│                         │
│  [Submit Statement]     │ ← Optional
│                         │
└─────────────────────────┘
```

#### Components Needed

##### Statement Card Component
- **Card Container**
  - Shadow, rounded corners (16px)
  - Centered, prominent
  - Statement text (large, readable)
  - Agree button (left/top)
  - Disagree button (right/bottom)
  - Customizable button labels

- **Button Positioning**
  - Agree/Disagree: ON the card
  - Pass/Unsure: BELOW the card, separated

##### Progress Bar Component (Instagram-style)
- Segmented bar at very top
- Each segment = one statement in current batch
- Filled segments = voted
- Current segment = animated/pulsing
- Empty segments = upcoming in current batch
- Always visible, sticky
- **Batching behavior:**
  - Shows 10 segments per batch
  - Resets visual segments after each batch of 10
  - Statement counter uses cumulative numbering

##### Header Controls
- Poll question (small, top)
- Finish button (right side)
  - Disabled state (grayed out) until threshold
  - Enabled state (clickable) after threshold
  - Tooltip when disabled:
    - "Complete the first 10 statements to finish" (polls with 10+ statements)
    - "Vote on all X statements to finish" (polls with <10 statements)
- Submit Statement button (optional, in menu or header)

##### Vote Result Overlay
```
┌─────────────────────────┐
│  ┌─────────────────┐    │
│  │                 │    │
│  │   STATEMENT     │    │
│  │                 │    │
│  │  ✓ YOU AGREED   │    │ ← User's vote
│  │                 │    │
│  │  Agree:    65%  │    │
│  │  ████████░░     │    │ ← Animated bar
│  │                 │    │
│  │  Disagree: 25%  │    │
│  │  ███░░░░░░░     │    │
│  │                 │    │
│  │  Unsure:   10%  │    │
│  │  █░░░░░░░░░     │    │
│  │                 │    │
│  │  Based on 234   │    │
│  │  votes          │    │
│  │                 │    │
│  └─────────────────┘    │
│                         │
│  [Next →] (optional)    │
└─────────────────────────┘
```

#### States

##### Pre-Vote State (Clean Card)
- Statement card visible
- Agree/Disagree buttons enabled
- Pass/Unsure button enabled
- No vote distribution shown
- Progress bar shows current position

##### Post-Vote State (Results Display)
- Statement card remains
- User's vote highlighted
- Vote distribution appears with animation:
  - Percentages (X% agree, Y% disagree, Z% neutral)
  - Horizontal bars (animated fill)
  - Total vote count
  - User's vote indicator
- Results visible for 3-5 seconds
- Auto-advance OR manual Next button

##### Transition State
- Smooth fade out of results
- Card slides/fades away
- Next card slides/fades in
- Progress bar segment fills
- Clean slate for next statement

#### Interactions

1. **Voting Flow**
   - Tap Agree → Vote recorded → Results reveal (animated) → Auto-advance (3-5s) → Next card
   - Tap Disagree → Same flow
   - Tap Pass/Unsure → Same flow

2. **Manual Advancement**
   - Optional "Next" button during results display
   - Allows users to skip ahead faster

3. **No Back Navigation**
   - No back button
   - No review previous votes
   - Forward-only progression
   - Votes are final and irreversible

4. **Finish Button**
   - Initially disabled (grayed out) until threshold
   - Threshold: First 10 statements OR all statements if poll has <10
   - Shows tooltip when disabled (see Header Controls above)
   - Becomes enabled when threshold reached
   - Tap when enabled → End voting, show insights

5. **Submit Statement** (if poll allows)
   - Tap Submit Statement button
   - Modal/popup appears
   - Text input for statement
   - Character count indicator
   - Submit/Cancel buttons
   - Returns to same voting card after submit

6. **Statement Batching (10 statements at a time)**
   - When poll has more than 10 approved statements
   - User sees first 10 statements as a batch
   - After voting on 10th statement, continuation page appears
   - User chooses: Continue voting OR Finish now (enabled after first batch complete)
   - If Continue → Load next batch of up to 10 statements
   - If Finish → End voting session, generate insights
   - Finish button in header enabled throughout after threshold met
   - **Cumulative counting system:**
     - Batch 1: Shows "Statement 1 of 10", "2 of 10"... "10 of 10"
     - Batch 2: Shows "Statement 11 of 20", "12 of 20"... "20 of 20"
     - Batch 3: Shows "Statement 21 of 30", "22 of 30"... "30 of 30"
     - Final batch: Shows "Statement 31 of 32", "32 of 32" (example for 32 total)
   - **Progress bar resets visually** each batch but counter remains cumulative
   - User understands continuation without knowing total statement count upfront

---

### 6a. Continuation Page (Between Batches)
**Displayed after every 10 statements voted**

#### Layout
```
┌─────────────────────────┐
│                         │
│   Great progress!       │
│                         │
│   You've voted on 10    │
│   statements so far.    │
│   (or 20, 30, etc.)     │
│                         │
│   ┌─────────────────┐   │
│   │  Your Stats     │   │
│   │  -------------  │   │
│   │  Agree:    6    │   │
│   │  Disagree: 3    │   │
│   │  Unsure:   1    │   │
│   └─────────────────┘   │
│                         │
│   There are more        │
│   statements to explore.│
│                         │
│   What would you like   │
│   to do?                │
│                         │
│  [Continue Voting]      │ ← Primary
│                         │
│  [Finish & See Results] │ ← Secondary
│                         │
└─────────────────────────┘
```

#### Components Needed
- Progress summary card
- Vote distribution summary
- Statement count indicator
- Continue button (primary, prominent)
- Finish button (secondary)

#### Interactions
- **Continue Voting** → Load next batch of up to 10 statements
- **Finish & See Results** → End voting session, generate insights
- **No skip/dismiss** → User must choose one option
- **Cumulative progress display:** Shows total votes so far (10, 20, 30, etc.)
- Does NOT show total remaining or total statement count (keeps exploration open-ended)
- Next batch continues cumulative numbering (e.g., after voting 10, next batch starts at "Statement 11 of 20")

---

### 7. Statement Submission Modal
**Triggered from voting interface**

#### Layout
```
┌─────────────────────────┐
│  Submit a Statement [X] │
├─────────────────────────┤
│                         │
│  Write your statement:  │
│                         │
│  ┌─────────────────┐    │
│  │                 │    │
│  │                 │    │
│  │                 │    │
│  └─────────────────┘    │
│                         │
│  Characters: 45/200     │
│                         │
│  Preview:               │
│  ┌─────────────────┐    │
│  │ Your statement  │    │
│  │ will appear     │    │
│  │ like this       │    │
│  └─────────────────┘    │
│                         │
│  [Cancel]    [Submit]   │
│                         │
└─────────────────────────┘
```

#### Components Needed
- Modal overlay (darkened background)
- Modal container
- Text area input
- Character counter
- Statement preview card
- Cancel button (secondary)
- Submit button (primary, disabled if empty)

#### States
- Empty state (submit disabled)
- Typing state (live character count)
- Limit warning (approaching/at character limit)
- Submitting state (loading spinner)
- Success state (confirmation message)
- Error state (submission failed)

#### Post-Submission Flow
- Auto-approval: "Your statement is now live!"
- Moderation: "Your statement is pending approval"
- Modal closes
- Returns to same voting card

---

## Results & Insights Pages

### 8. Personal Insights Page
**Shown after completing voting (pressing Finish button after threshold met)**

#### Layout
```
┌─────────────────────────┐
│                         │
│   Your Insights         │
│                         │
│   ┌─────────────────┐   │
│   │  INSIGHT TITLE  │   │
│   │  (Your position │   │
│   │   summary)      │   │
│   └─────────────────┘   │
│                         │
│   Insight Body Text:    │
│   - How you align with  │
│     majority/minority   │
│   - Your thematic       │
│     positions           │
│   - Unique perspectives │
│   - Demographic         │
│     correlations        │
│                         │
│   Generated: [timestamp]│
│                         │
│   [Share] [Save]        │
│   [View Poll Results]   │
│                         │
│   [Back to Polls]       │
│                         │
└─────────────────────────┘
```

#### Components Needed
- **Insight Display Component**
  - Title section (headline)
  - Body section (detailed text)
  - Timestamp
  - Share button (opens share menu)
  - Save button (authenticated only, saves to profile)
  - View Poll Results button (navigates to results summary)
  - Back to Polls button

#### Loading State
```
┌─────────────────────────┐
│                         │
│     [Spinner]           │
│                         │
│  Analyzing your         │
│  responses...           │
│                         │
└─────────────────────────┘
```

#### Error State
```
┌─────────────────────────┐
│                         │
│   ⚠️ Insight Generation │
│      Failed             │
│                         │
│  We couldn't generate   │
│  your insights right    │
│  now. Please try again  │
│  later.                 │
│                         │
│   [Retry]               │
│   [View Poll Results]   │
│                         │
└─────────────────────────┘
```

#### Interactions
- Share button → Native share menu or custom share options
- Save button → Save to user profile (authenticated only)
- View Poll Results → Navigate to Poll Results Summary page
- Back to Polls → Navigate to poll directory

---

### 9. Poll Results Summary Page
**Accessible after viewing personal insights**

#### Layout
```
┌─────────────────────────┐
│  [< Back to Insights]   │
├─────────────────────────┤
│                         │
│   Poll Results          │
│   Poll Question Here    │
│                         │
│   ┌─────────────────┐   │
│   │  AI Summary     │   │
│   │                 │   │
│   │  Overall poll   │   │
│   │  sentiment and  │   │
│   │  consensus:     │   │
│   │                 │   │
│   │  - Main themes  │   │
│   │  - Polarizing   │   │
│   │    statements   │   │
│   │  - Key trends   │   │
│   │                 │   │
│   └─────────────────┘   │
│                         │
│   Participation Stats:  │
│   - X voters            │
│   - Y total votes       │
│                         │
│   Generated: [timestamp]│
│                         │
│   [Back to Polls]       │
│                         │
└─────────────────────────┘
```

#### Components Needed
- **Results Summary Component**
  - Back button (to insights)
  - Poll question heading
  - AI-generated summary text section
  - Participation statistics
  - Timestamp of generation
  - Back to polls button

#### States
- Loading state (if summary not yet generated)
- Generated state (show summary)
- Error state (generation failed)

---

### 10. Closed Poll Access Page
**For ALL users (voters and non-voters) accessing closed polls**

#### Layout (For Voters)
```
┌─────────────────────────┐
│  [< Back to Polls]      │
├─────────────────────────┤
│                         │
│   Poll Question (CLOSED)│
│                         │
│   ┌─────────────────┐   │
│   │  Your Insights  │   │
│   │  (if completed  │   │
│   │    voting)      │   │
│   └─────────────────┘   │
│                         │
│   [View Poll Results]   │ ← Navigates to Poll Results Page
│                         │
│   ┌─────────────────┐   │
│   │  Your Votes:    │   │
│   │                 │   │
│   │  Statement 1    │   │
│   │  ✓ You agreed   │   │
│   │                 │   │
│   │  Statement 2    │   │
│   │  ✗ You disagreed│   │
│   │                 │   │
│   │  ... (all votes)│   │
│   │                 │   │
│   └─────────────────┘   │
│                         │
└─────────────────────────┘
```

#### Layout (For Non-Voters)
```
┌─────────────────────────┐
│  [< Back to Polls]      │
├─────────────────────────┤
│                         │
│   Poll Question (CLOSED)│
│                         │
│   This poll has ended.  │
│                         │
│   You can view the      │
│   results and insights  │
│   from this poll.       │
│                         │
│   [View Poll Results]   │ ← Navigates to Poll Results Page
│                         │
│   (No personal insights │
│    or vote history      │
│    available)           │
│                         │
└─────────────────────────┘
```

#### Components Needed
- **Closed Poll View Component**
  - Poll status badge (CLOSED)
  - Personal insights section (if available, voters only)
  - View Poll Results button → **Navigates to Poll Results Page (route: `/polls/[slug]/results`)**
  - Vote summary list (read-only, voters only)
    - Statement text
    - User's vote indicator
    - Vote distribution (optional)

#### Access Rules
- **Voters (participated and completed):**
  - See personal insights (if they completed voting/reached threshold)
  - See their vote history (read-only)
  - Can view poll results page
- **Non-voters (did not participate):**
  - NO personal insights (didn't participate)
  - NO vote history (didn't vote)
  - CAN view poll results page (public results)

---

## Creator/Owner Pages

### 11. Poll Creation Wizard
**Route:** `/polls/create`

#### Step 1: Basic Information
```
┌─────────────────────────┐
│  Create New Poll [X]    │
├─────────────────────────┤
│  Step 1 of 5            │
│  ████░░░░░░░░░░         │
│                         │
│  Poll Question *        │
│  ┌─────────────────┐    │
│  │                 │    │
│  └─────────────────┘    │
│                         │
│  Description (optional) │
│  ┌─────────────────┐    │
│  │                 │    │
│  │                 │    │
│  │                 │    │
│  └─────────────────┘    │
│                         │
│     [Cancel] [Next →]   │
└─────────────────────────┘
```

#### Step 2: Control Settings
```
┌─────────────────────────┐
│  Create New Poll [X]    │
├─────────────────────────┤
│  Step 2 of 5            │
│  ████████░░░░░░         │
│                         │
│  Settings               │
│                         │
│  □ Allow user-submitted │
│    statements           │
│                         │
│  □ Auto-approve user    │
│    statements           │
│    (requires above)     │
│                         │
│  Voting Threshold *     │
│  [5 ▼] (min: 1)         │
│                         │
│  Voting Goal (optional) │
│  ┌──────┐               │
│  │ 1000 │               │
│  └──────┘               │
│                         │
│  [← Back]   [Next →]    │
└─────────────────────────┘
```

#### Step 3: Button Labels
```
┌─────────────────────────┐
│  Create New Poll [X]    │
├─────────────────────────┤
│  Step 3 of 5            │
│  ████████████░░         │
│                         │
│  Customize Voting       │
│  Buttons (optional)     │
│                         │
│  Agree Button Label     │
│  ┌──────────┐           │
│  │ Agree    │ (10 max)  │
│  └──────────┘           │
│  Displayed ON card      │
│                         │
│  Disagree Button Label  │
│  ┌──────────┐           │
│  │ Disagree │ (10 max)  │
│  └──────────┘           │
│  Displayed ON card      │
│                         │
│  Pass/Unsure Label      │
│  ┌──────────┐           │
│  │ Unsure   │ (10 max)  │
│  └──────────┘           │
│  Displayed BELOW card   │
│                         │
│  [← Back]   [Next →]    │
└─────────────────────────┘
```

#### Step 4: Scheduling
```
┌─────────────────────────┐
│  Create New Poll [X]    │
├─────────────────────────┤
│  Step 4 of 5            │
│  ████████████████░      │
│                         │
│  Schedule (optional)    │
│                         │
│  Start Time             │
│  [Date Picker]          │
│  [Time Picker]          │
│                         │
│  End Time               │
│  [Date Picker]          │
│  [Time Picker]          │
│                         │
│  Leave blank for:       │
│  - Immediate start      │
│  - No end date          │
│                         │
│  [← Back]   [Next →]    │
└─────────────────────────┘
```

#### Step 5: Initial Statements
```
┌─────────────────────────┐
│  Create New Poll [X]    │
├─────────────────────────┤
│  Step 5 of 5            │
│  ████████████████████   │
│                         │
│  Add Statements         │
│  (minimum 6 required)*  │
│                         │
│  Statement 1            │
│  ┌─────────────────┐    │
│  │ Text here...    │ [X]│
│  └─────────────────┘    │
│                         │
│  Statement 2            │
│  ┌─────────────────┐    │
│  │ Text here...    │ [X]│
│  └─────────────────┘    │
│                         │
│  [+ Add Statement]      │
│                         │
│  Added: 2 statements    │
│  Need at least 6 to     │
│  create poll            │
│                         │
│  [← Back] [Create Poll] │
│  (disabled until 6+)    │
└─────────────────────────┘
```

#### Components Needed
- **Wizard Container**
  - Step indicator (1 of 5)
  - Progress bar
  - Close/cancel button
  - Navigation buttons (Back/Next/Finish)

- **Form Inputs**
  - Text input (question)
  - Textarea (description)
  - Checkbox toggles (settings)
  - Text inputs with character limits (button labels)
  - Date/time pickers
  - Dynamic statement list with add/remove

- **Validation**
  - Required field indicators
  - Real-time validation
  - Error messages
  - Prevent next step if invalid

---

### 12. Poll Management Dashboard
**Route:** `/polls/[slug]/manage`

#### Layout
```
┌─────────────────────────┐
│  [← Back to Polls]      │
├─────────────────────────┤
│  Poll Question          │
│  Status: [DRAFT/ACTIVE] │
│                         │
│  [Edit] [Publish/Unpublish/Close] │
│                         │
│  ┌─────────────────┐    │
│  │  Quick Stats    │    │
│  │  - X voters     │    │
│  │  - Y votes      │    │
│  │  - Z statements │    │
│  │  - N pending    │    │
│  └─────────────────┘    │
│                         │
│  Tabs:                  │
│  [Statements] [Analytics]│
│  [Settings] [Roles]     │
│                         │
│  [Active Tab Content]   │
│                         │
└─────────────────────────┘
```

#### Tab: Statements
```
┌─────────────────────────┐
│  Filter: [All ▼]        │
│  [Approved][Pending][All]│
│                         │
│  Pending (3)            │
│  ┌─────────────────┐    │
│  │ "Statement..."  │    │
│  │ By: User123     │    │
│  │ [Approve][Reject]│   │
│  └─────────────────┘    │
│                         │
│  ☑ Select All           │
│  [Bulk Approve]         │
│  [Bulk Reject]          │
│                         │
│  Approved (12)          │
│  ┌─────────────────┐    │
│  │ "Statement..."  │    │
│  │ Votes: 45       │    │
│  │ [Edit] [Delete] │    │
│  └─────────────────┘    │
│                         │
│  [+ Add Statement]      │
└─────────────────────────┘
```

#### Tab: Analytics
```
┌─────────────────────────┐
│  Participation Metrics  │
│                         │
│  Total Voters: 234      │
│  Total Votes: 1,547     │
│  Avg Votes/User: 6.6    │
│  Reached Threshold: 89% │
│                         │
│  Statement Performance  │
│                         │
│  Most Agreed:           │
│  "Statement text..."    │
│  87% agree              │
│                         │
│  Most Disagreed:        │
│  "Statement text..."    │
│   12% agree              │
│                         │
│  Most Divisive:         │
│  "Statement text..."    │
│  51% agree, 49% disagree│
│                         │
│  [Export Data]          │
└─────────────────────────┘
```

#### Tab: Settings
```
┌─────────────────────────┐
│  Poll Settings          │
│                         │
│  Question               │
│  ┌─────────────────┐    │
│  │ Current text    │    │
│  └─────────────────┘    │
│                         │
│  Description            │
│  ┌─────────────────┐    │
│  │                 │    │
│  └─────────────────┘    │
│                         │
│  ☑ Allow user statements│
│  ☐ Auto-approve         │
│                         │
│  Threshold: [5 ▼]       │
│                         │
│  Button Labels          │
│  Agree: [____]          │
│  Disagree: [____]       │
│  Pass: [____]           │
│                         │
│  Schedule               │
│  Start: [Date/Time]     │
│  End: [Date/Time]       │
│                         │
│  [Save Changes]         │
└─────────────────────────┘
```

#### Tab: Roles
```
┌─────────────────────────┐
│  Poll Managers          │
│                         │
│  Current Managers (2)   │
│  ┌─────────────────┐    │
│  │ User Name       │    │
│  │ email@test.com  │    │
│  │ [Remove]        │    │
│  └─────────────────┘    │
│                         │
│  Add Manager            │
│  ┌─────────────────┐    │
│  │ Search user...  │    │
│  └─────────────────┘    │
│  [Add]                  │
│                         │
│  Transfer Ownership     │
│  [Transfer Poll...]     │
│                         │
└─────────────────────────┘
```

#### Components Needed
- **Management Header**
  - Poll status badge
  - Action buttons:
    - **Edit** (draft/published polls)
    - **Publish** (draft polls only)
    - **Unpublish** (published polls only, returns to draft state)
    - **Close** (published polls only, ends poll permanently)
  - Quick stats card

- **Tab Navigation**
  - 4 tabs: Statements, Analytics, Settings, Roles
  - Active tab indicator

- **Statement Moderation Components**
  - Statement card with actions
  - Bulk selection checkboxes
  - Bulk action buttons
  - Filter dropdown

- **Analytics Visualizations**
  - Stat cards
  - Top statements list
  - Export button

- **Settings Form**
  - All poll settings (reusable from creation)
  - Save button

- **Role Management**
  - Manager list
  - User search/add
  - Transfer ownership modal

---

### 13. Poll Publish Confirmation Modal

#### Layout
```
┌─────────────────────────┐
│  Publish Poll? [X]      │
├─────────────────────────┤
│                         │
│  Ready to publish?      │
│                         │
│  ✓ 15 statements added  │
│  ✓ Settings configured  │
│  ✓ Threshold set to 5   │
│                         │
│  ⚠ Recommendations:     │
│  - Add more statements  │
│    for better insights  │
│                         │
│  Once published, you    │
│  can unpublish later if │
│  needed (returns to     │
│  draft state).          │
│                         │
│  Start Time:            │
│  [Immediately / Scheduled]│
│                         │
│  [Cancel] [Publish Now] │
│                         │
└─────────────────────────┘
```

---

### 13a. Poll Unpublish Confirmation Modal

#### Layout
```
┌─────────────────────────┐
│  Unpublish Poll? [X]    │
├─────────────────────────┤
│                         │
│  Are you sure you want  │
│  to unpublish this poll?│
│                         │
│  ⚠ This will:           │
│  - Hide poll from users │
│  - Stop accepting votes │
│  - Return to draft state│
│  - Keep existing votes  │
│                         │
│  Current Stats:         │
│  ✓ 234 voters           │
│  ✓ 1,547 votes recorded │
│                         │
│  You can republish the  │
│  poll later if needed.  │
│                         │
│  [Cancel] [Unpublish]   │
│                         │
└─────────────────────────┘
```

#### Components Needed
- Modal overlay
- Warning icon
- Impact summary
- Current statistics
- Cancel button (secondary)
- Unpublish button (warning/danger style)

#### Post-Unpublish Actions
- Poll status changes to DRAFT
- Poll removed from public listings
- Existing votes preserved
- Analytics remain accessible
- Owner can edit and republish

---

## Admin Pages

### 14. Global Moderation Queue
**Route:** `/admin/moderation`

#### Layout
```
┌─────────────────────────┐
│  Global Moderation      │
│  Queue                  │
├─────────────────────────┤
│  Filter by Poll: [All ▼]│
│  Sort: [Oldest First ▼] │
│  Search: [_________]    │
│                         │
│  Pending (47)           │
│                         │
│  ┌─────────────────┐    │
│  │ "Statement..."  │    │
│  │ Poll: Question  │    │
│  │ By: User123     │    │
│  │ 2 hours ago     │    │
│  │ [Approve][Reject]│   │
│  └─────────────────┘    │
│                         │
│  ☑ Select All           │
│  [Bulk Approve]         │
│  [Bulk Reject]          │
│                         │
│  [Load More]            │
└─────────────────────────┘
```

#### Components Needed
- Filter and search bar
- Pending statement list
- Statement cards with poll context
- Bulk action controls
- Pagination/infinite scroll

---

### 15. Admin Dashboard
**Route:** `/admin/dashboard`

#### Layout
```
┌─────────────────────────┐
│  Admin Dashboard        │
├─────────────────────────┤
│                         │
│  System Stats           │
│  ┌─────────────────┐    │
│  │ Total Polls: 45 │    │
│  │ Active: 23      │    │
│  │ Users: 1,234    │    │
│  │ Votes: 45,678   │    │
│  └─────────────────┘    │
│                         │
│  Quick Actions          │
│  [Moderation Queue (47)]│
│  [View All Polls]       │
│  [User Management]      │
│                         │
│  Recent Activity        │
│  - New poll created     │
│  - 234 votes today      │
│  - 12 statements pending│
│                         │
└─────────────────────────┘
```

---

### 16. Admin Poll View
**Route:** `/admin/polls/[slug]`

#### Layout
```
┌─────────────────────────┐
│  Admin View - Poll      │
│  Question Here          │
├─────────────────────────┤
│                         │
│  All Statements         │
│                         │
│  ┌─────────────────┐    │
│  │ Statement 1     │    │
│  │                 │    │
│  │ Agree: 65% ████ │    │
│  │ Disagree: 25% ██│    │
│  │ Unsure: 10% █   │    │
│  │                 │    │
│  │ Total votes: 234│    │
│  └─────────────────┘    │
│                         │
│  (All statements shown  │
│   with distributions)   │
│                         │
│  [Edit Poll]            │
│  [Delete Poll]          │
│                         │
└─────────────────────────┘
```

#### Note
- Owners/managers can view ALL statements with distributions
- No voting interface in admin view
- Can vote separately as regular user

---

## Shared Components

### Component Library

#### 1. Navigation Components

##### AdaptiveHeader (Context-Aware Header System)
**Implementation:** Single header component that adapts based on page context and configuration

**Architecture:**
- **HeaderContext** - Provides configuration API for pages to customize header
- **AdaptiveHeader** - Smart component that renders appropriate variant based on context
- **Auto-detection** - Detects route patterns to apply correct variant automatically
- **Override capability** - Pages can use `useHeader()` hook to customize header behavior

**Header Variants:**

1. **Default Variant** (Public pages: Home, Poll listing)
   - Logo (left)
   - Desktop navigation: Polls, Create Poll (auth), Admin (auth)
   - Auth buttons / User menu (right)
   - Mobile hamburger menu
   - Sticky positioning

2. **Voting Variant** (Active voting session `/polls/[slug]/vote`)
   - Poll question (truncated, left)
   - Poll end time (subtitle, if applicable)
   - Context actions (right): Submit Statement, Finish button
   - Progress bar (custom content below header)
   - Compact layout optimized for voting flow

3. **Management Variant** (Poll owner/manager `/polls/[slug]/manage`)
   - Back button (left)
   - Poll title/badge (center)
   - Management actions (right): Edit, Publish/Unpublish, Close
   - User menu
   - Sticky positioning

4. **Minimal Variant** (Auth, Results, Insights, Closed polls)
   - Back button with custom label (left)
   - Logo (center, optional)
   - Auth buttons / User menu (right)
   - Clean, focused layout

5. **Admin Variant** (Admin dashboard, moderation)
   - Back button (left)
   - Page title (center)
   - Admin-specific actions (right, optional)
   - Sticky positioning

**Usage Pattern:**
```tsx
// Pages use HeaderContext to customize header
const { setConfig, resetConfig } = useHeader();

useEffect(() => {
  setConfig({
    variant: "management",
    backUrl: "/polls",
    backLabel: "Back to Polls",
    title: "Poll Management",
    actions: <CustomActions />
  });

  return () => resetConfig();
}, []);
```

**Benefits:**
- Single source of truth (no duplicate headers)
- Context-aware (adapts to page needs)
- Consistent behavior across all pages
- Easy to maintain and extend

##### Mobile Navigation
- **MobileNav Component**
  - Slide-out sheet from left
  - User info at top (if authenticated)
  - Navigation links
  - Auth buttons (if anonymous)
  - Aligned with AdaptiveHeader structure

##### Footer
  - Links (About, Privacy, Terms)
  - Copyright
  - Social links

#### 2. Card Components
- **Poll Card** (list view)
- **Statement Card** (voting interface)
- **Insight Card**
- **Results Summary Card**
- **Stat Card** (analytics)
- **Welcome Back Banner** (NEW - poll entry page)
  - File: `components/polls/welcome-back-banner.tsx`
  - Three variants:
    - **in-progress**: Info icon, "Welcome back!" message with vote count
    - **threshold-reached**: Sparkles icon, "Your insights are ready!" message
    - **completed**: Sparkles icon, "Poll completed!" message
  - Uses Alert, AlertTitle, AlertDescription components
  - Blue color scheme (border-blue-200 bg-blue-50)
  - Optional badge showing vote progress
  - Props: `votedCount`, `totalCount`, `variant`

#### 3. Form Components
- **Text Input**
  - Label
  - Placeholder
  - Error state
  - Helper text
  - Character counter

- **Textarea**
  - Expandable
  - Character limit
  - Auto-resize

- **Select Dropdown**
  - Custom styling
  - Search (for long lists)
  - Multi-select (optional)

- **Checkbox**
  - Single
  - Group
  - Toggle variant

- **Date/Time Picker**
  - Date only
  - Time only
  - Combined

#### 4. Button Components
- **Primary Button**
  - Normal state
  - Hover state
  - Active/pressed state
  - Disabled state
  - Loading state

- **Secondary Button**
- **Text Button** (link style)
- **Icon Button**

#### 5. Modal/Dialog Components
- **Modal Container**
  - Overlay
  - Content area
  - Close button
  - Action buttons

- **Confirmation Dialog**
- **Alert Dialog**

#### 6. Feedback Components
- **Loading Spinner**
  - Small (inline)
  - Large (full screen)

- **Progress Bar**
  - Linear
  - Segmented (Instagram-style)
  - Circular

- **Toast/Notification**
  - Success
  - Error
  - Warning
  - Info

- **Empty State**
  - Icon
  - Message
  - Action button

- **Error State**
  - Icon
  - Message
  - Retry button

#### 7. Data Display Components
- **Stat Display**
  - Number
  - Label
  - Icon (optional)
  - Trend indicator (optional)

- **Vote Distribution Bar**
  - Animated fill
  - Percentage label
  - Color coded

- **Badge**
  - Status (Active/Closed/Draft)
  - Count (notification)
  - Label

- **Avatar**
  - User image
  - Fallback initials
  - Status indicator

#### 8. Layout Components
- **Container**
  - Max width
  - Padding
  - Centered

- **Grid**
  - Responsive columns
  - Gap spacing

- **Stack**
  - Vertical spacing
  - Alignment

---

## Responsive Behavior

### Breakpoints
```
Mobile:  375px - 767px   (base design)
Tablet:  768px - 1023px  (adjusted layout)
Desktop: 1024px+         (expanded layout)
```

### Mobile (375px - 767px)
- **Navigation:** Hamburger menu
- **Voting Interface:** Full screen cards
- **Poll List:** Single column, stacked cards
- **Modals:** Full screen on small devices
- **Forms:** Full width inputs
- **Admin Tables:** Horizontal scroll or stacked view

### Tablet (768px - 1023px)
- **Navigation:** Visible menu bar
- **Voting Interface:** Slightly larger cards, same flow
- **Poll List:** 2-column grid
- **Modals:** Centered, max-width 600px
- **Forms:** Optimized spacing
- **Admin Tables:** Full table view

### Desktop (1024px+)
- **Navigation:** Full menu bar with dropdowns
- **Voting Interface:** Centered card, max-width 500px
- **Poll List:** 3-column grid
- **Modals:** Centered, max-width 800px
- **Forms:** Multi-column layouts where appropriate
- **Admin Tables:** Full featured tables with sorting/filtering
- **Sidebar:** Optional sidebar for admin/management views

---

## Animation & Interaction Specs

### Micro-Animations

#### 1. Button Press
- Scale down to 0.95 on press
- Duration: 100ms
- Easing: ease-out

#### 2. Card Transitions (Voting)
- **Vote Reveal:**
  - Results fade in: 300ms
  - Bars animate fill: 500ms (staggered by 100ms)
  - Easing: ease-out

- **Card Exit:**
  - Fade out: 200ms
  - Slide left: 300ms
  - Easing: ease-in

- **Card Enter:**
  - Fade in: 200ms
  - Slide in from right: 300ms
  - Easing: ease-out

#### 3. Progress Bar
- **Segment Fill:**
  - Width transition: 300ms
  - Easing: ease-in-out

- **Current Segment Pulse:**
  - Opacity: 1 → 0.5 → 1
  - Duration: 1500ms
  - Loop: infinite

#### 4. Modal Animations
- **Open:**
  - Overlay fade in: 200ms
  - Modal scale: 0.9 → 1.0, 250ms
  - Easing: ease-out

- **Close:**
  - Modal scale: 1.0 → 0.9, 200ms
  - Overlay fade out: 200ms
  - Easing: ease-in

#### 5. Loading States
- **Spinner:** Continuous rotation, 1s per revolution
- **Skeleton:** Shimmer effect, 1.5s loop
- **Progress Bar:** Indeterminate animation

### Gesture Interactions (Mobile)
- **Pull to Refresh:** Optional for poll list
- **Swipe:** NOT used for voting (button-only)
- **Long Press:** Show contextual menu (admin/management)
- **Double Tap:** Not used (prevent accidental actions)

### Haptic Feedback (Mobile)
- **Vote Cast:** Light haptic
- **Button Press:** Light haptic
- **Error:** Medium haptic
- **Success:** Success pattern haptic

### Accessibility Animations
- **Reduced Motion:** Respect `prefers-reduced-motion`
  - Disable card transitions
  - Use fade only (no slide)
  - Disable pulsing animations
  - Instant progress bar changes

---

## Additional UX Considerations

### Error Handling UX

#### Network Errors
- Retry button
- Offline indicator
- Queue actions for later (optimistic UI)

#### Validation Errors
- Inline field errors
- Aggregate error summary
- Focus management to first error

#### Permission Errors
- Clear messaging
- Redirect to appropriate page
- Contact support option

### Empty States

#### No Polls Available
- Illustration
- Message: "No polls found"
- CTA: Create poll or adjust filters

#### No Statements (Admin)
- Message: "No statements to moderate"
- Helpful next action

#### No Votes Yet
- Encourage participation
- Share poll prompt

### Success States

#### Poll Created
- Confirmation message
- Next steps (add statements, publish)
- Share options

#### Vote Cast
- Brief visual confirmation (checkmark)
- Progress update

#### Statement Submitted
- Confirmation with status
- Return to voting

### Loading States

#### Page Load
- Skeleton screens matching layout
- Progressive loading (content first, then images)

#### Action Processing
- Button loading spinner
- Disabled state during process
- Optimistic UI when safe

### Focus Management

#### Modal Open
- Focus first interactive element
- Trap focus within modal

#### Form Submission
- Focus first error or success message
- Return focus on modal close

#### Keyboard Navigation
- Logical tab order
- Skip links for navigation
- Visible focus indicators

---

## Conclusion

This specification provides a complete blueprint for designing and implementing the Pulse frontend. Designers should use this as a foundation for creating detailed mockups, while developers can use it as a technical reference for component structure and behavior.

**Next Steps:**
1. Design system creation (colors, typography, spacing)
2. High-fidelity mockups for key flows
3. Interactive prototypes for voting interface
4. Component library implementation
5. Usability testing and iteration
