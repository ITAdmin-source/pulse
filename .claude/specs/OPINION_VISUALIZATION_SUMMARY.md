# Opinion Clustering Visualization - Executive Summary

**Full Specification:** See `OPINION_VISUALIZATION_SPEC.md` (13,000+ words, implementation-ready)

---

## Key Design Decisions (Final)

### 1. Desktop: Hybrid Canvas/SVG 2D Maps
- **Canvas** for >100 participants (performance)
- **SVG** for <100 participants (accessibility, native interactions)
- Privacy-preserving: Only user's position visible (no other individual markers)
- Group boundaries shown as semi-transparent colored regions
- Statement highlighting via click-to-overlay heatmap

### 2. Mobile: Context-Adaptive
- **10-50 participants:** Simplified 2D map (no pan/zoom, larger touch targets)
- **>50 participants:** Stacked horizontal bars (group-based)
- Star icon marks user's group prominently
- Tap-to-expand for group details

### 3. Accessibility: WCAG 2.1 AA Compliant
- Full keyboard navigation (Tab, Arrow keys, Enter, Escape)
- Screen reader support with ARIA live regions
- Alternative data table view (toggle button)
- Color + shape + text encoding (not color-only)
- High contrast mode support
- Reduced motion preferences respected

### 4. User Onboarding: 5-Step Interactive Tutorial
- First-time overlay walkthrough
- Progressive disclosure (Welcome → Groups → Your Position → Explore → Get Started)
- Dismissible + "Don't show again" option
- Persistent help button (?) always available
- Contextual tooltips for complex elements

### 5. Gamification: Discovery-Focused
- **Achievements:**
  - Explorer (first view)
  - Bridge Builder (low cluster confidence)
  - Consensus Seeker (high agreement with consensus statements)
  - Independent Thinker (outlier position)
  - Group Representative (near centroid)
- **Exploration Prompts:** Contextual based on position (between groups, minority group, position changed)
- **Social Comparison:** Privacy-safe group-level stats only

### 6. Privacy: Self-Only Positioning
- **User sees:** Own position, group boundaries, aggregate stats
- **User CANNOT see:** Other individual positions, names in clustering context
- **Small groups (<5):** Still show counts (rounded: "4-6 members"), no individual markers

---

## Technical Architecture

### Component Hierarchy
```
OpinionLandscapeCard.tsx (main container)
  ├─ OpinionMapCanvas.tsx (Canvas rendering for >100 users)
  ├─ OpinionMapSVG.tsx (SVG rendering for <100 users)
  ├─ MobileClusteringView.tsx (mobile: stacked bars or simplified map)
  ├─ GroupLegend.tsx (color-coded legend)
  ├─ StatementOverlay.tsx (heatmap overlay on click)
  ├─ OnboardingTutorial.tsx (5-step interactive guide)
  ├─ ClusteringDataTable.tsx (accessible table alternative)
  └─ ClusteringInsights.tsx (text summary panel)
```

### Integration Points
- **Placement:** New "מפת דעות" tab in Results view
- **Unlock:** 10 votes minimum (matches existing threshold)
- **Design Tokens:** Uses `design-tokens-v2.ts` (purple gradient, white cards, shadows)
- **Strings:** All Hebrew text in `lib/strings/he.ts` (new `clustering` section added)
- **Responsive:** Uses existing `useMobile` hook (<768px breakpoint)

### Rendering Strategy
```typescript
// Automatic selection based on participant count
const shouldUseCanvas = (count: number) => count > 100;

// Hybrid approach:
{shouldUseCanvas(participants.length) ? (
  <OpinionMapCanvas data={data} />
) : (
  <OpinionMapSVG data={data} />
)}
```

### Animation Specifications
- **Component entrance:** 600ms ease-out fade + scale
- **Group boundaries:** 800ms path morph
- **User marker:** Spring animation (stiffness: 200, damping: 15)
- **Real-time updates:** 800ms smooth transition (30s debounce)
- **Statement highlights:** 300ms fade overlay

---

## Visual Encoding System

### Opinion Groups (2-5 clusters)
- **Shape:** Convex hull (smooth organic boundaries)
- **Fill:** Semi-transparent gradient (15% opacity, 30% on hover)
- **Stroke:** 2px solid in group color
- **Colors:** Purple, pink, blue, emerald, amber (from design tokens)
- **Labels:** White text at centroid with shadow

### User's Position
- **Marker:** 20px white circle with 3px colored border
- **Animation:** Gentle pulsing (scale 1 → 1.05 → 1)
- **Label:** "אתם כאן" below marker
- **Glow:** Drop shadow for prominence

