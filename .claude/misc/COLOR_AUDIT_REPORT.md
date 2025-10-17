# Color Audit Report - Polls Pages

**Date:** 2025-10-17
**Pages Analyzed:** `/app/polls/[slug]/page.tsx` and `/app/polls/page.tsx`
**Design Tokens Reference:** `lib/design-tokens-v2.ts`

---

## Executive Summary

This report identifies which UI elements use centralized design tokens versus hardcoded colors in the two main poll pages. **Key finding:** Most colors are hardcoded using Tailwind utility classes, not design token references.

---

## `/app/polls/[slug]/page.tsx` - Poll Detail Page

### ✅ Elements Using Design Tokens

| Element | Line | Design Token Used | Token Path |
|---------|------|------------------|------------|
| Page background | 907, 918, 930 | `colors.background.page.className` | `colors.background.page.className` |

**That's it!** Only 1 element properly uses design tokens.

---

### ❌ Elements with Hardcoded Colors

#### Header Section (Lines 932-944)
```tsx
// Sticky header with hardcoded purple gradient
className="sticky top-0 z-50 bg-gradient-to-r from-purple-900/80 via-purple-800/60 to-purple-900/80 backdrop-blur-md border-b border-purple-500/20"

// Button with hardcoded purple
className="text-white hover:bg-purple-700/50 hover:text-white flex items-center gap-2"
```
**Issue:** Uses `purple-900`, `purple-800`, `purple-700`, `purple-500` directly
**Should use:** Create a design token for header gradient

---

#### Poll Header (Lines 948-959)
```tsx
// White text (hardcoded)
className="text-2xl sm:text-3xl font-bold text-white"

// Purple text (hardcoded)
className="text-purple-200 text-sm sm:text-base"

// Red badge (hardcoded)
className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded"
```
**Issue:** `text-white`, `text-purple-200`, `bg-red-500` hardcoded
**Should use:** `colors.text.inverse`, `colors.status.closed`

---

#### Tab Navigation (Lines 962-972)
The `<TabNavigation>` component may use design tokens internally, but this needs verification.

---

#### Vote Tab - Completion Card (Lines 1017-1041)
```tsx
// Green gradient (hardcoded)
className="w-16 h-16 mx-auto bg-gradient-to-br from-green-500 to-emerald-500 rounded-full"

// Gray text (hardcoded)
className="text-2xl font-bold text-gray-900 mb-2"
className="text-gray-600 mb-6"

// Purple/pink gradient button (hardcoded)
className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-xl"

// Purple button (hardcoded)
className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl"
```
**Issue:** Multiple hardcoded colors
**Should use:** `colors.background.completion.className`, `colors.text.primary`, `colors.primary.purple[600]`

---

#### Loading States (Lines 909, 1044, 1078, 1082)
```tsx
// Purple spinner (hardcoded)
className="h-8 w-8 animate-spin mx-auto mb-4 text-purple-600"

// Gray text (hardcoded)
className="text-gray-600"
```
**Issue:** `text-purple-600`, `text-gray-600` hardcoded
**Should use:** `colors.primary.purple[600]`, `colors.text.secondary`

---

#### Results Tab - Insight Generation States (Lines 1088-1105)
```tsx
// Purple/pink gradient (hardcoded)
className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 rounded-2xl p-6 sm:p-8 shadow-2xl text-white text-center"

// Purple text on loading message (hardcoded)
className="text-sm text-purple-200 mt-2"

// Red/pink gradient for error (hardcoded)
className="bg-gradient-to-br from-red-600 via-rose-600 to-pink-600 rounded-2xl p-6 sm:p-8 shadow-2xl text-white text-center"

// White button with purple text (hardcoded)
className="bg-white text-purple-600 px-6 py-3 rounded-lg font-semibold hover:bg-purple-50 transition-colors shadow-lg"
```
**Issue:** Multiple hardcoded gradients and colors
**Should use:** `colors.background.insight.className` already exists!

---

#### Components Used (Need Internal Audit)
These components are imported and used, but their internal color usage needs verification:
- `<SplitVoteCard>` (line 1004)
- `<ProgressSegments>` (line 979)
- `<ResultsLockedBanner>` (line 1070)
- `<ClosedPollBanner>` (line 1057)
- `<PartialParticipationBanner>` (line 1062)
- `<InsightCard>` (line 1107)
- `<AggregateStats>` (line 1144)
- `<DemographicHeatmap>` (line 1152)
- `<MoreStatementsPrompt>` (line 1129)
- `<VotingCompleteBanner>` (line 1134)

---

## `/app/polls/page.tsx` - Polls List Page

### ✅ Elements Using Design Tokens

