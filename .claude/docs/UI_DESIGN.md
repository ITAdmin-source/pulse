# UI Design System

Complete UI/UX design system documentation for Pulse platform (v2.0 - Production).

## Design Philosophy

**Dark purple gradient background with vibrant accents and white content cards for modern, social-first aesthetic.**

### Core Principles

1. **Mobile-first** - Responsive design with RTL support
2. **Statement-based voting** - Direct voting on positions
3. **Gamification** - Milestone-based encouragement
4. **Accessibility** - WCAG compliant, keyboard navigation
5. **Performance** - Smooth animations, optimized rendering
6. **Hebrew-first** - RTL layout with logical properties

## Design Tokens (`lib/design-tokens-v2.ts`)

Centralized design system with color palette, spacing, typography, and animation constants.

### Color System

#### Background Colors
```css
/* Universal page background */
bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900

/* Applied to all voting pages */
```

#### Card Colors
```css
/* Content cards */
bg-white rounded-2xl shadow-xl

/* Card headers (gradient) */
from-purple-600 to-pink-600

/* Gray header variant */
bg-gray-50 border-b-4 border-purple-200
```

#### Voting Colors (Flat - NO Gradients)
```css
/* Agree button */
bg-green-500 hover:bg-green-600

/* Disagree button */
bg-red-500 hover:bg-red-600

/* Pass/Skip button */
bg-gray-100 hover:bg-gray-200

/* Primary action */
bg-purple-600 hover:bg-purple-700

/* Secondary action */
border-gray-200 hover:bg-gray-50
```

#### Text Colors
```css
/* On white cards */
text-gray-900    /* Primary */
text-gray-600    /* Secondary */

/* On dark backgrounds */
text-white       /* Inverse */
text-white/60    /* Secondary inverse */

/* On gradient cards */
text-white       /* Always white */
```

### Spacing System

**8px base unit maintained:**
- `gap-1` = 4px (0.5 unit)
- `gap-2` = 8px (1 unit)
- `gap-3` = 12px (1.5 units)
- `gap-4` = 16px (2 units)
- `gap-6` = 24px (3 units)
- `gap-8` = 32px (4 units)
- `gap-10` = 40px (5 units)
- `gap-12` = 48px (6 units)

### Typography Scale

**Responsive Tailwind classes:**

```typescript
// Hero text
text-2xl sm:text-4xl font-bold

// Statement text
text-lg sm:text-xl font-medium

// Voting buttons
text-xl sm:text-2xl font-bold

// Regular buttons
text-sm sm:text-base font-semibold

// Body text
text-sm sm:text-base

// Small text
text-xs sm:text-sm
```

### Border Radius

```css
rounded-xl     /* 12px - Small elements */
rounded-2xl    /* 16px - Cards (standard) */
rounded-3xl    /* 24px - Large cards */
rounded-full   /* Circular elements */
```

### Shadows

```css
shadow-lg      /* Small elevation */
shadow-xl      /* Card standard */
shadow-2xl     /* High elevation */
```

### Animation Timings

**Framer Motion variants for all transitions:**

```typescript
// Quick interactions
duration: 0.2

// Standard transitions
duration: 0.3

// Emphasis animations
duration: 0.5

// Page transitions
duration: 0.4
```

## Component Patterns (v2.0)

### Poll Cards (Gradient Header)

**Location:** `components/polls-v2/poll-card-gradient.tsx`

```tsx
<div className="bg-white rounded-2xl shadow-xl overflow-hidden">
  {/* Gradient header */}
  <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6">
    <h3 className="text-white text-xl font-bold">
      {poll.emoji} {poll.title}
    </h3>
  </div>

  {/* White body */}
  <div className="p-6">
    <p className="text-gray-600">{poll.description}</p>
  </div>
</div>
```

**Styling:**
- Header: `from-purple-600 to-pink-600`
- Body: Simple white `bg-white`
- Border radius: `rounded-2xl`
- Shadow: `shadow-xl` with `hover:shadow-2xl`
- No aspect ratio constraint (flexible height)

### Split Vote Card

**Location:** `components/voting-v2/split-vote-card.tsx`

**Key Features:**
- 50/50 split voting buttons (full height)
- Hover expansion (60/40 ratio)
- Stats appear ON buttons after vote
- RTL-aware layout