### Statement Highlighting
- **Agree regions:** Green tint (20% opacity)
- **Disagree regions:** Red tint (20% opacity)
- **Mixed regions:** Yellow tint (bridge areas)
- **Annotations:** Agreement % at group centroids

---

## Mobile Optimizations

### Performance
- CSS transforms (GPU-accelerated)
- Virtualized statement list (if >100 items)
- 60s debounce on clustering updates (vs 30s desktop)
- Lazy load non-visible content
- localStorage caching (5min TTL)

### Touch Interactions
- 48x48px minimum touch targets
- Swipe left/right: Navigate tabs
- Swipe up: Collapse details
- Pull to refresh: Trigger recompute
- Visual feedback: 100ms scale animation + ripple

---

## Accessibility Features

### Keyboard Shortcuts
- `Tab` / `Shift+Tab`: Navigate elements
- `Enter`: Select focused group/statement
- `Space`: Toggle selection
- `Escape`: Clear selection, close modals
- `Arrow keys`: Pan map (if zoomed)
- `H`: Toggle help overlay

### Screen Reader Labels (Hebrew)
```typescript
ariaMapLabel: "מפת דעות המציגה 3 קבוצות דעה עם 83 משתתפים. אתם בקבוצה 2"
ariaGroupLabel: "קבוצה 2: 38 חברים. אתם בקבוצה זו"
ariaPositionUpdate: "המיקום שלכם עודכן. אתם כעת בקבוצה 2"
```

### ARIA Live Regions
- Clustering updates: `aria-live="polite"`
- Statement selection: `aria-live="assertive"`
- Group expansion: `aria-live="polite"`

### Alternative Views
- Data table toggle (always visible)
- Sortable columns, expandable rows
- Full keyboard navigation
- Proper semantic HTML (`<table>`, `<th>`, `<td>`)

---

## User Onboarding Flow

### Tutorial Steps (Hebrew)
1. **Welcome:** "גלו איפה אתם ממוקמים במרחב הדעות"
2. **Groups:** "כל צבע מייצג קבוצת משתתפים עם דפוסי הצבעה דומים"
3. **Your Position:** "הנקודה המוארת מראה איפה אתם ממוקמים"
4. **Explore:** "לחצו על עמדה כדי לראות איך קבוצות שונות הצביעו"
5. **Get Started:** "קו הצטרפות • קו פילוג • קו גשר"

### Help Panel (Always Available)
- Explains group regions
- Describes user's position
- Lists statement types (consensus, divisive, bridge)
- Link to full tutorial

### Axis Interpretation
- **Simple mode:** "דימנזיה 1" / "דימנזיה 2"
- **Advanced mode:** Semantic labels (e.g., "מדיניות כלכלית")
- **Technical mode:** "PC1 (45% variance)"
- Toggle in settings (⚙)

---

## Gamification System

### Clustering Achievements
| Achievement | Emoji | Trigger | Rarity |
|-------------|-------|---------|--------|
| Explorer | 🔍 | First view clustering | Common |
| Bridge Builder | 🌉 | Low cluster confidence | Rare |
| Consensus Seeker | 🤝 | 80%+ consensus alignment | Rare |
| Independent Thinker | 💡 | Outlier position | Legendary |
| Group Representative | 🎯 | Near centroid (<0.1 distance) | Common |

### Exploration Prompts
- **Between groups:** "גלו עמדות גשר המקשרות בין הקבוצות"
- **Minority group:** "ראו מה ייחודי בדפוס ההצבעה שלכם"
- **Position changed:** "המיקום שלכם השתנה מאז הביקור האחרון"

### Social Comparison (Privacy-Safe)
- Group size comparisons
- Group consensus statements
- Your group vs. others (aggregate stats only)
- NO individual user identities or positions

---

## Privacy Safeguards

### User Can See
- Own position (x, y coordinates)
- Own group assignment
- Group boundaries (convex hulls)
- Group member counts
- Group-level voting stats

### User CANNOT See
- Other individual positions (no markers)
- Other individual names in clustering context
- Vote-by-vote breakdown for individuals
- Exact coordinates of others

### Small Group Handling
- Groups with <5 members: Show rounded counts ("4-6 members")
- Minimum 3 members to form group (smaller = outliers)
- No individual markers even in small groups
- Aggregate statistics only

---

## Performance Budget

### Metrics
- First Contentful Paint: <1.5s
- Time to Interactive: <3s
- Canvas draw: <100ms
- Animation duration: <300ms
- Payload size: ~20KB (100KB max)

