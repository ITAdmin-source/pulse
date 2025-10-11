# Pulse - UX/UI Specification Document

**Version:** 1.4
**Date:** 2025-10-10
**Purpose:** Complete frontend specification for designers and developers

**Changelog:**
- **v1.4 (2025-10-10)**: Card deck terminology finalized - Updated all button labels and terminology to Hebrew infinitives (לשמור/לזרוק/לדלג), replaced "vote/voting" with "choose/choosing" conceptually
- **v1.3 (2025-10-09)**: Hebrew RTL makeover - Complete Hebrew translation with gender-neutral forms, RTL layout using CSS logical properties, Rubik font, Clerk Hebrew localization, all UI components translated
- **v1.2 (2025-10-08)**: Card deck metaphor refinements - InsightCard/ResultsCard redesigns, Continuation page achievement metaphor, Closed poll dual-card layout, Poll listing deck cards with emoji
- **v1.1 (2025-10-02)**: Implemented AdaptiveHeader system - unified context-aware navigation with 5 variants, removed duplicate headers across all pages

---

## Table of Contents

1. [Language & RTL Design](#language--rtl-design)
2. [Design System & Foundations](#design-system--foundations)
3. [Public-Facing Pages](#public-facing-pages)
4. [Authentication Pages](#authentication-pages)
5. [Voting Interface](#voting-interface)
6. [Results & Insights Pages](#results--insights-pages)
7. [Creator/Owner Pages](#creatorowner-pages)
8. [Admin Pages](#admin-pages)
9. [Shared Components](#shared-components)
10. [Responsive Behavior](#responsive-behavior)
11. [Animation & Interaction Specs](#animation--interaction-specs)

---

## Language & RTL Design

### Primary Language: Hebrew
**Pulse is a Hebrew-only application** with no English fallback or bilingual support. All UI elements, labels, messages, and content are in Hebrew with full RTL (right-to-left) layout.

#### Language Configuration
- **HTML:** `<html lang="he" dir="rtl">`
- **Font Family:** Rubik (Google Fonts)
  - Subsets: Hebrew + Latin
  - Variable: `--font-rubik`
  - Replaces: Geist Sans and Geist Mono
- **Date/Time:** Hebrew locale (`he` from date-fns)
- **Authentication:** Clerk Hebrew localization (`heIL`)

#### Translation Approach
**Gender-Neutral Hebrew Strategy:**
All text uses gender-neutral forms to be inclusive of all genders:
- **Infinitive forms:** "כניסה" (entering) instead of "התחבר" (masculine) or "התחברי" (feminine)
- **Noun forms:** "יצירת סקר" (poll creation), "צפייה בתובנות" (viewing insights)
- **Neutral constructions:** Avoids gendered pronouns and verb conjugations
- **Professional tone:** Maintains welcoming, inclusive language throughout

**Translation Examples:**
```
Sign In → כניסה
Sign Up → הצטרפות
Create Poll → יצירת סקר
Continue Choosing → המשך לבחור
View Insights → צפייה בתובנות
Back → חזרה
Next → הבא
Finish → סיום
```

**Card Deck Terminology:**
```
Keep (agree) → לשמור
Throw (disagree) → לזרוק
Pass (unsure) → לדלג
Choose → בחר
Player → שחקן
Card Choosing Interface → ממשק בחירת קלפים
Choice Results → תוצאות בחירה
```

#### RTL Layout Principles
**CSS Approach:** Tailwind CSS v4 logical properties throughout (183 replacements across 43 files)

**Directional Properties:**
- **Margins:**
  - `ml-*` → `ms-*` (margin-inline-start)
  - `mr-*` → `me-*` (margin-inline-end)
- **Padding:**
  - `pl-*` → `ps-*` (padding-inline-start)
  - `pr-*` → `pe-*` (padding-inline-end)
- **Positioning:**
  - `left-*` → `start-*` (inset-inline-start)
  - `right-*` → `end-*` (inset-inline-end)
- **Text Alignment:**
  - `text-left` → `text-start`
  - `text-right` → `text-end`
- **Borders:**
  - `border-l-*` → `border-s-*`
  - `border-r-*` → `border-e-*`
- **Rounded Corners:**
  - `rounded-l-*` → `rounded-s-*`
  - `rounded-r-*` → `rounded-e-*`

**Component Direction:**
- Radix UI components automatically respect `dir="rtl"` attribute
- No need for DirectionProvider wrapper
- Native HTML directionality handles most layout

**Icon Direction:**
- Directional icons reversed: Back buttons use `ArrowRight` instead of `ArrowLeft`
- Navigation drawer opens from right side
- Progress flows right-to-left

#### Typography for Hebrew
**Font Rendering:**
- Rubik provides excellent Hebrew glyph coverage
- Clear distinction between similar Hebrew letters
- Proper diacritic (nikud) support
- Latin fallback for usernames and technical terms

**Text Sizing:**
- Hebrew text generally appears slightly larger than Latin
- Font weights adjusted for Hebrew readability
- Line heights optimized for Hebrew character shapes

**Character Limits:**
- Statement text: 140 characters (sufficient for Hebrew)
- Button labels: 10 characters (adequate for Hebrew button text)
- Form validation adapted for Hebrew message lengths

#### UI Component Examples with Hebrew

**Card Choosing Interface:**
- Statement card: "לשמור" (To Keep) / "לזרוק" (To Throw)
- Pass button: "לדלג" (To Pass)
- Finish button: "סיום" (Finish)
- Add card button: "הוספת קלף" (Add Card)

**Poll Entry Page:**
- "פתיחת חפיסה" (Open Deck)
- "המשך חפיסה" (Continue Deck)
- "צפייה בתובנות שלך" (View Your Insights)

**Navigation:**
- "סקרים" (Polls)
- "לוח בקרה" (Dashboard)
- "יצירת סקר" (Create Poll)
- "פאנל ניהול" (Admin Panel)
- "כניסה" (Sign In)
- "הצטרפות" (Sign Up)

**Validation Messages (Zod):**
- "שאלה נדרשת" (Question required)
- "תיאור ארוך מדי" (Description too long)
- "זמן הסיום חייב להיות אחרי זמן ההתחלה" (End time must be after start time)

#### Accessibility for RTL Hebrew
**Screen Readers:**
- Proper `lang="he"` attribute for Hebrew pronunciation
- ARIA labels translated to Hebrew
- Form validation messages announced in Hebrew

**Keyboard Navigation:**
- Tab order flows naturally in RTL context
- Arrow key navigation reversed for RTL
- Focus indicators work correctly with RTL layout

**Visual Indicators:**
- Progress bars fill right-to-left
- Loading spinners rotate correctly
- Directional animations reversed for RTL

#### Date and Time Formatting
**Hebrew Locale:**
- Date format: Using `he` locale from date-fns
- Time format: 24-hour format preferred in Israel
- Date picker: Hebrew month/day names
- Relative dates: "לפני שעה" (an hour ago), "אתמול" (yesterday)

**Example in Code:**
```typescript
import { he } from "date-fns/locale";
format(date, "PPP 'בשעה' HH:mm", { locale: he });
// Output: "8 בינואר 2025 בשעה 14:30"
```

#### Translation Coverage
All user-facing elements translated:
- ✅ Navigation menus and headers
- ✅ Button labels (all variants)
- ✅ Form inputs and placeholders
- ✅ Validation error messages
- ✅ Toast notifications
- ✅ Modal titles and descriptions
- ✅ Empty states and help text
- ✅ Loading messages
- ✅ Success/error confirmations
- ✅ Poll creation wizard
- ✅ Voting interface
- ✅ Insights and results pages
- ✅ Admin interface
- ✅ Date/time pickers

#### Design Considerations for Hebrew RTL
**Layout Flow:**
- Content flows right-to-left
- Primary actions on right side (instead of left)
- Navigation menus anchor to right
- Progress indicators fill from right

**Visual Hierarchy:**
- Maintain same visual weight as LTR version
- Cards and components mirror horizontally
- Icon placement adjusted for RTL flow
- Text alignment follows natural Hebrew direction

**Component Mirroring:**
- Drawer/Sheet components open from right
- Dropdown menus expand to left
- Tooltip arrows point correctly
- Modal positioning centered (not affected by RTL)

**Testing Checklist:**
- [ ] All text displays correctly in Hebrew
- [ ] No layout breaks with long Hebrew words
- [ ] Icons face correct direction
- [ ] Animations flow right-to-left
- [ ] Form validation works in Hebrew
- [ ] Date pickers show Hebrew months
- [ ] Screen readers pronounce Hebrew correctly
- [ ] Keyboard navigation flows RTL

---

## Design System & Foundations

### Visual Style
- **Inspiration:** Card deck with Stories progress bar
  - Each statement is a card in the deck
  - Each poll is a complete card deck (shown as deck package on listing page)
  - Choosing cards is like sorting (Keep/Throw/Pass metaphor)
  - Adding statements is like adding cards to the deck
  - Progress bar shows position in the deck (Instagram Stories style)
  - Personal insights and poll results are collectible cards
  - Continuation page uses achievement/milestone metaphor
- **Color System (Card-Coded Gradients):**
  - **Amber**: Voting cards, active polls, progress pages (`from-amber-50 via-orange-50/40 to-amber-50`)
  - **Indigo/Violet**: Personal insights (`#ddd6fe`, `#e0e7ff`, `#dbeafe` with animated shimmer)
  - **Emerald/Teal**: Poll results (`#d1fae5`, `#dbeafe` with animated shimmer)
  - **Gray**: Closed/archived polls
- **Typography:** Rubik font family (Hebrew + Latin support)
  - Primary font: Rubik (replaces Geist Sans/Mono)
  - Font weights: 400 (normal), 500 (medium), 600 (semibold), 700 (bold)
  - Optimized for Hebrew readability with excellent glyph coverage
  - Clean, modern sans-serif style works well for both Hebrew and Latin characters
- **Spacing System:** 4px base grid (4, 8, 16, 24, 32, 48, 64px)
- **Border Radius:** Cards: 24px (rounded-3xl), Buttons: 8px, Small elements: 4px
- **Card Aspect Ratio:** Consistent 2:3 ratio for all card types (voting, insights, results, poll decks)

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

### 1. Poll Directory / Deck Listing
**Route:** `/polls`

**Design Philosophy:** Present each poll as a physical card deck package that users can browse and select.

#### Layout
```
┌─────────────────────────┐
│      Header/Nav         │
├─────────────────────────┤
│  Pick a Deck to Explore │ ← Title
│  Choose a deck, sort    │
│  the cards, discover... │
├─────────────────────────┤
│   Poll Filters          │
│   [Active] [Closed]     │
│   [Search: ______ ]     │
│   Sort: [Dropdown]      │
├─────────────────────────┤
│   Poll Deck Grid        │
│   (4 columns desktop,   │
│    3 tablet, 2 mobile)  │
│                         │
│   ┌─────┐  ┌─────┐     │
│   │ 🎴  │  │ 📊  │     │ ← Large emoji at top
│   │Deck1│  │Deck2│     │
│   │Quest│  │Quest│     │
│   │ ✦   │  │ ✦   │     │ ← Decorative elements
│   └─────┘  └─────┘     │
│                         │
│   [Load More]           │
└─────────────────────────┘
```

#### Components Needed
- **PollDeckCard Component** (`components/polls/poll-deck-card.tsx`)
  - 2:3 aspect ratio card (vertical orientation like a deck box)
  - **Large emoji at top** - Unique to each poll (stored in poll.emoji field)
  - **3-layer stacked depth effect** - 2 shadow layers behind for visual depth
  - **Status badge** - Top right corner (Active/Closed)
  - **Poll question** - Centered, bold, line-clamp-5
  - **Decorative element** - Bottom (✦ for active, ◆ for closed)
  - **CLOSED ribbon** - Diagonal semi-transparent overlay for closed decks
  - **Amber gradient** - Active decks use amber theme
  - **Gray gradient** - Closed decks use gray theme
  - **Hover animation:**
    - Scale to 1.05
    - Lift up 5px (translateY: -5px)
    - Enhanced shadow
    - Duration: 200ms
  - **Click** - Navigate to `/polls/[slug]`

- **Filter Bar Component**
  - Status filter (Active/Closed toggles)
  - Search input with icon
  - Sort dropdown (Recent, Popular, Ending Soon)
  - Clear filters button

#### States
- Loading state (skeleton screens matching 2:3 cards)
- Empty state (no polls found)
- Error state (connection failed)

#### Interactions
- **Click deck card** → Navigate to poll entry page (`/polls/[slug]`)
- **Hover deck card** → Lift and scale animation
- Filter changes → Update deck grid
- Search input → Debounced search, update list
- Infinite scroll or pagination for poll list

#### Visual Details
- **Grid Layout:**
  - Desktop: 4 columns (lg:grid-cols-4)
  - Tablet: 3 columns (md:grid-cols-3)
  - Mobile: 2 columns (grid-cols-2)
  - Gap: 8 (2rem between cards)
- **Background:** Blue-indigo gradient (from-blue-50 to-indigo-100)
- **Deck card stacking:**
  - Back layer: translateY(3), translateX(2), opacity 30%
  - Middle layer: translateY(1.5), translateX(1), opacity 60%
  - Front layer: Full opacity, interactive

---

### 2. Poll Entry / Landing Page
**Route:** `/polls/[slug]`

**IMPORTANT:** This page uses a card deck package metaphor to present polls as physical card decks. The page adapts to 4 distinct user states based on voting progress.

**Design Philosophy:** Clean, focused layout with the card deck as the visual centerpiece. No clutter - let the deck speak for itself.

#### Layout States (Adaptive)

##### State A: New User (No Votes)
```
┌─────────────────────────┐
│   [Manage Poll] (owner) │ ← Top right only
├─────────────────────────┤
│                         │
│   ┌─────────────────┐   │
│   │  ✦  Poll Deck   │   │ ← Card deck package
│   │                 │   │   (clickable, 2:3 ratio)
│   │  Poll Question  │   │
│   │  Description    │   │
│   │                 │   │
│   │   • • •         │   │ ← Dot divider
│   │                 │   │
│   │ Keep, throw, or │   │
│   │ skip each card  │   │
│   │                 │   │
│   │ Add a winning   │   │ ← If poll allows
│   │ card            │   │   user statements
│   │                 │   │
│   │ Discover your   │   │
│   │ insights        │   │
│   │                 │   │
│   │ ═══ ═══ ═══     │   │ ← Decorative bars
│   └─────────────────┘   │
│                         │
│   [Open Deck]           │ ← Primary CTA
│   (Large button)        │
│                         │
└─────────────────────────┘
```

##### State B: In Progress (Below Threshold)
```
┌─────────────────────────┐
│   [Manage Poll] (owner) │
├─────────────────────────┤
│                         │
│   ┌─────────────────┐   │
│   │  Card Deck      │   │ ← Same deck visual
│   │  (as State A)   │   │   Click navigates to
│   └─────────────────┘   │   /vote to continue
│                         │
│   [Continue Deck]       │ ← Primary CTA
│   (Large button)        │
│                         │
└─────────────────────────┘
```

##### State C: Threshold Reached (Not All Voted)
```
┌─────────────────────────┐
│   [Manage Poll] (owner) │
├─────────────────────────┤
│                         │
│   ┌─────────────────┐   │
│   │  Card Deck      │   │ ← Same deck visual
│   │  (as State A)   │   │   Click navigates to
│   └─────────────────┘   │   /insights
│                         │
│   [View Your Insights]  │ ← Primary CTA
│   (Large button)        │
│                         │
│   [Continue Deck]       │ ← Secondary button
│   (Secondary style)     │
│                         │
└─────────────────────────┘
```

##### State D: Completed (All Statements Voted)
```
┌─────────────────────────┐
│   [Manage Poll] (owner) │
├─────────────────────────┤
│                         │
│   ┌─────────────────┐   │
│   │  Card Deck      │   │ ← Same deck visual
│   │  (as State A)   │   │   Click navigates to
│   └─────────────────┘   │   /insights
│                         │
│   [View Your Insights]  │ ← Primary CTA
│   (Large button)        │
│                         │
│   [View Poll Results]   │ ← Secondary button
│   (Secondary style)     │
│                         │
└─────────────────────────┘
```

#### Components Needed

- **CardDeckPackage Component** (`components/polls/card-deck-package.tsx`)
  - Displays poll as a physical card deck (2:3 aspect ratio)
  - Visual structure:
    - Top: ✦ symbol + "Poll Deck" label
    - Middle: Poll question (bold) + optional description
    - Divider: Three dots (• • •)
    - Instructions: "Keep, throw, or skip each card"
    - Optional: "Add a winning card" (if allowUserStatements)
    - Bottom: "Discover your insights"
    - Decorative bars: Three amber bars at bottom (always visible)
  - Stacked card depth effect (2 shadow layers behind)
  - Amber gradient background (from-amber-50 via-orange-50/40 to-amber-50)
  - Size: max-w-xs (matches voting card size)
  - Clickable with hover effect:
    - Scale 1.02 + lift 4px on hover
    - Enhanced shadow (xl → 2xl)
    - Cursor pointer
  - Click navigation based on user state:
    - New/In Progress → /vote
    - Threshold/Completed → /insights

- **ClickableCardDeck Wrapper** (`components/polls/clickable-card-deck.tsx`)
  - Client component wrapper for navigation
  - Receives: pollSlug, pollQuestion, allowUserStatements, description, navigateTo
  - Handles click → router.push()

- **Adaptive CTA Buttons**
  - State A: "Open Deck" (primary)
  - State B: "Continue Deck" (primary)
  - State C: "View Your Insights" (primary) + "Continue Deck" (secondary)
  - State D: "View Your Insights" (primary) + "View Poll Results" (secondary)

- **Manage Poll Button** (top right, owners/managers only)
  - Small outline button with Settings icon
  - Links to `/polls/[slug]/manage`

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
- Show mandatory demographics modal (if user doesn't already have demographics)
- Demographics modal blocks access to statements until all 4 fields completed

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

### 5. Demographics Modal (Mandatory)
**Displayed before first statement card - Blocks voting until completed**

#### Purpose & Messaging
**Title:** "Let's get to know you"
**Description:** "We want to get to know a bit about you before you start playing, so that we can come up with better insights"

#### Layout
```
┌─────────────────────────┐
│ Let's get to know you   │
│  (NO X BUTTON)          │
│                         │
│  We want to get to know │
│  a bit about you before │
│  you start playing, so  │
│  that we can come up    │
│  with better insights   │
│                         │
│  Age Group *            │
│  [Select ▼]             │
│                         │
│  Gender *               │
│  [Select ▼]             │
│                         │
│  Ethnicity *            │
│  [Select ▼]             │
│                         │
│  Political Party *      │
│  [Select ▼]             │
│                         │
│       [Continue]        │
│  (Disabled until all    │
│   4 fields filled)      │
└─────────────────────────┘
```

#### Components Needed
- **Demographics Modal (Non-Dismissible)**
  - 4 dropdown selects (Age, Gender, Ethnicity, Political Party) - ALL REQUIRED (marked with *)
  - Continue button (primary, disabled until all fields filled)
  - NO Skip button
  - NO Close/dismiss X button
  - Modal overlay prevents clicking outside
  - Cannot be dismissed with Escape key
  - Purpose messaging explaining why demographics are needed

#### Interactions
- **All 4 fields mandatory** - Cannot proceed without completing all
- Continue button disabled (grayed out) until all 4 fields selected
- **Only shown if user doesn't already have demographics** (from previous poll or this poll)
- Continue → Save demographics, create user (if not exists), close modal, proceed to first statement card
- Cannot be shown again to same user (one-time only)
- Cannot be changed after submission
- **User Creation Timing:** User is created when demographics are saved OR on first vote (whichever comes first)

---

### 6. Card-Based Voting Interface
**Route:** `/polls/[slug]/vote`

#### Layout
```
┌─────────────────────────┐
│ ▬▬▬▬░░░░░░░░░  [+][Finish] │ ← Progress bar & actions
├─────────────────────────┤
│   Poll Question         │ ← In header
│   (Small, center-aligned)│
├─────────────────────────┤
│                         │
│  ┌─────────────────┐    │
│  │                 │    │
│  │   STATEMENT     │    │
│  │   TEXT HERE     │    │
│  │   (max 140 ch)  │    │
│  │                 │    │
│  │  [Agree] [Disagree] │ ← ON card
│  │                 │    │
│  └─────────────────┘    │
│                         │
│     [Pass/Unsure]       │ ← BELOW card
│                         │
└─────────────────────────┘
```

#### Components Needed

##### Statement Card Component
- **Card Container**
  - Fixed aspect ratio (2:3) for all cards
  - Shadow, rounded corners (24px)
  - Amber gradient background (from-amber-50 via-orange-50/40 to-amber-50)
  - Stacked card depth effect (2 shadow layers behind)
  - Decorative ✦ symbols top and bottom
  - Centered, prominent
  - **Statement text (max 140 characters)**
    - Center-aligned
    - Medium font weight
    - Responsive sizing (text-sm on mobile, text-base on desktop)
    - All cards same size regardless of text length
  - Agree button (left/top, on card)
  - Disagree button (right/bottom, on card)
  - Customizable button labels

- **Button Positioning**
  - Agree/Disagree: ON the card (primary actions)
  - Pass/Unsure: BELOW the card, separated (secondary action)

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
- Poll question (small, center-aligned in header)
- Add Card button (right side, with + icon)
  - Shows as icon-only on mobile, "Add Card" text on larger screens
  - Tooltip: "Add a new card to share a missing perspective"
  - Opens modal for statement submission
- Finish button (right side)
  - Disabled state (grayed out) until threshold
  - Enabled state (clickable) after threshold
  - Tooltip when disabled:
    - "Complete the first 10 statements to finish" (polls with 10+ statements)
    - "Vote on all X statements to finish" (polls with <10 statements)
- **No statement counter** - Progress bar is sufficient visual indicator

##### Vote Result Overlay (Card Flip Animation)
```
┌─────────────────────────┐
│  ┌─────────────────┐    │
│  │                 │    │ ← Same 2:3 aspect ratio
│  │ STATEMENT (sm)  │    │ ← Statement text smaller
│  │                 │    │
│  │  ✓ YOU AGREED   │    │ ← User's vote indicator
│  │                 │    │
│  │  Agree:    65%  │    │
│  │  ████████░░     │    │ ← Animated bars
│  │                 │    │
│  │  Disagree: 25%  │    │
│  │  ███░░░░░░░     │    │
│  │                 │    │
│  │  Unsure:   10%  │    │
│  │  █░░░░░░░░░     │    │
│  │                 │    │
│  │  Based on 234   │    │
│  │  votes          │    │
│  └─────────────────┘    │
│                         │
│      [Next →]           │ ← Manual advance
└─────────────────────────┘
```

**Card Flip Animation:**
- 600ms 3D rotation on Y-axis (0° → 180°)
- Front side (statement) hidden after 90°
- Back side (results) appears from 90° → 180°
- Same amber gradient background as statement card
- Results animate in after flip completes:
  - Vote indicator scales + fades in (300ms)
  - Bars fill sequentially with staggered delays (500ms each, 200ms stagger)
- Next button fades in after animations (1.2s delay)
- No auto-advance - user must click Next

#### States

##### Pre-Vote State (Clean Card)
- Statement card visible
- Agree/Disagree buttons enabled
- Pass/Unsure button enabled
- No vote distribution shown
- Progress bar shows current position

##### Post-Vote State (Results Display)
- Statement card flips to reveal results (3D card flip animation)
- Results appear on back of card (same amber gradient)
- User's vote highlighted with icon
- Vote distribution appears with staggered animations:
  - Percentages (X% agree, Y% disagree, Z% neutral)
  - Horizontal bars (animated fill, 500ms each with 200ms stagger)
  - Total vote count
  - User's vote indicator
- Next button fades in below card
- **Manual advance only** - no auto-advance
- **Result card is also clickable** - tapping card advances to next (discoverable interaction)

##### Transition State (Card-to-Card Animation)
**Slide Away + Slide In Animation:**
- **Results card exit:**
  - Slides left (x: -400px) with fade out
  - Duration: 400ms
  - Easing: ease-in-out
- **Next statement card enter:**
  - Slides in from right (x: 400px)
  - Scale effect: 0.95 → 1.0 for depth
  - Duration: 400ms
  - Easing: ease-in-out
- **Buttons fade separately:**
  - Vote buttons fade out/in (not sliding)
  - Pass button fades out/in (not sliding)
  - Next button fades out/in (not sliding)
  - Duration: 300ms
  - Keeps UI stable while cards transition
- **Progress bar updates** after animation completes
- Clean slate for next statement

#### Interactions

1. **Voting Flow**
   - Tap Agree/Disagree/Pass → Vote recorded
   - Card flips (600ms 3D rotation)
   - Results animate in (staggered)
   - Next button appears
   - User clicks Next OR taps result card → Next card slides in

2. **Manual Advancement**
   - "Next →" button below results (required - no auto-advance)
   - OR tap anywhere on result card to advance (discoverable)
   - Triggers slide-away animation

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

### 6a. Continuation Page (Achievement/Milestone)
**Displayed after every 10 statements voted**

**Design Philosophy:** Use achievement/milestone metaphor (NOT card collection). This is a progress checkpoint where users decide their next action.

#### Scenario 1: Progress Milestone (More Statements Available)
```
┌─────────────────────────┐
│                         │
│   ┌─────────────────┐   │
│   │      🏆         │   │ ← Trophy (spinning animation)
│   │ Progress        │   │   Amber gradient card
│   │ Milestone!      │   │   (matches voting flow)
│   │                 │   │
│   │ X cards sorted  │   │
│   │                 │   │
│   │ ┌─────────────┐ │   │
│   │ │ Your Tally  │ │   │ ← White inset card
│   │ │ Keep:    6  │ │   │   with icons
│   │ │ Throw:   3  │ │   │   (TrendingUp/Down/Minus)
│   │ │ Unsure:  1  │ │   │
│   │ └─────────────┘ │   │
│   │                 │   │
│   │ More cards to   │   │
│   │ explore         │   │
│   │                 │   │
│   └─────────────────┘   │
│                         │
│  [Continue Sorting]     │ ← Primary
│  [Sort X more to finish]│ ← Secondary (if below threshold)
│  OR                     │
│  [Finish & See Insights]│ ← Secondary (if threshold met)
│                         │
└─────────────────────────┘
```

#### Scenario 2: Deck Complete (No More Statements)
```
┌─────────────────────────┐
│                         │
│   ┌─────────────────┐   │
│   │      🏆         │   │ ← Trophy (spinning animation)
│   │ Deck Complete!  │   │   Amber gradient card
│   │ 🎉              │   │   (celebration theme)
│   │                 │   │
│   │ You've sorted   │   │
│   │ all X cards     │   │
│   │                 │   │
│   │ ┌─────────────┐ │   │
│   │ │ Final Tally │ │   │ ← White inset card
│   │ │ Keep:   12  │ │   │   Same structure
│   │ │ Throw:   8  │ │   │
│   │ │ Unsure:  2  │ │   │
│   │ └─────────────┘ │   │
│   │                 │   │
│   └─────────────────┘   │
│                         │
│  [See Your Insights]    │ ← Single CTA (primary)
│                         │
└─────────────────────────┘
```

#### Components Needed
- **ContinuationPage Component** (`components/voting/continuation-page.tsx`)
  - Two scenarios based on `hasMoreStatements` prop
  - **Achievement card:**
    - Amber gradient background (from-amber-50 via-orange-50/40 to-amber-50)
    - Same 2:3 aspect ratio as voting cards (max-w-md)
    - Trophy icon with spin animation (scale 0 → 1, rotate -180° → 0°, spring transition)
    - Title: "Progress Milestone!" or "Deck Complete! 🎉"
    - Card count display
  - **Tally section:**
    - White inset card (bg-white rounded-xl p-4 border border-gray-200)
    - Three rows: Keep (green), Throw (red), Unsure (gray)
    - Icons: TrendingUp, TrendingDown, Minus
    - Bold count numbers (text-xl)
  - **Compact sizing:**
    - Card padding: p-6 (not p-8)
    - Trophy icon: h-10 w-10 (not h-12 w-12)
    - Font sizes: text-2xl title, text-sm body
    - Reduced margins to fit on screen without scrolling
  - **Action buttons:**
    - Scenario 1: "Continue Sorting" (primary) + conditional "Finish & See Insights" (secondary, if threshold met)
    - Scenario 2: "See Your Insights" (primary only)

#### Interactions
- **Continue Sorting** → Load next batch of up to 10 statements
- **Finish & See Insights** → End voting session, navigate to `/insights`
- **Sort X more to finish** → Shows remaining needed, disabled button
- **No skip/dismiss** → User must choose one option
- **Error handling** → If batch loading fails, show error message with Retry button
- **Cumulative progress:** Shows total sorted (10, 20, 30, etc.)
- No total statement count displayed (keeps exploration open-ended)

#### Animation Specs
- **Trophy icon:**
  - Initial: scale(0), rotate(-180deg)
  - Animate to: scale(1), rotate(0deg)
  - Delay: 200ms
  - Transition: spring with stiffness 200
- **Card entrance:**
  - Initial: scale(0.9), opacity(0)
  - Animate to: scale(1), opacity(1)
  - Duration: 400ms
  - Easing: ease-out

---

### 7. Add Card Modal (Statement Submission)
**Triggered from voting interface via "Add Card" button**

#### Layout
```
┌─────────────────────────┐
│  Add a New Card         │
├─────────────────────────┤
│  Create a new card to   │
│  add a missing          │
│  perspective to this    │
│  poll's deck.           │
│                         │
│  What should your card  │
│  say?                   │
│                         │
│  ┌─────────────────┐    │
│  │                 │    │
│  │ Textarea...     │    │
│  │                 │    │
│  └─────────────────┘    │
│                         │
│  X/140 characters       │
│                         │
│  Preview your card:     │
│  ┌─────────────────┐    │
│  │ ✦  Your text  ✦ │    │ ← Mini horizontal preview
│  └─────────────────┘    │
│                         │
│  [Cancel]  [Add Card]   │
│                         │
└─────────────────────────┘
```

#### Components Needed
- Modal overlay (darkened background)
- Modal container with title "Add a New Card"
- Description: "Create a new card to add a missing perspective to this poll's deck"
- Label: "What should your card say?"
- Text area input (max 140 characters)
- Character counter (X/140 characters)
- **Compact horizontal preview card:**
  - Amber gradient background (same as voting cards)
  - Decorative ✦ symbols left and right
  - Text center-aligned, text-sm font, medium weight
  - Line-clamp-2 (max 2 lines)
  - Minimal height to keep modal compact
- Cancel button (secondary)
- "Add Card" button (primary, disabled if empty or over limit)

#### States
- Empty state ("Add Card" button disabled)
- Typing state (live character count)
- Limit warning (text red when over 140 characters)
- Submitting state (loading spinner, "Adding Card...")
- Success state (toast notification)
- Error state (submission failed)

#### Post-Submission Flow
- Auto-approval: Toast shows "Your card has been added to the deck!"
- Moderation: Toast shows "Card submitted for review"
- Modal closes
- Returns to same voting card
- User can continue voting immediately

---

## Results & Insights Pages

### 8. Personal Insights Page
**Route:** `/polls/[slug]/insights`
**Shown after completing voting (pressing Finish button after threshold met)**

**Design Philosophy:** Present insight as a special, collectible card distinct from voting cards. Clean layout with minimal clutter.

#### Layout
```
┌─────────────────────────┐
│   [Compact anon banner] │ ← If anonymous user
├─────────────────────────┤
│                         │
│   ┌─────────────────┐   │
│   │       🌟        │   │ ← Large emoji (extracted from title)
│   │ Personal Insight│   │   Indigo/violet gradient
│   │                 │   │   with animated shimmer
│   │ Strong Alignment│   │
│   │ with Key        │   │ ← Title (emoji removed)
│   │ Proposals       │   │
│   │                 │   │
│   │ Based on your   │   │ ← Body (scrollable)
│   │ voting pattern, │   │
│   │ you show strong │   │
│   │ support for...  │   │
│   │                 │   │
│   │ ─────────────── │   │ ← Metadata section
│   │ Poll Question   │   │   (bottom of card)
│   │ Jan 8, 2025     │   │
│   └─────────────────┘   │
│                         │
│   [Share] [Save]        │ ← Inline action buttons
│                         │
│   [View All Results]    │ ← Navigation buttons
│   [Back to All Decks]   │ ← (stacked on mobile,
│                         │    row on desktop)
└─────────────────────────┘
```

#### Components Needed
- **InsightCard Component** (`components/shared/insight-card.tsx`)
  - **2:3 aspect ratio** (same as voting cards - max-w-xs)
  - **Indigo/violet animated gradient background:**
    - Colors cycle: #ddd6fe → #e0e7ff → #dbeafe
    - Duration: 8 seconds, infinite loop
    - Smooth transitions
  - **Large emoji hero element:**
    - Extracted from title string using regex `/^(\p{Emoji})\s+(.+)$/u`
    - Displayed at 5xl size (text-5xl)
    - Spin-in animation on load (scale 0 → 1, rotate -180° → 0°)
  - **"Personal Insight" badge:**
    - Small uppercase label (px-3 py-0.5)
    - Indigo color scheme (bg-indigo-100 text-indigo-700)
  - **Title and body:**
    - Title without emoji (text-base md:text-lg, font-bold)
    - Body in scrollable section (max-h-[180px], overflow-y-auto)
    - Text size: text-xs md:text-sm
  - **Bottom metadata section:**
    - Border top (border-t border-indigo-200/50)
    - Poll question (line-clamp-2)
    - Generated date (en-US format to prevent hydration errors)
    - Both text-xs text-gray-500/400

- **InsightActions Component** (`components/polls/insight-actions.tsx`)
  - Share button (Share2 icon)
  - Save button (Save icon, disabled for anonymous)
  - Inline flex row, gap-3
  - Outline button style

- **Compact Anonymous Banner:**
  - If user not signed in
  - Yellow bg (bg-yellow-50 border-yellow-200)
  - Text: "Anonymous session • [Sign up] to save your insights"
  - Small padding (px-4 py-2), text-xs

#### States
- **Loading** - Generating insights spinner
- **Success** - Show InsightCard with actions
- **Error** - "Could Not Generate Insights" with retry/fallback options
- **Threshold not met** - "Sort More Cards First" with remaining count

#### Interactions
- **Share button** → Native share API or clipboard fallback
- **Save button** → Download .txt file (authenticated only)
- **View All Results** → Navigate to `/polls/[slug]/results`
- **Back to All Decks** → Navigate to `/polls`
- **Anonymous sign up link** → Navigate to `/signup`

#### Visual Details
- **Page background:** Blue-indigo gradient (from-blue-50 to-indigo-100)
- **Container:** max-w-3xl, px-4 py-4
- **Spacing:** space-y-4 between elements
- **Reduced clutter:** No header duplication, compact banner, minimal text

---

### 9. Poll Results Summary Page
**Route:** `/polls/[slug]/results`
**Accessible to all users (voters and non-voters)**

**Design Philosophy:** Clean, card-focused layout matching insights page structure. Results presented as collectible summary card.

#### Layout
```
┌─────────────────────────┐
│                         │
│   ┌─────────────────┐   │
│   │  Poll Results   │   │ ← Badge at top
│   │                 │   │   Emerald/teal gradient
│   │  👥 234  🗳️ 1.5K│   │   with animated shimmer
│   │                 │   │ ← Participant/vote stats
│   │ The poll shows  │   │
│   │ strong consensus│   │ ← AI-generated summary
│   │ on core issues, │   │   (scrollable)
│   │ with notable    │   │
│   │ divergence on...│   │
│   │                 │   │
│   │ Most agreed:    │   │
│   │ "Statement..."  │   │
│   │                 │   │
│   │ Most divisive:  │   │
│   │ "Statement..."  │   │
│   │                 │   │
│   │ ─────────────── │   │ ← Metadata section
│   │ Poll Question   │   │   (bottom of card)
│   │ Jan 8, 2025     │   │
│   └─────────────────┘   │
│                         │
│  [Back to All Decks]    │ ← Single centered button
│                         │
└─────────────────────────┘
```

#### Components Needed
- **ResultsCard Component** (`components/shared/results-card.tsx`)
  - **2:3 aspect ratio** (same as insights/voting cards - max-w-xs)
  - **Emerald/teal animated gradient background:**
    - Colors cycle: #d1fae5 → #dbeafe → #d1fae5
    - Duration: 8 seconds, infinite loop
    - Smooth transitions
  - **"Poll Results" badge:**
    - Small uppercase label (px-3 py-0.5)
    - Emerald color scheme (bg-emerald-100 text-emerald-700)
  - **Statistics display:**
    - Icons: Users (👥 participants), Vote (🗳️ votes)
    - Inline flex with gap
    - Icon + number pairs
    - Color: emerald-600
  - **Summary text:**
    - AI-generated poll summary
    - Scrollable section (max-h-[220px], overflow-y-auto)
    - Text size: text-xs md:text-sm
    - Includes key findings, most agreed/disagreed/divisive statements
  - **Bottom metadata section:**
    - Border top (border-t border-emerald-200/50)
    - Poll question (line-clamp-2)
    - Generated date (en-US format to prevent hydration errors)
    - Both text-xs text-gray-500/400

#### States
- **Loading** - "Generating results summary" spinner
- **Success** - Show ResultsCard
- **Error** - "Results summary is being generated. Please check back later." fallback
- **Cache** - AI summaries cached for 24 hours, show cached version if available

#### Interactions
- **Back to All Decks** → Navigate to `/polls`
- **Card itself** - Static display, no interactions

#### Visual Details
- **Page background:** Blue-indigo gradient (from-blue-50 to-indigo-100)
- **Container:** max-w-3xl, px-4 py-4
- **Spacing:** space-y-4 between elements
- **Clean layout:** Just card + back button, no clutter

---

### 10. Closed Poll Access Page
**Route:** `/polls/[slug]/closed`
**For ALL users (voters and non-voters) accessing closed polls**

**Design Philosophy:** Show both InsightCard and ResultsCard together to reduce clicks. Users get all information at once.

#### Layout (Desktop - Side by Side)
```
┌─────────────────────────────────────────┐
│                                         │
│  ┌──────────────┐  ┌──────────────┐    │
│  │   🌟         │  │ Poll Results │    │ ← InsightCard (left)
│  │ Personal     │  │              │    │   ResultsCard (right)
│  │ Insight      │  │  👥 234      │    │
│  │              │  │  🗳️ 1.5K     │    │ ← Only for voters who
│  │ Your voting  │  │              │    │   reached threshold
│  │ pattern...   │  │ Summary...   │    │
│  │              │  │              │    │
│  │ ──────────── │  │ ──────────── │    │
│  │ Poll Ques... │  │ Poll Ques... │    │
│  │ Jan 8, 2025  │  │ Jan 8, 2025  │    │
│  └──────────────┘  └──────────────┘    │
│                                         │
│       [Back to All Decks]               │ ← Single centered button
│                                         │
└─────────────────────────────────────────┘
```

#### Layout (Mobile - Stacked)
```
┌─────────────────────────┐
│                         │
│   ┌─────────────────┐   │
│   │       🌟        │   │ ← InsightCard (top)
│   │ Personal Insight│   │   (only for voters)
│   │                 │   │
│   │ Your pattern... │   │
│   │                 │   │
│   │ ─────────────── │   │
│   │ Poll Question   │   │
│   │ Jan 8, 2025     │   │
│   └─────────────────┘   │
│                         │
│   ┌─────────────────┐   │
│   │  Poll Results   │   │ ← ResultsCard (bottom)
│   │                 │   │   (shown to everyone)
│   │  👥 234         │   │
│   │  🗳️ 1.5K        │   │
│   │                 │   │
│   │ Summary text... │   │
│   │                 │   │
│   │ ─────────────── │   │
│   │ Poll Question   │   │
│   │ Jan 8, 2025     │   │
│   └─────────────────┘   │
│                         │
│  [Back to All Decks]    │
│                         │
└─────────────────────────┘
```

#### Components Needed
- **InsightCard** (`components/shared/insight-card.tsx`) - Reused component
  - Only shown for voters who reached threshold
  - Same indigo/violet gradient with emoji
  - Includes poll question and date metadata

- **ResultsCard** (`components/shared/results-card.tsx`) - Reused component
  - Always shown for everyone (voters and non-voters)
  - Same emerald/teal gradient
  - Includes poll question and date metadata

#### Layout System
- **Container:** max-w-6xl (wider to accommodate side-by-side on desktop)
- **Cards Container:**
  - Desktop: `flex flex-row gap-8` (lg:flex-row)
  - Mobile: `flex flex-col gap-6` (flex-col)
  - Alignment: `items-start justify-center`
- **Card Wrappers:**
  - Mobile: `w-full` with `flex justify-center`
  - Desktop: `lg:w-auto` with `flex justify-center`
  - Ensures cards stay centered and max-w-xs

#### Access Rules & Display Logic
- **Voters who reached threshold:**
  - See both InsightCard (left/top) and ResultsCard (right/bottom)
  - Both cards shown simultaneously

- **Voters who didn't reach threshold:**
  - See only ResultsCard (centered)
  - No personal insights (didn't vote enough)

- **Non-voters (never participated):**
  - See only ResultsCard (centered)
  - No personal insights (didn't participate)

#### Visual Details
- **Page background:** Blue-indigo gradient (from-blue-50 to-indigo-100)
- **Spacing:** space-y-4, gap-6 (mobile), gap-8 (desktop)
- **Responsive breakpoint:** lg (1024px) for side-by-side layout
- **No extra UI:** Just cards + back button, extremely clean

#### Interactions
- **Back to All Decks** → Navigate to `/polls`
- **Cards** → Static display, no click interactions
- **No separate navigation** → All info visible at once (UX win!)

---

## Creator/Owner Pages

### Prerequisites: Poll Creation Access

**Who Can Create Polls:**
Only users with one of these roles can access poll creation:
- **Poll Creator** role (assigned by System Admin)
- **Poll Manager** role (assigned to at least one poll)
- **System Administrator** role

**Entry Points:**
1. **Main Navigation:** "Create Poll" button (visible only to authorized users)
2. **User Dashboard:** "Create New Poll" button in "My Polls" section
3. **Unauthorized Access:** Shows message: "You need Poll Creator permissions. Contact system administrator."

**Result:** When user creates a poll, they automatically become the **Poll Owner** for that specific poll.

---

### 11. Poll Creation Wizard
**Route:** `/polls/create`
**Access:** Poll Creators, Poll Managers, System Admins only

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

### 12. Poll Management Interface (Poll-Specific)
**Route:** `/polls/[slug]/manage`
**Access:** Poll Owner, Poll Managers (for this poll), System Admins

**Key Principle:** All management work is poll-specific. This interface manages ONE poll at a time.

#### Layout
```
┌─────────────────────────┐
│  [← Back] Poll Title    │
│  Status: [DRAFT/ACTIVE] │
│  [View as Voter] [Share]│
├─────────────────────────┤
│  [Publish/Unpublish/Close] │
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
│  [Overview][Statements] │
│  [Settings][Analytics]  │
│  [Roles][Preview]       │
│                         │
│  [Active Tab Content]   │
│                         │
└─────────────────────────┘
```

**Who Sees What:**
- **Poll Owners:** All tabs, all actions (including Delete, Transfer ownership, Unpublish)
- **Poll Managers:** All tabs, most actions (CANNOT Delete, Transfer, or Unpublish - these show as disabled/locked)
- **System Admins:** Same as Poll Owners (full access to any poll)

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

#### Tab: Roles (Poll-Specific User Management)
**Purpose:** Manage who can access and manage THIS specific poll only.

```
┌─────────────────────────┐
│  Roles for THIS Poll    │
│                         │
│  ┌─────────────────┐    │
│  │ ℹ️ System Admins│    │
│  │ automatically   │    │
│  │ have access     │    │
│  └─────────────────┘    │
│                         │
│  Poll Owner             │
│  ┌─────────────────┐    │
│  │ Owner Name      │    │
│  │ owner@email.com │    │
│  │ (Cannot remove) │    │
│  └─────────────────┘    │
│                         │
│  Poll Managers (2)      │
│  ┌─────────────────┐    │
│  │ Manager 1       │    │
│  │ user@email.com  │    │
│  │ Added: 2024-10  │    │
│  │ [Remove]        │    │
│  └─────────────────┘    │
│                         │
│  Add Manager            │
│  ┌─────────────────┐    │
│  │ Search user...  │▼   │
│  └─────────────────┘    │
│  [Assign as Manager]    │
│                         │
│  Transfer Ownership 🔒  │
│  (Owner only)           │
│  [Transfer Poll...]     │
│                         │
└─────────────────────────┘
```

**Notes:**
- Managers gain access to THIS poll's management interface only
- Other polls unaffected
- System Admins shown in info box (not in manager list)
- Transfer Ownership button locked for managers (owner-only)

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

### Key Principle: Poll-Centric Administration

**Most admin work is poll-specific:**
- Admins access individual poll management interfaces at `/polls/[slug]/manage`
- Same interface as Poll Owners (all permissions)
- Work on one poll at a time

**Cross-poll features (minimal, convenience tools):**
- Global Moderation Queue - moderate statements across all polls
- User Role Management - assign Poll Creator role
- System Dashboard - overview and navigation

---

### 14. System Admin Dashboard
**Route:** `/admin/dashboard`
**Access:** System Admins only

#### Layout
```
┌─────────────────────────┐
│  Admin Dashboard        │
├─────────────────────────┤
│                         │
│  System Overview        │
│  ┌─────────────────┐    │
│  │ Total Polls: 45 │    │
│  │ - Draft: 8      │    │
│  │ - Published: 23 │    │
│  │ - Closed: 14    │    │
│  │                 │    │
│  │ Total Users:1234│    │
│  │ - Auth: 890     │    │
│  │ - Anon: 344     │    │
│  │                 │    │
│  │ Total Votes:    │    │
│  │ 45,678          │    │
│  └─────────────────┘    │
│                         │
│  Quick Actions          │
│  [Global Moderation (47)]│
│  [User Role Management] │
│  [View All Polls]       │
│                         │
│  All Polls List         │
│  ┌─────────────────┐    │
│  │ Poll Question   │    │
│  │ Owner: Name     │    │
│  │ Status: Active  │    │
│  │ Pending: 3      │    │
│  │ [Manage][View]  │    │
│  └─────────────────┘    │
│                         │
│  Recent Activity        │
│  - New poll created     │
│  - 234 votes today      │
│  - 12 statements pending│
│                         │
└─────────────────────────┘
```

**Purpose:**
- System-wide overview
- Navigate to specific poll management
- Access cross-poll convenience features
- Most actions link to poll-specific interfaces

---

### 15. Global Moderation Queue (Cross-Poll Convenience)
**Route:** `/admin/moderation`
**Access:** System Admins only

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

**Purpose:** Convenience feature to moderate statements from all polls in one view.

**Key Features:**
- Shows pending statements from ALL polls
- Poll context (question) shown for each statement
- Can approve/reject across different polls
- Link to "View in poll" for detailed context
- Actions affect the statement's specific poll

#### Components Needed
- Filter and search bar
- Pending statement list with poll context
- Statement cards with poll link
- Bulk action controls
- Pagination/infinite scroll

**Note:** Admins can also moderate by going to each poll's management interface individually (same as owners/managers).

---

### 16. User Role Management (System-Wide)
**Route:** `/admin/users`
**Access:** System Admins only

#### Purpose
Assign Poll Creator role to enable users to create new polls.

#### Layout
```
┌─────────────────────────┐
│  User Role Management   │
├─────────────────────────┤
│  Search: [_________] 🔍 │
│  Filter: [All Users ▼]  │
│                         │
│  User Directory         │
│                         │
│  ┌─────────────────┐    │
│  │ John Doe        │    │
│  │ john@email.com  │    │
│  │ Roles:          │    │
│  │ ☑ Poll Creator  │    │
│  │ ☐ System Admin  │    │
│  │ Polls Owned: 3  │    │
│  │ [View Details]  │    │
│  └─────────────────┘    │
│                         │
│  ┌─────────────────┐    │
│  │ Jane Smith      │    │
│  │ jane@email.com  │    │
│  │ Roles:          │    │
│  │ ☐ Poll Creator  │    │
│  │ ☐ System Admin  │    │
│  │ Manager of: 2   │    │
│  │ [View Details]  │    │
│  └─────────────────┘    │
│                         │
└─────────────────────────┘
```

#### User Detail View
```
┌─────────────────────────┐
│  User Details           │
│  [← Back to List]       │
├─────────────────────────┤
│  John Doe               │
│  john@email.com         │
│  Clerk ID: clerk_123    │
│  Joined: 2024-01-15     │
│                         │
│  System Roles           │
│  ☑ Poll Creator         │
│  ☐ System Administrator │
│  [Save Changes]         │
│                         │
│  Poll-Specific Roles    │
│  Owner of (3):          │
│  - Poll Title 1 [Manage]│
│  - Poll Title 2 [Manage]│
│  - Poll Title 3 [Manage]│
│                         │
│  Manager for (2):       │
│  - Poll Title 4 [Manage]│
│  - Poll Title 5 [Manage]│
│                         │
│  Activity Summary       │
│  - Polls created: 3     │
│  - Polls managed: 2     │
│  - Votes cast: 147      │
│  - Statements: 12       │
│                         │
└─────────────────────────┘
```

**Actions Available:**
- **Assign Poll Creator** - Toggle checkbox, user can now create polls
- **Assign System Admin** - Toggle with confirmation, grants full system access
- **Assign to Poll as Manager** - Search and select poll, assign user as manager
- **View Poll** - Click poll links to go to that poll's management interface

---

### 17. Admin View All Statements (Per-Poll Feature)
**Available in:** `/polls/[slug]/manage` (Analytics tab or separate view)
**Access:** Poll Owners, Poll Managers, System Admins

#### Layout
```
┌─────────────────────────┐
│  All Statements View    │
│  (Read-Only Mode)       │
├─────────────────────────┤
│  Poll Question Here     │
│                         │
│  ℹ️ Viewing all         │
│  statements without     │
│  voting. To vote, use   │
│  "Vote as Participant"  │
│                         │
│  ┌─────────────────┐    │
│  │ Statement 1     │    │
│  │                 │    │
│  │ Agree: 65% ████ │    │
│  │ Disagree: 25% ██│    │
│  │ Unsure: 10% █   │    │
│  │ Total: 234 votes│    │
│  └─────────────────┘    │
│                         │
│  ┌─────────────────┐    │
│  │ Statement 2     │    │
│  │ (vote dist...)  │    │
│  └─────────────────┘    │
│                         │
│  [Back to Management]   │
│  [Vote as Participant]  │
│                         │
└─────────────────────────┘
```

**Purpose:**
- Owners/Managers/Admins can view ALL statements with distributions
- WITHOUT casting votes (read-only view)
- Understand poll dynamics without influencing results
- Separate from normal voting interface

**Note:** Can vote separately using "Vote as Participant" which opens standard card-based voting interface.

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
   - Desktop navigation:
     - Polls (always visible)
     - Create Poll (visible to Poll Creators, Poll Managers, System Admins only)
     - Admin Dashboard (visible to System Admins only)
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

**Card Design System:** All cards use consistent 2:3 aspect ratio with color-coded gradients.

- **PollDeckCard** (`components/polls/poll-deck-card.tsx`) - Poll listing page
  - 2:3 aspect ratio vertical card
  - Large emoji at top (text-6xl) from poll.emoji field
  - 3-layer stacked depth effect (2 shadow layers)
  - Status badge top-right (Active/Closed)
  - Poll question centered (line-clamp-5)
  - Decorative element bottom (✦ active, ◆ closed)
  - CLOSED ribbon for closed polls (diagonal semi-transparent)
  - Amber gradient for active, gray for closed
  - Hover: scale 1.05, lift -5px, enhanced shadow
  - Props: `slug`, `question`, `status`

- **StatementCard** (`components/voting/statement-card.tsx`) - Voting interface
  - 2:3 aspect ratio card
  - Amber gradient background
  - Stacked depth effect
  - Statement text centered (max 140 chars)
  - Agree/Disagree buttons ON card
  - Pass/Unsure button BELOW card
  - Decorative ✦ symbols top and bottom
  - Props: `statement`, `onVote`, button labels

- **VoteResultOverlay** (`components/voting/vote-result-overlay.tsx`) - Post-vote results
  - Same 2:3 aspect ratio as statement card
  - 3D card flip animation (600ms, Y-axis rotation)
  - Amber gradient background (matches voting flow)
  - User's vote indicator with icon
  - Animated vote distribution bars (staggered 500ms fills)
  - Clickable to advance to next card
  - Next button for manual advance
  - Props: `statement`, `userVote`, percentages, `totalVotes`, `onNext`

- **InsightCard** (`components/shared/insight-card.tsx`) - Personal insights
  - 2:3 aspect ratio card (max-w-xs)
  - **Indigo/violet animated gradient** (8s cycle: #ddd6fe → #e0e7ff → #dbeafe)
  - Large emoji hero (text-5xl) extracted from title via regex
  - Spin-in animation (scale 0 → 1, rotate -180° → 0°)
  - "Personal Insight" badge (indigo-100/700)
  - Title without emoji (text-base md:text-lg)
  - Scrollable body (max-h-[180px])
  - Bottom metadata section: poll question + date
  - Props: `title`, `body`, `pollQuestion`

- **ResultsCard** (`components/shared/results-card.tsx`) - Poll results summary
  - 2:3 aspect ratio card (max-w-xs)
  - **Emerald/teal animated gradient** (8s cycle: #d1fae5 → #dbeafe)
  - "Poll Results" badge (emerald-100/700)
  - Stats display (Users icon + count, Vote icon + count)
  - Scrollable summary text (max-h-[220px])
  - Bottom metadata section: poll question + date
  - Props: `pollQuestion`, `summaryText`, `participantCount`, `voteCount`, `generatedAt`

- **ContinuationPage** (`components/voting/continuation-page.tsx`) - Progress milestone
  - Achievement card (max-w-md, not 2:3 ratio)
  - Amber gradient matching voting flow
  - Trophy icon with spin animation
  - Two scenarios: "Progress Milestone!" vs "Deck Complete!"
  - White inset tally card (Keep/Throw/Unsure with icons)
  - Compact sizing (p-6, text-2xl title, h-10 w-10 trophy)
  - Props: `statementsVoted`, vote counts, `hasMoreStatements`, action handlers

- **Stat Card** (analytics)
- **Welcome Back Banner** (poll entry page)
  - File: `components/polls/welcome-back-banner.tsx`
  - Three variants: in-progress, threshold-reached, completed
  - Blue color scheme
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
- **Poll Deck Grid:** 2-column grid (grid-cols-2)
- **Insights/Results:** Stacked cards vertically
- **Closed Poll Page:** Stacked InsightCard + ResultsCard
- **Modals:** Full screen on small devices
- **Forms:** Full width inputs
- **Admin Tables:** Horizontal scroll or stacked view

### Tablet (768px - 1023px)
- **Navigation:** Visible menu bar
- **Voting Interface:** Slightly larger cards, same flow
- **Poll Deck Grid:** 3-column grid (md:grid-cols-3)
- **Insights/Results:** Single centered card
- **Closed Poll Page:** Stacked cards (not side-by-side yet)
- **Modals:** Centered, max-width 600px
- **Forms:** Optimized spacing
- **Admin Tables:** Full table view

### Desktop (1024px+)
- **Navigation:** Full menu bar with dropdowns
- **Voting Interface:** Centered card, max-width 500px
- **Poll Deck Grid:** 4-column grid (lg:grid-cols-4)
- **Insights/Results:** Single centered card
- **Closed Poll Page:** Side-by-side InsightCard + ResultsCard (lg:flex-row)
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

**A. Card Flip (Vote → Results):**
- 3D rotation on Y-axis: 0° → 180°
- Duration: 600ms
- Easing: ease-in-out
- Front (statement) hidden after 90°
- Back (results) appears from 90° → 180°
- Same amber gradient on both sides
- Perspective: 1000px on parent container

**B. Results Reveal (After Flip):**
- Vote indicator: Scale 0.8 → 1.0 + Fade in, 300ms, delay 100ms
- Bar 1 (Agree): Fill 0% → X%, 500ms, delay 300ms
- Bar 2 (Disagree): Fill 0% → Y%, 500ms, delay 500ms
- Bar 3 (Unsure): Fill 0% → Z%, 500ms, delay 700ms
- Next button: Fade in, 300ms, delay 1200ms
- Easing: ease-out for all

**C. Card-to-Card Transition (Results → Next Statement):**
- **Results card exit:**
  - Slide left: translateX(-400px)
  - Fade out: opacity 0
  - Duration: 400ms
  - Easing: ease-in-out
- **Next statement card enter:**
  - Slide in from right: translateX(400px → 0)
  - Scale: 0.95 → 1.0 (depth effect)
  - Fade in: opacity 0 → 1
  - Duration: 400ms
  - Easing: ease-in-out
- **Buttons transition separately:**
  - Vote buttons: Fade only (300ms), no slide
  - Pass button: Fade only (300ms), no slide
  - Next button: Fade out (300ms) on exit
  - Keeps UI stable during card transition

#### 3. Card Deck Package (Poll Entry Page)
- **Initial Load:**
  - Scale: 0.95 → 1.0
  - Fade in: opacity 0 → 1
  - Duration: 500ms
  - Easing: ease-out

- **Hover Effect:**
  - Scale: 1.0 → 1.02
  - Lift: translateY(0 → -4px)
  - Shadow: xl → 2xl
  - Duration: 300ms
  - Easing: ease-out
  - Cursor: pointer

- **Click Feedback:**
  - Brief scale down to 0.98
  - Duration: 100ms
  - Then navigate to target route

#### 4. Progress Bar
- **Segment Fill:**
  - Width transition: 300ms
  - Easing: ease-in-out

- **Current Segment Pulse:**
  - Opacity: 1 → 0.5 → 1
  - Duration: 1500ms
  - Loop: infinite

#### 5. Modal Animations
- **Open:**
  - Overlay fade in: 200ms
  - Modal scale: 0.9 → 1.0, 250ms
  - Easing: ease-out

- **Close:**
  - Modal scale: 1.0 → 0.9, 200ms
  - Overlay fade out: 200ms
  - Easing: ease-in

#### 6. Poll Deck Card (Listing Page)
- **Hover Effect:**
  - Scale: 1.0 → 1.05
  - Lift: translateY(0 → -5px)
  - Shadow: enhanced
  - Duration: 200ms
  - Easing: ease-out

#### 7. Insight & Results Cards
- **Animated Shimmer Gradient:**
  - InsightCard: Cycles indigo/violet colors (#ddd6fe → #e0e7ff → #dbeafe and back)
  - ResultsCard: Cycles emerald/teal colors (#d1fae5 → #dbeafe and back)
  - Duration: 8 seconds
  - Loop: infinite
  - Smooth transitions between color stops

- **Emoji Hero Animation (InsightCard):**
  - Initial: scale(0), rotate(-180deg)
  - Animate to: scale(1), rotate(0deg)
  - Duration: 500ms
  - Easing: spring-like bounce
  - Triggered on card mount

#### 8. Continuation Page (Achievement)
- **Trophy Icon Animation:**
  - Initial: scale(0), rotate(-180deg)
  - Animate to: scale(1), rotate(0deg)
  - Delay: 200ms after mount
  - Transition: spring with stiffness 200
  - Creates celebratory spin-in effect

- **Card Entrance:**
  - Initial: scale(0.9), opacity(0)
  - Animate to: scale(1), opacity(1)
  - Duration: 400ms
  - Easing: ease-out

#### 9. Loading States
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
