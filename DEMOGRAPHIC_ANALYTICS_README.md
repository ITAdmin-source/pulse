# Demographic Analytics Infrastructure

## Overview

This document describes the complete demographic analytics system that enables vote distribution analysis by demographic categories (age group, gender, ethnicity, political party).

## Architecture

### 1. Database Layer (`db/queries/demographic-analytics-queries.ts`)

**Query Functions:**
- `getVoteBreakdownByAgeGroup(statementId)` - Statement-level breakdown by age
- `getVoteBreakdownByGender(statementId)` - Statement-level breakdown by gender
- `getVoteBreakdownByEthnicity(statementId)` - Statement-level breakdown by ethnicity
- `getVoteBreakdownByPoliticalParty(statementId)` - Statement-level breakdown by political party
- `getPollVoteBreakdownByAgeGroup(pollId)` - Poll-level aggregate breakdown by age
- `getPollVoteBreakdownByGender(pollId)` - Poll-level aggregate breakdown by gender
- `getPollVoteBreakdownByEthnicity(pollId)` - Poll-level aggregate breakdown by ethnicity
- `getPollVoteBreakdownByPoliticalParty(pollId)` - Poll-level aggregate breakdown by political party
- `getPollParticipantsByDemographic(pollId)` - Participant count per demographic category

**Data Structure:**
```typescript
interface DemographicVoteBreakdown {
  categoryId: number;
  categoryLabel: string;
  agreeCount: number;
  disagreeCount: number;
  neutralCount: number;
  totalVotes: number;
  agreePercent: number;
  disagreePercent: number;
  neutralPercent: number;
}
```

**Query Features:**
- Uses SQL JOIN operations to combine votes, users, and demographics
- Calculates counts and percentages in a single query
- Groups by demographic category labels
- Only includes approved statements

### 2. Service Layer (`lib/services/poll-results-service.ts`)

**Methods:**
- `getDemographicBreakdown(statementId, privacyThreshold)` - Statement-level breakdown with privacy filtering
- `getPollDemographicBreakdown(pollId, privacyThreshold)` - Poll-level breakdown with privacy filtering

**Privacy Protection:**
- Default privacy threshold: **5 votes minimum** per category
- Categories with fewer votes are filtered out to prevent re-identification
- Threshold can be adjusted (admin/manager can use threshold of 3)

### 3. Server Actions (`actions/demographic-analytics-actions.ts`)

**Actions:**

1. **`getPollDemographicBreakdownAction(pollId, privacyThreshold)`**
   - Public access (no authorization required)
   - Returns demographic breakdown for any poll
   - Uses default privacy threshold of 5

2. **`getStatementDemographicBreakdownAction(statementId, privacyThreshold)`**
   - Public access (no authorization required)
   - Returns demographic breakdown for specific statement
   - Uses default privacy threshold of 5

3. **`getDetailedDemographicAnalyticsAction(pollId, userId)`**
   - **Requires authorization:** Admin OR Poll Manager OR Poll Owner
   - Lower privacy threshold (3 instead of 5)
   - Returns unauthorized flag if user lacks permission

4. **`exportDemographicAnalyticsAction(pollId, userId)`**
   - **Requires authorization:** Admin OR Poll Manager OR Poll Owner
   - Exports demographic data as JSON
   - Returns unauthorized flag if user lacks permission

**Authorization Logic:**
```typescript
// Check if user is authorized
const isAdmin = await UserService.isSystemAdmin(userId);
const isPollManager = await UserService.isPollManager(userId, pollId);
const poll = await getPollById(pollId);
const isOwner = poll && poll.creatorId === userId;

if (!isAdmin && !isPollManager && !isOwner) {
  return { success: false, unauthorized: true };
}
```

### 4. UI Components (`components/analytics/`)

**Components:**

1. **`DemographicBreakdownChart`**
   - Visualizes demographic data using Recharts
   - Supports stacked or grouped bar charts
   - Shows percentages or raw counts
   - Custom Hebrew tooltips with RTL support
   - Handles empty data states gracefully

2. **`DemographicFilters`**
   - Filter selector for demographic categories
   - Options: All, Age Group, Gender, Ethnicity, Political Party
   - RTL-aware layout

3. **`DemographicAnalyticsDashboard`**
   - Comprehensive dashboard component
   - Fetches and displays demographic data
   - Participant distribution summary
   - Multiple charts based on selected filters
   - Export functionality (when authorized)
   - Loading and error states
   - Privacy-aware (shows message when insufficient data)

**Features:**
- Full Hebrew localization with RTL support
- Responsive design for mobile/desktop
- Animated transitions using Framer Motion
- Toast notifications for user feedback
- Empty state handling

## Integration Points

### 1. Public Results Page (`app/polls/[slug]/results/page.tsx`)

**Integration:**
```tsx
<DemographicAnalyticsDashboard
  pollId={poll.id}
  privacyThreshold={5}
  title="ניתוח דמוגרפי"
  description="התפלגות בחירות לפי קבוצות דמוגרפיות"
/>
```

**Behavior:**
- Available to all users (voters and non-voters)
- Uses standard privacy threshold (5)
- No export functionality
- Shows demographic breakdown alongside poll results

### 2. Admin Analytics Page (`app/admin/analytics/page.tsx`)

**Integration:**
```tsx
<DemographicAnalyticsDashboard
  pollId={selectedPollId}
  userId={user.id}
  showExport={true}
  privacyThreshold={3}
  title="Detailed Demographic Analytics"
  description="In-depth demographic breakdown with export capabilities (Admin View)"
/>
```

