# Hebrew RTL Conversion Plan - Pulse

**Strategy:** Hebrew-only conversion (no bilingual support)
**Estimated Time:** 14-21 hours
**Difficulty:** Medium

---

## Overview

This plan converts the entire Pulse application to Hebrew with RTL (right-to-left) layout. Since we're going Hebrew-only (no English fallback), this is significantly simpler than a bilingual approach.

### Why Hebrew-Only?

- ✅ 60% less development work
- ✅ No i18n library complexity
- ✅ Better performance (no translation lookups)
- ✅ Easier maintenance
- ✅ Simpler database (no language columns)
- ✅ Can add i18n later if needed

---

## Phase 1: Foundation Setup (2-3 hours)

### 1.1 Install RTL Direction Provider

**Install Radix Direction Provider:**
```bash
npm install @radix-ui/react-direction
```

### 1.2 Update Root Layout

**File:** `app/layout.tsx`

**Change HTML tag:**
```tsx
// Before:
<html lang="en" suppressHydrationWarning>

// After:
<html lang="he" dir="rtl" suppressHydrationWarning>
```

**Wrap app with DirectionProvider:**
```tsx
import { DirectionProvider } from '@radix-ui/react-direction';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="he" dir="rtl" suppressHydrationWarning>
        <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
          <DirectionProvider dir="rtl">
            <Providers attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
              <UserProvider>
                <HeaderProvider>
                  <AdaptiveHeader />
                  {children}
                </HeaderProvider>
              </UserProvider>
            </Providers>
          </DirectionProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
```

### 1.3 Install Hebrew Font

**Recommended fonts (choose one):**
- **Rubik** - Modern, clean, excellent for UI (recommended)
- **Heebo** - Minimal, geometric
- **Assistant** - Friendly, rounded
- **Alef** - Traditional but modern

**Update font imports in `app/layout.tsx`:**
```tsx
import { Rubik } from "next/font/google";

const rubik = Rubik({
  subsets: ["hebrew", "latin"],
  variable: "--font-rubik",
  display: "swap",
});

// In body className:
<body className={`${rubik.variable} antialiased`}>
```

**Update CSS variables in `app/globals.css`:**
```css
@theme inline {
  --font-sans: var(--font-rubik);
  /* Remove or update mono font if needed */
}
```

---

## Phase 2: CSS Migration to Logical Properties (2-3 hours)

### 2.1 Bulk Replace Directional Utilities

**These 36+ files need updates:**
```
app/dashboard/page.tsx
app/polls/[slug]/manage/page.tsx
app/polls/[slug]/page.tsx
app/polls/create/page.tsx
app/admin/users/page.tsx
app/admin/dashboard/page.tsx
components/shared/adaptive-header.tsx
components/ui/* (various)
components/modals/* (various)
components/voting/* (various)
```

**Find and Replace (in order):**

1. **Margin:**
   - `ml-` → `ms-`
   - `mr-` → `me-`

2. **Padding:**
   - `pl-` → `ps-`
   - `pr-` → `pe-`

3. **Positioning:**
   - `left-` → `start-`
   - `right-` → `end-`

4. **Text Alignment:**
   - `text-left` → `text-start`
   - `text-right` → `text-end`

5. **Borders:**
   - `border-l-` → `border-s-`
   - `border-r-` → `border-e-`
   - `rounded-l-` → `rounded-s-`
   - `rounded-r-` → `rounded-e-`

### 2.2 Special Cases - Manual Review Needed

**Icon positioning in buttons:**
```tsx
// Before:
<ArrowRight className="h-4 w-4 ml-2" />

// After (swap icon AND use logical property):
<ArrowLeft className="h-4 w-4 ms-2" />
```

**Directional icons that need swapping:**
- `ArrowLeft` ↔ `ArrowRight`
- `ChevronLeft` ↔ `ChevronRight`
- `ArrowLeftCircle` ↔ `ArrowRightCircle`

**Icons that DON'T need changes:**
- `X`, `Plus`, `Check`, `Menu`, `Loader2`, `Upload`, etc.

### 2.3 Component-Specific CSS Fixes

**Mobile Navigation (`components/shared/mobile-nav.tsx`):**
```tsx
// Change Sheet side:
<SheetContent side="right" className="w-72"> // Was "left"
```

**Statement Card depth effect (`components/voting/statement-card.tsx`):**
```tsx
// Update transforms to use logical equivalents or keep as-is (works with dir="rtl")
// The translate-x will automatically flip with RTL
```

---

## Phase 3: Content Translation (8-12 hours)

### 3.1 Translation Reference - Common Terms

