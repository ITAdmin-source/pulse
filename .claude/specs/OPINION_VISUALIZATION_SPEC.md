# Opinion Clustering Visualization - Final UI/UX Specification

**Version:** 1.0
**Created:** 2025-10-19
**Status:** FINAL - Ready for Implementation

---

## Executive Summary

This document specifies the complete UI/UX design for opinion clustering visualization in Pulse, integrating:
- Privacy-preserving 2D opinion maps (desktop)
- Mobile-optimized alternatives (stacked bars + compact views)
- Comprehensive accessibility support
- User onboarding for abstract PCA concepts
- Gamification tied to exploration and discovery
- Hebrew RTL support throughout

**Core Philosophy:** Make complex collective intelligence patterns accessible, engaging, and actionable for all users while preserving privacy and statistical validity.

---

## 1. Desktop Visualization (Primary Experience)

### 1.1 Component Architecture

```typescript
// components/results-v2/opinion-clustering/
OpinionLandscapeCard.tsx          // Main container with tabs
  ├─ OpinionMapCanvas.tsx          // 2D Canvas rendering
  ├─ GroupLegend.tsx               // Color-coded group labels
  ├─ StatementOverlay.tsx          // Statement highlighting layer
  ├─ OnboardingTutorial.tsx        // First-time walkthrough
  └─ ClusteringInsights.tsx        // Text-based insights panel

// Supporting components
OpinionGroupBadge.tsx              // Badge showing user's group
StatementClassificationBadge.tsx  // Consensus/divisive/bridge badges
ClusterStatsCard.tsx              // Aggregate stats per group
```

### 1.2 Rendering Technology: Hybrid Canvas + SVG

**Why Hybrid:**
- Canvas for >100 data points (performance)
- SVG for <100 data points (accessibility, interactions)
- Automatic switching based on participant count

**Implementation:**
```typescript
// lib/utils/clustering-viz-utils.ts
export function shouldUseCanvas(participantCount: number): boolean {
  return participantCount > 100;
}

// Rendering decision
const RenderComponent = shouldUseCanvas(participants.length)
  ? OpinionMapCanvas
  : OpinionMapSVG;
```

**Canvas Strategy:**
- Main layer: Group clouds (filled regions with gradients)
- Middle layer: User's position (animated dot with label)
- Top layer: Interactive hover targets (invisible but clickable)
- Accessibility: Companion ARIA live region + data table

**SVG Strategy:**
- Group regions as `<path>` with gradients
- User position as highlighted `<circle>`
- Native SVG interactions (hover, focus)
- Screen reader labels on all elements

### 1.3 Visual Encoding System

**Opinion Groups (2-5 clusters):**
- **Shape:** Convex hull boundary (smooth, organic shapes)
- **Fill:** Semi-transparent gradient (purple-600 → pink-600, purple-600 → blue-600, etc.)
- **Opacity:** 0.15 base, 0.3 on hover
- **Stroke:** 2px solid border in group color
- **Label:** Positioned at centroid, white text with shadow

**User's Position:**
- **Shape:** Large circle (20px diameter)
- **Fill:** White with pulsing animation
- **Stroke:** 3px in user's group color
- **Label:** Name/emoji below marker (e.g., "אתם כאן" - "You are here")
- **Shadow:** Drop shadow for depth (0 4px 12px rgba(0,0,0,0.3))

**Statement Highlighting (on click):**
- **Agree regions:** Green tint overlay (0.2 opacity)
- **Disagree regions:** Red tint overlay (0.2 opacity)
- **Mixed regions:** Yellow tint (bridge areas)
- **Annotation:** Small dots at group centroids showing agreement %