```tsx
<div className="bg-white rounded-2xl overflow-hidden">
  {/* Gray header */}
  <div className="bg-gray-50 border-b-4 border-purple-200 p-4">
    <p className="text-gray-900 font-medium">{statement}</p>
  </div>

  {/* 50/50 split buttons */}
  <div className="flex h-32">
    <button className="flex-1 bg-red-500 hover:flex-[1.2]">
      לא מסכים/ה
    </button>
    <button className="flex-1 bg-green-500 hover:flex-[1.2]">
      מסכים/ה
    </button>
  </div>
</div>
```

**Styling:**
- White card: `bg-white rounded-2xl`
- Gray header: `bg-gray-50 border-b-4 border-purple-200`
- Agree: `bg-green-500` (flat, right side in RTL)
- Disagree: `bg-red-500` (flat, left side in RTL)
- Hover expansion: `hover:flex-[1.2]` (60/40 ratio)
- Stats: Animated overlay on buttons

### Progress Segments

**Location:** `components/voting-v2/progress-segments.tsx`

**Instagram Stories-style segmented progress bar:**

```tsx
<div className="flex gap-1">
  {segments.map((segment, i) => (
    <div
      key={i}
      className={cn(
        "h-1 flex-1 rounded-full transition-colors",
        segment === 'completed' && "bg-purple-500",
        segment === 'current' && "bg-purple-300 animate-pulse",
        segment === 'upcoming' && "bg-white/20"
      )}
    />
  ))}
</div>
```

**Styling:**
- Height: `h-1` (thinner than v1.5)
- Completed: `bg-purple-500`
- Current: `bg-purple-300 animate-pulse`
- Upcoming: `bg-white/20`
- Gap: `gap-1`

### Question Pill

**Location:** `components/voting-v2/question-pill.tsx`

```tsx
<div className="bg-gradient-to-r from-blue-600 to-blue-500 rounded-xl shadow-lg p-4">
  <p className="text-white text-center font-medium">
    {question}
  </p>
</div>
```

**Styling:**
- Blue gradient: `from-blue-600 to-blue-500`
- Rounded: `rounded-xl`
- Shadow: `shadow-lg`
- Text: white, centered

### Tab Navigation

**Location:** `components/polls-v2/tab-navigation.tsx`

```tsx
<div className="bg-white/10 backdrop-blur rounded-xl p-1">
  <button className="bg-white text-purple-900">
    Vote
  </button>
  <button className="bg-white/10 text-white">
    Results (7/10)
  </button>
  <button className="bg-white/5 text-white/40" disabled>
    Locked
  </button>
</div>
```

**Styling:**
- Background: `bg-white/10 backdrop-blur`
- Active tab: `bg-white text-purple-900`
- Inactive tab: `bg-white/10 text-white`
- Disabled tab: `bg-white/5 text-white/40`

### Insight Card

**Location:** `components/results-v2/insight-card.tsx`

```tsx
<div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 rounded-2xl shadow-2xl p-8">
  {/* Decorative circles */}
  <div className="absolute top-4 right-4 w-32 h-32 bg-white/10 rounded-full" />

  <h3 className="text-white text-2xl font-bold">
    פרופיל ההשפעה שלך
  </h3>
  <p className="text-white/90 mt-4">
    {insightText}
  </p>
</div>
```

**Styling:**
- Gradient: `from-indigo-600 via-purple-600 to-pink-600`
- Decorative circles: `bg-white/10`
- Text: white
- Shadow: `shadow-2xl`

### Buttons

**Primary Button:**
```tsx
<button className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg">
  Action
</button>
```

**Secondary Button:**
```tsx
<button className="border-2 border-gray-200 hover:bg-gray-50 text-gray-900 px-6 py-3 rounded-xl font-semibold">
  Cancel
</button>
```

**Voting Buttons:**
```tsx
{/* Agree - flat green */}
<button className="bg-green-500 hover:bg-green-600 text-white">
  מסכים/ה
</button>

{/* Disagree - flat red */}
<button className="bg-red-500 hover:bg-red-600 text-white">
  לא מסכים/ה
</button>

{/* Pass - light gray */}
<button className="bg-gray-100 hover:bg-gray-200 text-gray-900">
  דילוג
</button>
```

## Component Architecture

### v2.0 Components (Production)

#### Voting Interface (`components/voting-v2/`)
- `split-vote-card.tsx` - 50/50 split buttons with hover expansion
- `progress-segments.tsx` - Stories-style progress bar
- `question-pill.tsx` - Blue gradient question display