**Navigation & Actions:**
- Polls → סקרים
- Dashboard → לוח בקרה
- Create Poll → צור סקר
- Admin Dashboard → פאנל ניהול
- Sign In → התחבר
- Sign Up → הרשם
- Sign Out → התנתק
- Back → חזור
- Next → הבא
- Cancel → ביטול
- Save → שמור
- Delete → מחק
- Edit → ערוך
- Submit → שלח

**Voting:**
- Agree → מסכים / תומך
- Disagree → לא מסכים / מתנגד
- Pass → דילוג
- Keep → שמור
- Throw → השלך
- Skip → דלג
- Vote → הצבע
- Statement → הצהרה
- Results → תוצאות
- Insights → תובנות

**Poll Creation:**
- Question → שאלה
- Description → תיאור
- Settings → הגדרות
- Statements → הצהרות
- Start Time → זמן התחלה
- End Time → זמן סיום
- Goal → יעד
- Draft → טיוטה
- Published → פורסם
- Closed → סגור

**Forms:**
- Required → שדה חובה
- Optional → אופציונלי
- Placeholder → (context-dependent)
- Loading → טוען...
- Success → הצלחה
- Error → שגיאה

### 3.2 High-Priority Files for Translation

**Priority 1: Voting Flow (most visible to users)**

1. **`components/voting/statement-card.tsx`**
   ```tsx
   // Line 17-19 default labels:
   agreeLabel = "תומך",
   disagreeLabel = "מתנגד",
   passLabel = "דילוג",
   ```

2. **`components/voting/vote-result-overlay.tsx`**
   - Result messages
   - Distribution labels

3. **`components/voting/continuation-page.tsx`**
   - Batch completion messages
   - Continue button text

4. **`components/voting/statement-counter.tsx`**
   - Counter format (if text-based)

5. **`components/voting/statement-submission-modal.tsx`**
   - Modal title, form labels, submit button

**Priority 2: Navigation & Headers**

6. **`components/shared/adaptive-header.tsx`**
   ```tsx
   // Lines to translate:
   - "Back" (line 46)
   - "Sign In" (line 65)
   - "Sign out" (line 79)
   - "Pulse" (logo - keep or translate to "פולס")
   ```

7. **`components/shared/mobile-nav.tsx`**
   ```tsx
   // Lines to translate:
   - "Menu" (line 23)
   - "Browse Polls" → "עיון בסקרים" (line 63)
   - "Dashboard" → "לוח בקרה" (line 72)
   - "Create Poll" → "צור סקר" (line 78)
   - "Admin Dashboard" → "פאנל ניהול" (line 86)
   - "Sign In" → "התחבר" (line 96)
   - "Sign Up" → "הרשם" (line 101)
   ```

**Priority 3: Poll Creation Wizard**

8. **`app/polls/create/page.tsx`** (66+ strings)
   ```tsx
   // Step titles (lines 239-243):
   - "Basic Information" → "מידע בסיסי"
   - "Control Settings" → "הגדרות בקרה"
   - "Button Labels" → "תוויות כפתורים"
   - "Scheduling" → "תזמון"
   - "Initial Statements" → "הצהרות ראשוניות"

   // Descriptions (lines 246-250)
   // Form labels throughout
   // Placeholders
   // Helper text
   // Validation messages
   ```

**Priority 4: Poll Display Pages**

9. **`app/polls/[slug]/page.tsx`** - Poll overview
10. **`app/polls/[slug]/vote/page.tsx`** - Voting interface
11. **`app/polls/[slug]/insights/page.tsx`** - Personal insights
12. **`app/polls/[slug]/results/page.tsx`** - Poll results
13. **`app/polls/[slug]/closed/page.tsx`** - Closed poll view
14. **`app/polls/[slug]/manage/page.tsx`** - Poll management

**Priority 5: Admin Pages**

15. **`app/admin/dashboard/page.tsx`**
16. **`app/admin/users/page.tsx`**
17. **`app/admin/moderation/page.tsx`**
18. **`app/admin/polls/page.tsx`**

**Priority 6: Modals & Components**

19. **`components/modals/publish-poll-modal.tsx`**
20. **`components/modals/unpublish-poll-modal.tsx`**
21. **`components/modals/add-statement-modal.tsx`**
22. **`components/modals/edit-statement-modal.tsx`**
23. **`components/modals/transfer-ownership-modal.tsx`**
24. **`components/polls/demographics-modal.tsx`**
25. **`components/polls/poll-card.tsx`**
26. **`components/polls/poll-filters.tsx`**

### 3.3 Validation & Error Messages

**Zod Schemas (`lib/validations/*.ts`):**
- Translate all error messages
- Keep validation logic unchanged

