# Pol.is-Style Voting Platform - Development Guide

## 1. Product Overview

### What We're Building
A mobile-first opinion polling platform that allows users to vote on statements, discover their voting profiles, and see group consensus. Think Pol.is meets Instagram Stories.

### Core Philosophy
- **Anonymous first, auth optional**: Users can vote immediately without login
- **Batch-based engagement**: Present statements in manageable chunks (10 at a time) to reduce overwhelm
- **Progressive disclosure**: Show features when relevant, not all at once
- **Reward participation**: Personal insights as emotional payoff for engagement

---

## 2. Key User Flows

### Flow 1: First-Time Voter (Open Poll)
```
Home → Click Poll → Vote on 10 statements → Demographics Form → 
See Results + Personal Insight → Prompted to sign up → Continue voting (optional)
```

### Flow 2: Returning Voter (Open Poll, 5 votes, has demographics)
```
Home → Click Poll → Resume at statement 6 → Complete 10 minimum → 
See Results → Vote on next batch (optional)
```

### Flow 3: Returning Voter (Open Poll, 5 votes, no demographics yet)
```
Home → Click Poll → Resume at statement 6 → Complete 10 minimum → 
Demographics Form → See Results
```

### Flow 4: Viewing Closed Poll (Participated)
```
Home → Click Closed Poll → Direct to Results → 
See "You voted on 7/10 before closing" → See personal insight
```

### Flow 5: Viewing Closed Poll (Never Participated)
```
Home → Click Closed Poll → Direct to Results → 
See closure banner → View group statistics only
```

---

## 3. Core UX Principles

### Principle 1: Keep It Simple
**Problem**: Too many options = decision paralysis  
**Solution**: 
- One clear action per screen
- "Vote Now" or "View Results" - never both
- No dropdown menus or hidden navigation

### Principle 2: Value Exchange Before Friction
**Problem**: Asking for data upfront kills engagement  
**Solution**: 
- Let users vote first (experience value)
- Gate Results with demographics form (fair exchange)
- Clear messaging: "Answer 4 questions to see your results"
- Collect demographics ONCE, never ask again

### Principle 2: Value Exchange Before Friction
**Problem**: Asking for data upfront kills engagement  
**Solution**: 
- Let users vote first (experience value)
- Gate Results with demographics form (fair exchange)
- Clear messaging: "Answer 4 questions to see your results"
- Collect demographics ONCE, never ask again

### Principle 3: Mobile-First Design
**Why**: 70%+ users on mobile  
**Implementation**:
- Touch targets minimum 44px
- Responsive text sizes (`text-sm sm:text-base`)
- Swipe-friendly interactions
- Stacked layouts on small screens

### Principle 4: Progressive Disclosure
**Don't show users what they can't access yet**

Examples:
- Results tab locked until 10 votes: `Results (7/10)`
- Vote tab hidden for closed polls
- Auth prompts shown at high-value moments, not immediately
- Demographics form shown only after minimum votes

### Principle 5: Clear Visual Hierarchy
**Status communication through design:**

| State | Visual Treatment | Button Text |
|-------|-----------------|-------------|
| Open poll | Full color, vibrant | "Vote Now" |
| Closed poll | 75% opacity, red badge | "View Results" |
| Current statement | Full color voting buttons | - |
| After voting | Stats appear on buttons | - |

---

## 4. Technical Architecture

### State Management

#### Poll-Level State
```javascript
{
  id: 'work-culture',
  title: 'Team Work Culture',
  isClosed: false,
  closedDate: null,
  statements: [...],
  participants: 36
}
```

#### User-Level State (Per Poll)
```javascript
{
  pollId: 'work-culture',
  votes: { 1: 'agree', 2: 'disagree', 5: 'pass' },
  currentStatementIndex: 7,
  currentBatch: 0
}
```

**Critical**: Each poll has its own voting state. Don't mix votes across polls.

### Batch System Logic

```javascript
const BATCH_SIZE = 10;

// Calculate current batch
const batchStart = currentBatch * BATCH_SIZE;
const batchEnd = Math.min(batchStart + BATCH_SIZE, statements.length);
const currentBatchStatements = statements.slice(batchStart, batchEnd);

// Check if more batches exist
const hasMoreBatches = batchEnd < statements.length;
```