#### Poll Components (`components/polls-v2/`)
- `poll-card-gradient.tsx` - Purple/pink gradient header
- `tab-navigation.tsx` - Vote/Results switcher

#### Results & Insights (`components/results-v2/`)
- `insight-card.tsx` - Gradient personal insight card
- `insight-detail-modal.tsx` - Detailed insight modal
- `aggregate-stats.tsx` - Vote distribution charts
- `demographic-heatmap.tsx` - Demographic breakdown
- `statements-list.tsx` - Statement history view
- `voting-complete-banner.tsx` - Completion celebration
- `more-statements-prompt.tsx` - Continue voting prompt
- `minimal-collection-footer.tsx` - Artifact collection display
- `new-artifact-badge.tsx` - New artifact badge
- `interactive-artifact-slot.tsx` - Artifact slots

#### Opinion Clustering (`components/clustering/`)
- `opinion-map-client.tsx` - Client wrapper for opinion map page
- `opinion-map-canvas.tsx` - Desktop SVG-based 2D visualization
- `mobile-clustering-view.tsx` - Mobile card-based group statistics
- `opinion-map-legend.tsx` - Color-coded legend with group labels
- `statement-agreement-view.tsx` - Container for statement agreement analysis
- `statement-agreement-heatmap.tsx` - Group-statement agreement heatmap
- `statement-stats-cards.tsx` - Summary statistics cards
- `coalition-analysis-sidebar.tsx` - Pairwise coalition alignment display
- `view-toggle.tsx` - Toggle between opinion map and statement heatmap
- `clustering-loading-skeleton.tsx` - Loading state placeholder
- `clustering-error-state.tsx` - Error state display
- `clustering-not-eligible.tsx` - Eligibility requirements message
- `types.ts` - Shared TypeScript types for clustering components

**Privacy-preserving design:**
- Opinion map shows ONLY group boundaries, centroids, and current user position
- Individual positions of other users are NOT displayed
- Protects voting privacy while enabling opinion landscape insights

**Visualization features:**
- Color-coded opinion groups (2-5 groups)
- Interactive hover states on desktop
- Pulsing animation for current user marker
- SVG-based rendering for crisp graphics
- Mobile-optimized card-based alternative view

#### Informational Banners (`components/banners/`)
- `demographics-banner.tsx` - Demographics prompt (after 10 votes)
- `results-locked-banner.tsx` - Results unlock explanation
- `closed-poll-banner.tsx` - Closed poll notification
- `partial-participation-banner.tsx` - Partial voting message
- `sign-up-banner.tsx` - Anonymous user sign-up encouragement

#### UI Primitives (`components/ui/`)
- Radix UI components styled with Tailwind
- Button, Dialog, Select, Checkbox, etc.
- Consistent styling across all primitives

#### Shared Layouts (`components/shared/`)
- `adaptive-header.tsx` - Context-aware header
- `mobile-nav.tsx` - Mobile navigation

## RTL Support

### Logical Properties (Required)

**Use logical properties (ms-*, me-*, start, end), NOT directional (ml-*, mr-*, left, right):**

```css
/* ✅ Correct - logical properties */
ms-4         /* Margin inline-start (right in RTL, left in LTR) */
me-4         /* Margin inline-end (left in RTL, right in LTR) */
ps-4         /* Padding inline-start */
pe-4         /* Padding inline-end */
start-0      /* Inset inline-start */
end-0        /* Inset inline-end */

/* ❌ Incorrect - directional properties */
ml-4         /* Always left margin */
mr-4         /* Always right margin */
left-0       /* Always left inset */
right-0      /* Always right inset */
```

### RTL Layout

```tsx
// All text containers
<div dir="auto">
  {hebrewText}
</div>

// Root HTML
<html dir="rtl" lang="he">
```

## Hebrew String Management

### Centralized Strings (`lib/strings/he.ts`)

**All UI text managed in one file:**

```typescript
// lib/strings/he.ts
export const strings = {
  voting: {
    agree: "מסכים/ה",
    disagree: "לא מסכים/ה",
    pass: "דילוג",
  },
  polls: {
    title: "דיונים",
    createNew: "צרו דיון חדש",
  },
  // ... more organized by page/component
};
```

**Usage in components:**