**Example:**
```tsx
// Before:
question: z.string().min(1, "Question is required")

// After:
question: z.string().min(1, "שאלה היא שדה חובה")
```

**Toast Messages (search for `toast.` across codebase):**
- Success messages → "הצלחה", "נשמר בהצלחה", etc.
- Error messages → "שגיאה", "משהו השתבש", etc.
- Info messages

### 3.4 Metadata & SEO

**`app/layout.tsx` metadata:**
```tsx
export const metadata: Metadata = {
  title: "פולס - פלטפורמת סקרים דמוקרטית",
  description: "פלטפורמת סקרים משתתפת למעורבות דמוקרטית",
};
```

**Individual page metadata:**
- Translate titles in each page.tsx
- Update descriptions
- Keep URLs in English (SEO best practice)

---

## Phase 4: Date & Time Localization (1 hour)

### 4.1 Install Hebrew Locale for date-fns

**Already installed:** `date-fns` (version 4.1.0)

### 4.2 Import Hebrew Locale

```tsx
import { he } from 'date-fns/locale';
import { format } from 'date-fns';

// Usage:
format(new Date(), 'PPP', { locale: he })
// Output: "15 בינואר 2025"
```

### 4.3 Files Using Dates

Search for `format(` or `new Date(` to find date formatting:
- Poll display components
- Admin dashboards
- Timestamp displays

---

## Phase 5: Clerk Authentication Localization (1-2 hours)

### 5.1 Clerk Localization

**Update Clerk components with Hebrew:**

```tsx
import { heIL } from '@clerk/localizations';

<ClerkProvider localization={heIL}>
  {/* ... */}
</ClerkProvider>
```

### 5.2 Custom Auth Pages

**`app/(auth)/login/[[...login]]/page.tsx`:**
- May need custom Hebrew text if using custom forms

**`app/(auth)/signup/[[...signup]]/page.tsx`:**
- Same as above

### 5.3 UserButton Customization

**In `adaptive-header.tsx` and `mobile-nav.tsx`:**
```tsx
<UserButton.Action
  label="התנתק"  // Was "Sign out"
  labelIcon={<span>🚪</span>}
  onClick={() => signOut({ redirectUrl: "/" })}
/>
```

---

## Phase 6: Database Content (Optional - 1-2 hours)

### 6.1 Seed Data Translation

**File:** `db/seed.ts`

If you have seed data:
- Translate poll questions to Hebrew
- Translate statements to Hebrew
- Keep user data as-is or use Hebrew names

### 6.2 Existing Data Migration

**If you have production data:**

Option A: Leave existing English data (mixed content)
Option B: Manually translate via admin panel
Option C: Write migration script to translate (use AI API)

**No schema changes needed** - content fields remain the same type.

---

## Phase 7: Testing & Quality Assurance (3-4 hours)

### 7.1 Visual Testing Checklist

**All Pages:**
- [ ] Header renders correctly RTL
- [ ] Navigation menu aligns to right
- [ ] Mobile menu slides from right
- [ ] Buttons align correctly
- [ ] Forms align correctly (labels on right)
- [ ] Cards/modals center properly
- [ ] Icons face correct direction
- [ ] Text alignment is correct
- [ ] Footer (if any) renders correctly

**Voting Flow:**
- [ ] Statement cards display correctly
- [ ] Buttons positioned correctly
- [ ] Progress bar fills right-to-left
- [ ] Vote overlay displays correctly
- [ ] Continuation page renders correctly

**Poll Creation:**
- [ ] Wizard steps display correctly
- [ ] Form fields align right
- [ ] Progress bar fills correctly
- [ ] Statement list aligns correctly

**Admin:**
- [ ] Tables render correctly (consider column order)
- [ ] Dashboards display correctly
- [ ] Charts render correctly (Recharts RTL support)

### 7.2 Functional Testing

**Forms:**
- [ ] All forms submit correctly
- [ ] Validation messages appear in Hebrew
- [ ] Error messages display correctly
- [ ] Toast notifications appear correctly

**Navigation:**
- [ ] All links work
- [ ] Breadcrumbs work (if any)
- [ ] Back buttons work
- [ ] Tab navigation works

**Voting:**
- [ ] Can vote on statements
- [ ] Progress tracking works
- [ ] Insights generate correctly
- [ ] Results display correctly

**Admin:**
- [ ] Can create polls
- [ ] Can moderate statements
- [ ] Can manage users
- [ ] All admin actions work

### 7.3 Browser Testing

**Desktop:**
- [ ] Chrome (Windows)
- [ ] Firefox
- [ ] Edge
- [ ] Safari (Mac if available)

