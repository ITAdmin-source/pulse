# Poll Entry Page - UI States Guide

Visual reference for the 4 adaptive states implemented in Phase 1.

---

## State A: New User 🆕

**Condition:** No database user OR votedCount = 0

```
┌─────────────────────────────────────────┐
│                                         │
│     What is your opinion on X?          │
│     ══════════════════════════          │
│                                         │
│     This is a description of the poll   │
│                                         │
│         ┌──────────────────┐            │
│         │  Start Voting    │            │
│         └──────────────────┘            │
│                                         │
│  Vote on statements one at a time and   │
│  discover your personalized insights    │
│                                         │
└─────────────────────────────────────────┘
```

**Key Features:**
- No banner
- No progress badge
- Single "Start Voting" button (primary)
- Standard helper text

---

## State B: In Progress 📝

**Condition:** votedCount > 0 AND !thresholdReached

```
┌─────────────────────────────────────────┐
│                                         │
│  ┌────────────────────────────────────┐ │
│  │ ℹ️  Welcome back!                  │ │
│  │ You've voted on 5 of 15 statements│ │
│  │ [5/15 statements]                 │ │
│  └────────────────────────────────────┘ │
│                                         │
│     What is your opinion on X?          │
│     ══════════════════════════          │
│                                         │
│     This is a description of the poll   │
│                                         │
│         ┌─────────────────┐             │
│         │  5/15 Statements│             │
│         └─────────────────┘             │
│                                         │
│         ┌──────────────────┐            │
│         │ Continue Voting  │            │
│         └──────────────────┘            │
│                                         │
│  Vote on 10 more statements to see      │
│  your insights                          │
│                                         │
└─────────────────────────────────────────┘
```

**Key Features:**
- 🔵 Blue welcome banner (in-progress variant)
- Progress badge showing "X/Y Statements"
- "Continue Voting" button (primary)
- Helper text shows remaining votes needed
- Badge uses secondary variant

---

## State C: Threshold Reached ✨

**Condition:** thresholdReached AND votedCount < totalStatements

```
┌─────────────────────────────────────────┐
│                                         │
│  ┌────────────────────────────────────┐ │
│  │ ✨ Your insights are ready!        │ │
│  │ You've voted on 10 statements and │ │
│  │ reached the threshold. View your  │ │
│  │ personalized insights now, or     │ │
│  │ continue voting on the remaining  │ │
│  │ 5 statements.                     │ │
│  └────────────────────────────────────┘ │
│                                         │
│     What is your opinion on X?          │
│     ══════════════════════════          │
│                                         │
│     This is a description of the poll   │
│                                         │
│         ┌─────────────────┐             │
│         │ ✨ Insights Ready│             │
│         └─────────────────┘             │
│                                         │
│         ┌──────────────────────┐        │
│         │ View Your Insights   │        │
│         └──────────────────────┘        │
│                                         │
│         ┌──────────────────────┐        │
│         │ Continue Voting      │ ⬜     │
│         └──────────────────────┘        │
│                                         │
│  You've unlocked your insights!         │
│  Continue voting or view your results   │
│                                         │
└─────────────────────────────────────────┘
```

**Key Features:**
- 🌟 Sparkle banner (threshold-reached variant)
- Badge shows "✨ Insights Ready" (primary variant)
- "View Your Insights" button (primary, larger)
- "Continue Voting" button (secondary/outline, below)
- Two-action layout encourages viewing insights
- Helper text mentions both options

---

## State D: Completed 🎉

**Condition:** votedCount >= totalStatements

```
┌─────────────────────────────────────────┐
│                                         │
│  ┌────────────────────────────────────┐ │
│  │ ✨ Poll completed!                 │ │
│  │ You've voted on all 15 statements.│ │
│  │ View your personalized insights   │ │
│  │ and see how your views compare    │ │
│  │ to others.                        │ │
│  └────────────────────────────────────┘ │
│                                         │
│     What is your opinion on X?          │
│     ══════════════════════════          │
│                                         │
│     This is a description of the poll   │
│                                         │
│         ┌─────────────────┐             │
│         │ ✨ Insights Ready│             │
│         └─────────────────┘             │
│                                         │
│         ┌──────────────────────┐        │
│         │ View Your Insights   │        │
│         └──────────────────────┘        │
│                                         │
│         ┌──────────────────────┐        │
│         │ View Poll Results    │ ⬜     │
│         └──────────────────────┘        │
│                                         │
│  You've completed this poll! View your  │
│  insights and see how others voted      │
│                                         │
└─────────────────────────────────────────┘
```

