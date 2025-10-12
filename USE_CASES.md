# Pulse - Use Cases & User Workflows

**Version:** 1.6
**Date:** 2025-10-10
**Purpose:** Comprehensive documentation of all user workflows for UX/UI design

**Changelog:**
- **v1.6 (2025-10-10)**: Card deck terminology finalized - Updated all "vote/voting/voter" references to "choose/choosing/player" terminology with Hebrew mapping (לשמור/לזרוק/לדלג)
- **v1.5 (2025-10-09)**: Hebrew RTL conversion - Complete translation to Hebrew with gender-neutral language, RTL layout using CSS logical properties, Rubik font with Hebrew support, Clerk Hebrew localization
- **v1.4 (2025-10-08)**: Card deck metaphor refinements - Continuation page achievement flow, Insights/Results as collectible cards, Closed poll dual-card display, Poll listing as deck browsing

---

## Table of Contents

1. [Language & Localization](#language--localization)
2. [User Personas & Roles](#user-personas--roles)
3. [Core User Journeys](#core-user-journeys)
4. [Poll Creator Workflows](#poll-creator-workflows)
5. [Poll Management Workflows](#poll-management-workflows)
6. [System Administrator Workflows](#system-administrator-workflows)
7. [Interface Boundaries Summary](#interface-boundaries-summary)
8. [Key Features & Business Logic](#key-features--business-logic)
9. [Technical Constraints & Rules](#technical-constraints--rules)

---

## Language & Localization

### Application Language
**Pulse is a Hebrew-only application** with full RTL (right-to-left) support. There is no English fallback or bilingual interface.

#### Language Implementation
- **Primary Language:** Hebrew only (no English)
- **Direction:** RTL (right-to-left) layout throughout
- **Font:** Rubik with Hebrew + Latin subset support (Google Fonts)
- **Translation Approach:** Gender-neutral Hebrew using infinitives and nouns
- **Character Set:** Full Hebrew Unicode support

#### Translation Philosophy
**Gender-Neutral Language Strategy:**
- All UI text uses gender-neutral forms to support all genders
- Uses infinitive verb forms instead of gendered conjugations (e.g., "כניסה" instead of "התחבר/התחברי")
- Uses noun forms where appropriate (e.g., "יצירת סקר", "צפייה בתובנות")
- Avoids masculine/feminine pronouns where possible
- Maintains professional, welcoming tone for all users

**Examples:**
- "Sign In" → "כניסה" (entrance/entering)
- "Create Poll" → "יצירת סקר" (poll creation)
- "View Insights" → "צפייה בתובנות" (viewing insights)
- "Continue Choosing" → "המשך לבחור" (continue choosing)

#### UI Localization Components
1. **Clerk Authentication:** Hebrew localization (`heIL`) for all auth flows
2. **Date/Time:** Hebrew locale (`he` from date-fns) for date formatting
3. **Validation Messages:** All Zod error messages translated to Hebrew
4. **Toast Notifications:** All user-facing messages in Hebrew
5. **Form Labels:** All inputs, buttons, placeholders in Hebrew

#### RTL Layout Implementation
- **HTML Attribute:** `<html lang="he" dir="rtl">`
- **CSS Strategy:** Tailwind CSS v4 logical properties throughout
  - `ms-` (margin-inline-start) instead of `ml-` (margin-left)
  - `me-` (margin-inline-end) instead of `mr-` (margin-right)
  - `ps-` (padding-inline-start) instead of `pl-` (padding-left)
  - `pe-` (padding-inline-end) instead of `pr-` (padding-right)
  - `start-` (inset-inline-start) instead of `left-`
  - `end-` (inset-inline-end) instead of `right-`
  - `text-start` instead of `text-left`
  - `text-end` instead of `text-right`
- **Icons:** Directional icons reversed (ArrowLeft → ArrowRight for back buttons)
- **Component Direction:** Radix UI components automatically respect `dir="rtl"` attribute

#### Font Configuration
- **Font Family:** Rubik (replaces Geist Sans/Mono)
- **Subsets:** Hebrew + Latin (supports Hebrew UI with English usernames/technical terms)
- **Font Variable:** `--font-rubik` in CSS
- **Display:** Swap (for performance)
- **Usage:** Applied via Tailwind's font-sans utility

#### Card Deck Terminology

**Primary UI Language: Hebrew with RTL support**

| Concept | English | Hebrew |
|---------|---------|--------|
| Poll | Deck | חפיסה |
| Statement | Card | קלף |
| Choose | Choose | בחר |
| Player | Player | שחקן |
| Keep (agree) | Keep | לשמור |
| Throw (disagree) | Throw | לזרוק |
| Pass (unsure) | Pass | לדלג |
| Card Choosing Interface | Card Choosing Interface | ממשק בחירת קלפים |
| Choice Results | Choice Results | תוצאות בחירה |

#### Translation Coverage
All user-facing text translated, including:
- Navigation labels and menu items
- Button labels (choosing cards, submission, navigation)
- Form fields and placeholders
- Validation and error messages
- Modal titles and descriptions
- Toast notification messages
- Empty states and help text
- Poll creation wizard steps
- Analytics labels and descriptions
- Admin interface labels

#### Accessibility Considerations
- Hebrew text rendering: proper diacritics support
- Screen readers: Hebrew language attribute for proper pronunciation
- Keyboard navigation: RTL-aware focus order
- Form validation: Hebrew error messages announced correctly

---

## User Personas & Roles

### 1. Anonymous Visitor
- **Identity:** No account, no session tracking
- **Access:** Can browse published polls (read-only)
- **Limitations:** Cannot choose cards or submit statements

### 2. Anonymous Player
- **Identity:** Tracked via browser session (session_id)
- **Lifecycle:** Created in database only when they take their first action (choose a card or submit statement)
- **Access:** Can choose cards and submit statements on published polls
- **Data:** Card choosing history and submitted statements tied to session
- **Demographics:** Mandatory - must provide age group, gender, ethnicity, political party before choosing cards (all 4 fields required). Only shown if user doesn't already have demographics.
- **Upgrade Path:** Can authenticate later to preserve their participation data

### 3. Authenticated Player
- **Identity:** Signed in via Clerk (clerk_user_id)
- **Profile:** Name, picture, social links (cached from Clerk)
- **Demographics:** Mandatory age group, gender, ethnicity, political party before choosing cards (all 4 fields required). Only shown if user doesn't already have demographics.
- **Access:** Full participation rights, persistent identity
- **Benefits:** Access to personal insights, demographics tracking, profile management
- **Poll Creation:** Cannot create polls unless assigned Poll Creator role

### 4. Poll Creator (Role-Based)
- **Role:** Database-assigned by System Admin
- **Creation Rights:** Can create new polls
- **Becomes Owner:** Automatically becomes owner of polls they create
- **Scope:** Can create multiple polls, owns each one created
- **Permissions:** When creating a poll, gains all Owner permissions for that specific poll
- **Choosing Cards:** Can choose cards on any poll (including their own) using standard card-based interface

### 5. Poll Owner (Per-Poll Role)
- **Role:** Automatically assigned when user creates a poll, or transferred from previous owner
- **Permissions for owned poll(s):**
  - Full control over poll settings
  - Approve/reject statements
  - Publish/unpublish/close poll
  - View analytics and statistics
  - Manage poll-specific user roles (assign managers)
  - Transfer ownership
  - Delete poll
- **Scope:** Per-poll (can own multiple polls)
- **Choosing Cards:** Chooses cards using standard card-based interface (separate from management)
- **Management Interface:** Accesses poll-specific admin panel at `/polls/[slug]/manage`

### 6. Poll Manager (Per-Poll Role)
- **Role:** Assigned by Poll Owner or System Admin to specific poll(s)
- **Creation Rights:** Can create new polls (becomes owner of created polls)
- **Permissions for managed poll(s):**
  - Approve/reject statements
  - Edit poll settings (except deletion and ownership transfer)
  - View analytics and statistics
  - Manage poll-specific user roles (assign other managers)
- **Scope:** Per-poll (can manage multiple polls)
- **Choosing Cards:** Chooses cards using standard card-based interface (separate from management)
- **Management Interface:** Accesses poll-specific admin panel at `/polls/[slug]/manage`

### 7. System Administrator
- **Role:** Database-assigned global role (assigned by other admins or directly in database)
- **Creation Rights:** Can create new polls (becomes owner of created polls)
- **Permissions:**
  - All Poll Owner permissions for ALL polls
  - Assign Poll Creator role to users
  - Assign Poll Manager role to any poll
  - Transfer ownership of any poll
  - Delete any poll
  - Access system-wide admin features (minimal cross-poll tools)
- **Scope:** System-wide
- **Choosing Cards:** Chooses cards using standard card-based interface (separate from management)
- **Management Interface:** Can access poll-specific admin panel for any poll at `/polls/[slug]/manage`, plus system admin dashboard at `/admin/dashboard`

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

2. **Demographics Collection (Mandatory)**
   - **Shown BEFORE the first statement card appears**
   - **Required - blocks voting until completed**
   - **All fields mandatory:** age group, gender, ethnicity, political party (all 4 required)
   - **Messaging:** "We want to get to know a bit about you before you start playing, so that we can come up with better insights"
   - Available to both anonymous and authenticated users
   - **One-time only:** Cannot be changed after initial submission
   - **Not requested again if user upgrades** from anonymous to authenticated
   - **Not shown if user already has demographics** (from previous poll or this poll)
   - **Non-dismissible modal:** No skip button, no X button to close
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
     - **Poll question** (small, center-aligned in header)
     - **Statement card** (centered, prominent)
       - **Fixed 2:3 aspect ratio** (all cards same size)
       - **Amber gradient background** with decorative ✦ symbols
       - **Stacked card depth effect** (shadow layers behind)
       - **Statement text (max 140 characters)** prominently displayed
         - Center-aligned, medium font weight
         - All cards same size regardless of text length
       - **Two primary buttons ON the card:** Agree and Disagree (with custom labels if set)
     - **Pass/Unsure button BELOW the card** (secondary, less prominent)
       - Default label: "Pass" or "Unsure"
       - Can be customized per poll
       - Positioned under the card, not on it
     - **Add Card button** in header (+ icon)
       - Tooltip: "Add a new card to share a missing perspective"
       - Opens modal for submitting new statements
   - **No vote distribution shown yet**
   - **No statement counter** - progress bar is sufficient
   - No back/review options visible

4. **First Vote Action**
   - User clicks one of three buttons:
     - **Keep/לשמור** (on card, primary action)
     - **Throw/לזרוק** (on card, primary action)
     - **Pass/לדלג** (below card, secondary action)
   - **System creates user record in database** (with session_id)
   - Vote is recorded
   - **Vote is final and irreversible** - no changing votes later
   - **Inline results display (3 seconds):**
     - Statement card remains in place (no flip)
     - Vote buttons disappear (200ms fade out)
     - **Tri-colored results bar appears** at bottom of card (animated)
     - Bar shows three colored segments in one unified component:
       - **Green segment** (Keep): Shows percentage of Keep votes
       - **Red segment** (Throw): Shows percentage of Throw votes
       - **Gray segment** (Pass): Shows percentage of Pass votes
     - Each segment animates width from 0% with staggered delays (100ms, 200ms, 300ms)
     - Percentages ≥15% shown inside segments with white text
     - Percentages <15% shown in small labels below bar
     - User's vote segment shows icon (✓ for Keep, ✗ for Throw, − for Pass)
     - Results display for 3 seconds

5. **Exit Animation and Auto-Advance**
   - After 2.5 seconds of results display, **exit animation triggers** (500ms):
     - **Keep vote:** Card slides RIGHT and up with slight rotation (positive direction in RTL)
     - **Throw vote:** Card slides LEFT and down with rotation (thrown away)
     - **Pass vote:** Card slides straight DOWN (set aside, neutral)
   - **Automatic advance** - No manual "Next" button required
   - At 3 seconds total, next statement loads
   - **No "back" button** - forward-only progression
   - New statement card slides in from deck position (behind and rotated)
   - Progress bar updates (next segment fills)

6. **Continued Voting**
   - Process repeats for each statement in sequence
   - Vote → Inline results (3s) → Exit animation (0.5s) → Next statement
   - Stories-style progress bar shows overall completion
   - **No ability to review or change previous votes**
   - One-way journey through all statements

6a. **Statement Batching (10 at a time)**
   - When poll has more than 10 approved statements:
     - User sees first batch of 10 statements
     - After voting on 10th statement, **continuation page appears**

   - **Continuation Page (Achievement/Milestone Metaphor):**
     - **NOT a card collection** - uses achievement metaphor instead
     - This is a progress checkpoint where user decides next action

     - **Scenario 1: Progress Milestone (More Statements Available)**
       - Amber gradient card (matches voting flow)
       - 🏆 Trophy icon with spinning animation
       - Title: "Progress Milestone!"
       - Shows cards sorted count (X cards sorted)
       - **Tally section** (white inset card):
         - Keep: X (with TrendingUp icon, green)
         - Throw: X (with TrendingDown icon, red)
         - Unsure: X (with Minus icon, gray)
       - Status: "More cards to explore"
       - Two buttons:
         - **Continue Sorting** (primary) → Load next batch
         - **Finish & See Insights** (secondary, if threshold met) OR
         - **Sort X more to finish** (secondary, disabled if below threshold)

     - **Scenario 2: Deck Complete (No More Statements)**
       - Same amber gradient card
       - 🏆 Trophy icon with spinning animation
       - Title: "Deck Complete! 🎉"
       - Shows total cards sorted
       - **Final Tally** (same structure as above)
       - Single button: **See Your Insights** (primary)

     - **Visual Details:**
       - Compact sizing to fit on screen without scrolling
       - Card padding: p-6 (not p-8)
       - Trophy: h-10 w-10, spins in from scale(0) rotate(-180°)
       - All text sizes reduced for screen fit
       - User must choose an option (no skip/dismiss)

   - **Progress bar only** (no statement counter):
     - Shows 10 segments per batch
     - Resets visually after each batch
     - Clear visual indicator of position in current batch

   - **Finish button** - Disabled until threshold reached, then enabled throughout voting
   - Process repeats every 10 statements until poll exhausted or user finishes

7. **Completion Options**
   - User can vote through **all statements** in the poll, OR
   - User can press **"Finish" button** after reaching threshold
   - **Finish button disabled until threshold met:**
     - Polls with 10+ statements: Disabled until first 10 statements voted
     - Polls with <10 statements: Disabled until all statements voted
   - Tooltip on disabled button: "Complete the first 10 statements to finish" or "Vote on all X statements to finish"

8. **Insight Generation After Completion**
   - **When user finishes** (threshold reached and Finish button pressed):
     - System generates AI-powered personal insights
     - Loading state: "Analyzing your responses..."
     - **Personal Insight Card** appears (collectible card design):
       - **2:3 aspect ratio card** (max-w-xs, same as voting cards)
       - **Indigo/violet animated gradient background** (8s shimmer cycle)
       - **Large emoji hero** at top (extracted from AI-generated title)
         - Examples: 🌟 (strong alignment), 🎯 (critical perspective), 🤔 (thoughtful), ⚖️ (balanced), 👍 (supportive), 🔍 (skeptical)
         - Spins in with animation (scale 0 → 1, rotate -180° → 0°)
       - **"Personal Insight" badge** (indigo color scheme)
       - **Title** (emoji removed, text-base md:text-lg, bold)
       - **Body text** (scrollable, max-h-[180px], text-xs md:text-sm)
       - **Metadata section at bottom**:
         - Poll question (line-clamp-2)
         - Generated date (hydration-safe en-US format)
     - **Action buttons** below card:
       - Share button (native share API or clipboard)
       - Save button (downloads .txt file, authenticated users only)
     - **Navigation buttons**:
       - "View All Results" → Navigate to results card
       - "Back to All Decks" → Navigate to poll listing
     - **Anonymous user banner** (if applicable):
       - Compact yellow banner at top
       - "Anonymous session • Sign up to save your insights"

9. **Optional: Add Card** (if poll allows)
   - **Available during voting via "Add Card" button in header**
   - Button shows Plus icon with "Add Card" text (icon-only on mobile)
   - Tooltip: "Add a new card to share a missing perspective"
   - Opens modal overlay without leaving voting flow
   - Modal displays:
     - Title: "Add a New Card"
     - Description: "Create a new card to add a missing perspective to this poll's deck"
     - Text input with 140 character limit and counter
     - Compact horizontal preview showing card with amber gradient and decorative symbols
   - Submits card:
     - If auto-approval enabled: card added to voting queue for other users
     - If moderation required: card enters approval queue
     - User receives feedback about submission status
   - **Returns to voting flow** at the same statement they were on
   - Can submit multiple cards during voting session

10. **Session Persistence**
    - Votes persist across browser sessions via session ID
    - If user closes browser mid-voting and returns, their progress is restored
    - Resumes from **next unvoted statement** (cannot review past votes)
    - Progress bar reflects completed statements

#### Flow: Returning Anonymous User (Incomplete Session)

**Note:** Poll entry page now adapts to user state. See `POLL_PAGE_STATES_GUIDE.md` for visual reference.

1. **Session Recognition:**
   - Browser session recognized (via session_id cookie)
   - Previous votes and progress restored from database
   - System fetches voting progress from server

2. **Adaptive Poll Entry Page:**
   - **If below threshold (State B - In Progress):**
     - Shows welcome back banner: "Welcome back! You've voted on X of Y statements"
     - Displays progress badge: "X/Y Statements"
     - CTA button changes to "Continue Voting" (instead of "Start Voting")
     - Helper text: "Vote on N more statements to see your insights"

   - **If threshold reached but not all voted (State C):**
     - Shows insights-ready banner: "Your insights are ready!"
     - Displays "✨ Insights Ready" badge
     - Primary CTA: "View Your Insights"
     - Secondary CTA: "Continue Voting"
     - Helper text: "You've unlocked your insights! Continue voting or view your results"

   - **If all statements voted (State D - Completed):**
     - Shows completion banner: "Poll completed! You've voted on all X statements"
     - Displays "✨ Insights Ready" badge
     - Primary CTA: "View Your Insights"
     - Secondary CTA: "View Poll Results"
     - No "Continue Voting" option (all done)
     - Helper text: "You've completed this poll! View your insights and see how others voted"

3. **Resume Voting (from States B or C):**
   - Click "Continue Voting" → Navigate to `/polls/[slug]/vote`
   - Vote page automatically shows **next unvoted statement** (statement #4 in example)
   - Progress bar immediately shows completed segments (e.g., 3 of 10 filled)
   - Continues exactly as if they never left
   - Same forward-only flow
   - **Cannot review or change previous votes**

4. **Access Insights (from States C or D):**
   - Click "View Your Insights" → Navigate to `/polls/[slug]/insights`
   - Shows previously generated insights
   - Can return to poll page and continue voting (if State C)

5. **Completion Options:**
   - Can continue voting through remaining statements (States B and C)
   - Can press Finish button during voting to see insights (once threshold reached)
   - Can access insights directly from poll page (States C and D)
   - Finish button disabled until threshold met (first 10 or all statements)

6. **No Restart Option:**
   - Cannot reset or start poll over
   - Previous votes are locked in
   - Poll entry page always shows current progress state

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

#### Scenario D: Already Authenticated User Behavior
**Edge Case: User already signed in attempts to access auth pages**

1. **Sign In/Sign Up Buttons Hidden**
   - When user is authenticated, Sign In/Sign Up buttons are hidden from UI
   - Only UserButton (with sign out) is visible
   - Prevents confusion and accidental auth page visits

2. **Direct Auth Page Access** (if user manually navigates to `/login` or `/signup`)
   - Clerk's SignIn/SignUp components detect existing authentication
   - User is automatically redirected to `fallbackRedirectUrl` (home page `/`)
   - No error message shown - seamless redirect
   - Expected behavior: authenticated users shouldn't reach auth pages

3. **Sign Out Flow**
   - User clicks UserButton (avatar) in header
   - Clerk menu opens with user info and "Sign out" option
   - Clicks "Sign out"
   - Redirected to home page (`afterSignOutUrl="/"`)
   - Can now access Sign In/Sign Up buttons again

---

### Journey 3: Poll Discovery & Browsing

#### Public Poll Listing (Deck Browsing)
1. **Poll Deck Listing Page** (`/polls`)
   - **Design Metaphor:** Browse card decks like choosing a game to play
   - **Heading:** "Pick a Deck to Explore"
   - **Subheading:** "Choose a deck, sort the cards, and discover your unique perspective"
   - User sees grid of poll deck cards:
     - Desktop: 4 columns (lg:grid-cols-4)
     - Tablet: 3 columns (md:grid-cols-3)
     - Mobile: 2 columns (grid-cols-2)
     - Gap: 8 (2rem between cards)

   - **Each Poll Deck Card shows:**
     - **2:3 aspect ratio** (vertical orientation like deck box)
     - **Large emoji at top** (text-6xl) - unique to each poll
     - **3-layer stacked depth effect** (2 shadow layers behind for depth)
     - **Status badge** top-right (Active in green, Closed in gray)
     - **Poll question** centered, bold, line-clamp-5
     - **Decorative element** at bottom (✦ for active, ◆ for closed)
     - **CLOSED ribbon** for closed decks (diagonal semi-transparent overlay)
     - **Amber gradient** for active decks
     - **Gray gradient** for closed decks
     - **Hover animation:**
       - Scale to 1.05
       - Lift up 5px
       - Enhanced shadow
       - Duration: 200ms

   - **Click deck card** → Navigate to `/polls/[slug]` entry page

2. **Filtering & Search**
   - Filter by status (Active/Closed)
   - Search by keywords in question/description
   - Sort by recent, popular, ending soon

3. **Poll Entry**
   - Click poll to view poll entry page (`/polls/[slug]`)
   - **Poll entry page adapts to user's voting state:**
     - **New users:** Shows "Start Voting" button with poll description
     - **Returning users (in progress):** Shows "Welcome back!" banner + "Continue Voting" button
     - **Users who reached threshold:** Shows "View Your Insights" button (primary) + "Continue Voting" (secondary)
     - **Users who completed poll:** Shows "View Your Insights" + "View Poll Results" buttons
   - **No preview of statements or vote distributions** on entry page
   - Click appropriate CTA to proceed to voting interface, insights, or results
   - Entry page provides clear orientation for user's current status

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
   - Clear visual of how far through poll

6. **Completion Trigger**
   - User can **vote through all statements** to auto-complete, OR
   - **Press "Finish" button** after reaching threshold
   - **Finish button behavior:**
     - **Disabled until threshold reached** (grayed out)
     - Threshold: First 10 statements OR all statements if poll has fewer than 10
     - **Enabled once threshold met** (becomes clickable)
     - Always visible in header/menu with state indicator
     - Shows tooltip when disabled:
       - "Complete the first 10 statements to finish" (for polls with 10+ statements)
       - "Vote on all X statements to finish" (for polls with <10 statements)

7. **Post-Completion: Insight Generation & Results Summary**
   - User pressed Finish button (threshold already met by design)
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

8. **Voting Rules**
   - One vote per statement per user
   - **No vote changes** - all votes final
   - Votes on approved statements only
   - Cannot vote on own submitted statements (optional business rule)
   - **No backward navigation** once vote cast

#### Vote Distribution Display Rules
- **Before voting:** No distribution shown (clean card with vote buttons)
- **After voting:** Inline tri-colored results bar appears on card (no flip)
- **Animation:** Results bar segments grow from 0% width with staggered delays (100ms, 200ms, 300ms)
- **Timing:** Results display for 3 seconds, then card auto-advances with exit animation
- **Components:**
  - Statement text remains visible at center of card
  - Tri-colored results bar at bottom of card (replaces vote buttons):
    - Green segment (Keep/לשמור votes)
    - Red segment (Throw/לזרוק votes)
    - Gray segment (Pass/לדלג votes)
  - Percentages shown inside segments (if ≥15%) or in labels below bar (if <15%)
  - User's vote segment shows icon (✓ for Keep, ✗ for Throw, − for Pass)
- **Exit animation:** After 2.5 seconds, card exits based on user's vote:
  - Keep: Slides RIGHT and up (positive direction in RTL)
  - Throw: Slides LEFT and down (thrown away)
  - Pass: Slides straight DOWN (set aside)
- **Visibility:** Only after user commits their vote (no peeking)

---

### Journey 5: Add Card (Statement Submission)

#### Prerequisites
- Poll must allow user statements (`allowUserStatements = true`)
- Poll must be in published/active state
- User can be anonymous or authenticated

#### Flow
1. **Access Add Card Interface**
   - User sees "Add Card" button in voting header (Plus icon)
   - Tooltip: "Add a new card to share a missing perspective"
   - Button is responsive: shows icon + text on desktop, icon-only on mobile
   - Clicks to open modal

2. **Writing Card**
   - Modal title: "Add a New Card"
   - Modal description: "Create a new card to add a missing perspective to this poll's deck"
   - Text input field with 140 character limit
   - Character counter showing remaining characters
   - Compact horizontal preview showing card with:
     - Amber gradient background (matching voting cards)
     - Decorative symbols (✦) on both sides
     - Text preview centered between symbols

3. **Submission**
   - User submits card
   - **If auto-approval enabled:**
     - Card appears immediately in voting list for other users
     - User receives: "Your card is now live!"
   - **If moderation required:**
     - Card enters approval queue
     - User receives: "Your card is pending approval"
     - Card not visible to others yet

4. **Post-Submission**
   - Modal closes, user returns to voting flow at same position
   - Can continue voting on other statements
   - Can submit multiple cards during session
   - If authenticated: can track submission status
   - Submitted cards tied to user ID

5. **Approval Notification** (if moderation enabled)
   - When approved: card appears in poll
   - When rejected: card deleted (not shown to user)
   - No notification currently implemented (potential feature)

---

### Journey 6: Personal Insights

#### Trigger Conditions
- **User completes voting session** (presses "Finish" button after threshold met)
- Threshold: First 10 statements OR all statements if poll has fewer than 10

#### Generation Process
1. **Triggered After Completion**
   - User finishes voting by pressing "Finish" button
   - Threshold already met (button only enabled after threshold)
   - Insight generation begins immediately

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

1. **Poll Results Page with Demographic Heatmap:**
   - **Route:** `/polls/[slug]/results`
   - **Accessible to:** All users (voters and non-voters)
   - **Page Layout:**
     - **Poll Stats Card** at top:
       - Poll question (large, centered)
       - Participant count with Users icon
       - Vote count with Vote icon
       - Clean gradient background (emerald to teal)
     - **Demographic Heatmap Dashboard** below:
       - Interactive visualization of vote patterns by demographics
       - See "Demographic Heatmap" section below for details
     - Container: max-w-6xl, space-y-6
     - Clean, focused layout with just stats + heatmap

2. **From Personal Insight Screen:**
   - User clicks "View All Results" button
   - Navigates to `/polls/[slug]/results`
   - Shows poll stats card + demographic heatmap

3. **Accessing Later:**
   - **Authenticated users:** Can access from user dashboard for completed polls
   - **Anonymous users:** Can access results page for any poll
   - Available for both active and closed polls

4. **Closed Poll Access (`/polls/[slug]/closed`):**
   - **For voters who reached threshold:**
     - See **both InsightCard and ResultsCard** simultaneously
     - Desktop: Side-by-side layout (lg:flex-row)
     - Mobile: Stacked layout (flex-col)
     - Reduces clicks - all info visible at once
     - Single "Back to All Decks" button below

   - **For voters who didn't reach threshold:**
     - See only ResultsCard (centered)
     - No personal insights (didn't vote enough)

   - **For non-voters (never participated):**
     - See only ResultsCard (centered)
     - NO personal insights (didn't participate)
     - CAN view poll results (public data)
     - Same clean, minimal layout

#### Demographic Heatmap
**Purpose:** Visualize how different demographic groups voted on each statement, inspired by Pol.is.

**Key Features:**
- **Statement-by-demographic grid** showing agreement percentages
- **5-color scale:** Dark green (+80% to +100%) → Light green (+60% to +79%) → Yellow (-59% to +59%) → Light red (-79% to -60%) → Dark red (-100% to -80%)
- **Agreement calculation:** (agrees - disagrees) / (agrees + disagrees) × 100 (pass votes excluded from calculation but tracked)
- **Statement classification:**
  - **Consensus** - Most groups agree (>80% agreement)
  - **Partial Consensus** - Many groups agree (60-79% agreement)
  - **Split** - Mixed opinions (around 50/50)
  - **Divisive** - Strong disagreement patterns
- **Privacy threshold:** Minimum 3 votes per cell to prevent re-identification (cells below threshold show "—")
- **Pass vote indicator:** Dots (•) shown when >30% of responses are "pass"
- **Single attribute view:** View one demographic at a time (gender, age group, ethnicity, political party)
- **Responsive design:**
  - **Desktop/tablet:** Table view with sticky headers
  - **Mobile:** Card-based layout
- **Filtering & sorting:**
  - Sort by classification type or alphabetically
  - Filter by statement type (consensus/partial/split/divisive)
- **Auto-refresh:** 30-second polling for new data
- **5-minute caching:** In-memory cache with TTL for performance

**Data Display:**
- Each cell shows:
  - Agreement percentage (colored background)
  - Total response count in parentheses
  - Pass indicator (•) if applicable
- Hover tooltip shows detailed breakdown (agrees/disagrees/passes)

**Performance:**
- Single optimized query using PostgreSQL GROUP BY
- Database-level aggregation for efficiency
- Scales to large polls (tested with 110+ voters, 12 statements)

---

## Poll Creator Workflows

### Prerequisites: Who Can Create Polls

#### Required Role
To access "Create Poll" interface, user must have ONE of:
- **Poll Creator** role (assigned by System Admin)
- **Poll Manager** role (assigned to at least one existing poll)
- **System Administrator** role

#### Entry Points
1. **Main Navigation:**
   - "Create Poll" button visible only to authorized users
   - Takes user to poll creation form

2. **User Dashboard:**
   - "My Polls" section shows owned/managed polls
   - "Create New Poll" button prominent

3. **Unauthorized Users:**
   - "Create Poll" option not visible
   - Direct URL access shows: "You need Poll Creator permissions. Contact system administrator."

---

### Workflow 1: Poll Creation

#### Entry Point
- User with Poll Creator, Poll Manager, or System Admin role accesses "Create Poll" interface
- Must be signed in (anonymous users cannot create polls)

#### Step 1: Basic Information
1. **Poll Question** (required)
   - Main question/topic
   - Used to generate URL slug
2. **Description** (optional)
   - Additional context
   - Instructions for participants

#### Step 2: Control Settings
1. **User Card Submission**
   - Toggle: Allow users to add cards (submit statements)
   - Default: disabled

2. **Auto-Approval**
   - Toggle: Auto-approve user-submitted cards
   - Only relevant if card submission enabled
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
- Creator becomes **Poll Owner** for this poll
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

- **Completion Metrics:**
  - Number of users who completed voting (reached threshold)
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

## Poll Management Workflows

### Key Principle: Two Distinct Interfaces

**Everyone votes the same way** - whether anonymous, authenticated, manager, owner, or system admin.

1. **Public Voting Interface** (`/polls/[slug]/vote`)
   - Same card-based experience for all users
   - No special privileges during voting
   - Cannot see distributions before voting
   - Must follow same threshold rules

2. **Poll Management Interface** (`/polls/[slug]/manage`)
   - Only accessible to Poll Owners, Poll Managers (for their polls), and System Admins
   - Poll-specific admin work (statements, settings, analytics, roles)
   - Separate from voting experience

---

### Workflow 1: Accessing Poll Management Interface

#### Who Can Access
- **Poll Owners** - For polls they own
- **Poll Managers** - For polls they manage
- **System Administrators** - For any poll

#### Entry Points

1. **From User Dashboard:**
   - "My Polls" section lists owned/managed polls
   - Each poll shows status, pending items, quick stats
   - Click "Manage Poll" → Navigate to `/polls/[slug]/manage`

2. **From Poll Public Page:**
   - Authorized users see "Manage Poll" button
   - Others don't see this option
   - Click → Navigate to management interface

3. **Direct URL Access:**
   - `/polls/[slug]/manage` accessible only to authorized users
   - Unauthorized access shows: "You don't have permission to manage this poll"

#### Management Interface Layout

**Navigation Tabs:**
1. **Overview** - Poll summary, quick stats, pending items
2. **Statements** - Moderation queue, approved statements, add new
3. **Settings** - Poll configuration, button labels, scheduling
4. **Analytics** - Participation metrics, vote distributions, statement performance
5. **Roles** - User role management for this specific poll
6. **Preview** - View poll as participant would see it

**Top Bar:**
- Poll title with status badge (Draft/Published/Closed)
- Quick actions: Publish/Unpublish, View as Voter, Share Poll
- Back to dashboard

---

### Workflow 2: Poll-Specific Statement Management

#### Accessing Statement Management
- Navigate to **Statements tab** in poll management interface
- Shows ONLY statements for this specific poll

#### Interface Sections

1. **Pending Statements** (default view)
   - User-submitted statements awaiting moderation
   - Each entry shows:
     - Statement text (full or truncated with expand)
     - Submitter info (anonymous/authenticated, name if available)
     - Submission timestamp
     - Quick actions: Approve | Reject | Edit

2. **Approved Statements**
   - All currently active/votable statements
   - Shows vote counts and distribution per statement
   - Can edit or delete (with cascade warning)
   - Can add new statements directly

3. **All Statements**
   - Combined view with status filters
   - Search functionality
   - Sort options

#### Moderation Actions

1. **Individual Actions:**
   - **Approve** - Statement becomes visible to voters immediately
   - **Reject** - Statement permanently deleted from database
   - **Edit then Approve** - Modify text for clarity/grammar, then approve

2. **Bulk Actions:**
   - Select multiple pending statements
   - **Approve All Selected** - Batch approval
   - **Reject All Selected** - Batch deletion
   - Useful for high-volume moderation

3. **Statement Editing:**
   - Click edit icon on any statement
   - Modify statement text
   - Changes reflected immediately
   - Existing votes preserved

4. **Statement Deletion:**
   - Delete button with confirmation
   - Warning: "Deleting this statement will also delete X votes"
   - Cascades to all votes on statement
   - Use with extreme caution

#### Filtering & Search
- Filter by status: All / Pending / Approved
- Filter by submitter: User-submitted / Owner-created
- Search statement text
- Sort by: Newest / Oldest / Most voted

---

### Workflow 3: Poll-Specific Settings Management

#### Accessing Settings
- Navigate to **Settings tab** in poll management interface

#### Editable Settings

**Available to Both Owners and Managers:**

1. **Basic Information**
   - Poll question
   - Description
   - Button labels (Agree/Disagree/Pass)

2. **Control Settings**
   - Toggle: Allow user statement submissions
   - Toggle: Auto-approve user statements
   - Voting goal (target number of votes)

3. **Scheduling**
   - Start time (if poll not yet published)
   - End time (extend closing date)

**Owner-Only Actions** (Managers see these grayed out with lock icon):
- Delete poll
- Transfer ownership
- Unpublish poll (return to draft)

#### Settings Interface
- Form with auto-save functionality
- Owner-only items show lock icon for Managers
- Tooltip on locked items: "Only poll owner can perform this action"
- Changes show confirmation toast
- "Preview Poll" button to see changes as voter would

---

### Workflow 4: Poll-Specific Analytics & Statistics

#### Accessing Analytics
- Navigate to **Analytics tab** in poll management interface
- All metrics are specific to this poll only

#### Available Metrics

1. **Participation Overview**
   - Total unique voters (for THIS poll)
   - Total votes cast (on THIS poll's statements)
   - Average votes per user
   - Completion rate (% who reached threshold)
   - Participation over time chart

2. **Statement Performance**
   - Vote distribution for each statement
     - Agree/Disagree/Neutral percentages
     - Total votes per statement
   - Most agreed statements (top 5)
   - Most disagreed statements (top 5)
   - Most divisive statements (closest to 50/50 split)
   - Low-engagement statements (fewest votes)

3. **Engagement Metrics**
   - User-submitted vs. creator-generated statements
   - Statement approval/rejection rates
   - Average time to complete poll
   - Drop-off points (where users stop voting)

4. **Demographic Heatmap Dashboard**
   - **Same heatmap as public results page** but accessible from management interface
   - Navigate to Analytics tab to view demographic analysis
   - All features available:
     - Statement-by-demographic grid visualization
     - 5-color agreement scale
     - Statement classification (consensus/partial/split/divisive)
     - Attribute selection (gender, age group, ethnicity, political party)
     - Filtering and sorting options
     - Privacy threshold protection
     - Responsive table/card layouts
   - **Poll selector** at top (for admins viewing multiple polls)
   - **Auto-refresh** every 30 seconds
   - See "Demographic Heatmap" section in Journey 7 for full feature details

#### Admin View Feature

**Special Privilege for Owners/Managers:**
- Access demographic heatmap dashboard from management interface
- View patterns across demographic groups
- Identify consensus and divisive statements
- Useful for understanding poll dynamics and audience composition
- All data aggregated and anonymized (privacy threshold enforced)
- Read-only analytical view

#### Export Options
- Export THIS poll's data (CSV format)
- Export statement-level results
- Export participant demographics (anonymized)
- Generate poll report (PDF summary)

---

### Workflow 5: Poll-Specific User Role Management

#### Purpose
Manage who can access and manage THIS specific poll.

#### Accessing Role Management
- Navigate to **Roles tab** in poll management interface

#### Interface Shows

1. **Current Roles for This Poll:**
   - **Poll Owner** (highlighted, cannot be removed)
   - **Poll Managers** (list with remove option)
   - **Info box:** "System Admins automatically have access to all polls"

2. **Add Manager Section:**
   - Search bar: "Search for user by email or name"
   - Dropdown showing authenticated users
   - "Assign as Manager" button
   - Manager gains management access to THIS poll only

3. **Manager List:**
   - Each manager entry shows:
     - User name and email
     - Date assigned
     - Assigned by (owner or admin name)
     - Actions: Remove

#### Manager Management Actions

**Adding Manager:**
1. Owner/Admin clicks "Add Manager"
2. Search for user by email or name
3. Select from dropdown of authenticated users
4. Confirm assignment
5. User receives notification (if implemented)
6. Manager gains access to THIS poll's management interface

**Removing Manager:**
1. Click "Remove" next to manager name
2. Confirmation modal: "Remove [user] as manager of [poll name]?"
3. Confirm → Manager loses access to this poll only
4. Other polls unaffected

**Ownership Transfer** (Owner-only action):
1. Owner clicks "Transfer Ownership" button
2. Search for new owner (must be authenticated user)
3. Confirmation modal with warning:
   - "You will lose owner privileges"
   - "New owner will have full control"
   - Checkbox: "Make me a manager instead"
4. Confirm transfer
5. New owner assigned, previous owner's role changes
6. Cannot be undone (new owner must transfer back)

#### Constraints
- Cannot remove Poll Owner (only transfer ownership)
- Owner cannot remove themselves (must transfer first)
- System Admins have implicit access (not shown in manager list)
- At least one person must have owner or manager role

---

### Workflow 6: Poll Publishing & Lifecycle Management

#### Accessing Lifecycle Controls
- "Publish" / "Unpublish" / "Close" buttons in management interface top bar
- Status badge shows current state

#### Draft State Management
- Poll created in Draft by default
- Not visible to public
- Full editing capability
- Can add/edit/delete statements freely
- "Publish Poll" button prominent in top bar

#### Publishing Process

1. **Pre-Publish Validation:**
   - System checks minimum 6 statements requirement
   - System checks poll question set
   - Warning if no scheduling configured

2. **Publish Action:**
   - Owner clicks "Publish Poll"
   - Pre-publish checklist modal appears:
     - ✓ Minimum 6 statements
     - ✓ Poll question set
     - ⚠ Schedule configured (optional warning)
     - Warning: "Poll will become public and visible in listings"
   - Confirm → Poll status changes to Published

3. **After Publishing:**
   - Poll appears in public listings
   - Voting enabled at start_time (or immediately if not set)
   - URL shareable
   - Management interface remains accessible
   - Can still moderate statements and add new ones

#### Unpublishing (Owner-Only)

1. **Unpublish Action:**
   - Owner clicks "Unpublish Poll" button
   - Only visible to owners (managers don't see this)

2. **Warning Modal:**
   - "Are you sure you want to unpublish this poll?"
   - Shows impact:
     - "Poll will be hidden from public listings"
     - "No new votes will be accepted"
     - "Current stats: X voters, Y votes recorded"
     - "Existing votes and data will be preserved"
     - "You can edit and republish later"

3. **After Unpublishing:**
   - Poll status changes to DRAFT
   - Removed from public listings
   - Voting interface inaccessible
   - All existing votes and analytics preserved
   - Owner can edit settings and statements
   - Can republish at any time

#### Closing Process

1. **Automatic Closing:**
   - Poll reaches end_time (if configured)
   - Voting automatically disabled
   - Poll marked as Closed
   - No user action required

2. **Manual Closing** (Owner-only):
   - Owner clicks "Close Poll" before end_time
   - Confirmation modal: "Close poll early?"
   - Confirm → Poll immediately closes

3. **Closed State:**
   - No new votes accepted
   - No new statements accepted
   - Results remain visible to all
   - Voters can still see their insights
   - Poll remains in public listings (read-only)
   - Management interface accessible for analytics review

---

### Workflow 7: Voting as Owner/Manager (Dual-Mode Access)

#### Key Principle
Owners and Managers can vote on their polls, but voting happens in a **completely separate interface** from management.

#### Accessing Voting Mode

1. **From Poll Management Interface:**
   - Click "View as Voter" button in top bar
   - Navigate to `/polls/[slug]/vote`

2. **From Poll Public Page:**
   - Navigate to poll like any user
   - Click "Start Voting" or "Continue Voting"

3. **From Public Poll Listing:**
   - Browse polls and click to vote
   - Same flow as regular users

#### Voting Experience

- **Identical to regular users:**
  - Same card-based voting interface
  - No special manager/owner privileges visible
  - Cannot see vote distributions before voting on each statement
  - Cannot skip ahead or preview future statements
  - Must follow same threshold rules
  - Forward-only progression (no back button)

- **Why Separate:**
  - Prevents bias - vote with genuine first reactions
  - Maintains integrity of personal insights
  - Clear separation between moderation and participation roles
  - Ensures all votes treated equally

#### Post-Voting

- Receive personal insights after reaching threshold (same as everyone)
- Can view poll results summary
- Voting history stored separately from management activities
- To manage poll again, navigate back to management interface

---

## System Administrator Workflows

### Overview
System Administrators have two unique capabilities beyond poll management:
1. **Assign Poll Creator role** to users (enable poll creation)
2. **Access cross-poll convenience features** (optional tools for efficiency)

**Most admin work is poll-specific** - same as owners/managers, just with access to all polls.

---

### Workflow 1: System Admin Dashboard

#### Purpose
High-level system monitoring and cross-poll navigation.

#### Accessing Dashboard
- URL: `/admin/dashboard`
- Link in main navigation (visible only to admins)

#### Dashboard Widgets

1. **System Overview:**
   - Total polls: Draft / Published / Closed counts
   - Total users: Anonymous / Authenticated counts
   - Total votes cast (system-wide)
   - Active polls (currently accepting votes)

2. **All Polls List:**
   - Shows every poll in system
   - Each entry displays:
     - Poll question
     - Status badge
     - Owner name
     - Participation stats
     - Pending statements count
     - Quick actions: Manage | View | Delete
   - Filter by: Status, Owner, Date created
   - Search by poll question

3. **Recent Activity Feed:**
   - Recently created polls
   - Recent user signups
   - Recent votes cast (counts only)
   - System events

4. **Pending Items:**
   - Total pending statements across all polls
   - Link to Global Moderation Queue
   - Polls needing attention (low engagement, errors)

5. **System Health:**
   - Database connection status
   - API service status (AI, Clerk)
   - Error logs (if any)
   - Performance metrics

#### Navigation from Dashboard

- **Click any poll** → Go to that poll's management interface (`/polls/[slug]/manage`)
- **Click pending statements count** → Go to Global Moderation Queue
- **Click user counts** → Go to User Role Management

---

### Workflow 2: Managing Any Poll

#### Admin Capability
System Admins can access the poll-specific management interface for ANY poll.

#### Access Methods

1. **From Admin Dashboard:**
   - "All Polls" list shows every poll
   - Click "Manage" on any poll
   - Navigate to `/polls/[slug]/manage`

2. **From Poll Public Page:**
   - "Manage Poll" button visible to admin
   - Enter management interface

3. **Direct URL:**
   - Navigate to `/polls/[slug]/manage` for any poll
   - Admin has automatic access

#### Management Interface
- **Identical to owner view:**
  - All tabs available (Overview, Statements, Settings, Analytics, Roles)
  - All actions available (including delete and transfer ownership)
  - No visual distinction from owner interface

- **Poll-specific work:**
  - Moderate THIS poll's statements
  - View THIS poll's analytics
  - Manage THIS poll's roles
  - Edit THIS poll's settings
  - All actions scoped to the current poll

**Key Point:** Admin work is still poll-specific, just with access to all polls.

---

### Workflow 3: Global Moderation Queue (Cross-Poll Feature)

#### Purpose
Convenience feature for admins to moderate statements across all polls in one view.

#### Accessing Global Queue
- From Admin Dashboard: Click "Global Moderation Queue"
- URL: `/admin/moderation`
- Shows total pending count across all polls

#### Queue Interface

1. **Statement List:**
   - All pending statements from ALL polls
   - Each entry shows:
     - Statement text
     - **Poll context** (poll question - clickable link)
     - Poll owner name
     - Submitter information
     - Submission timestamp
     - Quick actions: Approve | Reject | Edit

2. **Filtering Options:**
   - Filter by specific poll (dropdown)
   - Filter by submitter type (anonymous/authenticated)
   - Filter by date range
   - Search statement text across all polls

3. **Sorting Options:**
   - Oldest first (priority queue - default)
   - Newest first
   - By poll
   - By submitter

4. **Actions:**
   - **Approve** - Statement approved in its poll
   - **Reject** - Statement deleted from its poll
   - **Edit then Approve** - Modify text, then approve
   - **Bulk select** - Approve/reject multiple across different polls
   - **View in poll** - Link to that poll's management interface

#### Workflow

1. Admin opens global moderation queue
2. Reviews statements with full poll context
3. Approves quality contributions
4. Rejects spam, inappropriate, or off-topic submissions
5. For complex cases, clicks "View in poll" to see full context
6. Queue updates on refresh or manual reload

**Note:** This is a convenience feature. Admins can also moderate by visiting each poll's management interface individually (same as owners/managers).

---

### Workflow 4: User Role Management (System-Wide)

#### Purpose
Assign Poll Creator role to enable users to create new polls.

#### Accessing User Management
- From Admin Dashboard: "User Role Management" section
- URL: `/admin/users`

#### User List Interface

1. **User Directory:**
   - Searchable list of all authenticated users
   - Each entry shows:
     - User name
     - Email
     - Clerk ID
     - Registration date
     - Current roles: Poll Creator | System Admin
     - Polls owned (count)
     - Polls managed (count)

2. **Search & Filter:**
   - Search by name or email
   - Filter by role: All / Poll Creators / Managers / Admins / Regular Users
   - Sort by: Registration date, Activity, Name

#### User Detail View

Click any user to see detailed view:

1. **Profile Information:**
   - Full user details
   - Demographics (if provided)
   - Registration date
   - Last active timestamp

2. **Activity Summary:**
   - Polls created (count)
   - Polls managed (count)
   - Votes cast (count only, not details)
   - Statements submitted (count)

3. **Current Roles:**
   - **System Roles:**
     - System Administrator (yes/no)
     - Poll Creator (yes/no)
   - **Poll-Specific Roles:**
     - Poll Owner of: [list of polls with links]
     - Poll Manager for: [list of polls with links]

4. **Role Assignment Actions:**

   **Assign Poll Creator:**
   - Toggle "Poll Creator" role checkbox
   - Confirm: "[User] can now create polls"
   - User gains "Create Poll" access
   - Does not automatically make them owner of existing polls

   **Assign System Admin:**
   - Toggle "System Admin" role checkbox
   - Confirmation required: "Grant full system access to [user]?"
   - User gains all admin privileges
   - Use sparingly

   **Assign Poll Manager** (for specific poll):
   - Click "Add to Poll as Manager"
   - Search and select poll
   - Confirm assignment
   - User gains management access to that specific poll

   **Revoke Roles:**
   - Untoggle Poll Creator - user can no longer create new polls
   - Untoggle System Admin - user loses admin access
   - Remove from specific poll - managed via poll's Roles tab

#### Bulk Operations (Future)
- Select multiple users
- Bulk assign Poll Creator role
- Export user list

---

### Workflow 5: Managing Poll Ownership & Transfers

#### Admin Capability
System Admins can transfer ownership of any poll between users.

#### Access

1. **From Poll's Roles Tab:**
   - Navigate to any poll's management interface
   - Go to Roles tab
   - Click "Transfer Ownership" (admin always has access)

2. **From User Detail View:**
   - View user's owned polls
   - Click "Transfer to another user" next to any poll

#### Transfer Process

1. **Initiate Transfer:**
   - Select "Transfer Ownership"
   - Search for new owner (authenticated users only)
   - Select user from dropdown

2. **Confirmation Modal:**
   - "Transfer ownership of [poll name] to [new user]?"
   - Shows current owner and new owner
   - Option: "Make current owner a manager instead"
   - Warning: Cannot be undone without another transfer

3. **After Transfer:**
   - New user becomes Poll Owner
   - Previous owner loses ownership
   - Previous owner becomes manager (if checkbox selected)
   - New owner receives notification (if implemented)
   - Immediate effect

#### Use Cases
- Original owner leaves organization
- Reassign polls for better management
- Correct accidental assignments
- Consolidate polls under single owner

---

## Interface Boundaries Summary

### Public Voting Interface

- **Who:** Everyone (anonymous, authenticated, managers, owners, admins)
- **Purpose:** Vote on poll statements
- **Access:** `/polls/[slug]/vote`
- **Features:**
  - Card-based voting experience
  - Stories-style progress bar
  - Equal experience for all users
  - No special privileges during voting
  - Cannot see distributions before voting
  - Must complete threshold to finish

### Poll Management Interface

- **Who:**
  - Poll Owners (for their polls)
  - Poll Managers (for their assigned polls)
  - System Admins (for all polls)
- **Purpose:** Manage specific poll settings, statements, roles, analytics
- **Access:** `/polls/[slug]/manage`
- **Tabs:** Overview | Statements | Settings | Analytics | Roles | Preview
- **Scope:** Single poll at a time (poll-specific work)
- **Key Point:** All management work is poll-centric

### System Admin Dashboard

- **Who:** System Admins only
- **Purpose:**
  - Assign Poll Creator role to users
  - Monitor system health
  - Access Global Moderation Queue (convenience feature)
  - Navigate to any poll's management interface
  - Manage system-wide user roles
- **Access:** `/admin/dashboard`
- **Scope:** System-wide overview, but most actions link to poll-specific interfaces

### Key Separation

1. **Creating/Managing Polls** ≠ **Voting on Polls**
   - Two completely separate interfaces
   - Voting experience identical for everyone
   - Management requires role-based access

2. **Poll-Specific Work** (primary) ≠ **Cross-Poll Work** (minimal)
   - Most admin work happens in poll management interface
   - Cross-poll features are convenience tools for admins
   - User role management is the main system-wide feature

3. **Role-Based Access:**
   - Poll Creator role enables poll creation
   - Poll Owner/Manager roles are per-poll
   - System Admin has access to all polls but still works poll-by-poll

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

### Feature 4: Fixed Voting Threshold

#### Purpose
- Ensure meaningful participation through first batch completion
- Gate insights generation
- Track engagement quality

#### Threshold Rules
- **Fixed Threshold:** Not configurable per poll
- **For polls with 10+ statements:** First 10 statements (one full batch)
- **For polls with <10 statements:** All statements
- **Cannot be changed** - consistent across all polls

#### Enforcement
1. **Insights Gating**
   - User must complete threshold before finishing
   - Finish button disabled until threshold met
   - Only then are personal insights generated
   - Prevents shallow engagement

2. **Participation Counting**
   - Users who reach threshold: counted as "full participants"
   - Statistics track completion rates

3. **UI Behavior**
   - Finish button disabled (grayed out) until threshold
   - Tooltip shows requirement when disabled
   - No counter needed - threshold is always first batch or all

---

### Feature 5: Personal Insights Generation

#### Triggering Events
- **User completes voting session** by pressing "Finish" button
- Threshold automatically met (button only enabled after threshold)

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
- **Shown immediately after completing voting session**
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

#### Required User Data
- **Age Group:** Predefined ranges (required)
- **Gender:** Predefined options (required)
- **Ethnicity:** Predefined categories (required)
- **Political Party:** Predefined affiliations (required)

#### Availability
- **Anonymous Participants:** Must provide demographics before voting (all 4 fields required)
- **Authenticated Users:** Must provide demographics before voting (all 4 fields required)
- **Collection Timing:**
  - Prompted before first statement card appears
  - Shown via non-dismissible modal (no skip, no X button)
  - Only shown if user doesn't already have demographics from previous poll or session
  - Blocks voting until completed
  - Cannot be changed after initial submission

#### Purpose
- Enable demographic analysis of voting patterns
- Identify group alignments
- Inform poll creators about audience
- Enhance insights generation (critical for quality insights)
- Improve personalization (without requiring authentication)

#### Privacy & Control
- Required for all user types before voting
- No authentication required to provide demographics
- Cannot be updated after submission (one-time only)
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
  - User can still see their insights if they completed voting (reached threshold)
- Extremely rare edge case, handled gracefully
- No data loss for user

#### D. Poll Closes/Ends While User is Voting
**Scenario:** Poll reaches end_time or manually closed while user mid-voting

**Handling:**
- **User can continue voting on their current session**
- Votes cast before closing remain valid
- When user tries to move to next statement or press Finish:
  - Show message: "This poll has closed. Your votes have been saved."
  - Automatically take them to insights (if they reached threshold)
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
   - **Manual progression** - User clicks "Next →" button after viewing results to advance
   - **Inline results display** - Tri-colored bar appears on card bottom with animated segment growth
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
   - **Finish Button:** Disabled until threshold (first 10 or all statements), always visible with state indicator
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