**Why batches?**
- Reduces cognitive load (10 vs 100 statements)
- Creates natural stopping points
- Instagram-style progress bar stays clean (max 10 segments)

### Smart Routing Logic

**When user enters a poll:**
```javascript
if (poll.isClosed) {
  → Go to Results (always)
} else if (userVotedCount >= 10) {
  → Go to Results (reward for reaching minimum)
} else {
  → Go to Vote (need to reach minimum first)
}
```

**Why this matters**: Sets user expectations correctly from entry.

---

## 5. The 6 Use Cases Matrix

| # | Poll State | User State | Entry Point | Available Views | Special Handling |
|---|------------|-----------|-------------|-----------------|------------------|
| 1 | Closed | Participated | Results only | Results | Show profile + "voted X/Y before closing" |
| 2 | Closed | Didn't participate | Results only | Results | Closure banner, no profile |
| 3 | Open | No votes, no demographics | Vote | Vote only | Results locked "(0/10)", demographics after 10 |
| 4 | Open | 1-9 votes, no demographics | Vote | Vote only | Results locked "(7/10)", demographics after 10 |
| 5 | Open | 10+ votes, has demographics | Results | Vote + Results | Both unlocked, starts at Results |
| 6 | Open | All done, has demographics | Results | Vote + Results | Celebration message + share |

**Developer note**: Test all 6 scenarios. Most bugs come from edge cases 1, 2, and 4.

**New critical flow**: After reaching 10 votes, if user has no demographics, show demographics form BEFORE Results.

---

## 6. Demographics Collection System

### Why Demographics?

To understand voting patterns across different demographic groups and provide users with insights like:
- "78% of your age group agrees with you"
- "Your views align with 60% of moderates"

### The Strategy: Gate Results, Not Entry

**DO:**
- ✅ Let users vote first (10 statements minimum)
- ✅ Show demographics form AFTER 10th vote, BEFORE Results
- ✅ Frame as value exchange: "Help us understand our community"
- ✅ Collect ONCE per user, never ask again
- ✅ Make completion required (all 4 fields)
- ✅ Include "Prefer not to say" option

**DON'T:**
- ❌ Ask before first vote (kills engagement)
- ❌ Make it optional (incomplete data is useless)
- ❌ Ask multiple times
- ❌ Ask creepy/invasive questions
- ❌ Link demographics to individual votes publicly

### The 4 Questions

```javascript
demographics: {
  gender: 'female' | 'male' | 'non-binary' | 'prefer-not-say',
  ageGroup: 'under-18' | '18-24' | '25-34' | '35-44' | '45-54' | '55-64' | '65+' | 'prefer-not-say',
  ethnicity: 'white' | 'black' | 'hispanic' | 'asian' | 'middle-eastern' | 'mixed' | 'other' | 'prefer-not-say',
  politicalParty: 'very-liberal' | 'liberal' | 'moderate' | 'conservative' | 'very-conservative' | 'independent' | 'other' | 'prefer-not-say'
}
```

### Form Design

**Visual Treatment:**
- Modal overlay (like post-poll prompt)
- 4 dropdown select fields
- Disabled submit button until all fields complete
- "See My Results" button (enabled when complete)
- "Why we ask" + "Privacy" links in footer
- Privacy assurance text

**Copy:**
```
Heading: "Help us understand our community"
Subtext: "Answer 4 quick questions to unlock your personalized voting profile"
Button (incomplete): "Complete all fields" (disabled, gray)
Button (complete): "See My Results" (enabled, purple)
Footer: "Your votes remain anonymous. We only use demographics to show group trends."
```

### Flow Logic

```javascript
// After 10th vote
if (!user.hasDemographics) {
  showDemographicsForm();
} else {
  showResults();
}

// After demographics submission
setHasDemographics(true);
showResults();
```

### Data Storage

```javascript
{
  userId: '...',
  hasDemographics: true,
  demographics: {
    gender: 'female',
    ageGroup: '25-34',
    ethnicity: 'asian',
    politicalParty: 'moderate',
    collectedAt: '2025-10-15T12:00:00Z'
  }
}
```

**Important:** Store `hasDemographics` boolean separately to quickly check if user needs the form.