**Key Features:**
- 🎉 Completion banner (completed variant)
- Badge shows "✨ Insights Ready" (primary variant)
- "View Your Insights" button (primary)
- "View Poll Results" button (secondary/outline, below)
- NO "Continue Voting" option (all statements done)
- Completion-focused helper text

---

## State E: Scheduled Poll ⏰

**Condition:** poll.status !== "published" AND poll.startTime > now

```
┌─────────────────────────────────────────┐
│                                         │
│     Poll Not Yet Active                 │
│     ═══════════════════                 │
│                                         │
│  This poll will be available on         │
│  10/15/2025 at 2:00 PM                  │
│                                         │
│         ┌──────────────────┐            │
│         │ Back to Polls    │            │
│         └──────────────────┘            │
│                                         │
└─────────────────────────────────────────┘
```

**Key Features:**
- No banner
- No voting buttons
- Shows formatted start date/time
- Only "Back to Polls" button
- Prevents premature voting

---

## Banner Component Variants

### In-Progress Variant
```tsx
<WelcomeBackBanner
  votedCount={5}
  totalCount={15}
  variant="in-progress"
/>
```
**Visual:**
- 🔵 Blue border and background (`border-blue-200 bg-blue-50`)
- ℹ️ Info icon
- Title: "Welcome back!"
- Description: "You've voted on 5 of 15 statements so far."
- Badge: "5/15 statements"

### Threshold-Reached Variant
```tsx
<WelcomeBackBanner
  votedCount={10}
  totalCount={15}
  variant="threshold-reached"
/>
```
**Visual:**
- 🔵 Blue border and background (same styling)
- ✨ Sparkles icon
- Title: "Your insights are ready!"
- Description: "You've voted on 10 statements and reached the threshold. View your personalized insights now, or continue voting on the remaining 5 statements."
- No badge (info in description)

### Completed Variant
```tsx
<WelcomeBackBanner
  votedCount={15}
  totalCount={15}
  variant="completed"
/>
```
**Visual:**
- 🔵 Blue border and background (same styling)
- ✨ Sparkles icon
- Title: "Poll completed!"
- Description: "You've voted on all 15 statements. View your personalized insights and see how your views compare to others."
- No badge (completion message)

---

## Button Hierarchy

### Primary Button (Default Variant)
- Used for main action: "Start Voting", "Continue Voting", "View Your Insights"
- Blue background, white text
- Larger size: `size="lg" className="text-lg px-8 py-6 h-auto"`

### Secondary Button (Outline Variant)
- Used for alternative actions: "Continue Voting" (state C), "View Poll Results" (state D)
- White background, blue border, blue text
- Same large size for visual consistency

### Spacing
- Primary button always first
- 12px gap between buttons (`gap-3` = 0.75rem)
- Center-aligned (`items-center`)
- Vertical stack (`flex-col`)

---

## Badge Variants

### Secondary Badge (In Progress)
```tsx
<Badge variant="secondary">
  5/15 Statements
</Badge>
```
- Gray background
- Shows progress fraction
- Indicates more work needed

### Primary Badge (Threshold Reached / Completed)
```tsx
<Badge variant="default">
  ✨ Insights Ready
</Badge>
```
- Blue background
- Sparkle emoji for celebration
- Indicates achievement unlocked

---

## Helper Text Variations

All helper text uses: `text-sm text-gray-500`

| State | Helper Text |
|-------|-------------|
| **New User** | "Vote on statements one at a time and discover your personalized insights" |
| **In Progress** | "Vote on 10 more statements to see your insights" (dynamic count) |
| **Threshold Reached** | "You've unlocked your insights! Continue voting or view your results" |
| **Completed** | "You've completed this poll! View your insights and see how others voted" |

---

## Responsive Behavior

### Mobile (< 768px)
- Poll question: `text-4xl` (smaller than desktop)
- Same button sizes (touch-friendly)
- Banner stacks naturally
- Single column layout maintained