**Behavior:**
- Requires admin authentication
- Poll selector to choose which poll to analyze
- Lower privacy threshold (3)
- Export functionality enabled
- Links to manage and view polls

**Navigation:**
- Added to admin dashboard quick actions
- Direct link: `/admin/analytics`

## Privacy & Security

### Privacy Protections

1. **Minimum Vote Threshold**
   - Public views: 5 votes minimum per category
   - Admin/Manager views: 3 votes minimum per category
   - Prevents re-identification of individual voters

2. **Category Filtering**
   - Categories below threshold are automatically removed
   - Only shows categories with sufficient participation
   - Applies to all demographic dimensions

3. **Anonymous Support**
   - Works with both anonymous and authenticated users
   - No personally identifiable information exposed
   - Only aggregate statistics shown

### Authorization Levels

1. **Public Users**
   - Can view demographic breakdowns (with threshold of 5)
   - Cannot export data
   - Cannot adjust privacy threshold

2. **Poll Owners**
   - Can view detailed analytics (threshold of 3)
   - Can export demographic data
   - Only for their own polls

3. **Poll Managers**
   - Same permissions as poll owners
   - For polls they manage (via role assignment)

4. **System Admins**
   - Can view detailed analytics for all polls
   - Can export data for all polls
   - Access to system-wide analytics dashboard

## Data Flow

### Public Results Flow
```
User → Results Page
  ↓
getPollDemographicBreakdownAction(pollId, threshold=5)
  ↓
PollResultsService.getPollDemographicBreakdown(pollId, 5)
  ↓
demographic-analytics-queries (multiple parallel queries)
  ↓
Apply privacy filter (remove categories < 5 votes)
  ↓
Return filtered data
  ↓
DemographicAnalyticsDashboard renders charts
```

### Admin Analytics Flow
```
Admin → Admin Analytics Page
  ↓
Select Poll
  ↓
getDetailedDemographicAnalyticsAction(pollId, userId)
  ↓
Authorization check (admin/manager/owner)
  ↓
PollResultsService.getPollDemographicBreakdown(pollId, 3)
  ↓
demographic-analytics-queries (multiple parallel queries)
  ↓
Apply privacy filter (remove categories < 3 votes)
  ↓
Return filtered data
  ↓
DemographicAnalyticsDashboard renders charts + export button
```

## Chart Types & Visualizations

### Stacked Bar Chart (Default)
- Shows 100% composition of each demographic category
- Bars divided into Keep/Throw/Pass segments
- Useful for comparing relative proportions

### Grouped Bar Chart (Optional)
- Shows Keep/Throw/Pass as separate bars side-by-side
- Useful for comparing absolute values across categories

### Chart Features
- Hebrew labels with RTL support
- Custom tooltips showing counts and percentages
- Color coding: Green (Keep), Red (Throw), Gray (Pass)
- Responsive sizing
- Empty state handling

## Future Enhancements

### Potential Features
1. **Cross-demographic analysis** - Compare multiple demographics simultaneously
2. **Trend analysis** - Track how demographics change over time
3. **Statement-level heatmaps** - Visual representation of agreement patterns
4. **Comparative polls** - Compare demographic patterns across multiple polls
5. **Export formats** - CSV, Excel, PDF reports
6. **Advanced filtering** - Filter by specific demographic values
7. **Statistical significance** - Highlight statistically significant differences

### Performance Optimizations
1. **Caching** - Cache demographic breakdowns (similar to poll summaries)
2. **Incremental updates** - Update only changed data
3. **Pagination** - For polls with many statements
4. **Background processing** - Pre-calculate breakdowns for published polls

## Usage Examples

### Example 1: View Public Demographics
```typescript
// In any component
import { getPollDemographicBreakdownAction } from "@/actions/demographic-analytics-actions";

const result = await getPollDemographicBreakdownAction(pollId, 5);
if (result.success) {
  console.log(result.data.byAgeGroup);
  console.log(result.data.byGender);
}
```

### Example 2: Export Demographics (Admin)
```typescript
// In admin component
import { exportDemographicAnalyticsAction } from "@/actions/demographic-analytics-actions";

const result = await exportDemographicAnalyticsAction(pollId, userId);
if (result.success && result.data) {
  // result.data is JSON string
  downloadFile(result.data, `analytics-${pollId}.json`);
}
```

### Example 3: Custom Component
```typescript
<DemographicAnalyticsDashboard
  pollId="poll-123"
  userId="user-456"
  showExport={true}
  privacyThreshold={3}
  title="Custom Analytics"
  description="Your custom description"
/>
```

## Testing Considerations

### Test Cases
1. **Privacy threshold enforcement**
   - Verify categories below threshold are filtered
   - Test with different threshold values

2. **Authorization**
   - Non-admin cannot access detailed analytics
   - Non-owner cannot export other polls
   - Verify proper error messages

3. **Empty data handling**
   - Poll with no votes
   - Poll with no demographic data
   - Categories all below threshold

4. **Data accuracy**
   - Verify percentages sum to 100%
   - Verify counts match raw vote data
   - Cross-check with manual calculations

5. **UI/UX**
   - RTL layout works correctly
   - Charts render properly on mobile
   - Loading states display correctly
   - Error messages are clear

## Conclusion

The demographic analytics infrastructure provides a comprehensive, privacy-aware system for analyzing vote distributions across demographic categories. It supports both public viewing (with strong privacy protections) and admin/manager access (with detailed insights and export capabilities). The system is fully integrated into the Pulse application and ready for production use.