### Privacy & Trust

**Transparency:**
- Explain WHY you need this data (in "Why we ask" modal)
- Show examples of insights they'll get
- Promise anonymity

**"Why We Ask" Modal Content:**
```
Title: "Why we ask for demographics"

Body:
- Understanding diverse perspectives: These questions help us 
  understand how different groups view important topics.
  
- Better insights: We can show you how your views compare to 
  others in your demographic group.
  
- Improving our analysis: Demographic data helps us identify 
  consensus and differences across communities.
  
- Your privacy: All responses are anonymous and used only for 
  aggregate analysis. We never link your demographics to your 
  individual votes.
```

### Completion Rate Expectations

- Target: 85%+ completion
- Acceptable: 75%+
- Concerning: <70% (indicates friction issue)

If completion rate is low, consider:
1. Simplifying questions
2. Better copy/messaging
3. A/B testing different approaches

---

## 7. Personal Insight Algorithm

### Logic
```javascript
if (agreePercent > 70) → "The Optimist" 🌟
else if (disagreePercent > 60) → "The Critical Thinker" 🔍
else if (passPercent > 40) → "The Thoughtful Observer" 🤔
else if (|agrees - disagrees| <= 2) → "The Balanced Evaluator" ⚖️
else → "The Engaged Contributor" 💡
```

### When to Show
- ✅ User voted 1+ times AND viewing Results
- ❌ User hasn't voted (show generic view)
- ❌ Poll is closed AND user never voted

**Why**: Insights are personal rewards. Don't fake them.

---

## 8. Authentication Strategy (Phase 1)

### The Principle: "Invite, Don't Gate"

**Don't block**: Let users experience value first  
**Do invite**: Show benefits at high-value moments

**Note:** Demographics collection is separate from authentication. Users can vote and provide demographics without creating an account.

### Auth Prompt Placement

1. **Home page**: Small "Sign Up" button (top-right) + dismissible banner (bottom)
2. **After first poll completion**: Modal with 3 benefits listed
3. **Inside profile card**: Small link "💾 Sign up to save this profile"

### Prompt Timing
```
User votes on 1st poll → Complete → Modal appears
User dismisses banner → Don't show again (this session)
User sees 3+ prompts → Stop prompting (avoid nagging)
```