### Desktop (≥ 768px)
- Poll question: `text-5xl` (larger)
- Description: `text-xl` (larger)
- More generous padding
- Same vertical layout (no horizontal button groups)

---

## Color Palette

### Banners
- Background: `bg-blue-50` (light blue)
- Border: `border-blue-200` (medium blue)
- Title: `text-blue-900` (dark blue, high contrast)
- Description: `text-blue-800` (slightly lighter)

### Badges
- **Secondary**: Gray background (default UI component)
- **Primary**: Blue background (default UI component)

### Buttons
- **Primary**: Blue background, white text
- **Outline**: White background, blue border, blue text

### Text
- Poll Question: `text-gray-900` (near black)
- Description: `text-gray-600` (medium gray)
- Helper Text: `text-gray-500` (light gray)

---

## State Transition Flow

```
New User (A)
    ↓ (votes 1+ statements)
In Progress (B)
    ↓ (reaches threshold: 10 votes)
Threshold Reached (C)
    ↓ (votes remaining statements)
Completed (D)
```

**Notes:**
- Users can jump from B → D if poll has < 10 statements
- Users stay in C even if they continue voting (until all done)
- States are persistent across sessions (via database)
- States work for both anonymous and authenticated users

---

## Accessibility Considerations

### Screen Readers
- Banner uses Alert component (ARIA role="alert")
- Badge text is readable ("5 of 15 statements")
- Button labels are descriptive
- Helper text provides context

### Keyboard Navigation
- All buttons are tabbable
- Enter/Space activates buttons
- Focus visible (default button styles)

### Color Contrast
- Banner text: Blue 900 on Blue 50 (high contrast)
- Buttons: Meet WCAG AA standards
- Helper text: Gray 500 readable on white

---

## Implementation Details

### Server-Side Rendering
- Poll page is a **Server Component** (fast initial load)
- User detection happens server-side (no client flicker)
- Progress fetched during SSR (no loading spinner needed)
- Banner is client component (but data is server-provided)

### Performance
- Single database query for progress
- No additional API calls on client
- Static generation where possible
- Efficient SQL with INNER JOIN

### Error Handling
- Failed user detection → Treat as new user (State A)
- Failed progress fetch → Treat as new user (State A)
- Deleted statements → Progress updates automatically (INNER JOIN)
- All errors logged to console for debugging

---

## Testing Each State

### How to Test State A (New User)
1. Open incognito/private browser window
2. Visit `/polls/[slug]`
3. Should see "Start Voting" button

### How to Test State B (In Progress)
1. Start voting (from State A)
2. Vote on 5 statements (below threshold)
3. Close browser
4. Reopen same browser (session persists)
5. Visit `/polls/[slug]` again
6. Should see "Continue Voting" + progress banner

### How to Test State C (Threshold Reached)
1. Continue from State B
2. Vote 5 more statements (total 10)
3. Close browser, reopen
4. Visit `/polls/[slug]`
5. Should see "View Insights" (primary) + "Continue Voting" (secondary)

### How to Test State D (Completed)
1. Continue from State C
2. Vote on all remaining statements
3. Close browser, reopen
4. Visit `/polls/[slug]`
5. Should see "View Insights" + "View Results" (no Continue)

### How to Test State E (Scheduled)
1. Create poll with future `startTime`
2. Keep status as "draft" (not "published")
3. Visit `/polls/[slug]`
4. Should see "Poll Not Yet Active" message

---

## Edge Cases Handled

1. **Poll with < 10 statements**
   - Threshold = total statements (not 10)
   - State B → State D transition (skip State C)

2. **Poll with exactly 10 statements**
   - Threshold = 10 (all statements)
   - States B and C don't exist (A → D)

3. **User with no session/auth**
   - Always shows State A (new user)
   - Safe fallback behavior

4. **Database error during progress fetch**
   - Logs error to console
   - Shows State A (new user)
   - User can still vote (no blocking error)

5. **Admin deletes statements**
   - Progress recalculates automatically
   - User may drop from State C to State B
   - Vote count decreases transparently

---

**Document Version:** 1.0
**Last Updated:** 2025-10-05
**Related Files:**
- `app/polls/[slug]/page.tsx`
- `components/polls/welcome-back-banner.tsx`
- `PHASE_1_IMPLEMENTATION_SUMMARY.md`