```tsx
import { strings } from '@/lib/strings/he';

export function VoteButton() {
  return (
    <button>
      {strings.voting.agree}
    </button>
  );
}
```

**Important:**
- **NEVER hardcode Hebrew text** in components
- Always import from `lib/strings/he.ts`
- Organized by page/component
- Type-safe with TypeScript

### Opinion Map Strings

**Complete set of 60+ Hebrew strings for clustering visualization:**

```typescript
// lib/strings/he.ts
export const opinionMap = {
  // Page navigation
  pageTitle: 'מפת דעות',
  backToResults: 'חזרה לתוצאות',

  // Loading & error states
  loading: 'בונים את מפת הדעות...',
  computing: 'מחשבים קבוצות דעה...',
  errorTitle: 'שגיאה בטעינת מפת הדעות',
  errorRetry: 'נסו שוב',

  // Eligibility messages
  notEligibleTitle: 'מפת הדעות עדיין לא זמינה',
  notEligibleMinUsers: (current: number, required: number) =>
    `דרושים לפחות ${required} מצביעים כדי ליצור מפת דעות. כרגע: ${current} מצביעים.`,

  // Legend & visualization
  yourPosition: 'המיקום שלכם',
  yourGroup: 'הקבוצה שלכם',
  groupLabel: (n: number) => `קבוצה ${n}`,
  groupSize: (count: number) => `${count} משתתפים`,

  // Statement classifications
  consensusPositive: 'קונצנזוס חיובי',
  consensusNegative: 'קונצנזוס שלילי',
  divisiveStatement: 'עמדה מחלקת',
  bridgeStatement: 'עמדת גשר',

  // Quality metrics
  qualityTitle: 'איכות הניתוח',
  silhouetteScore: 'ציון איכות',
  varianceExplained: 'שונות מוסברת',

  // ... 40+ more strings
};
```

**Usage example:**

```tsx
import { opinionMap } from '@/lib/strings/he';

<h1>{opinionMap.pageTitle}</h1>
<p>{opinionMap.notEligibleMinUsers(8, 10)}</p>
```

## Gamification System

### Milestone-Based Encouragement

**Triggers at specific progress points:**

```typescript
// 30% progress
const milestone30 = totalVotes >= Math.ceil(totalStatements * 0.3);

// 50% progress
const milestone50 = totalVotes >= Math.ceil(totalStatements * 0.5);

// 70% progress
const milestone70 = totalVotes >= Math.ceil(totalStatements * 0.7);

// 10 votes (threshold)
const threshold = totalVotes >= 10;
```

**Visual Feedback:**

1. **Encouragement Toasts** - Hebrew messages at milestones
2. **Confetti Celebration** - Triggers at threshold completion
3. **Add Button Pulse** - Appears at vote 4
4. **Progress Indicators** - Real-time completion percentage

**Implementation:**
- Milestone logic in `/app/polls/[slug]/page.tsx`
- Toast messages from `lib/strings/he.ts`
- Confetti via `canvas-confetti` library
- Animations via Framer Motion

### Artifact Collection System

**Rarity Tiers:**
- Common - Basic participation artifacts
- Rare - Moderate engagement artifacts
- Legendary - High engagement artifacts

**Components:**
- `minimal-collection-footer.tsx` - Collection display
- `new-artifact-badge.tsx` - New unlock badges
- `interactive-artifact-slot.tsx` - Locked/unlocked slots

**Service:**
- `artifact-rarity-service.ts` - Rarity calculations and unlocking

### User Feedback System

**Floating Feedback Button:**
- Always accessible during voting
- Modal-based submission
- Anonymous + authenticated support

**Implementation:**
- `feedback-service.ts` - Submission handling
- Clean, focused feedback interface

## CSS Theme System

### CSS Variables Architecture

**Centralized theme system using CSS custom properties for consistent, theme-switchable styling.**

#### Core Theme Files (`/app` directory)

**Base Files:**
- `theme-variables.css` - Main purple/pink theme variables (100+ variables)
- `theme-utilities.css` - Utility classes using CSS variables
- `globals.css` - Global styles and imports

**Theme Variants:**

Each theme has two versions (standard and brand):