**Copy guidelines**:
- ✅ "Save your voting profiles across topics"
- ✅ "Get notified about new polls"
- ❌ "Sign up now!" (no urgency/pressure)
- ❌ "You need an account to continue" (don't block)

---

## 8. Mobile Optimization Checklist

### Typography
```css
/* Base pattern */
className="text-sm sm:text-base"

/* Headers */
className="text-2xl sm:text-3xl"

/* Buttons */
className="py-2.5 sm:py-3"
```

### Spacing
```css
/* Padding */
className="p-4 sm:p-6"

/* Gaps */
className="gap-2 sm:gap-3"

/* Margins */
className="mb-4 sm:mb-6"
```

### Icons
```jsx
<Icon size={16} className="sm:w-[18px] sm:h-[18px]" />
```

### Hidden Elements
```css
/* Hide on very small screens */
className="hidden xs:inline"
```

**Testing requirement**: Every screen must be tested at 320px width (iPhone SE).

---

## 9. Animation & Feedback

### Voting Flow Animations

**1. Statement Transition** (1 second)
```
Vote → Stats appear on buttons → Pulse animation → 
Wait 1s → Next statement
```

**Why 1 second?** 
- 800ms: Too fast, user can't read stats
- 1000ms: Perfect - time to process
- 1500ms: Too slow, feels sluggish

**2. Progress Bar**
Instagram-style segments:
- Completed: Full white
- Current: Animating fill
- Upcoming: Empty (30% opacity)

**3. Button Hover States**
```css
/* Disagree/Agree buttons */
hover: scale-up by 20% (flex-[1.2])
after-vote: scale to 110% + pulse
```

### Micro-interactions
- Card hover: `-translate-y-1` (lift effect)
- Button click: Scale pulse
- Stats reveal: Fade in + slide up

**Performance note**: Use CSS transforms (not position changes) for 60fps.

---

## 10. Data Structure Reference

### Poll Object (Complete)
```javascript
{
  id: string,              // Unique identifier
  title: string,           // Display name
  emoji: string,           // Visual identifier
  description: string,     // Subtitle
  question: string,        // Main prompt shown while voting
  participants: number,    // Total who voted
  statementCount: number,  // Total statements
  isClosed: boolean,       // Poll status
  closedDate: string|null, // "2025-10-01" or null
  statements: Statement[]  // Array of statements
}
```

### Statement Object
```javascript
{
  id: number,        // Unique within poll
  text: string,      // The statement text
  author: string,    // Who submitted it
  agree: number,     // Count of agrees
  disagree: number,  // Count of disagrees
  pass: number       // Count of passes
}
```

### User Vote State
```javascript
{
  [pollId]: {
    votes: { [statementId]: 'agree'|'disagree'|'pass' },
    currentStatementIndex: number,
    currentBatch: number,
    lastVisited: timestamp
  }
}
```

---

## 11. Common Pitfalls & Solutions

### Pitfall 1: Vote State Persists Across Polls
**Problem**: User votes on Poll A, clicks Poll B, sees Poll A's votes  
**Solution**: Clear votes on `handleSelectPoll()`
```javascript
setVotes({});
setRevealedStats({});
```

### Pitfall 2: Results Tab Accessible Before 10 Votes
**Problem**: Logic checks `votedCount < 10` but doesn't disable button  
**Solution**: 
```javascript
disabled={!canSeeResults}
className={!canSeeResults ? 'cursor-not-allowed opacity-40' : ''}
```

### Pitfall 3: Closed Poll Shows Vote Tab
**Problem**: Conditional rendering only checks `activeView`  
**Solution**: Check both `activeView === 'vote' && !poll.isClosed`

### Pitfall 4: Auth Prompts Spam User
**Problem**: Prompt shows after every action  
**Solution**: Track dismissals and completion state:
```javascript
const [hasCompletedFirstPoll, setHasCompletedFirstPoll] = useState(false);
// Only show modal once
```

### Pitfall 5: Mobile Buttons Too Small
**Problem**: Button text too small on mobile, hard to tap  
**Solution**: Minimum touch target 44x44px:
```css
className="py-3" /* ≥ 44px height */
```

---

## 12. Testing Scenarios

### Critical Path Tests

**Test 1: Complete First Poll (New User)**
1. Land on home page
2. Click any open poll
3. Vote on 10 statements
4. Verify demographics form shows
5. Fill all 4 fields
6. Verify submit button enables
7. Click "See My Results"
8. Verify Results view shows
9. Verify personal insight appears
10. Verify post-poll modal shows (first time only)

**Test 2: Complete First Poll (Has Demographics)**
1. User already filled demographics
2. Vote on 10 statements
3. Verify NO demographics form shows
4. Verify goes directly to Results

**Test 3: Partial Voting (No Demographics)**
1. Start poll, vote 5 times
2. Leave and return
3. Verify Results still locked "(5/10)"
4. Vote 5 more
5. Verify demographics form shows
6. Complete form
7. Verify Results unlocks

**Test 2: Closed Poll Viewing**
1. Click closed poll
2. Verify redirects to Results (skips Vote)
3. Verify yellow closure banner shows
4. Verify no Vote tab exists

**Test 3: Partial Voting**
1. Start poll, vote 5 times
2. Leave and return
3. Verify Results still locked "(5/10)"
4. Vote 5 more
5. Verify Results unlocks

**Test 4: Batch System**
1. Vote on 10 statements (complete batch 1)
2. Go to Results
3. Click "Vote on Next Batch"
4. Verify new progress bar (starts fresh)
5. Verify continues from statement 11

### Edge Cases

- Empty poll (0 statements) - shouldn't exist
- Single statement poll - batch = 1, works normally
- User votes, poll closes, user returns - show partial message
- User completes all, poll adds more - "There's more!" shows
- Rapid clicking during vote animation - buttons disabled
- User refreshes during demographics form - save partial progress to localStorage
- User closes tab during demographics - on return, show form again
- User with demographics votes on new poll - skip demographics form

---

## 13. Performance Considerations

### Optimization Points

**1. Statement Rendering**
- Don't render all statements at once
- Only render current batch (max 10)
- Use `slice()` not `filter()`

**2. Image/Emoji Loading**
- Use system emojis (no image assets)
- Lazy load poll cards if list grows >20

**3. Animation Performance**
- Use `transform` not `margin/top/left`
- Use `will-change` for animated elements
- Debounce hover states

**4. State Updates**
- Batch state updates in vote handler
- Don't trigger re-renders during animation

### Bundle Size Target
- Initial load: < 100KB (gzipped)
- Full app: < 300KB
- No external dependencies except React + Lucide icons

---

## 14. Accessibility Requirements

### Keyboard Navigation
```
Tab: Move between interactive elements
Enter/Space: Activate buttons
Escape: Close modals
Arrow keys: Navigate statements (nice-to-have)
```

### Screen Readers
```jsx
// Voting buttons
<button aria-label="Agree with this statement">
  <ThumbsUp />
  Agree
</button>

// Progress indicator
<div role="progressbar" aria-valuenow={votedCount} aria-valuemax={10}>
  {votedCount} / 10 votes
</div>

// Locked Results tab
<button disabled aria-label="Results locked until 10 votes">
  Results (7/10)
</button>
```

### Color Contrast
- All text: Minimum 4.5:1 ratio
- Buttons: Minimum 3:1 ratio
- Disabled states: Clear visual distinction

### Focus States
All interactive elements must have visible focus rings:
```css
focus:outline-none focus:ring-2 focus:ring-purple-500
```

---

## 15. Future Considerations (Not in Scope)

### Phase 2 Features (Authenticated Users)
- Save voting history across devices
- Email notifications for new polls
- Create custom polls
- Follow specific topics
- Compare profiles with friends

### Phase 3 Features (Advanced)
- Real-time vote updates
- Opinion clustering visualization (Pol.is-style map)
- Statement moderation
- Multi-language support
- Export results as PDF

### Technical Debt to Address
- Local storage for anonymous users (resume sessions)
- Backend API integration
- Real authentication system
- Analytics tracking
- A/B testing framework

---

## 16. Development Workflow

### Recommended Build Order

**Week 1: Core Voting**
1. Poll data structure
2. Home page + poll cards
3. Single statement voting UI
4. Vote recording logic

**Week 2: Batch System**
1. Batch calculation logic
2. Progress bar
3. Batch transitions
4. "Next batch" flow

**Week 3: Demographics & Results**
1. Demographics form component
2. Demographics gate logic
3. Results view layout
4. Personal insight algorithm
5. Stats calculations

**Week 4: Polish & Edge Cases**
1. Closed polls
2. All 6 use cases + demographics flow
3. Auth prompts
4. Mobile optimization
5. Animations

### Code Review Checklist
- [ ] All 6 use cases tested
- [ ] Demographics form shows after 10 votes (if not already filled)
- [ ] Demographics required (all 4 fields) before Results
- [ ] Demographics only collected ONCE per user
- [ ] "Prefer not to say" option for all fields
- [ ] "Why we ask" modal functional
- [ ] Mobile tested at 320px width
- [ ] Vote state cleared between polls
- [ ] Results locked until 10 votes
- [ ] Closed polls skip to Results
- [ ] Auth prompts dismissible
- [ ] Animations perform at 60fps
- [ ] Accessibility standards met
- [ ] No console errors
- [ ] No layout shifts (CLS)

---

## 17. Design Tokens

### Colors
```javascript
primary: 'purple-600',    // #9333ea
secondary: 'pink-600',    // #db2777
success: 'green-500',     // #22c55e
error: 'red-500',         // #ef4444
warning: 'yellow-500',    // #eab308
background: 'slate-900',  // #0f172a
```

### Spacing Scale
```
xs: 0.5rem  // 8px
sm: 0.75rem // 12px
md: 1rem    // 16px
lg: 1.5rem  // 24px
xl: 2rem    // 32px
```

### Typography Scale
```
xs: 0.75rem   // 12px
sm: 0.875rem  // 14px
base: 1rem    // 16px
lg: 1.125rem  // 18px
xl: 1.25rem   // 20px
2xl: 1.5rem   // 24px
3xl: 1.875rem // 30px
```

### Border Radius
```
sm: 0.375rem  // 6px
md: 0.5rem    // 8px
lg: 0.75rem   // 12px
xl: 1rem      // 16px
2xl: 1.5rem   // 24px
```

---

## 18. Key Takeaways for Developers

### What Makes This Work

1. **Simplicity First**: One action per screen, clear paths
2. **Mobile-Optimized**: Every decision considers thumb-reach
3. **Batch Mental Model**: 10 at a time, always
4. **Progressive Disclosure**: Show when relevant, not before
5. **Emotional Payoff**: Personal insights as reward
6. **Anonymous Default**: Auth is enhancement, not requirement

### What to Avoid

1. ❌ Don't add features "just in case"
2. ❌ Don't force login early
3. ❌ Don't overwhelm with too many statements
4. ❌ Don't hide poll status (open vs closed)
5. ❌ Don't spam auth prompts
6. ❌ Don't sacrifice mobile for desktop

### Philosophy

> "The best interface is the one that gets out of the user's way. Our job is to make voting feel effortless, not to show off features."

---

## Questions for Product/Engineering Sync

1. **Backend**: What's the API structure for polls and votes?
2. **Demographics**: How should we store demographic data? Separate table? Encrypted?
3. **Auth**: Using OAuth? Magic links? Email/password?
4. **Real-time**: Do votes update live or on page refresh?
5. **Analytics**: What events should we track? (votes, demographics completion, etc.)
6. **Notifications**: Email? Push? In-app only?
7. **Moderation**: How do we handle inappropriate statements?
8. **Scaling**: Expected concurrent users per poll?
9. **Data retention**: How long do we keep closed polls? What about demographics?
10. **GDPR/Privacy**: Do we need user consent for demographic collection? Data deletion process?

---

## Appendix A: Component Hierarchy

```
App
├── HomePage
│   ├── Header (+ Sign Up button)
│   ├── PollGrid
│   │   └── PollCard (x3)
│   │       ├── Badge (if closed)
│   │       └── Button
│   └── SignUpBanner (dismissible)
│
└── PollPage
    ├── Header (+ Back button + Status badge)
    ├── ClosureBanner (if closed)
    ├── TabNavigation (if open)
    │   ├── VoteTab
    │   └── ResultsTab
    │
    ├── VoteView (if activeView === 'vote')
    │   ├── ProgressBar
    │   ├── QuestionCard
    │   ├── StatementCard
    │   │   ├── StatementText
    │   │   ├── VotingButtons
    │   │   │   ├── DisagreeButton
    │   │   │   └── AgreeButton
    │   │   └── ActionButtons
    │   │       ├── PassButton
    │   │       └── AddStatementButton
    │   └── AddStatementModal
    │
    └── ResultsView (if activeView === 'results')
        ├── PartialParticipationBanner (if closed + partial)
        ├── PersonalInsightCard (if voted)
        │   ├── ProfileHeader
        │   ├── Description
        │   └── ShareButton
        ├── NextBatchPrompt (if more batches)
        ├── CompletionMessage (if all done)
        ├── StatsGrid
        ├── ConsensusSection
        └── AllStatementsSection

Modals (Global)
├── DemographicsForm (after 10 votes, before Results)
│   ├── 4 Select Fields
│   ├── Submit Button
│   └── Footer Links (Why we ask, Privacy)
├── WhyWeAskModal (explains demographics)
└── PostPollPrompt (after first completion)
```

---

## Appendix B: Demographics Data Model

### User Object
```javascript
{
  userId: string,
  hasDemographics: boolean,
  demographics: {
    gender: string,
    ageGroup: string,
    ethnicity: string,
    politicalParty: string,
    collectedAt: timestamp
  },
  votes: {
    [pollId]: {
      [statementId]: 'agree' | 'disagree' | 'pass'
    }
  }
}
```

### Privacy Considerations
- Store demographics separately from individual votes
- Use aggregate queries only: "How many 25-34 year olds agreed?"
- Never expose: "User X is 25-34 and voted this way"
- Implement data retention policy (delete after N months?)
- Provide user data export/deletion on request (GDPR)

---

**Document Version**: 2.0  
**Last Updated**: October 2025  
**Changes**: Added Demographics Collection System (Section 6)  
**Author**: Design + Engineering Team  
**Status**: Ready for Development