**Axes (PCA components):**
- **Style:** Thin gray lines (1px, #e5e7eb)
- **Labels:** Contextual axis names (NOT "PC1/PC2" - see Section 4.3)
- **Grid:** Subtle grid lines every 20% (optional, toggleable)

### 1.4 Interaction Design

**Primary Interactions:**

1. **Pan & Zoom (Desktop only)**
   - Scroll wheel: Zoom (1x - 5x)
   - Click + drag: Pan around space
   - Double-click: Reset view
   - Home button: Re-center on user

2. **Hover Over Group Regions**
   - **Effect:** Increase opacity to 0.3
   - **Tooltip:** Group name, member count, top 3 consensus statements
   - **Duration:** Instant (0ms delay)

3. **Click Statement (from list below map)**
   - **Effect:** Overlay agreement heatmap on opinion map
   - **Animation:** Fade in colored regions (300ms ease-out)
   - **Persistence:** Remains until another statement clicked or "Clear" button

4. **Click User Position**
   - **Effect:** Open "Your Opinion Profile" modal
   - **Contents:** Group membership, similarity to centroid, voting summary

5. **Keyboard Navigation**
   - Tab: Cycle through groups
   - Enter: Select focused group (show details)
   - Escape: Clear selection
   - Arrow keys: Pan map (if zoomed)

**Secondary Interactions:**

6. **Toggle Overlays (toolbar)**
   - Grid lines (on/off)
   - Group labels (on/off)
   - Axis labels (simplified/technical)

7. **Export**
   - PNG download (with attribution)
   - Share link (copies URL)

### 1.5 Animation Specifications

**Component Entrance:**
```typescript
// Framer Motion variants
const mapVariants = {
  initial: { opacity: 0, scale: 0.95 },
  animate: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.6, ease: 'easeOut' }
  }
};

const groupVariants = {
  initial: { opacity: 0, pathLength: 0 },
  animate: {
    opacity: 0.15,
    pathLength: 1,
    transition: { duration: 0.8, ease: 'easeInOut', delay: 0.2 }
  }
};

const userMarkerVariants = {
  initial: { scale: 0, opacity: 0 },
  animate: {
    scale: 1,
    opacity: 1,
    transition: {
      type: 'spring',
      stiffness: 200,
      damping: 15,
      delay: 0.5
    }
  }
};
```

**Real-Time Position Updates:**
- User's marker: Smooth transition over 800ms (cubic-bezier ease)
- Group boundaries: Morph gradually over 1200ms
- Trigger: Debounced by 30s (follows clustering recompute schedule)
- Visual indicator: Small "Updating..." badge during recalculation

**Statement Highlight Animation:**
- Fade in heatmap overlay: 300ms ease-out
- Pulse agreement % labels: Scale 1 → 1.1 → 1 over 600ms

### 1.6 Layout Structure

```
┌─────────────────────────────────────────────────────────┐
│ Opinion Landscape                        [?] [⚙] [⬇]   │ ← Header
├─────────────────────────────────────────────────────────┤
│                                                         │
│   ┌───────────────────────────────────────────┐       │
│   │                                           │       │
│   │        [Opinion Map Canvas/SVG]          │       │
│   │                                           │       │
│   │   Group 1 (purple)    ● You             │       │
│   │                                           │       │
│   │              Group 2 (blue)              │       │
│   │                                           │       │
│   └───────────────────────────────────────────┘       │
│                                                         │
│   Legend: ■ Group 1 (45) ■ Group 2 (38) ■ You         │ ← Legend
├─────────────────────────────────────────────────────────┤
│ Statement Highlights                                    │
│ [Consensus] [Divisive] [Bridge] [All]          ← Tabs  │
│                                                         │
│ Statement list with badges and click-to-highlight...   │
└─────────────────────────────────────────────────────────┘
```

**Responsive Breakpoints:**
- Desktop (≥1024px): Full 2D map with sidebar
- Tablet (768-1023px): Stacked layout, map above statements
- Mobile (<768px): Switch to mobile design (see Section 2)

---

## 2. Mobile Visualization (<768px)

### 2.1 Design Decision: Hybrid Approach

**Mobile challenges with 2D maps:**
- Small screen real estate makes clusters unreadable
- Touch interactions conflict with pan/zoom
- Labels overlap and become illegible
- Users cannot appreciate spatial relationships on 4-5 inch screens

**Solution: Context-Adaptive Rendering**

1. **10-50 participants:** 2D map (simplified)
2. **>50 participants:** Stacked bars (group-based)
3. **User has <10 votes:** Locked state with progress indicator

### 2.2 Simplified 2D Map (10-50 participants)

**Modifications from desktop:**
- No pan/zoom (fixed view centered on user)
- Larger touch targets (48x48px minimum)
- No hover (tap-to-select groups)
- Simplified labels (icons only, names on tap)
- Vertical orientation optimized

**Layout:**
```
┌──────────────────────┐
│  Opinion Groups      │
│  ┌────────────────┐ │
│  │                │ │
│  │   [2D Map]     │ │
│  │   Simplified   │ │
│  │   ● You        │ │
│  │                │ │
│  └────────────────┘ │
│                      │
│  Tap group to see    │
│  characteristics →   │
└──────────────────────┘
```

### 2.3 Stacked Bars (>50 participants)

**Why stacked bars:**
- Clearly shows group proportions
- User's group highlighted prominently
- Easy to understand without spatial reasoning
- Accessible on small screens

**Visual Design:**
```
┌──────────────────────────────────────┐
│ Your Opinion Group                   │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│ Group 2 - Balanced Approach          │
│ 38 participants (32%)        ⭐ You  │
│                                      │
│ All Opinion Groups                   │
│ ────────────────────────────────────│
│ Group 1 ████████████████ 45 (38%)   │
│ Group 2 ████████████ 38 (32%) ⭐    │
│ Group 3 ███████ 24 (20%)            │
│ Group 4 ████ 12 (10%)               │
│                                      │
│ [Tap to explore group →]            │
└──────────────────────────────────────┘
```

**Bar encoding:**
- Width: Proportional to group size
- Color: Group color from palette
- Icon: Star for user's group
- Label: Group name + count + percentage

**Interaction:**
- Tap bar: Expand to show group characteristics
- Accordion pattern: One expanded at a time
- Expanded view shows:
  - Top 3 consensus statements for group
  - Demographic breakdown (if >30 members)
  - Comparison to other groups

### 2.4 Mobile Touch Interactions

**Swipe Gestures:**
- Swipe left/right: Navigate between statement classification tabs
- Swipe up: Collapse expanded group details
- Pull to refresh: Trigger clustering recompute (if >30s since last)

**Tap Targets:**
- Minimum 48x48px (Apple/Android guidelines)
- Visual feedback: 100ms scale animation (0.95)
- Ripple effect on material surfaces

### 2.5 Mobile Performance Optimizations

**Rendering:**
- Use CSS transforms for animations (GPU-accelerated)
- Lazy load statement list (virtualize if >100 statements)
- Debounce clustering updates to 60s on mobile (vs 30s desktop)

**Data Transfer:**
- Request simplified dataset (no full vote matrix)
- Prefetch clustering data on tab switch
- Cache results in localStorage (5min TTL)

---

## 3. Accessibility (WCAG 2.1 AA Compliance)

### 3.1 Keyboard Navigation

**Focus Order:**
1. Opinion map container (receives initial focus)
2. Group regions (tabbable, in visual order left-to-right)
3. User's position marker (focusable)
4. Statement classification tabs
5. Statement list items
6. Action buttons (export, settings)

**Keyboard Shortcuts:**
```
Tab         - Next focusable element
Shift+Tab   - Previous focusable element
Enter       - Select focused group/statement
Space       - Toggle group/statement selection
Escape      - Clear selection, close modals
Arrow keys  - Navigate within map (if zoomed)
H           - Toggle help overlay
```

### 3.2 Screen Reader Support

**ARIA Labels:**
```html
<!-- Opinion map container -->
<div
  role="img"
  aria-label="Opinion landscape showing 3 opinion groups with 83 participants. You are in Group 2."
  aria-describedby="opinion-map-description"
>
  <p id="opinion-map-description" class="sr-only">
    2D visualization of opinion groups based on voting patterns.
    Group 1 has 45 members (38%), Group 2 has 38 members (32%),
    Group 3 has 24 members (20%). You are positioned in Group 2.
  </p>
</div>

<!-- Group region -->
<div
  role="button"
  tabindex="0"
  aria-label="Group 2: Balanced Approach. 38 members. You are in this group."
  aria-pressed="false"
>
  <!-- Visual group region -->
</div>

<!-- User position -->
<div
  role="status"
  aria-label="Your position in opinion space"
  aria-live="polite"
>
  You are positioned at coordinates (0.3, -0.15) in Group 2
</div>
```

**ARIA Live Regions:**
- Real-time clustering updates: `aria-live="polite"`
- Statement selection feedback: `aria-live="assertive"`
- Group expansion: `aria-live="polite"`

**Voice-Over Descriptions (Hebrew):**
```typescript
// lib/strings/he.ts additions
export const clustering = {
  ariaMapLabel: (groups: number, total: number, userGroup: string) =>
    `מפת דעות המציגה ${groups} קבוצות דעה עם ${total} משתתפים. אתם בקבוצה ${userGroup}`,

  ariaGroupLabel: (name: string, count: number, isUserGroup: boolean) =>
    `קבוצה ${name}: ${count} חברים${isUserGroup ? '. אתם בקבוצה זו' : ''}`,

  ariaPositionUpdate: (group: string) =>
    `המיקום שלכם עודכן. אתם כעת בקבוצה ${group}`,

  ariaStatementHighlight: (statement: string, agreement: number) =>
    `עמדה מודגשת: "${statement}". ${agreement}% הסכמה`,
};
```

### 3.3 Alternative Text-Based View

**Toggle:** "Switch to data table view" button (always visible)

**Table Structure:**
```
┌──────────────────────────────────────────────────────┐
│ Opinion Groups - Data Table View                     │
├──────────┬────────┬──────────┬────────────────────────┤
│ Group    │ Size   │ Your Grp │ Top Consensus Stmt     │
├──────────┼────────┼──────────┼────────────────────────┤
│ Group 1  │ 45     │          │ Statement A (92%)      │
│ Group 2  │ 38     │ ⭐ Yes   │ Statement C (85%)      │
│ Group 3  │ 24     │          │ Statement B (78%)      │
└──────────┴────────┴──────────┴────────────────────────┘
```

**Features:**
- Sortable columns (by size, name, consensus)
- Expandable rows (show full group characteristics)
- Keyboard navigable (arrow keys)
- Screen reader friendly (proper `<table>` semantics)

### 3.4 Color Contrast & Visual Encoding

**WCAG AA Requirements:**
- Text contrast: Minimum 4.5:1 (achieved via white text on dark backgrounds)
- UI components: Minimum 3:1 (group borders, user marker)

**Non-Color Encoding (don't rely on color alone):**
- User's group: Star icon + "You" label
- Consensus statements: Green checkmark icon
- Divisive statements: Split icon (two opposing arrows)
- Bridge statements: Bridge icon (connecting arc)

**High Contrast Mode:**
```css
@media (prefers-contrast: high) {
  .opinion-group {
    opacity: 0.4; /* Increase from 0.15 */
    stroke-width: 3px; /* Increase from 2px */
  }

  .user-marker {
    stroke-width: 4px; /* Increase from 3px */
    filter: drop-shadow(0 0 8px currentColor); /* Stronger glow */
  }
}
```

**Reduced Motion:**
```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }

  .user-marker {
    /* No pulsing animation */
  }
}
```

---

## 4. User Onboarding (Making PCA Human-Readable)

### 4.1 First-Time Tutorial (Interactive Overlay)

**Trigger:** First time user sees clustering visualization

**Steps (5 screens, progressive disclosure):**

1. **Welcome**
   ```
   ┌────────────────────────────────────┐
   │  🗺️  מפת הדעות שלכם                │
   │                                    │
   │  גלו איפה אתם ממוקמים במרחב       │
   │  הדעות ביחס למשתתפים אחרים        │
   │                                    │
   │  [המשיכו →]        [דלגו >]       │
   └────────────────────────────────────┘
   ```

2. **Groups Explanation**
   ```
   ┌────────────────────────────────────┐
   │  קבוצות דעה                        │
   │                                    │
   │  [Highlight group regions]         │
   │                                    │
   │  כל צבע מייצג קבוצת משתתפים       │
   │  עם דפוסי הצבעה דומים              │
   │                                    │
   │  [← הקודם]  [המשיכו →]  [דלגו >]  │
   └────────────────────────────────────┘
   ```

3. **Your Position**
   ```
   ┌────────────────────────────────────┐
   │  המיקום שלכם                       │
   │                                    │
   │  [Highlight user marker]           │
   │                                    │
   │  הנקודה המוארת מראה איפה אתם      │
   │  ממוקמים לפי הצבעותיכם             │
   │                                    │
   │  [← הקודם]  [המשיכו →]  [דלגו >]  │
   └────────────────────────────────────┘
   ```

4. **Exploring Statements**
   ```
   ┌────────────────────────────────────┐
   │  חקרו עמדות                        │
   │                                    │
   │  [Highlight statement list]        │
   │                                    │
   │  לחצו על עמדה כדי לראות איך       │
   │  קבוצות שונות הצביעו עליה          │
   │                                    │
   │  [← הקודם]  [המשיכו →]  [דלגו >]  │
   └────────────────────────────────────┘
   ```

5. **Get Started**
   ```
   ┌────────────────────────────────────┐
   │  מוכנים לחקור! 🎉                 │
   │                                    │
   │  שימו לב:                          │
   │  • קו הצטרפות - עמדות מאחדות       │
   │  • קו פילוג - עמדות מפלגות         │
   │  • קו גשר - פוטנציאל לדיאלוג       │
   │                                    │
   │  [← הקודם]      [בואו נתחיל! ✓]  │
   └────────────────────────────────────┘
   ```

**Implementation:**
```typescript
// components/results-v2/opinion-clustering/OnboardingTutorial.tsx
export function OnboardingTutorial({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(0);
  const steps = [/* 5 steps */];

  // Save completion to localStorage
  const handleComplete = () => {
    localStorage.setItem('clustering_onboarding_completed', 'true');
    onComplete();
  };

  return (
    <motion.div
      className="fixed inset-0 bg-black/80 z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {/* Tutorial step UI */}
    </motion.div>
  );
}
```

### 4.2 Help System (Always Available)

**Help Button:** "?" icon in top-right of clustering card

**Help Panel Content:**
```
┌─────────────────────────────────────────┐
│ 💡 איך לקרוא את המפה                    │
├─────────────────────────────────────────┤
│ קבוצות דעה                              │
│ אזורים צבעוניים מייצגים קבוצות של      │
│ אנשים שהצביעו באופן דומה                │
│                                         │
│ המיקום שלכם                             │
│ הנקודה המוארת מציגה את דפוס ההצבעות    │
│ שלכם ביחס לכולם                         │
│                                         │
│ סוגי עמדות                              │
│ ✓ הסכמה - רוב הקבוצות מסכימות           │
│ ↔ פילוג - קבוצות חלוקות                │
│ ⌒ גשר - עמדות מקשרות בין קבוצות        │
│                                         │
│ [סגור]                   [הדרכה מלאה →]│
└─────────────────────────────────────────┘
```

### 4.3 Axis Interpretation (Human-Readable Labels)

**Challenge:** PCA components are abstract mathematical constructs

**Solution:** Semantic axis labeling based on statement loadings

**Algorithm:**
```typescript
// lib/utils/axis-labeling.ts
export function generateAxisLabels(
  pcaLoadings: number[][], // [statements][components]
  statements: Statement[]
): { pc1Label: string; pc2Label: string } {

  // Find statements with highest absolute loadings on PC1
  const pc1TopStatements = findTopLoadings(pcaLoadings, 0, statements);

  // Analyze semantic themes
  const pc1Theme = inferTheme(pc1TopStatements);
  // e.g., "Economic Policy" vs "Social Issues"

  // Repeat for PC2
  const pc2TopStatements = findTopLoadings(pcaLoadings, 1, statements);
  const pc2Theme = inferTheme(pc2TopStatements);

  return {
    pc1Label: pc1Theme || "Opinion Dimension 1",
    pc2Label: pc2Theme || "Opinion Dimension 2"
  };
}

function inferTheme(statements: Statement[]): string | null {
  // Use keyword extraction or simple heuristics
  // For MVP: Just use top statement's category if available
  // Future: Use LLM to generate descriptive label

  const categories = statements.map(s => s.category).filter(Boolean);
  if (categories.length > 0) {
    return mostCommon(categories);
  }
  return null;
}
```

**Display Options:**
- Simple mode: "דימנזיה 1" / "דימנזיה 2" (Dimension 1/2)
- Advanced mode: Semantic labels (e.g., "מדיניות כלכלית" / "סוגיות חברתיות")
- Technical mode: "PC1 (45% שונות)" / "PC2 (23% שונות)" (with variance %)

**User Control:** Toggle in settings icon (⚙)

### 4.4 Tooltips & Contextual Help

**Persistent Hints:**
- First 3 visits: Show hint badge "Click statement to see voting patterns"
- Hover over axis labels: "This dimension separates opinions based on..."
- Empty group: "This area represents uncommitted voters"

**Tooltip Delays:**
- Desktop: 500ms hover delay
- Mobile: N/A (tap-to-show instead)

---

## 5. Gamification (Exploration & Discovery)

### 5.1 Achievement Integration

**Clustering-Related Achievements:**

```typescript
// lib/gamification/clustering-achievements.ts
export const CLUSTERING_ACHIEVEMENTS = [
  {
    id: 'explorer',
    emoji: '🔍',
    nameHe: 'חוקר דעות',
    descriptionHe: 'צפיתם במפת הדעות לראשונה',
    trigger: 'first_view_clustering',
    rarity: 'common'
  },
  {
    id: 'bridge_builder',
    emoji: '🌉',
    nameHe: 'בונה גשרים',
    descriptionHe: 'הצבעותיכם קרובות לשתי קבוצות דעה שונות',
    trigger: 'low_cluster_confidence', // <0.6 silhouette
    rarity: 'rare'
  },
  {
    id: 'consensus_seeker',
    emoji: '🤝',
    nameHe: 'מחפש הסכמה',
    descriptionHe: 'הסכמתם עם 80%+ מהעמדות המוסכמות',
    trigger: 'high_consensus_alignment',
    rarity: 'rare'
  },
  {
    id: 'independent_thinker',
    emoji: '💡',
    nameHe: 'חושב עצמאי',
    descriptionHe: 'המיקום שלכם רחוק ממרכזי כל הקבוצות',
    trigger: 'outlier_position',
    rarity: 'legendary'
  },
  {
    id: 'group_representative',
    emoji: '🎯',
    nameHe: 'נציג קבוצה',
    descriptionHe: 'קרובים מאוד למרכז הקבוצה שלכם',
    trigger: 'near_centroid', // <0.1 distance
    rarity: 'common'
  }
];
```

**Achievement Display:**
- Unlock notification: Confetti + modal (existing pattern)
- Badge on user marker: Small icon overlay
- Profile page: "Clustering Explorer" badge tier

### 5.2 Exploration Prompts

**Contextual Prompts Based on Position:**

```typescript
// lib/utils/exploration-prompts.ts
export function getExplorationPrompt(
  userPosition: ClusterPosition,
  groups: OpinionGroup[]
): ExplorationPrompt | null {

  // User near boundary between two groups
  if (isBetweenGroups(userPosition, groups)) {
    return {
      textHe: 'אתם ממוקמים בין שתי קבוצות דעה. לחצו כאן לגלות את העמדות המקשרות ביניהן',
      actionLabel: 'גלו עמדות גשר',
      actionType: 'show_bridge_statements'
    };
  }

  // User in minority group
  const userGroup = getUserGroup(userPosition, groups);
  if (isMinorityGroup(userGroup, groups)) {
    return {
      textHe: 'אתם בקבוצה קטנה יחסית. ראו מה ייחודי בדפוס ההצבעה שלכם',
      actionLabel: 'ראו עמדות ייחודיות',
      actionType: 'show_unique_statements'
    };
  }

  // User moved groups since last visit
  if (hasChangedGroups(userPosition)) {
    return {
      textHe: 'שימו לב! המיקום שלכם השתנה מאז הביקור האחרון',
      actionLabel: 'למה זה קרה?',
      actionType: 'show_position_change_explanation'
    };
  }

  return null;
}
```

**Prompt UI:**
```
┌────────────────────────────────────────┐
│ 💡 הצעה לחקירה                        │
│                                        │
│ אתם ממוקמים בין שתי קבוצות דעה.       │
│ לחצו כאן לגלות את העמדות המקשרות       │
│ ביניהן ולראות היכן יש פוטנציאל        │
│ לדיאלוג.                               │
│                                        │
│ [גלו עמדות גשר →]          [X]        │
└────────────────────────────────────────┘
```

### 5.3 Social Comparison (Privacy-Safe)

**What Users Can See:**
- Group sizes (anonymous counts)
- Group consensus statements
- Comparative stats: "Your group voted 85% agree on X, others voted 45%"

**What Users CANNOT See:**
- Other individual user positions
- Names/identities of group members
- Who specifically voted how

**Comparison UI:**
```
┌────────────────────────────────────────┐
│ איך הקבוצה שלכם משתווה?                │
├────────────────────────────────────────┤
│ עמדה: "יש להגדיל תקציבי חינוך"        │
│                                        │
│ הקבוצה שלכם (Group 2):                │
│ ████████████████ 85% מסכימים           │
│                                        │
│ כלל המשתתפים:                          │
│ ██████████ 58% מסכימים                 │
│                                        │
│ [עוד השוואות →]                       │
└────────────────────────────────────────┘
```

### 5.4 Engagement Hooks

**Progressive Revelation:**
1. **First view:** Show 2D map + basic legend
2. **After 30s exploration:** Unlock statement highlighting
3. **After exploring 3 statements:** Unlock group comparison view
4. **After viewing all sections:** Unlock export/share features

**Nudges:**
- "83% of users found bridge statements helpful. Try it?"
- "Your opinion group grew by 5 members since yesterday!"
- "New consensus emerged: [Statement]. See details →"

---

## 6. Privacy-Preserving Design (Finalized Approach)

### 6.1 What Users Can See

**Own Data (Full Access):**
- Own position coordinates (x, y in PCA space)
- Own group assignment
- Own distance from group centroid
- Own voting pattern summary

**Aggregate Data (Anonymous):**
- Group boundaries (convex hulls)
- Group centroids (average positions)
- Group member counts
- Group-level voting statistics (% agree/disagree per statement)

**Derived Insights:**
- Consensus statements (cross-group agreement)
- Divisive statements (between-group disagreement)
- Bridge statements (connect groups)

### 6.2 What Users CANNOT See

**Forbidden (Privacy Protection):**
- Other individual user positions (no dots, no markers)
- Other individual user names/identities in clustering context
- Vote-by-vote breakdown for individuals
- Exact position coordinates for others

### 6.3 Small Group Handling (<5 members)

**Decision:** ALWAYS show group counts and aggregate stats

**Rationale:**
- Voting is already semi-public (statements show total counts)
- Clustering adds analytical layer, not new privacy exposure
- Groups are based on voting patterns, not personal attributes
- Users opted into participation by voting

**Safeguards:**
- No individual markers (even in small groups)
- Group statistics rounded (e.g., "4-6 members" instead of "5")
- Minimum 3 members to form a group (smaller = outliers)

**UI for Small Groups:**
```
Group 3 (Small Group)
4-6 members

This is a smaller opinion group. Aggregate
statistics show general patterns, but no
individual voting details are visible.

[View group consensus statements →]
```

### 6.4 Technical Privacy Implementation

**Database Queries:**
```typescript
// ✓ ALLOWED: Aggregate group data
const groupStats = await db
  .select({
    groupId: userOpinionGroups.groupId,
    memberCount: count(),
    centroidX: avg(userOpinionGroups.pc1),
    centroidY: avg(userOpinionGroups.pc2)
  })
  .from(userOpinionGroups)
  .where(eq(userOpinionGroups.pollId, pollId))
  .groupBy(userOpinionGroups.groupId);

// ✗ FORBIDDEN: Individual positions for others
// Never expose this to client-side:
const allUserPositions = await db
  .select()
  .from(userOpinionGroups)
  .where(eq(userOpinionGroups.pollId, pollId));
// ^^^ Only use server-side for computations
```

**API Design:**
```typescript
// GET /api/clustering/[pollId]
// Returns ONLY:
{
  groups: [
    { id: 1, name: "Group 1", memberCount: 45, centroid: [0.2, -0.3], boundary: [[...]] }
  ],
  currentUser: {
    position: [0.3, -0.15],
    groupId: 2,
    confidence: 0.85
  },
  consensusStatements: [...],
  bridgeStatements: [...]
}
// Does NOT return: positions of other users
```

---

## 7. Integration with Existing Pulse UI

### 7.1 Placement in Results View

**New Tab in Results Page:**
```typescript
// app/polls/[slug]/page.tsx
const RESULTS_TABS = [
  { id: 'overview', labelHe: 'סקירה' },
  { id: 'clustering', labelHe: 'מפת דעות' }, // NEW
  { id: 'statements', labelHe: 'כל העמדות' },
  { id: 'demographics', labelHe: 'התפלגות' }
];
```

**Visibility Rules:**
- Minimum 10 voters (business rule)
- User has voted on ≥10 statements (unlock threshold)
- Clustering computation completed (background job)

**Locked State UI:**
```
┌────────────────────────────────────────┐
│ 🔒 מפת דעות                            │
│                                        │
│ הצביעו על 7 עמדות נוספות לפתוח את     │
│ מפת הדעות ולראות היכן אתם ממוקמים     │
│ ביחס למשתתפים אחרים.                  │
│                                        │
│ ████████████░░░░░░░ 3/10 הצבעות       │
│                                        │
│ [חזרו להצבעה →]                       │
└────────────────────────────────────────┘
```

### 7.2 Design Token Usage

**Following Pulse Design System:**
```typescript
// components/results-v2/opinion-clustering/OpinionLandscapeCard.tsx
import { colors, typography, radius, shadows } from '@/lib/design-tokens-v2';

const cardStyles = {
  background: colors.background.card.white,
  borderRadius: radius.card, // 24px
  boxShadow: shadows.card,
  padding: '2rem',
};

const groupColors = [
  colors.primary.purple[600], // Group 1
  colors.primary.pink[600],   // Group 2
  '#3b82f6',                  // blue-500 for Group 3
  '#10b981',                  // emerald-500 for Group 4
  '#f59e0b',                  // amber-500 for Group 5
];
```

**Page Background:**
```tsx
<div className="bg-gradient-page min-h-screen">
  {/* Purple gradient background */}
  <div className="container mx-auto p-4 sm:p-6">
    <OpinionLandscapeCard />
  </div>
</div>
```

### 7.3 Hebrew Strings Integration

**New strings in `lib/strings/he.ts`:**
```typescript
export const clustering = {
  // Tab & Headers
  tabTitle: 'מפת דעות',
  cardTitle: 'נוף הדעות',
  cardDescription: 'גלו איפה אתם ממוקמים במרחב הדעות',

  // Onboarding
  onboardingWelcome: 'ברוכים הבאים למפת הדעות!',
  onboardingGroupsTitle: 'קבוצות דעה',
  onboardingGroupsBody: 'כל צבע מייצג קבוצת משתתפים עם דפוסי הצבעה דומים',
  onboardingYourPositionTitle: 'המיקום שלכם',
  onboardingYourPositionBody: 'הנקודה המוארת מראה איפה אתם ממוקמים לפי הצבעותיכם',

  // Groups
  groupLabel: (num: number) => `קבוצה ${num}`,
  yourGroup: 'הקבוצה שלכם',
  groupSize: (count: number) => `${count} חברים`,
  groupPercentage: (pct: number) => `${pct}% מהמשתתפים`,

  // Statement Classifications
  consensusLabel: 'הסכמה רחבה',
  divisiveLabel: 'עמדה מפלגת',
  bridgeLabel: 'עמדת גשר',

  // Actions
  exploreStatements: 'חקרו עמדות',
  viewGroupDetails: 'צפו בפרטי קבוצה',
  exportMap: 'ייצוא מפה',
  shareLink: 'שיתוף קישור',

  // Locked State
  lockedTitle: 'מפת דעות נעולה',
  lockedMessage: (remaining: number) =>
    `הצביעו על ${remaining} עמדות נוספות לפתוח`,

  // Help
  helpTitle: 'איך לקרוא את המפה',
  helpGroupsTitle: 'קבוצות דעה',
  helpGroupsBody: 'אזורים צבעוניים מייצגים קבוצות של אנשים שהצביעו באופן דומה',
  helpPositionTitle: 'המיקום שלכם',
  helpPositionBody: 'הנקודה המוארת מציגה את דפוס ההצבעות שלכם ביחס לכולם',

  // Accessibility
  ariaMapLabel: (groups: number, total: number, userGroup: string) =>
    `מפת דעות המציגה ${groups} קבוצות דעה עם ${total} משתתפים. אתם בקבוצה ${userGroup}`,
  ariaGroupLabel: (name: string, count: number, isUserGroup: boolean) =>
    `קבוצה ${name}: ${count} חברים${isUserGroup ? '. אתם בקבוצה זו' : ''}`,

  // Achievements
  achievementExplorer: 'חוקר דעות',
  achievementBridgeBuilder: 'בונה גשרים',
  achievementConsensusSeeker: 'מחפש הסכמה',
};
```

### 7.4 Responsive Breakpoints

**Using existing `useMobile` hook:**
```typescript
import { useIsMobile } from '@/hooks/use-mobile';

export function OpinionLandscapeCard() {
  const isMobile = useIsMobile(); // <768px

  return (
    <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6">
      {isMobile ? (
        <MobileClusteringView />
      ) : (
        <DesktopOpinionMap />
      )}
    </div>
  );
}
```

**Tailwind Breakpoints:**
- `sm:` 640px+ (small tablets)
- `md:` 768px+ (tablets, useMobile returns false)
- `lg:` 1024px+ (desktops)

**Layout Adjustments:**
```tsx
<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
  {/* Opinion map */}
  <div className="col-span-1 lg:col-span-2">
    <OpinionMapCanvas />
  </div>

  {/* Group stats */}
  <div className="col-span-1">
    <GroupStatsCard />
  </div>

  {/* Statement list */}
  <div className="col-span-1">
    <StatementHighlightList />
  </div>
</div>
```

---

## 8. Component Specifications (Implementation Ready)

### 8.1 Main Container Component

**File:** `components/results-v2/opinion-clustering/OpinionLandscapeCard.tsx`

```typescript
import { clustering } from '@/lib/strings/he';
import { useIsMobile } from '@/hooks/use-mobile';
import { useState, useEffect } from 'react';
import { OpinionMapCanvas } from './OpinionMapCanvas';
import { MobileClusteringView } from './MobileClusteringView';
import { OnboardingTutorial } from './OnboardingTutorial';

interface OpinionLandscapeCardProps {
  pollId: string;
  userId: string;
  minVotesRequired: number; // From poll settings or default 10
}

export function OpinionLandscapeCard({
  pollId,
  userId,
  minVotesRequired
}: OpinionLandscapeCardProps) {
  const isMobile = useIsMobile();
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Fetch clustering data
  const { data, isLoading } = useClusteringData(pollId, userId);

  // Check if onboarding needed
  useEffect(() => {
    const completed = localStorage.getItem('clustering_onboarding_completed');
    if (!completed && data) {
      setShowOnboarding(true);
    }
  }, [data]);

  // Locked state
  if (data?.userVoteCount < minVotesRequired) {
    return <LockedStateCard remaining={minVotesRequired - data.userVoteCount} />;
  }

  return (
    <>
      {showOnboarding && (
        <OnboardingTutorial onComplete={() => setShowOnboarding(false)} />
      )}

      <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6" dir="rtl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
              {clustering.cardTitle}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {clustering.cardDescription}
            </p>
          </div>

          <div className="flex gap-2">
            <HelpButton />
            <SettingsButton />
            <ExportButton />
          </div>
        </div>

        {/* Main Content */}
        {isMobile ? (
          <MobileClusteringView data={data} />
        ) : (
          <DesktopOpinionMap data={data} />
        )}
      </div>
    </>
  );
}
```

### 8.2 Canvas Rendering Component

**File:** `components/results-v2/opinion-clustering/OpinionMapCanvas.tsx`

```typescript
import { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

interface OpinionMapCanvasProps {
  groups: OpinionGroup[];
  userPosition: { x: number; y: number; groupId: number };
  onGroupClick?: (groupId: number) => void;
  highlightedStatement?: string | null;
}

export function OpinionMapCanvas({
  groups,
  userPosition,
  onGroupClick,
  highlightedStatement
}: OpinionMapCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    // Clear
    ctx.clearRect(0, 0, rect.width, rect.height);

    // Draw groups
    groups.forEach(group => drawGroup(ctx, group, rect));

    // Draw user position
    drawUserMarker(ctx, userPosition, rect);

    // Draw statement overlay if selected
    if (highlightedStatement) {
      drawStatementOverlay(ctx, highlightedStatement, groups, rect);
    }
  }, [groups, userPosition, highlightedStatement]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="relative w-full h-[500px] bg-gray-50 rounded-xl overflow-hidden"
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        role="img"
        aria-label={getAriaLabel(groups, userPosition)}
      />

      {/* Invisible interaction layer */}
      <InteractionLayer
        groups={groups}
        onGroupClick={onGroupClick}
      />
    </motion.div>
  );
}

// Helper functions
function drawGroup(
  ctx: CanvasRenderingContext2D,
  group: OpinionGroup,
  bounds: DOMRect
) {
  // Convert PCA coordinates to canvas coordinates
  const canvasPoints = group.boundary.map(([x, y]) =>
    pcaToCanvas(x, y, bounds)
  );

  // Draw filled region
  ctx.fillStyle = `${group.color}26`; // 15% opacity
  ctx.beginPath();
  ctx.moveTo(canvasPoints[0].x, canvasPoints[0].y);
  canvasPoints.forEach(p => ctx.lineTo(p.x, p.y));
  ctx.closePath();
  ctx.fill();

  // Draw border
  ctx.strokeStyle = group.color;
  ctx.lineWidth = 2;
  ctx.stroke();

  // Draw label at centroid
  const centroid = pcaToCanvas(group.centroid[0], group.centroid[1], bounds);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 14px Rubik';
  ctx.textAlign = 'center';
  ctx.fillText(group.name, centroid.x, centroid.y);
}

function drawUserMarker(
  ctx: CanvasRenderingContext2D,
  position: { x: number; y: number },
  bounds: DOMRect
) {
  const pos = pcaToCanvas(position.x, position.y, bounds);

  // Outer glow
  ctx.shadowColor = 'rgba(147, 51, 234, 0.5)';
  ctx.shadowBlur = 12;

  // White circle
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(pos.x, pos.y, 10, 0, Math.PI * 2);
  ctx.fill();

  // Purple border
  ctx.strokeStyle = '#9333ea';
  ctx.lineWidth = 3;
  ctx.stroke();

  // Reset shadow
  ctx.shadowBlur = 0;

  // Label
  ctx.fillStyle = '#1f2937';
  ctx.font = '12px Rubik';
  ctx.textAlign = 'center';
  ctx.fillText('אתם כאן', pos.x, pos.y + 25);
}

function pcaToCanvas(
  x: number,
  y: number,
  bounds: DOMRect
): { x: number; y: number } {
  // PCA coords are typically -2 to +2
  // Map to canvas 0 to width/height with padding
  const padding = 40;
  const scale = (bounds.width - 2 * padding) / 4; // 4 = range from -2 to +2

  return {
    x: (x + 2) * scale + padding,
    y: bounds.height - ((y + 2) * scale + padding) // Flip Y axis
  };
}
```

### 8.3 Mobile Stacked Bars Component

**File:** `components/results-v2/opinion-clustering/MobileClusteringView.tsx`

```typescript
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { clustering } from '@/lib/strings/he';

interface MobileClusteringViewProps {
  data: ClusteringData;
}

export function MobileClusteringView({ data }: MobileClusteringViewProps) {
  const [expandedGroupId, setExpandedGroupId] = useState<number | null>(null);

  // Use simplified 2D map for small polls
  if (data.groups.length <= 3 && data.totalParticipants < 50) {
    return <SimplifiedOpinionMap data={data} />;
  }

  // Stacked bars for larger polls
  return (
    <div className="space-y-4">
      {/* User's group highlight */}
      <div className="bg-gradient-poll-header p-4 rounded-xl text-white">
        <div className="text-sm font-medium mb-1">{clustering.yourGroup}</div>
        <div className="text-xl font-bold">
          {data.userGroup.name}
        </div>
        <div className="text-sm mt-1 opacity-90">
          {clustering.groupSize(data.userGroup.memberCount)}
          {' '}·{' '}
          {clustering.groupPercentage(
            Math.round((data.userGroup.memberCount / data.totalParticipants) * 100)
          )}
        </div>
      </div>

      {/* All groups */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-gray-700 mb-2">
          כל קבוצות הדעה
        </h3>

        {data.groups.map(group => (
          <GroupBar
            key={group.id}
            group={group}
            totalParticipants={data.totalParticipants}
            isUserGroup={group.id === data.userGroup.id}
            isExpanded={expandedGroupId === group.id}
            onToggle={() => setExpandedGroupId(
              expandedGroupId === group.id ? null : group.id
            )}
          />
        ))}
      </div>
    </div>
  );
}

interface GroupBarProps {
  group: OpinionGroup;
  totalParticipants: number;
  isUserGroup: boolean;
  isExpanded: boolean;
  onToggle: () => void;
}

function GroupBar({
  group,
  totalParticipants,
  isUserGroup,
  isExpanded,
  onToggle
}: GroupBarProps) {
  const percentage = Math.round((group.memberCount / totalParticipants) * 100);

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      {/* Bar header */}
      <button
        onClick={onToggle}
        className="w-full p-3 flex items-center gap-3 hover:bg-gray-50 transition-colors"
      >
        {/* Color indicator */}
        <div
          className="w-1 h-12 rounded-full"
          style={{ backgroundColor: group.color }}
        />

        {/* Progress bar */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold text-gray-900">
              {group.name}
              {isUserGroup && ' ⭐'}
            </span>
            <span className="text-sm text-gray-600">
              {group.memberCount} ({percentage}%)
            </span>
          </div>

          <div className="w-full bg-gray-200 rounded-full h-2">
            <motion.div
              className="h-2 rounded-full"
              style={{ backgroundColor: group.color }}
              initial={{ width: 0 }}
              animate={{ width: `${percentage}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
          </div>
        </div>

        {/* Expand icon */}
        <ChevronIcon isExpanded={isExpanded} />
      </button>

      {/* Expanded details */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="border-t border-gray-200 p-3 bg-gray-50"
          >
            <GroupDetails group={group} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
```

### 8.4 Accessibility Data Table Component

**File:** `components/results-v2/opinion-clustering/ClusteringDataTable.tsx`

```typescript
import { clustering } from '@/lib/strings/he';

interface ClusteringDataTableProps {
  groups: OpinionGroup[];
  userGroupId: number;
}

export function ClusteringDataTable({
  groups,
  userGroupId
}: ClusteringDataTableProps) {
  return (
    <div className="overflow-x-auto" dir="rtl">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-4 py-3 text-right text-xs font-bold text-gray-700 uppercase">
              קבוצה
            </th>
            <th scope="col" className="px-4 py-3 text-right text-xs font-bold text-gray-700 uppercase">
              גודל
            </th>
            <th scope="col" className="px-4 py-3 text-right text-xs font-bold text-gray-700 uppercase">
              הקבוצה שלכם
            </th>
            <th scope="col" className="px-4 py-3 text-right text-xs font-bold text-gray-700 uppercase">
              עמדות הסכמה מובילות
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {groups.map(group => (
            <tr
              key={group.id}
              className={group.id === userGroupId ? 'bg-purple-50' : ''}
            >
              <td className="px-4 py-3 whitespace-nowrap">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: group.color }}
                  />
                  <span className="font-medium">{group.name}</span>
                </div>
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                {group.memberCount}
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                {group.id === userGroupId && (
                  <span className="text-purple-600 font-semibold">⭐ כן</span>
                )}
              </td>
              <td className="px-4 py-3 text-sm text-gray-700">
                {group.topConsensusStatements.slice(0, 2).join(', ')}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

---

## 9. Technical Implementation Notes

### 9.1 Data Fetching Strategy

```typescript
// lib/hooks/use-clustering-data.ts
export function useClusteringData(pollId: string, userId: string) {
  return useQuery({
    queryKey: ['clustering', pollId, userId],
    queryFn: () => fetchClusteringData(pollId, userId),
    staleTime: 30_000, // 30s (matches clustering recompute debounce)
    refetchInterval: 60_000, // Refetch every 60s for real-time updates
  });
}

async function fetchClusteringData(pollId: string, userId: string) {
  const res = await fetch(`/api/clustering/${pollId}?userId=${userId}`);
  if (!res.ok) throw new Error('Failed to fetch clustering data');
  return res.json() as Promise<ClusteringData>;
}
```

### 9.2 Performance Budget

**Rendering Performance:**
- First Contentful Paint (FCP): <1.5s
- Time to Interactive (TTI): <3s
- Canvas draw time: <100ms
- Statement highlight animation: <300ms

**Data Size:**
- Maximum payload: 100KB compressed
- Groups: ~5 objects × 500B = 2.5KB
- User position: 200B
- Statement classifications: 50 statements × 300B = 15KB
- Total estimate: ~20KB (well within budget)

### 9.3 Error Handling

```typescript
// Error states
interface ClusteringError {
  code: 'INSUFFICIENT_DATA' | 'COMPUTATION_FAILED' | 'NOT_FOUND';
  message: string;
  retryable: boolean;
}

// Error UI
function ClusteringErrorState({ error }: { error: ClusteringError }) {
  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center">
      <div className="text-4xl mb-3">⚠️</div>
      <h3 className="text-lg font-semibold text-yellow-900 mb-2">
        {getErrorTitle(error.code)}
      </h3>
      <p className="text-yellow-800 mb-4">
        {error.message}
      </p>
      {error.retryable && (
        <button
          onClick={retry}
          className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
        >
          נסו שוב
        </button>
      )}
    </div>
  );
}
```

### 9.4 Testing Strategy

**Unit Tests:**
- PCA coordinate transformation (pcaToCanvas)
- Group boundary calculations
- Statement classification logic
- Hebrew string formatting

**Integration Tests:**
- Canvas rendering with mock data
- Mobile/desktop responsive switching
- Accessibility keyboard navigation
- Real-time update handling

**E2E Tests (Playwright):**
- Full user journey: vote → unlock clustering → explore
- Onboarding tutorial flow
- Statement highlighting interactions
- Export/share functionality

**Visual Regression Tests:**
- Screenshot comparison for map rendering
- Group color consistency
- RTL layout verification

---

## 10. Deployment Checklist

**Before Launch:**
- [ ] Clustering backend computation tested with 1000+ votes
- [ ] Canvas rendering performs well on low-end devices
- [ ] Mobile stacked bars tested on iOS/Android
- [ ] Screen reader navigation verified (NVDA, VoiceOver)
- [ ] Keyboard navigation complete (no mouse-only interactions)
- [ ] Hebrew RTL layout validated
- [ ] Color contrast meets WCAG AA (all text)
- [ ] Reduced motion preferences respected
- [ ] Achievement integration tested
- [ ] Privacy safeguards verified (no individual positions leaked)
- [ ] Error states handled gracefully
- [ ] Loading states smooth and informative
- [ ] Export functionality works (PNG, link sharing)
- [ ] Analytics events tracked (view, explore, share)

**Documentation:**
- [ ] User-facing help documentation (Hebrew)
- [ ] Admin guide for interpretation
- [ ] Developer API documentation
- [ ] Accessibility conformance report

---

## Appendix A: Design Wireframes (Text Descriptions)

### A.1 Desktop Full View

```
┌────────────────────────────────────────────────────────────────┐
│ [Header: "נוף הדעות" | Help | Settings | Export]               │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  ┌──────────────────────────────────┐  ┌──────────────────┐  │
│  │                                  │  │  Legend          │  │
│  │                                  │  │                  │  │
│  │        [2D Opinion Map]          │  │  ■ Group 1 (45)  │  │
│  │                                  │  │  ■ Group 2 (38)  │  │
│  │   Group 1 (purple cloud)         │  │  ■ Group 3 (24)  │  │
│  │                                  │  │  ● You           │  │
│  │              ● You (white dot)   │  │                  │  │
│  │                                  │  │  [Table View ⇄]  │  │
│  │   Group 2 (blue cloud)           │  │                  │  │
│  │                                  │  └──────────────────┘  │
│  │                                  │                        │
│  └──────────────────────────────────┘                        │
│                                                                │
├────────────────────────────────────────────────────────────────┤
│  Statement Classifications                                     │
│  [הסכמה] [פילוג] [גשר] [הכל]                ← Tabs            │
│                                                                │
│  ✓ Statement A (85% consensus)                                │
│  ↔ Statement B (highly divisive)                              │
│  ⌒ Statement C (bridge opinion)                               │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### A.2 Mobile Stacked Bars

```
┌──────────────────────┐
│ הקבוצה שלכם          │
│ ════════════════════ │
│ Group 2              │
│ Balanced Approach    │
│ 38 participants ⭐   │
│                      │
│ כל קבוצות הדעה       │
│ ──────────────────── │
│ Group 1              │
│ ████████████████ 45  │
│                      │
│ Group 2  ⭐          │
│ ████████████ 38      │
│ [Details ▼]          │
│                      │
│ Group 3              │
│ ███████ 24           │
│                      │
└──────────────────────┘
```

### A.3 Onboarding Overlay

```
[Dimmed background with spotlight on map]

┌────────────────────────────────┐
│  🗺️  מפת הדעות שלכם            │
│                                │
│  גלו איפה אתם ממוקמים במרחב   │
│  הדעות ביחס למשתתפים אחרים    │
│                                │
│  ○ ○ ● ○ ○  (step 3/5)        │
│                                │
│  [← הקודם]  [המשיכו →] [דלגו] │
└────────────────────────────────┘
```

---

## Appendix B: Technical Dependencies

**New Package Requirements:**
```json
{
  "dependencies": {
    // Already in project:
    "framer-motion": "^10.x",
    "recharts": "^2.x",
    "@tanstack/react-query": "^5.x",

    // May need to add:
    "d3-scale": "^4.0.2",        // For coordinate transformations
    "d3-shape": "^3.2.0",        // For convex hull calculations
    "canvas-confetti": "^1.6.0"  // For achievement celebrations
  }
}
```

**Build Configuration:**
- No changes needed (Canvas API is native)
- Ensure Framer Motion SSR compatibility

---

**End of Specification**

This document provides complete, implementation-ready specifications for opinion clustering visualization in Pulse. All design decisions have been finalized, accessibility requirements met, and integration points with existing architecture defined.

Next step: Begin implementation following the component specifications in Section 8.