| Theme Name | Standard File | Brand File |
|------------|--------------|------------|
| Blue Foundation | `theme-blue-foundation-standard.css` | `theme-blue-foundation-brand.css` |
| Cyan Centric | `theme-cyan-centric-standard.css` | `theme-cyan-centric-brand.css` |
| Natural Gradient | `theme-natural-gradient-standard.css` | `theme-natural-gradient-brand.css` |
| Vibrant Spectrum | `theme-vibrant-spectrum-standard.css` | `theme-vibrant-spectrum-brand.css` |

**Standard vs Brand:**
- **Standard**: Neutral color scheme for general use
- **Brand**: Branded colors with stronger identity

#### Variable Categories

**Primary Brand Colors:**
```css
:root {
  /* Purple Scale (Primary) */
  --color-primary-900: #581c87;      /* purple-900 */
  --color-primary-600: #9333ea;      /* purple-600 - Main purple */
  --color-primary-300: #d8b4fe;      /* purple-300 */

  /* Pink Scale (Secondary) */
  --color-secondary-600: #db2777;    /* pink-600 */
  --color-secondary-500: #ec4899;    /* pink-500 */
}
```

**Background Gradients:**
```css
:root {
  /* Page Background */
  --gradient-page-from: #0f172a;     /* slate-900 */
  --gradient-page-via: #581c87;      /* purple-900 */
  --gradient-page-to: #0f172a;       /* slate-900 */

  /* Poll Card Header */
  --gradient-poll-header-from: #9333ea;  /* purple-600 */
  --gradient-poll-header-to: #db2777;    /* pink-600 */

  /* Insight Card */
  --gradient-insight-from: #4f46e5;   /* indigo-600 */
  --gradient-insight-via: #9333ea;    /* purple-600 */
  --gradient-insight-to: #db2777;     /* pink-600 */
}
```

**White Overlays (for dark backgrounds):**
```css
:root {
  --white-overlay-5: rgba(255, 255, 255, 0.05);
  --white-overlay-10: rgba(255, 255, 255, 0.1);
  --white-overlay-20: rgba(255, 255, 255, 0.2);
  /* ... up to 95% */
}
```

**Status Colors:**
```css
:root {
  --status-success: #22c55e;          /* green-500 */
  --status-error: #ef4444;            /* red-500 */
  --status-warning: #eab308;          /* yellow-500 */
  --status-info: #3b82f6;             /* blue-500 */
}
```

**Voting Colors:**
```css
:root {
  --voting-agree: #22c55e;            /* green-500 */
  --voting-agree-hover: #16a34a;      /* green-600 */
  --voting-disagree: #ef4444;         /* red-500 */
  --voting-disagree-hover: #dc2626;   /* red-600 */
  --voting-pass: #f3f4f6;             /* gray-100 */
  --voting-pass-hover: #e5e7eb;       /* gray-200 */
}
```

**Confetti Colors (for celebrations):**
```css
:root {
  --confetti-purple-600: #9333ea;
  --confetti-pink-600: #db2777;
  --confetti-blue-600: #2563eb;
  --confetti-green-500: #22c55e;
  --confetti-red-500: #ef4444;
}
```

#### Theme Usage in Components

**Clustering Components (CSS Variables):**

Since October 2025, clustering UI components use CSS variables instead of hardcoded Tailwind classes:

```tsx
// ✅ Correct - uses CSS variables
<div style={{
  backgroundColor: 'var(--gradient-eligibility-from)',
  borderColor: 'var(--color-primary-400)'
}}>

// ❌ Old approach - hardcoded colors
<div className="bg-purple-100 border-purple-400">
```

**Benefits:**
- Theme switching without code changes
- Centralized color management
- Easy brand customization
- Consistent styling across components

**Components using CSS variables:**
- `clustering-not-eligible.tsx`
- `coalition-analysis-sidebar.tsx`
- `opinion-map-client.tsx`
- `opinion-map-legend.tsx`
- `statement-agreement-heatmap.tsx`
- `statement-agreement-view.tsx`
- `statement-stats-cards.tsx`
- `view-toggle.tsx`

#### How to Change Theme Colors

**Method 1: Edit theme-variables.css** (Recommended)

1. Open `/app/theme-variables.css`
2. Modify CSS variable values
3. No code changes needed - variables are referenced everywhere
4. See comments in file for guidance

**Method 2: Use Alternative Theme File**

1. Import different theme file in `globals.css`
2. Available themes: blue-foundation, cyan-centric, natural-gradient, vibrant-spectrum
3. Choose standard or brand version

**Method 3: Override at Runtime** (Advanced)