**Mobile:**
- [ ] Chrome Android
- [ ] Safari iOS
- [ ] Test both portrait and landscape

### 7.4 Accessibility Testing

**Screen Readers:**
- [ ] Test with NVDA (Windows) or VoiceOver (Mac)
- [ ] Verify Hebrew pronunciation is acceptable
- [ ] Check heading hierarchy

**Keyboard Navigation:**
- [ ] Tab order makes sense RTL
- [ ] Focus indicators visible
- [ ] Arrow keys work in RTL context (carousels, sliders)

---

## Phase 8: Edge Cases & Polish (2-3 hours)

### 8.1 Mixed Content Handling

**URLs in Hebrew text:**
```tsx
// Use unicode-bidi isolation for URLs
<span className="inline-block" style={{ unicodeBidi: 'plaintext' }}>
  https://example.com
</span>
```

**Email addresses in Hebrew text:**
- Same approach as URLs

**Numbers in Hebrew text:**
- Hebrew uses Western numerals (1, 2, 3)
- No special handling needed

**Code snippets (if any):**
- Keep LTR with `dir="ltr"` override

### 8.2 Text Overflow

**Long Hebrew words:**
- Hebrew words can be long
- Test truncation: `truncate` class
- Test overflow: `overflow-hidden`
- Consider `break-words` for very long text

### 8.3 Performance Check

**After all changes:**
- [ ] Run `npm run build` to check for errors
- [ ] Check bundle size (should be similar or smaller)
- [ ] Test page load times
- [ ] Verify no console errors

---

## Implementation Order (Step-by-Step)

### Day 1: Foundation & CSS (4-6 hours)

1. **Setup (30 min):**
   - Install `@radix-ui/react-direction`
   - Update `app/layout.tsx` (HTML dir/lang + DirectionProvider)
   - Install Hebrew font (Rubik recommended)
   - Update font CSS

2. **CSS Migration (2-3 hours):**
   - Bulk find-replace directional utilities (see Phase 2.1)
   - Manually review icon placements
   - Fix mobile nav (side="right")
   - Test all pages visually

3. **Initial Testing (1-2 hours):**
   - Browse all pages
   - Fix obvious layout breaks
   - Take screenshots of before/after

### Day 2: Content Translation - Part 1 (4-6 hours)

4. **Voting Flow (2 hours):**
   - Translate `statement-card.tsx`
   - Translate `vote-result-overlay.tsx`
   - Translate `continuation-page.tsx`
   - Translate `statement-submission-modal.tsx`
   - Test voting flow end-to-end

5. **Navigation (1 hour):**
   - Translate `adaptive-header.tsx`
   - Translate `mobile-nav.tsx`
   - Test navigation on all pages

6. **Poll Display Pages (2 hours):**
   - Translate poll overview, vote, insights, results pages
   - Test each page

### Day 3: Content Translation - Part 2 (4-6 hours)

7. **Poll Creation (2 hours):**
   - Translate `app/polls/create/page.tsx` (biggest file)
   - Test wizard flow
   - Test form validation

8. **Admin Pages (1-2 hours):**
   - Translate admin dashboard, users, moderation, polls pages
   - Test admin actions

9. **Modals & Components (1-2 hours):**
   - Translate all modals
   - Translate poll cards, filters, demographics modal
   - Test each modal

### Day 4: Validation, Polish & Testing (3-4 hours)

10. **Validation Messages (1 hour):**
    - Translate Zod schemas
    - Translate toast messages
    - Test form errors

11. **Metadata & Dates (1 hour):**
    - Update page metadata
    - Implement date-fns Hebrew locale
    - Update Clerk localization

12. **Final Testing (2 hours):**
    - Full QA pass (checklist in Phase 7)
    - Browser testing
    - Mobile testing
    - Fix any issues

---

## Quick Reference: Key Files to Change

### Must Change (Core Functionality)
```
app/layout.tsx                              # dir="rtl", lang="he", font, DirectionProvider
components/shared/adaptive-header.tsx       # Navigation labels
components/shared/mobile-nav.tsx            # Menu items, side="right"
components/voting/statement-card.tsx        # Vote button labels
app/polls/create/page.tsx                   # Poll creation wizard
```

### High Priority (User-Facing)
```
app/polls/[slug]/page.tsx                   # Poll overview
app/polls/[slug]/vote/page.tsx              # Voting UI
app/polls/[slug]/insights/page.tsx          # Insights
app/polls/[slug]/results/page.tsx           # Results
components/voting/*                          # All voting components
components/polls/*                           # All poll components
components/modals/*                          # All modals
```

