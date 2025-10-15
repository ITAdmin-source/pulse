# 📋 UX Redesign Migration Plan

**Version:** 1.0
**Date:** 2025-10-15
**Approach:** Pure Mockup Implementation (Option A)
**Duration:** 4 weeks estimated

---

## Table of Contents

1. [Migration Overview](#migration-overview)
2. [Pre-Implementation Checklist](#pre-implementation-checklist)
3. [File-by-File Migration Map](#file-by-file-migration-map)
4. [Phase 1: Foundation & Routing](#phase-1-foundation--routing-week-1)
5. [Phase 2: Voting Interface](#phase-2-voting-interface-week-2)
6. [Phase 3: Results & Demographics](#phase-3-results--demographics-week-3)
7. [Phase 4: Polish & Edge Cases](#phase-4-polish--edge-cases-week-4)
8. [Testing Strategy](#testing-strategy)
9. [Rollback Plan](#rollback-plan)

---

## Migration Overview

### Strategic Approach

**Method:** Parallel development with clean cutover
- Keep admin/manager interfaces completely untouched
- Build new voting UX components alongside old ones
- Single cutover point (swap routes when complete)
- Easy rollback if needed

### Success Metrics

- [ ] All voting user pages use mockup design system
- [ ] Single-page architecture with tabs functional
- [ ] All Hebrew strings implemented with correct terminology
- [ ] Demographics modal appears after 10 votes (not before)
- [ ] Admin/manager interfaces unchanged and functional
- [ ] All existing business logic preserved
- [ ] Zero database schema changes

---

## Pre-Implementation Checklist

### Before Starting Phase 1

- [ ] **Backup current branch** - Create backup of `ux-redesign` branch
- [ ] **Create Hebrew strings file** - `lib/strings/he.ts` with all terminology
- [ ] **Create design tokens v2** - `lib/design-tokens-v2.ts` with mockup styles
- [ ] **Update CLAUDE.md** - Document new terminology and architecture
- [ ] **Create test polls** - At least 3 test polls with different states:
  - New poll (0 votes)
  - In-progress poll (5 votes)
  - Completed poll (20+ votes)
  - Closed poll

### Environment Setup

```bash
# Already on ux-redesign branch
git status

# Ensure dependencies are up to date
npm install

# Test current build
npm run build

# Start dev server for testing
npm run dev
```

---

## File-by-File Migration Map

### 🗑️ Files to DELETE

These files are card-deck specific and no longer needed:

```
❌ DELETE:
components/voting/
  - continuation-page.tsx (replaced with inline prompt)

components/polls/
  - clickable-card-deck.tsx (no entry page)
  - card-deck-package.tsx (no entry page)
  - poll-deck-card.tsx (replaced with gradient card)
  - mini-deck-stack.tsx (card deck visual)

components/shared/
  - fanned-deck-header.tsx (card deck visual)
  - deck-stats.tsx (if card-specific)

app/polls/[slug]/
  - page.tsx (entry page - will be replaced)
  - vote/page.tsx (merge into main poll page)
  - insights/page.tsx (merge into results view)
  - closed/page.tsx (merge into results view)
```

### ✨ Files to CREATE

New components for mockup design:

```
✅ CREATE:

lib/
  - strings/he.ts (Hebrew terminology)
  - design-tokens-v2.ts (new design system)

components/voting-v2/
  - split-vote-card.tsx (main voting interface)
  - progress-segments.tsx (Stories-style progress)
  - question-pill.tsx (blue gradient poll question)
  - vote-stats-overlay.tsx (percentage on buttons)

components/polls-v2/
  - poll-card-gradient.tsx (purple-to-pink header)
  - tab-navigation.tsx (Vote/Results tabs)
  - next-batch-prompt.tsx (inline after 10 votes)
  - completion-card.tsx (finished message)

components/banners/
  - closed-poll-banner.tsx (yellow closure notice)
  - partial-participation-banner.tsx (voted X of Y)
  - signup-banner.tsx (dismissible home banner)

components/modals/
  - why-we-ask-modal.tsx (demographics explanation)
  - post-poll-prompt.tsx (auth modal after first poll)

components/results-v2/
  - results-view.tsx (complete results layout)
  - stats-grid.tsx (3 cards: participants, positions, votes)
  - consensus-section.tsx (high agreement positions)
  - all-positions-section.tsx (full list with bars)

app/polls/[slug]/
  - page.tsx (NEW - combined Vote + Results views with tabs)
```

### 🔧 Files to UPDATE

Existing files that need styling/logic updates:

```
🔧 UPDATE:

components/shared/
  - adaptive-header.tsx (simplify to Back + Title + Sign Up)
  - insight-card.tsx (gradient design from mockup)
  - poll-stats-card.tsx (update styling to match mockup)
  - results-dashboard.tsx (keep for heatmap, update styling)

components/polls/
  - demographics-modal.tsx (update styling, keep logic)
  - statement-submission-modal.tsx (update styling, keep logic)
  - poll-filters.tsx (update styling)

components/voting/
  - statement-card.tsx (REPLACE or create new split-vote-card)
  - progress-bar.tsx (update styling to thinner segments)
  - statement-submission-modal.tsx (update styling)

app/
  - page.tsx (keep redirect, no changes)
  - polls/page.tsx (update to use new poll cards & styling)
  - (auth)/login/[[...login]]/page.tsx (update styling)
  - (auth)/signup/[[...signup]]/page.tsx (update styling)

lib/
  - design-tokens.ts (keep for admin/manager, or merge into v2)
```

### 📦 Files to PRESERVE (No Changes)

Admin/manager interfaces and infrastructure:

```
✅ PRESERVE (NO CHANGES):

app/admin/
  - ** (all admin pages)

app/polls/
  - create/page.tsx (poll creation)
  - [slug]/manage/page.tsx (poll management)

components/admin/
  - ** (all admin components)

lib/services/
  - ** (all services - user, poll, voting, statement, AI)

actions/
  - ** (all server actions)

db/
  - ** (all database files)

lib/validations/
  - ** (all Zod schemas)

contexts/
  - user-context.tsx (preserve logic)
  - header-context.tsx (may deprecate if not needed)

hooks/
  - ** (all hooks)
```

---

## Phase 1: Foundation & Routing (Week 1)

### Goals
- New design tokens created
- Hebrew strings file created
- Single-page architecture implemented
- Tab navigation functional
- Basic routing logic working

### Tasks Breakdown

#### 1.1 Create Hebrew Strings File

**File:** `lib/strings/he.ts`

**Action:** Create new file with all approved terminology

**Estimated Time:** 1 hour

**Testing:** Import and verify all strings compile

```bash
# Test
npm run build
# Should compile without errors
```

---

#### 1.2 Create Design Tokens v2

**File:** `lib/design-tokens-v2.ts`

**Action:** Create new file with mockup color system

**Estimated Time:** 2 hours

**Details:** See "Design Tokens v2" section below (next deliverable)

---

#### 1.3 Update Polls List Page

**File:** `app/polls/page.tsx`

**Actions:**
- Update background to dark gradient
- Import Hebrew strings
- Update filter/search styling
- Keep all logic unchanged

**Estimated Time:** 3 hours

**Changes:**
```tsx
// OLD
<div className="min-h-screen bg-gradient-to-br from-stone-100 via-stone-50 to-stone-100">

// NEW
<div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
```

**Testing:**
- [ ] Page loads with dark background
- [ ] Filters work (active/closed/all)
- [ ] Search works
- [ ] Sort dropdown works
- [ ] Poll cards load (will update cards next)

---

#### 1.4 Create New Poll Card Component

**File:** `components/polls-v2/poll-card-gradient.tsx`

**Action:** Build gradient header poll card from mockup

**Estimated Time:** 4 hours

**Dependencies:** Design tokens v2, Hebrew strings

**Component Structure:**
```tsx
export function PollCardGradient({
  slug,
  title,
  description,
  emoji,
  isClosed,
  participants,
  positionCount,
  userVotedCount,
}: PollCardGradientProps) {
  // Gradient header card with purple-to-pink header
  // White body with stats
  // Adaptive CTA based on state
}
```

**Testing:**
- [ ] Card renders with gradient header
- [ ] Closed badge shows correctly
- [ ] Stats display correctly
- [ ] Click navigates to poll page
- [ ] Hover animation works
- [ ] RTL text renders correctly

---

#### 1.5 Replace Poll Cards in List

**File:** `app/polls/page.tsx`

**Action:** Replace `PollDeckCard` with `PollCardGradient`

**Estimated Time:** 1 hour

**Changes:**
```tsx
// OLD
import { PollDeckCard } from "@/components/polls/poll-deck-card";

// NEW
import { PollCardGradient } from "@/components/polls-v2/poll-card-gradient";

// In render:
{filteredPolls.map((poll) => (
  <PollCardGradient
    key={poll.id}
    slug={poll.slug}
    title={poll.question}
    // ... rest of props
  />
))}
```

**Testing:**
- [ ] Polls list shows new gradient cards
- [ ] Grid layout works on all screen sizes
- [ ] All poll states render correctly (active/closed)

---

#### 1.6 Create Combined Poll Page

**File:** `app/polls/[slug]/page.tsx` (REPLACE existing)

**Action:** Build single-page architecture with Vote/Results views

**Estimated Time:** 8 hours (complex)

**Component Structure:**
```tsx
export default async function PollPage({ params }: PollPageProps) {
  const { slug } = await params;

  // Fetch poll data
  const poll = await getPollBySlugAction(slug);

  // Fetch user progress
  const user = await getCurrentUser();
  const progress = await getVotingProgressAction(poll.id, user.id);

  // Determine initial view
  const initialView = determineInitialView(poll, progress);

  return (
    <PollPageClient
      poll={poll}
      initialView={initialView}
      userProgress={progress}
    />
  );
}
```

**Client Component:**
```tsx
'use client';

export function PollPageClient({ poll, initialView, userProgress }) {
  const [activeView, setActiveView] = useState<'vote' | 'results'>(initialView);
  const [votedCount, setVotedCount] = useState(userProgress.totalVoted);

  const canSeeResults = votedCount >= 10;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Tabs (if poll is open) */}
      {!poll.isClosed && (
        <TabNavigation
          activeView={activeView}
          onChangeView={setActiveView}
          votedCount={votedCount}
          canSeeResults={canSeeResults}
        />
      )}

      {/* Views */}
      {activeView === 'vote' && (
        <VoteView
          poll={poll}
          onVoteRecorded={() => setVotedCount(c => c + 1)}
        />
      )}

      {activeView === 'results' && (
        <ResultsView poll={poll} />
      )}
    </div>
  );
}
```

**Testing:**
- [ ] Page loads with correct initial view
- [ ] Tabs show/hide based on poll state
- [ ] Results tab locks until 10 votes
- [ ] View switching works without page reload
- [ ] Back button works
- [ ] Sign Up button shows in header

---

#### 1.7 Create Tab Navigation Component

**File:** `components/polls-v2/tab-navigation.tsx`

**Action:** Build Vote/Results tab switcher

**Estimated Time:** 3 hours

**Component:**
```tsx
export function TabNavigation({
  activeView,
  onChangeView,
  votedCount,
  canSeeResults,
}: TabNavigationProps) {
  return (
    <div className="flex gap-2 p-4 max-w-md mx-auto">
      <button
        onClick={() => onChangeView('vote')}
        className={cn(
          'flex-1 py-3 rounded-lg font-semibold',
          activeView === 'vote'
            ? 'bg-white text-purple-900'
            : 'bg-white/10 text-white'
        )}
      >
        <MessageSquare className="inline me-2" />
        {strings.pollPage.tabVote}
      </button>

      <button
        onClick={() => canSeeResults && onChangeView('results')}
        disabled={!canSeeResults}
        className={cn(
          'flex-1 py-3 rounded-lg font-semibold',
          activeView === 'results'
            ? 'bg-white text-purple-900'
            : canSeeResults
              ? 'bg-white/10 text-white'
              : 'bg-white/5 text-white/40 cursor-not-allowed'
        )}
      >
        <TrendingUp className="inline me-2" />
        {canSeeResults
          ? strings.pollPage.tabResults
          : strings.pollPage.tabResultsLocked(votedCount, 10)
        }
      </button>
    </div>
  );
}
```

**Testing:**
- [ ] Tabs render correctly
- [ ] Active tab highlights
- [ ] Results tab disabled when <10 votes
- [ ] Counter shows "(7/10)" when locked
- [ ] Click switches view
- [ ] RTL layout correct

---

#### 1.8 Delete Old Pages

**Files to Delete:**
```
app/polls/[slug]/vote/page.tsx
app/polls/[slug]/insights/page.tsx
app/polls/[slug]/closed/page.tsx
```

**Action:** Remove old routes (logic moved to combined page)

**Estimated Time:** 30 minutes

**Verification:**
```bash
# Test that old routes 404
curl http://localhost:3000/polls/test-slug/vote
# Should redirect or 404

# New route should work
curl http://localhost:3000/polls/test-slug
# Should load combined page
```

---

### Phase 1 Completion Checklist

- [ ] Hebrew strings file created and imported
- [ ] Design tokens v2 created
- [ ] Polls list page updated with dark gradient
- [ ] New gradient poll cards working
- [ ] Combined poll page functional
- [ ] Tab navigation working
- [ ] Results tab locks at <10 votes
- [ ] Old pages deleted
- [ ] All tests passing
- [ ] Build compiles without errors

**Estimated Total Time:** ~22 hours (3-4 days)

---

## Phase 2: Voting Interface (Week 2)

### Goals
- Split-screen voting card implemented
- Progress bar updated
- Poll question pill created
- Vote flow functional (vote → stats → next)
- Pass and Add Position buttons working

### Tasks Breakdown

#### 2.1 Create Question Pill Component

**File:** `components/voting-v2/question-pill.tsx`

**Action:** Blue gradient pill for poll question

**Estimated Time:** 2 hours

**Component:**
```tsx
export function QuestionPill({ question }: QuestionPillProps) {
  return (
    <div className="max-w-2xl mx-auto mb-6 px-4">
      <div className="bg-gradient-to-r from-blue-600 to-blue-500 rounded-xl px-6 py-4 shadow-lg">
        <p className="text-white text-center text-lg font-medium" dir="auto">
          {question}
        </p>
      </div>
    </div>
  );
}
```

**Testing:**
- [ ] Pill renders with gradient
- [ ] Text centers correctly
- [ ] RTL text works
- [ ] Responsive on mobile

---

#### 2.2 Create Progress Segments Component

**File:** `components/voting-v2/progress-segments.tsx`

**Action:** Stories-style progress bar (thinner, h-1)

**Estimated Time:** 3 hours

**Component:**
```tsx
export function ProgressSegments({
  totalSegments,
  currentSegment,
  showingResults,
}: ProgressSegmentsProps) {
  return (
    <div className="flex gap-1 w-full max-w-2xl mx-auto px-4 mb-4">
      {Array.from({ length: totalSegments }).map((_, index) => (
        <div
          key={index}
          className={cn(
            'h-1 flex-1 rounded-full transition-all duration-300',
            index < currentSegment
              ? 'bg-purple-500' // Completed
              : index === currentSegment
                ? showingResults
                  ? 'bg-purple-400' // Current (showing results)
                  : 'bg-purple-300 animate-pulse' // Current (voting)
                : 'bg-white/20' // Upcoming
          )}
        />
      ))}
    </div>
  );
}
```

**Testing:**
- [ ] Segments render correctly
- [ ] Current segment pulses during voting
- [ ] Completed segments show as filled
- [ ] Smooth transitions
- [ ] Responsive width

---

#### 2.3 Create Split Vote Card Component

**File:** `components/voting-v2/split-vote-card.tsx`

**Action:** Main voting interface with 50/50 split buttons

**Estimated Time:** 8 hours (complex, main component)

**Testing:**
- [ ] Card renders with statement
- [ ] Split buttons work (50/50)
- [ ] Hover effect expands button (flex-[1.2])
- [ ] Click records vote
- [ ] Stats appear on buttons after vote
- [ ] Animation smooth (scale, pulse)
- [ ] Pass button works
- [ ] Add Position button shows when enabled
- [ ] RTL layout correct
- [ ] Mobile responsive (buttons stack?)

---

#### 2.4 Create Vote View Container

**File:** `components/voting-v2/vote-view.tsx`

**Action:** Container for voting interface with state management

**Estimated Time:** 6 hours

**Testing:**
- [ ] Statements load correctly
- [ ] Vote records in database
- [ ] Stats fetch and display on buttons
- [ ] 1-second delay works
- [ ] Auto-advances to next statement
- [ ] Progress bar updates
- [ ] Batch completion detected
- [ ] Add Position modal opens

---

#### 2.5 Update Statement Submission Modal

**File:** `components/polls/statement-submission-modal.tsx`

**Action:** Update styling to match mockup (keep logic)

**Estimated Time:** 2 hours

**Changes:**
- Purple accent colors (was amber)
- Updated button styles
- Hebrew strings from new file

**Testing:**
- [ ] Modal opens
- [ ] Form validation works
- [ ] Submit sends to database
- [ ] Success message shows
- [ ] Auto-approval flow works (if enabled)

---

### Phase 2 Completion Checklist

- [ ] Question pill component created
- [ ] Progress segments updated to thin style
- [ ] Split vote card fully functional
- [ ] Vote → stats → next flow works smoothly
- [ ] Pass button records neutral vote
- [ ] Add Position modal updated
- [ ] All animations smooth
- [ ] RTL layout correct throughout
- [ ] Mobile responsive
- [ ] Build compiles without errors

**Estimated Total Time:** ~21 hours (3-4 days)

---

## Phase 3: Results & Demographics (Week 3)

### Goals
- Demographics modal updated and repositioned (after 10 votes)
- Personal insight card with gradient design
- Results view layout complete
- Next batch prompt working
- Completion card implemented

### Tasks Breakdown

#### 3.1 Update Demographics Modal Trigger

**Files:**
- `app/polls/[slug]/page.tsx` (client component)
- `components/polls/demographics-modal.tsx`

**Action:** Move demographics check from before first vote to after 10th vote

**Estimated Time:** 3 hours

**Testing:**
- [ ] Demographics doesn't show before first vote
- [ ] Demographics shows after exactly 10th vote
- [ ] Modal blocks progression to results
- [ ] Submit unlocks results view
- [ ] If demographics already exist, skips to results immediately

---

#### 3.2 Update Demographics Modal Styling

**File:** `components/polls/demographics-modal.tsx`

**Action:** Update to purple theme, add "Why We Ask" link

**Estimated Time:** 3 hours

**Changes:**
- Title: "לפני צפייה בתוצאות" (Before Viewing Results)
- Purple accent colors (was amber)
- Add "למה אנחנו שואלים?" link → opens WhyWeAskModal
- Submit button: "צפו בתוצאות שלי" (See My Results)
- Update privacy note text

**Testing:**
- [ ] Modal shows with new title
- [ ] All 4 fields required
- [ ] "Why We Ask" link opens modal
- [ ] Submit button enables when all fields complete
- [ ] Submit saves to database
- [ ] Modal closes and unlocks results

---

#### 3.3 Create Why We Ask Modal

**File:** `components/modals/why-we-ask-modal.tsx`

**Action:** Create explanation modal for demographics

**Estimated Time:** 2 hours

**Testing:**
- [ ] Opens from demographics modal
- [ ] Text displays correctly
- [ ] Close button works
- [ ] Returns to demographics modal

---

#### 3.4 Update Insight Card Component

**File:** `components/shared/insight-card.tsx`

**Action:** Redesign with gradient background from mockup

**Estimated Time:** 4 hours

**Testing:**
- [ ] Gradient renders correctly
- [ ] Decorative circles show
- [ ] Content readable on gradient
- [ ] Share button works
- [ ] Sign up link shows for anonymous users
- [ ] Responsive on mobile

---

#### 3.5 Create Next Batch Prompt Component

**File:** `components/polls-v2/next-batch-prompt.tsx`

**Action:** Inline prompt after completing 10 statements

**Estimated Time:** 3 hours

**Testing:**
- [ ] Shows in results view when more statements available
- [ ] Click loads next batch
- [ ] Switches to vote view
- [ ] Progress resets for new batch

---

#### 3.6 Create Completion Card Component

**File:** `components/polls-v2/completion-card.tsx`

**Action:** Celebration message when all statements voted

**Estimated Time:** 2 hours

**Testing:**
- [ ] Shows when all statements voted
- [ ] Displays correct vote count
- [ ] Share button works

---

#### 3.7 Create Results View Component

**File:** `components/results-v2/results-view.tsx`

**Action:** Complete results layout with all sections

**Estimated Time:** 6 hours

**Testing:**
- [ ] All sections render in correct order
- [ ] Conditional rendering works (banners, prompts)
- [ ] Insight loads for users who voted
- [ ] Stats display correctly
- [ ] Heatmap integrates properly
- [ ] Responsive on all screen sizes

---

#### 3.8 Create Stats Grid, Consensus, All Positions Components

**Files:**
- `components/results-v2/stats-grid.tsx`
- `components/results-v2/consensus-section.tsx`
- `components/results-v2/all-positions-section.tsx`

**Action:** Build results display sections from mockup

**Estimated Time:** 8 hours total (2.5 hours each + integration)

**Testing:**
- [ ] Stats cards show correct numbers
- [ ] Consensus section filters >70% agreement
- [ ] All positions list shows vote bars
- [ ] Vote percentages calculate correctly

---

### Phase 3 Completion Checklist

- [ ] Demographics modal triggers after 10 votes (not before)
- [ ] Demographics modal updated with new styling
- [ ] "Why We Ask" modal created
- [ ] Insight card redesigned with gradient
- [ ] Next batch prompt working
- [ ] Completion card implemented
- [ ] Results view layout complete
- [ ] Stats grid displaying correctly
- [ ] Consensus section working
- [ ] All positions section working
- [ ] Heatmap integrated
- [ ] Build compiles without errors

**Estimated Total Time:** ~31 hours (4-5 days)

---

## Phase 4: Polish & Edge Cases (Week 4)

### Goals
- Auth prompts added (banner, modal, links)
- Closed poll handling
- Simplified header
- Mobile optimization
- Animation polish
- Full testing

### Tasks Breakdown

#### 4.1 Create Sign Up Banner (Home Page)

**File:** `components/banners/signup-banner.tsx`

**Action:** Dismissible banner on polls list page

**Estimated Time:** 2 hours

**Testing:**
- [ ] Shows on polls list for anonymous users
- [ ] Doesn't show for authenticated users
- [ ] Dismiss button works
- [ ] Stays dismissed for session
- [ ] Sign up button navigates to /signup

---

#### 4.2 Create Post-Poll Auth Modal

**File:** `components/modals/post-poll-prompt.tsx`

**Action:** Modal after completing first poll (for anonymous users)

**Estimated Time:** 3 hours

**Testing:**
- [ ] Shows after first poll completion
- [ ] Only for anonymous users
- [ ] Doesn't show again after dismissal
- [ ] Sign up button works
- [ ] Continue as guest works

---

#### 4.3 Create Closed/Partial Poll Banners

**Files:**
- `components/banners/closed-poll-banner.tsx`
- `components/banners/partial-participation-banner.tsx`

**Action:** Yellow/blue banners for closed polls

**Estimated Time:** 3 hours total

**Testing:**
- [ ] Closed banner shows for all users on closed polls
- [ ] Partial banner shows for users who didn't vote on all
- [ ] Colors match mockup (yellow for closed, blue for partial)
- [ ] Dates format correctly in Hebrew

---

#### 4.4 Simplify Adaptive Header

**File:** `components/shared/adaptive-header.tsx`

**Action:** Simplify to Back + Title + Sign Up

**Estimated Time:** 3 hours

**Testing:**
- [ ] Polls list shows app title
- [ ] Poll pages show back button + poll title
- [ ] Sign up button always visible
- [ ] Back button navigates correctly
- [ ] RTL layout correct

---

#### 4.5 Update Auth Pages Styling

**Files:**
- `app/(auth)/login/[[...login]]/page.tsx`
- `app/(auth)/signup/[[...signup]]/page.tsx`

**Action:** Update to dark purple/pink theme

**Estimated Time:** 2 hours

**Testing:**
- [ ] Pages load with dark background
- [ ] Clerk components styled correctly
- [ ] Hebrew text displays
- [ ] Forms work

---

#### 4.6 Mobile Optimization Pass

**Action:** Test and fix all components on mobile (320px-768px)

**Estimated Time:** 6 hours

**Testing Devices:**
- [ ] iPhone SE (375px width)
- [ ] iPhone 12 Pro (390px)
- [ ] Pixel 5 (393px)
- [ ] iPad Mini (768px)

---

#### 4.7 Animation Polish

**Action:** Add smooth transitions throughout

**Estimated Time:** 4 hours

**Testing:**
- [ ] All animations smooth (60fps)
- [ ] No jank on mobile
- [ ] Reduced motion respected (prefers-reduced-motion)

---

#### 4.8 RTL Testing Pass

**Action:** Verify all Hebrew text and RTL layouts

**Estimated Time:** 3 hours

**Checklist:**
- [ ] All text in Hebrew
- [ ] All logical properties used (ms-, me-, start-, end-)
- [ ] No hardcoded left/right
- [ ] Icons face correct direction
- [ ] Tabs ordered right-to-left
- [ ] Voting buttons (Disagree on RIGHT, Agree on LEFT)
- [ ] Progress bars fill right-to-left

---

#### 4.9 Comprehensive Testing

**Action:** Full end-to-end test of all user journeys

**Estimated Time:** 8 hours

**Test Scenarios:**
1. Anonymous user complete journey
2. Authenticated user complete journey
3. Anonymous → Authenticated upgrade
4. Closed poll viewing
5. Poll with <10 statements
6. Poll with 50+ statements (multiple batches)
7. Demographics required flow
8. Demographics already exists flow
9. Add position flow
10. Results sharing

**Testing:**
- [ ] All scenarios pass
- [ ] No console errors
- [ ] Network requests efficient
- [ ] Loading states appropriate
- [ ] Error handling works

---

### Phase 4 Completion Checklist

- [ ] Sign up banner implemented
- [ ] Post-poll modal implemented
- [ ] Closed/partial banners working
- [ ] Header simplified
- [ ] Auth pages updated
- [ ] Mobile fully optimized
- [ ] Animations polished
- [ ] RTL fully tested
- [ ] All user journeys tested
- [ ] Performance acceptable
- [ ] Build compiles without errors
- [ ] No TypeScript errors
- [ ] Lighthouse scores >90

**Estimated Total Time:** ~34 hours (5 days)

---

## Testing Strategy

### Unit Testing
- Test individual components in isolation
- Mock data and actions
- Focus on logic and rendering

### Integration Testing
- Test component interactions
- Test data flow between components
- Test state management

### E2E Testing
- Test complete user journeys
- Use Playwright (already set up)
- Test critical paths

### Visual Regression Testing
- Take screenshots of key pages
- Compare before/after
- Ensure no unintended changes

### Performance Testing
- Lighthouse audits
- Check bundle size
- Measure page load times
- Test on slow 3G

---

## Rollback Plan

### If Major Issues Found

**Quick Rollback (< 1 hour):**
```bash
# Revert to pre-redesign state
git checkout ux-redesign
git reset --hard <commit-before-phase-1>
git push -f origin ux-redesign

# Restart dev server
npm run dev
```

**Partial Rollback:**
- Keep Phase 1-2 (foundation + voting)
- Revert Phase 3-4 if demographics/results broken

### Emergency Hotfixes

Create separate `hotfix/` branch for critical bugs:
```bash
git checkout -b hotfix/critical-bug-description
# Fix bug
git commit
git push
# Create PR to ux-redesign
```

---

## Timeline Summary

| Phase | Focus | Duration | Days |
|-------|-------|----------|------|
| **Phase 1** | Foundation & Routing | ~22 hours | 3-4 days |
| **Phase 2** | Voting Interface | ~21 hours | 3-4 days |
| **Phase 3** | Results & Demographics | ~31 hours | 4-5 days |
| **Phase 4** | Polish & Testing | ~34 hours | 5 days |
| **Total** | Complete Redesign | ~108 hours | **15-18 days** |

**Realistic Timeline:** 4 weeks with buffer for unexpected issues

---

## Success Criteria

### Must Have (P0)
- [ ] All voting pages use mockup design
- [ ] Single-page tabs working
- [ ] Demographics after 10 votes
- [ ] All Hebrew terminology correct
- [ ] Admin/manager unchanged

### Should Have (P1)
- [ ] Auth prompts (banner, modal)
- [ ] Mobile optimized
- [ ] Animations smooth
- [ ] Performance good (Lighthouse >80)

### Nice to Have (P2)
- [ ] Advanced animations
- [ ] Additional polish
- [ ] Extra edge cases handled

---

## 🎯 Migration Plan Complete

This comprehensive migration plan provides:
- ✅ File-by-file breakdown
- ✅ Component-by-component tasks
- ✅ Time estimates for each task
- ✅ Testing checklist for each phase
- ✅ Clear success criteria
- ✅ Rollback strategy
