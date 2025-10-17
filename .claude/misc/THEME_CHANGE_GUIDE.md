# Theme Change Guide - CSS Variables System

**Version:** 1.0
**Last Updated:** 2025-10-17
**Current Theme:** Purple/Pink (Original)

---

## Overview

The Pulse app now uses a **CSS Custom Properties (variables) system** for all colors. This makes changing the entire app's color scheme as simple as editing a single file.

### Benefits:
- ✅ **Single source of truth** - All colors defined in one file
- ✅ **Instant updates** - Change colors in minutes, not hours
- ✅ **No code changes** - Update only CSS variables
- ✅ **Designer-friendly** - Non-developers can edit colors
- ✅ **Zero performance impact** - (~1-2ms overhead, negligible)

---

## How to Change Colors

### Step 1: Choose Your Brand Colors

Decide on your color palette. For example, the **Cyan-Centric** proposal:
- Primary: Tomorrow Cyan (#16c3ea)
- Secondary: Basic Blue (#042e5f)
- Accent: Contemporary Orange (#f04e2d)
- Success: Medium Base Green (#8dc63f)

### Step 2: Update CSS Variables

Edit **`app/theme-variables.css`** and replace the color values:

```css
:root {
  /* PRIMARY BRAND COLORS - UPDATE THESE */
  --color-primary-900: #042e5f;      /* Was #581c87 (purple-900) */
  --color-primary-800: #0a4a7a;      /* Was #6b21a8 (purple-800) */
  --color-primary-700: #0e5a8f;      /* Was #7e22ce (purple-700) */
  --color-primary-600: #16c3ea;      /* Was #9333ea (purple-600) ⭐ MAIN */
  --color-primary-500: #42d4f5;      /* Was #a855f7 (purple-500) */
  --color-primary-400: #6ddff7;      /* Was #c084fc (purple-400) */
  --color-primary-300: #98e9fa;      /* Was #d8b4fe (purple-300) */
  --color-primary-200: #c4f4fc;      /* Was #e9d5ff (purple-200) */

  --color-secondary-600: #f04e2d;    /* Was #db2777 (pink-600) */
  --color-secondary-500: #f67059;    /* Was #ec4899 (pink-500) */

  --color-indigo-600: #042e5f;       /* Was #4f46e5 (indigo-600) */

  /* BACKGROUND GRADIENTS - UPDATE THESE */
  --gradient-page-from: #042e5f;     /* Dark navy */
  --gradient-page-via: #0a4a7a;      /* Slightly lighter */
  --gradient-page-to: #042e5f;       /* Dark navy */

  --gradient-header-from: rgba(4, 46, 95, 0.8);      /* Navy/80 */
  --gradient-header-via: rgba(22, 195, 234, 0.6);    /* Cyan/60 */
  --gradient-header-to: rgba(4, 46, 95, 0.8);        /* Navy/80 */

  --gradient-poll-header-from: #16c3ea;    /* Cyan */
  --gradient-poll-header-to: #6294bf;      /* Gray-blue */

  --gradient-insight-from: #042e5f;   /* Navy */
  --gradient-insight-via: #16c3ea;    /* Cyan */
  --gradient-insight-to: #6294bf;     /* Gray-blue */

  /* VOTING COLORS (Optional - can keep standard green/red) */
  --voting-agree: #8dc63f;            /* Brand green */
  --voting-disagree: #f04e2d;         /* Brand orange */
  --voting-pass: #cfcfa3;             /* Brand beige */
  --voting-pass-text: #042e5f;        /* Navy text */

  /* CONFETTI COLORS */
  --confetti-purple-600: #16c3ea;     /* Cyan */
  --confetti-pink-600: #f04e2d;       /* Orange */
  --confetti-pink-500: #f67059;       /* Light orange */
  --confetti-purple-500: #8dc63f;     /* Green */
}
```

### Step 3: Test

```bash
npm run dev
```

Visit:
- http://localhost:3000/polls - Should show new colors
- http://localhost:3000/polls/[slug] - Should show new colors everywhere
- Test all buttons, hover states, progress bars

### Step 4: Build & Deploy

```bash
npm run build
```

If build succeeds, you're done! 🎉

---

## CSS Variable Reference

### Primary Colors (Main Theme)

| Variable | Current Value | Usage |
|----------|---------------|-------|
| `--color-primary-900` | #581c87 | Darkest - backgrounds |
| `--color-primary-800` | #6b21a8 | Dark - header gradients |
| `--color-primary-700` | #7e22ce | Hover states |
| `--color-primary-600` | #9333ea | **Main brand color** - buttons, CTAs |
| `--color-primary-500` | #a855f7 | Borders, accents |
| `--color-primary-400` | #c084fc | Light borders |
| `--color-primary-300` | #d8b4fe | Very light accents |
| `--color-primary-200` | #e9d5ff | Text on dark backgrounds |

### Secondary Colors

| Variable | Current Value | Usage |
|----------|---------------|-------|
| `--color-secondary-600` | #db2777 | Secondary accent (pink) |
| `--color-secondary-500` | #ec4899 | Secondary accent light |

### Background Gradients

| Variable | Usage | Components |
|----------|-------|------------|
| `--gradient-page-from/via/to` | Page background | All pages |
| `--gradient-header-from/via/to` | Header background | Sticky headers |
| `--gradient-poll-header-from/to` | Poll card headers | Poll cards |
| `--gradient-insight-from/via/to` | Personal insight card | Results page |
| `--gradient-error-from/via/to` | Error states | Insight errors |
| `--gradient-completion-from/to` | Voting complete | Vote tab |
| `--gradient-question-from/to` | Question pills | Vote tab |

### Voting Colors

| Variable | Current Value | Usage |
|----------|---------------|-------|
| `--voting-agree` | #22c55e | Agree button |
| `--voting-agree-hover` | #16a34a | Agree button hover |
| `--voting-disagree` | #ef4444 | Disagree button |
| `--voting-disagree-hover` | #dc2626 | Disagree button hover |
| `--voting-pass` | #f3f4f6 | Pass button |
| `--voting-pass-hover` | #e5e7eb | Pass button hover |
| `--voting-pass-text` | #374151 | Pass button text |

### White Overlays (for dark backgrounds)

| Variable | Opacity | Usage |
|----------|---------|-------|
| `--white-overlay-5` | 5% | Very subtle overlays |
| `--white-overlay-10` | 10% | Forms, skeletons |
| `--white-overlay-20` | 20% | Borders, dividers |
| `--white-overlay-40` | 40% | - |
| `--white-overlay-60` | 60% | Placeholder text |
| `--white-overlay-70` | 70% | Secondary text |
| `--white-overlay-80` | 80% | Text on dark |
| `--white-overlay-90` | 90% | - |
| `--white-overlay-95` | 95% | Near-white backgrounds |

### Status Colors

| Variable | Current Value | Usage |
|----------|---------------|-------|
| `--status-success` | #22c55e | Success messages |
| `--status-error` | #ef4444 | Error states, closed polls |
| `--status-warning` | #eab308 | Warning states |
| `--status-info` | #3b82f6 | Info messages |

---

## Utility Classes Reference

The `app/theme-utilities.css` file provides convenient CSS classes:

### Background Classes

```css
.bg-gradient-header          /* Header gradient */
.bg-gradient-poll-header     /* Poll card header */
.bg-gradient-insight         /* Insight card */
.bg-gradient-error           /* Error state */
.bg-gradient-completion      /* Voting complete */
.bg-gradient-question        /* Question pill */

.bg-primary-900 through .bg-primary-200   /* Solid primary colors */
.bg-white-5 through .bg-white-95          /* White overlays */
```

### Text Classes

```css
.text-primary-900 through .text-primary-200
.text-white
.text-white-80 through .text-white-60
```

### Button Classes

```css
.btn-primary                 /* Primary button (main brand color) */
.btn-primary:hover           /* Primary button hover */
.btn-secondary               /* Secondary button (gray) */
.btn-secondary:hover         /* Secondary button hover */
```

### Voting Classes

```css
.bg-voting-agree             /* Agree button background */
.bg-voting-disagree          /* Disagree button background */
.bg-voting-pass              /* Pass button background */
.text-voting-pass            /* Pass button text */
```

### Status Classes

```css
.bg-status-success
.bg-status-error
.bg-status-warning
.bg-status-info
```

---

## Common Scenarios

### Scenario 1: Change Main Brand Color Only

Update just the primary color:

```css
:root {
  --color-primary-600: #16c3ea;  /* Your new main color */
  --color-primary-700: #128fb5;  /* Darker version for hover */
}
```

### Scenario 2: Change Page Background

```css
:root {
  --gradient-page-from: #1a1a2e;
  --gradient-page-via: #16213e;
  --gradient-page-to: #1a1a2e;
}
```

Then update the design tokens file:

```typescript
// In lib/design-tokens-v2.ts
export const colors = {
  background: {
    page: {
      ...
      className: 'bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#1a1a2e]',
    },
  },
}
```

### Scenario 3: Use Brand Colors for Voting

```css
:root {
  --voting-agree: #8dc63f;       /* Your brand green */
  --voting-disagree: #f04e2d;    /* Your brand orange */
  --voting-pass: #cfcfa3;        /* Your brand beige */
  --voting-pass-text: #042e5f;   /* Navy text */
}
```

### Scenario 4: Revert to Original Purple/Pink

Just restore the original values from the initial commit of `theme-variables.css`.

---

## Testing Checklist

After changing colors, verify:

### `/polls` Page
- [ ] Page background shows new gradient
- [ ] Header shows new gradient
- [ ] Filter buttons show new color when active
- [ ] Filter buttons hover correctly
- [ ] Search input border and text colors
- [ ] Poll cards show new gradient headers
- [ ] Poll card buttons show new colors
- [ ] Loading skeletons use new overlay color
- [ ] Empty state text uses new colors

### `/polls/[slug]` Page
- [ ] Page background shows new gradient
- [ ] Header shows new gradient
- [ ] Back button hover uses new color
- [ ] Poll question text visible
- [ ] Closed badge shows correct color
- [ ] Progress segments use new color
- [ ] Tab navigation shows new colors
- [ ] Voting buttons use new colors (agree/disagree)
- [ ] Pass button uses new color
- [ ] Add statement button uses new primary color
- [ ] Stats overlay shows correctly
- [ ] Completion card gradient shows new colors
- [ ] Loading spinners use new primary color
- [ ] Insight card shows new gradient
- [ ] Error state shows new gradient
- [ ] Confetti uses new colors

### All Hover States
- [ ] Button hover effects work
- [ ] Color transitions smooth
- [ ] No flashing or color mismatches

---

## Files Modified (Reference Only)

You generally **don't need to edit these** - they reference the CSS variables:

1. `app/theme-variables.css` - ⭐ **EDIT THIS FILE**
2. `app/theme-utilities.css` - (Optional) Add more utility classes
3. `app/layout.tsx` - (Already imports theme files)
4. `app/globals.css` - (Already configured for Tailwind)
5. `app/polls/page.tsx` - (Uses utility classes)
6. `app/polls/[slug]/page.tsx` - (Uses utility classes)
7. `components/polls-v2/poll-card-gradient.tsx` - (Uses utility classes)
8. `components/voting-v2/split-vote-card.tsx` - (Uses utility classes)

---

## Tips & Best Practices

### 1. Generate Color Scales

When choosing a new primary color, generate a full scale (100-900):
- Use tools like: https://uicolors.app/create
- Input your main color (#16c3ea)
- Get all 9 shades (100-900)
- Update CSS variables accordingly

### 2. Test Contrast

Ensure text is readable:
- Dark backgrounds need light text
- Light backgrounds need dark text
- Use contrast checkers: https://webaim.org/resources/contrastchecker/

### 3. Maintain Consistency

Keep similar color families together:
- Headers: Darker shades
- Buttons: Medium shades
- Hover: Slightly darker/lighter
- Disabled: Very light or desaturated

### 4. Version Your Themes

If you want to maintain multiple themes:

```css
/* theme-variables-cyan.css */
:root {
  --color-primary-600: #16c3ea;
  /* ... cyan theme colors */
}

/* theme-variables-purple.css */
:root {
  --color-primary-600: #9333ea;
  /* ... purple theme colors */
}
```

Then import the one you want in `app/layout.tsx`.

---

## Troubleshooting

### Colors Not Changing

1. **Clear browser cache** - Hard refresh (Ctrl+Shift+R)
2. **Restart dev server** - `npm run dev`
3. **Check CSS variable spelling** - Must match exactly
4. **Check file saved** - Ensure `theme-variables.css` saved

### Build Errors

```bash
npm run build
```

If it fails:
- Check for syntax errors in CSS
- Ensure all color values are valid hex codes
- Check that no quotes are missing

### Colors Look Wrong

- Verify hex codes are correct
- Check opacity values (should be 0-1 for rgba)
- Ensure gradients have all three values (from/via/to)

---

## Future Enhancements

Possible improvements to the theme system:

1. **Dark Mode Support** - Add `@media (prefers-color-scheme: dark)` section
2. **Multiple Theme Files** - Support switching between themes dynamically
3. **Admin Theme Editor** - Build a UI for changing colors in-app
4. **Figma Integration** - Sync design tokens from Figma
5. **Tailwind Plugin** - Generate Tailwind classes from variables automatically

---

## Questions?

If you need help:
1. Check this guide first
2. Look at the demo page: http://localhost:3000/demo-brand-colors
3. Review `app/theme-variables.css` for current values
4. Ask Claude Code for assistance

---

**Happy Theming! 🎨**