```typescript
// Set CSS variables programmatically
document.documentElement.style.setProperty('--color-primary-600', '#3b82f6');
```

#### Integration with Design Tokens

**Dual System:**
- **CSS Variables** (`theme-variables.css`) - For dynamic theming
- **Design Tokens** (`lib/design-tokens-v2.ts`) - For TypeScript constants

**When to use which:**
- CSS Variables: Component styling, gradients, colors
- Design Tokens: Animations, spacing, breakpoints, TypeScript logic

**Example Integration:**
```tsx
import { designTokens } from '@/lib/design-tokens-v2';

// Use design tokens for animations
<motion.div
  transition={{ duration: designTokens.animation.quick }}
  style={{
    backgroundColor: 'var(--color-primary-600)' // CSS variable for color
  }}
/>
```

## Component Styling Rules

When creating/styling components:

1. ✅ **Use dark gradient background** for all voting pages
2. ✅ **Use white cards** for content (not colored gradients)
3. ✅ **Use purple/pink gradients** for headers and special cards
4. ✅ **Use flat colors** for voting buttons (NO gradients)
5. ✅ **Maintain 2xl rounding** (`rounded-2xl`) for cards
6. ✅ **Apply consistent shadows** (`shadow-xl` for cards)
7. ✅ **Follow RTL principles** with logical properties (ms-*, me-*, start, end)
8. ✅ **Import strings** from `lib/strings/he.ts` for all text
9. ✅ **Use design tokens** from `lib/design-tokens-v2.ts`
10. ✅ **Consider gamification** - milestone triggers and feedback

## Responsive Design

### Breakpoints

```typescript
// Tailwind default breakpoints
sm: '640px'   // Small devices
md: '768px'   // Medium devices
lg: '1024px'  // Large devices
xl: '1280px'  // Extra large devices
2xl: '1536px' // 2X Extra large devices
```

### Mobile-First Approach

```tsx
// Base styles for mobile
<div className="text-sm p-4">
  {/* Mobile layout */}
</div>

// Enhanced for larger screens
<div className="text-sm sm:text-base p-4 sm:p-6">
  {/* Responsive layout */}
</div>
```

### useMobile Hook

```typescript
import { useMobile } from '@/hooks/use-mobile';

export function Component() {
  const isMobile = useMobile();

  return isMobile ? (
    <MobileLayout />
  ) : (
    <DesktopLayout />
  );
}
```

## Accessibility

### WCAG Compliance

- **Color contrast** - AA standard minimum
- **Keyboard navigation** - Full support
- **Screen readers** - Semantic HTML + ARIA
- **Focus indicators** - Visible focus states

### Best Practices

```tsx
// Semantic HTML
<button type="button" aria-label="Vote agree">
  {strings.voting.agree}
</button>

// Focus indicators
<button className="focus:ring-2 focus:ring-purple-500 focus:outline-none">
  Action
</button>

// Alt text for images
<img src={poll.emoji} alt={`${poll.title} emoji`} />
```

## Animation Best Practices

### Framer Motion

```tsx
import { motion } from 'framer-motion';

// Fade in
<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  transition={{ duration: 0.3 }}
>
  {content}
</motion.div>

// Slide in
<motion.div
  initial={{ x: -20, opacity: 0 }}
  animate={{ x: 0, opacity: 1 }}
  transition={{ duration: 0.3 }}
>
  {content}
</motion.div>
```

### Performance Considerations

- Use `transform` and `opacity` (GPU-accelerated)
- Avoid animating `width`, `height`, `top`, `left`
- Use `will-change` sparingly
- Reduce motion for accessibility (`prefers-reduced-motion`)

## Design Resources

### Additional Documentation

- **[USE_CASES.md](../../USE_CASES.md)** - User journeys and workflows
- **[UX_UI_SPEC.md](../../UX_UI_SPEC.md)** - Complete UX/UI specification
- **[.claude/misc/MIGRATION_PLAN.md](..misc/MIGRATION_PLAN.md)** - UX redesign migration plan
- **[.claude/misc/HEBREW_TERMINOLOGY.md](../misc/HEBREW_TERMINOLOGY.md)** - Hebrew terminology reference

### Design Files

- **Design tokens:** `lib/design-tokens-v2.ts`
- **Hebrew strings:** `lib/strings/he.ts`
- **Theme variables:** CSS variables in app directory