| Element | Line | Design Token Used | Token Path |
|---------|------|------------------|------------|
| Page background | 141 | `colors.background.page.className` | `colors.background.page.className` |

**Again, only 1 element!**

---

### ❌ Elements with Hardcoded Colors

#### Header Section (Lines 143-173)
```tsx
// Purple gradient header (hardcoded)
className="sticky top-0 z-50 bg-gradient-to-r from-purple-900/80 via-purple-800/60 to-purple-900/80 backdrop-blur-md border-b border-purple-500/20"

// White text buttons (hardcoded)
className="text-white hover:bg-purple-700/50 hover:text-white"

// White button with purple text (hardcoded)
className="bg-white/95 border-purple-400/40 text-purple-700 hover:bg-purple-700/50 hover:text-white hover:border-purple-400/60"
```
**Issue:** Purple shades hardcoded throughout
**Should use:** Create `colors.header` design token

---

#### Welcome Section (Lines 178-185)
```tsx
// White text (hardcoded)
className="text-4xl sm:text-5xl font-bold text-white mb-4 tracking-tight"

// White with opacity (hardcoded)
className="text-lg sm:text-xl text-white/80 max-w-2xl mx-auto font-light"
```
**Issue:** `text-white`, `text-white/80` hardcoded
**Should use:** `colors.text.inverse`, or create `text-white/80` token

---

#### Filter Buttons (Lines 188-214)
```tsx
// Active state (hardcoded)
className="bg-purple-600 hover:bg-purple-700"

// Inactive state (hardcoded)
className="bg-transparent border-white/20 text-white hover:bg-white/10"
```
**Issue:** Purple buttons hardcoded
**Should use:** `colors.primary.purple[600]`, `colors.primary.purple[700]`

---

#### Search Input & Sort Select (Lines 216-234)
```tsx
// Search input (hardcoded)
className="w-full md:w-64 bg-white/10 border-white/20 text-white placeholder:text-white/60"

// Select trigger (hardcoded)
className="w-full sm:w-40 bg-white/10 border-white/20 text-white"
```
**Issue:** White with opacity hardcoded
**Should use:** Create tokens for form elements on dark backgrounds

---

#### Loading Skeleton (Lines 238-246)
```tsx
// Skeleton with white opacity (hardcoded)
className="w-full h-full rounded-2xl bg-white/10"
```
**Issue:** `bg-white/10` hardcoded
**Should use:** Create `colors.skeleton` token

---

#### Empty State (Lines 269-281)
```tsx
// White text (hardcoded)
className="text-xl text-white mb-4"
className="text-white/70 mb-6"

// White border button (hardcoded)
className="border-white/20 text-white hover:bg-white/10"
```
**Issue:** White colors and opacities hardcoded
**Should use:** Design tokens for empty states

---

#### Components Used (Need Internal Audit)
- `<PollCardGradient>` (line 254) - Needs internal audit
- `<SignUpBanner>` (line 287) - Needs internal audit

---

## Summary Statistics

### `/app/polls/[slug]/page.tsx`
- **Total color references:** ~40+
- **Using design tokens:** 1 (2.5%)
- **Hardcoded colors:** 39+ (97.5%)

### `/app/polls/page.tsx`
- **Total color references:** ~25+
- **Using design tokens:** 1 (4%)
- **Hardcoded colors:** 24+ (96%)

---

## Critical Issues

### 1. **Purple/Pink Colors Not Tokenized**
Despite having a purple/pink theme, almost all purple colors are hardcoded Tailwind classes:
- `purple-900/80`, `purple-800/60`, `purple-700/50`, `purple-600`, `purple-500/20`, `purple-400`, `purple-200`
- `pink-600`, `pink-500`

**Impact:** Changing to your brand colors (cyan/blue/orange) will require manual find-replace in every file.

---

### 2. **White/Opacity Patterns Not Tokenized**
Common patterns like `text-white`, `bg-white/10`, `text-white/80`, `border-white/20` are used dozens of times.

**Impact:** Cannot control transparency levels centrally.

---

### 3. **Gradients Duplicated**
The same gradient patterns appear multiple times:
- `from-purple-900/80 via-purple-800/60 to-purple-900/80` (headers)
- `from-purple-600 to-pink-600` (buttons, cards)
- `from-indigo-600 via-purple-600 to-pink-600` (insights)

**Impact:** Inconsistency risk and manual updates required.

---

## Recommendations

### Option 1: Update Design Tokens (Recommended)
Add missing tokens to `lib/design-tokens-v2.ts`:

```typescript
// Add to colors.background
header: {
  from: '#581c87',        // purple-900
  via: '#6b21a8',         // purple-800
  to: '#581c87',
  className: 'bg-gradient-to-r from-purple-900/80 via-purple-800/60 to-purple-900/80',
},

// Add to colors object
overlay: {
  white10: 'rgba(255, 255, 255, 0.1)',
  white20: 'rgba(255, 255, 255, 0.2)',
  white60: 'rgba(255, 255, 255, 0.6)',
  white70: 'rgba(255, 255, 255, 0.7)',
  white80: 'rgba(255, 255, 255, 0.8)',
  white95: 'rgba(255, 255, 255, 0.95)',
},

// Add to colors object
error: {
  gradient: {
    from: '#dc2626',      // red-600
    via: '#f43f5e',       // rose-600
    to: '#db2777',        // pink-600
    className: 'bg-gradient-to-br from-red-600 via-rose-600 to-pink-600',
  }
}
```

### Option 2: Create Inline Style Variables
For elements that need dynamic theming, use CSS custom properties:

```tsx
// In page component
const themeColors = {
  '--header-bg-from': colors.primary.purple[900],
  '--header-bg-via': colors.primary.purple[800],
  // etc.
}

<div style={themeColors}>
  {/* content */}
</div>
```

### Option 3: Utility Function Approach
Create helper functions in `lib/design-tokens-v2.ts`:

```typescript
export function getHeaderGradient(theme: 'purple' | 'blue' | 'cyan') {
  const gradients = {
    purple: 'bg-gradient-to-r from-purple-900/80 via-purple-800/60 to-purple-900/80',
    blue: 'bg-gradient-to-r from-blue-900/80 via-blue-800/60 to-blue-900/80',
    cyan: 'bg-gradient-to-r from-cyan-900/80 via-cyan-800/60 to-cyan-900/80',
  };
  return gradients[theme];
}

export function getOverlayClass(opacity: 10 | 20 | 60 | 70 | 80 | 95) {
  return `bg-white/${opacity}`;
}
```

---

## Action Plan for Brand Color Migration

### Phase 1: Tokenize Current Colors
1. Add all missing purple/pink patterns to design tokens
2. Replace hardcoded classes with token references
3. Test that UI looks identical

### Phase 2: Make Tokens Theme-Aware
1. Create theme variants (purple, cyan-blue, vibrant, etc.)
2. Add theme selection mechanism
3. Update all token references to use theme

### Phase 3: Component Audit
1. Audit all imported components for color usage
2. Ensure components accept theme props or use design tokens
3. Update component library to be theme-aware

---

## How to Control Colors After Choosing Brand Theme

### Approach A: Token Replacement (Simplest)
When you choose a proposal (e.g., Proposal 3 - Cyan-Centric):

1. Update `lib/design-tokens-v2.ts`:
```typescript
primary: {
  cyan: {
    600: '#16c3ea',
    // ... other shades
  },
  blue: {
    600: '#042e5f',
    // ... other shades
  }
}

background: {
  page: {
    from: '#042e5f',      // Basic Blue
    via: '#0a4a7a',       // Slightly lighter
    to: '#042e5f',
    className: 'bg-gradient-to-br from-[#042e5f] via-[#0a4a7a] to-[#042e5f]',
  },
  header: {
    className: 'bg-gradient-to-r from-[#042e5f]/80 via-[#16c3ea]/60 to-[#042e5f]/80',
  },
  // Update all other gradients...
}
```

2. Then do find-replace in pages:
- `from-purple-900/80` → use `colors.background.header.className` reference
- `bg-purple-600` → use `colors.primary.cyan[600]` or create token reference
- `text-purple-200` → use color token reference

### Approach B: Dynamic Theming (More Flexible)
Create a theme provider:

```typescript
// lib/theme-provider.tsx
const themes = {
  proposal1: { /* Blue Foundation colors */ },
  proposal2: { /* Vibrant Spectrum colors */ },
  proposal3: { /* Cyan-Centric colors */ },
  proposal4: { /* Natural Gradient colors */ },
};

export function ThemeProvider({ theme, children }) {
  const themeColors = themes[theme];
  return (
    <div style={{ ...themeColors }}>
      {children}
    </div>
  );
}
```

---

## Conclusion

**Current State:** Only 2.5-4% of colors use design tokens. Most are hardcoded.

**Required Work:** Significant refactoring needed to make the app theme-aware.

**Recommendation:** Start with Option 1 (update design tokens), then systematically replace hardcoded colors in both pages. Once these two pages are tokenized, extend the same pattern to all components.

**Estimated Effort:**
- Tokenizing 2 pages: 4-6 hours
- Full component library: 20-30 hours
- Testing all 4 proposals: 4-8 hours

**Quick Win:** Update design tokens with your chosen proposal's colors, then use find-replace to update the most common patterns (`purple-600`, `purple-900`, gradients) in these two pages.