### Medium Priority (Admin/Forms)
```
app/admin/*                                  # All admin pages
app/polls/page.tsx                          # Poll browsing
lib/validations/*                           # Zod error messages
```

### Low Priority (Edge Cases)
```
app/unauthorized/page.tsx                   # Error pages
app/page.tsx                                # Landing page
components/ui/*                             # UI component text (if any)
```

---

## Common Pitfalls to Avoid

1. **Forgetting DirectionProvider:** Radix components won't RTL without it
2. **Using absolute directions in new code:** Always use logical properties
3. **Not testing on mobile:** RTL bugs often show on mobile first
4. **Hardcoding text in new components:** Stay consistent with Hebrew
5. **Forgetting to swap directional icons:** Arrows/chevrons need swapping
6. **Not testing forms:** Hebrew input behaves differently
7. **Ignoring URL/email isolation:** Mixed bidirectional text can look broken

---

## Rollback Plan (If Something Goes Wrong)

1. **Git branch strategy:**
   ```bash
   git checkout -b hebrew-conversion
   # Do all work on this branch
   # Can easily revert to main if needed
   ```

2. **Commit frequently:**
   - After Phase 1 (foundation)
   - After Phase 2 (CSS migration)
   - After each major translation batch
   - Before final testing

3. **Keep English in comments:**
   - Helps you debug
   - Future developers can understand

---

## Post-Launch Considerations

### If You Need to Add English Later

The logical properties migration you did makes this easier:
1. Install `next-intl`
2. Create locale files (extract Hebrew text to `he.json`)
3. Add English translations to `en.json`
4. Wrap layout with locale detection
5. Update components to use translation hooks

### Performance Optimization

- Hebrew fonts can be large → use font subsetting
- Consider font-display: swap for faster initial render
- Lazy load admin pages if not frequently used

### Content Management

- Consider building a translation interface in admin panel
- Allow admins to update UI text without code changes
- Store common strings in database if frequent changes expected

---

## Success Metrics

After implementation, verify:
- ✅ All text is in Hebrew
- ✅ All layouts work RTL
- ✅ All forms submit correctly
- ✅ No console errors
- ✅ Build succeeds (`npm run build`)
- ✅ All tests pass (if you have tests)
- ✅ Mobile experience is smooth
- ✅ Clerk auth works in Hebrew
- ✅ No visual regressions

---

## Questions & Troubleshooting

### Q: Some Radix components don't flip RTL?
**A:** Make sure DirectionProvider wraps the entire app, not just part of it.

### Q: Text alignment looks weird?
**A:** Check if you're using `text-left/right` instead of `text-start/end`.

### Q: Icons are backwards?
**A:** Directional icons need manual swapping or `rtl:scale-x-[-1]`.

### Q: Clerk UI is still in English?
**A:** Add `localization={heIL}` to ClerkProvider.

### Q: Mobile nav slides from wrong side?
**A:** Change `<SheetContent side="left">` to `side="right"`.

### Q: Build fails after font change?
**A:** Check font import syntax, ensure Hebrew subset is available on Google Fonts.

### Q: Dates still show in English?
**A:** Import and use `{ locale: he }` from date-fns in all format calls.

### Q: Should I translate URLs/slugs?
**A:** No - keep URLs in English for SEO and compatibility. Only translate visible content.

---

## Resources

**Documentation:**
- [Tailwind Logical Properties](https://tailwindcss.com/blog/tailwindcss-v3-3#simplified-rtl-support-with-logical-properties)
- [Radix Direction Provider](https://www.radix-ui.com/primitives/docs/utilities/direction-provider)
- [date-fns Hebrew Locale](https://date-fns.org/v4.1.0/docs/I18n)
- [Clerk Localization](https://clerk.com/docs/components/customization/localization)

**Hebrew Fonts:**
- [Google Fonts - Rubik](https://fonts.google.com/specimen/Rubik)
- [Google Fonts - Heebo](https://fonts.google.com/specimen/Heebo)
- [Google Fonts - Assistant](https://fonts.google.com/specimen/Assistant)

**Testing:**
- [NVDA Screen Reader](https://www.nvaccess.org/) (Free, Windows)
- [BrowserStack](https://www.browserstack.com/) (Cross-browser testing)

---

## Final Notes

- **Start small:** Get Phase 1 working first before translating content
- **Test frequently:** Don't wait until the end to test
- **Use git branches:** Easy to rollback if something breaks
- **Take breaks:** 14-21 hours of work, spread over 2-4 days is reasonable
- **Ask for help:** If stuck, search for RTL-specific issues on Stack Overflow

Good luck with the conversion! 🇮🇱