### Optimizations
- Automatic Canvas/SVG switching
- Lazy loading
- LocalStorage caching
- Debounced updates (30s desktop, 60s mobile)
- GPU-accelerated animations

---

## Implementation Checklist

### Phase 1: Core Components (Week 1)
- [ ] `OpinionLandscapeCard` container
- [ ] `OpinionMapCanvas` rendering
- [ ] `OpinionMapSVG` rendering (accessibility)
- [ ] Group boundary calculations (convex hull)
- [ ] User marker positioning
- [ ] Basic legend component

### Phase 2: Mobile & Interactions (Week 2)
- [ ] `MobileClusteringView` stacked bars
- [ ] Simplified 2D map for mobile
- [ ] Statement highlighting overlay
- [ ] Hover/click interactions
- [ ] Keyboard navigation
- [ ] Touch gesture support

### Phase 3: Accessibility & Onboarding (Week 3)
- [ ] `OnboardingTutorial` 5-step flow
- [ ] `ClusteringDataTable` alternative view
- [ ] Screen reader ARIA labels
- [ ] Help panel
- [ ] Axis labeling system
- [ ] Tooltips & hints

### Phase 4: Gamification & Polish (Week 4)
- [ ] Achievement integration
- [ ] Exploration prompts
- [ ] Social comparison UI
- [ ] Export/share functionality
- [ ] Animation polish
- [ ] Error states
- [ ] Loading states

### Phase 5: Testing & Launch (Week 5)
- [ ] Unit tests (coordinate transforms, etc.)
- [ ] Integration tests (rendering, interactions)
- [ ] E2E tests (full user journey)
- [ ] Visual regression tests
- [ ] Accessibility audit (WCAG 2.1 AA)
- [ ] Performance testing
- [ ] Documentation
- [ ] Production deployment

---

## File Locations (Implementation Ready)

### New Components
```
components/results-v2/opinion-clustering/
  ├─ OpinionLandscapeCard.tsx          (main container)
  ├─ OpinionMapCanvas.tsx              (Canvas renderer)
  ├─ OpinionMapSVG.tsx                 (SVG renderer)
  ├─ MobileClusteringView.tsx          (mobile variant)
  ├─ GroupLegend.tsx                   (color legend)
  ├─ StatementOverlay.tsx              (heatmap layer)
  ├─ OnboardingTutorial.tsx            (5-step guide)
  ├─ ClusteringDataTable.tsx           (accessible table)
  ├─ ClusteringInsights.tsx            (text summary)
  ├─ HelpPanel.tsx                     (contextual help)
  ├─ SettingsPanel.tsx                 (axis labels toggle)
  └─ ExportButton.tsx                  (PNG/link export)
```

### Utilities
```
lib/utils/
  ├─ clustering-viz-utils.ts           (coordinate transforms)
  ├─ axis-labeling.ts                  (PCA → semantic labels)
  └─ exploration-prompts.ts            (contextual prompts)
```

### Hooks
```
lib/hooks/
  └─ use-clustering-data.ts            (data fetching, caching)
```

### Strings
```
lib/strings/he.ts
  └─ clustering: { ... }               (all Hebrew text)
```

### Gamification
```
lib/gamification/
  └─ clustering-achievements.ts        (achievement definitions)
```

---

## Dependencies (New Packages)

```json
{
  "dependencies": {
    "d3-scale": "^4.0.2",        // Coordinate transformations
    "d3-shape": "^3.2.0",        // Convex hull calculations
    "canvas-confetti": "^1.6.0"  // Achievement celebrations
  }
}
```

*Note: Framer Motion, Recharts, React Query already in project*

---

## Next Steps

1. **Review Specification:** Read full `OPINION_VISUALIZATION_SPEC.md`
2. **Install Dependencies:** Add d3-scale, d3-shape if needed
3. **Create Component Files:** Follow structure in Section 8 of spec
4. **Implement Phase 1:** Core desktop visualization (Canvas + SVG)
5. **Test Accessibility:** Keyboard navigation, screen readers
6. **Implement Phase 2:** Mobile stacked bars
7. **Add Onboarding:** Interactive tutorial
8. **Integrate Gamification:** Achievements + prompts
9. **Polish & Test:** Performance, E2E, visual regression
10. **Launch:** Deploy with monitoring

---

**Total Specification Length:** 13,000+ words
**Estimated Implementation Time:** 5 weeks (1 developer)
**Accessibility Level:** WCAG 2.1 AA compliant
**Mobile Support:** Full (adaptive design)
**Hebrew RTL:** Complete support
**Privacy:** Self-only positioning (no de-identification possible)

All design decisions finalized. Ready for implementation.
