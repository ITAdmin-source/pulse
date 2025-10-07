# Phase 2: Admin & Manager Workflow Enhancements - Implementation Guide

## Context

This project (Pulse - participatory polling platform) has completed **Phase 1** of implementing Use Case 4 (Admin & Manager Workflows) from [USE_CASES.md](../../USE_CASES.md). We've achieved ~85% coverage with the following completions:

### ✅ Phase 1 Completed Features:
1. **Ownership Transfer** - Full implementation at [components/modals/transfer-ownership-modal.tsx](../../components/modals/transfer-ownership-modal.tsx)
2. **Real Admin Dashboard** - Live statistics via [lib/services/admin-service.ts](../../lib/services/admin-service.ts)
3. **Poll Deletion UI** - Management interface at [app/admin/polls/page.tsx](../../app/admin/polls/page.tsx)

### 📋 Phase 2 Objectives

Complete the remaining admin/manager workflow features to achieve 95%+ coverage:

---

## Task 2.1: User Management Interface

**Priority:** High
**Estimated Effort:** 10-12 hours
**Complexity:** High

### Requirements

Build a centralized user management interface for system administrators with the following capabilities:

#### 1. User List Page (`app/admin/users/page.tsx`)

**Features:**
- Display all users (authenticated and anonymous) in a paginated table
- Show key information per user:
  - Email/Clerk ID (authenticated) or Session ID (anonymous)
  - User type badge (authenticated/anonymous)
  - Number of polls participated in
  - Total votes cast
  - Current roles (system_admin, poll_owner, poll_manager)
  - Account creation date
- Search functionality by email, Clerk ID, or session ID
- Filter options:
  - User type (all/authenticated/anonymous)
  - Has roles (all/admin/owner/manager/none)
  - Activity level (active/inactive)
- Pagination (20 users per page)
- Click user row to open details modal

#### 2. User Management Service (`lib/services/user-management-service.ts`)

**Required Methods:**
```typescript
class UserManagementService {
  // List users with pagination and filtering
  static async listUsers(options: {
    page: number;
    limit: number;
    search?: string;
    userType?: 'all' | 'authenticated' | 'anonymous';
    roleFilter?: 'all' | 'admin' | 'owner' | 'manager' | 'none';
  }): Promise<{
    users: Array<{
      id: string;
      email?: string;
      clerkUserId?: string;
      sessionId?: string;
      type: 'authenticated' | 'anonymous';
      pollsParticipated: number;
      totalVotes: number;
      roles: string[];
      createdAt: Date;
    }>;
    totalCount: number;
    totalPages: number;
  }>;

  // Get detailed user participation stats
  static async getUserStats(userId: string): Promise<{
    pollsParticipated: string[]; // poll IDs
    totalVotes: number;
    insightsGenerated: number;
    statementsSubmitted: number;
    roles: Array<{ role: string; pollId?: string }>;
  }>;

  // Assign/revoke system_admin role
  static async assignSystemAdmin(userId: string): Promise<void>;
  static async revokeSystemAdmin(userId: string): Promise<void>;
}
```

#### 3. User Details Modal (`components/admin/user-details-modal.tsx`)

**Features:**
- Display comprehensive user information:
  - Basic info (ID, email, type, created date)
  - Participation summary (polls, votes, insights)
  - Role assignments (with poll context)
  - Demographics (if provided)
- Actions available:
  - Assign/Revoke system_admin role (if current user is admin)
  - View user's insights (link to polls)
  - Export user data (future feature placeholder)
- Warning before assigning system_admin role
- Success/error toast notifications

#### 4. Server Actions (`actions/user-management-actions.ts`)

**Required Actions:**
```typescript
export async function listUsersAction(options: ListUsersOptions);
export async function getUserStatsAction(userId: string);
export async function assignSystemAdminAction(userId: string);
export async function revokeSystemAdminAction(userId: string);
```

### Implementation Notes

**Database Queries:**
- Join `users` with `votes`, `user_roles`, `user_poll_insights` for stats
- Use SQL COUNT for performance on large datasets
- Implement cursor-based pagination if user count > 10,000

**Permission Checks:**
- Only system_admin users can access this interface
- Middleware should protect `/admin/users` route
- Add permission check in each server action

**UI/UX Considerations:**
- Use data table component from shadcn/ui
- Loading skeletons during data fetch
- Empty state with helpful message
- Mobile-responsive design

**Testing Requirements:**
- Unit tests for UserManagementService
- Integration tests for server actions
- E2E test for user search and role assignment

---

## Task 2.3: Improve Manager Addition UX

**Priority:** Medium
**Estimated Effort:** 5-6 hours
**Complexity:** Medium

### Requirements

Replace the current text-input-based manager addition with an autocomplete user search component.

#### 1. User Search Autocomplete Component (`components/admin/user-search-autocomplete.tsx`)

**Features:**
- Search users by email or name (debounced, 300ms)
- Display matching results in dropdown:
  - User avatar (if available from Clerk)
  - Display name or email
  - User ID (truncated)
  - Current roles badge (if any)
- Select user from dropdown to populate selection
- Clear selection button
- Loading state during search
- Empty state ("No users found")
- Keyboard navigation (arrow keys, enter to select)

**Props:**
```typescript
interface UserSearchAutocompleteProps {
  onUserSelect: (user: { id: string; email?: string; name?: string }) => void;
  excludeUserIds?: string[]; // Don't show users already assigned
  placeholder?: string;
  disabled?: boolean;
}
```

#### 2. User Search Service Method

Add to `lib/services/user-service.ts`:
```typescript
static async searchUsers(query: string, limit: number = 10): Promise<Array<{
  id: string;
  clerkUserId?: string;
  email?: string;
  displayName?: string;
  currentRoles: string[];
}>> {
  // Search by email (from Clerk cache) or Clerk ID
  // Return users with their current roles
  // Limit results to prevent overwhelming UI
}
```

#### 3. Integration Updates

**Modify:** [app/polls/[slug]/manage/page.tsx](../../app/polls/[slug]/manage/page.tsx)

**Changes in Roles tab:**
- Replace current text input (line ~900) with UserSearchAutocomplete
- Update `handleAddManager` to work with selected user object
- Show selected user preview before adding
- Display error if user already has a role for this poll
- Better error messages (user-friendly)

**Before:**
```tsx
<Input
  type="text"
  placeholder="Enter user's Clerk ID or email"
  value={newManagerEmail}
  onChange={(e) => setNewManagerEmail(e.target.value)}
/>
```

**After:**
```tsx
<UserSearchAutocomplete
  onUserSelect={(user) => setSelectedUser(user)}
  excludeUserIds={pollManagers.map(m => m.userId)}
  placeholder="Search by email or name..."
/>
{selectedUser && (
  <div className="p-3 bg-blue-50 rounded">
    <p>Selected: {selectedUser.email || selectedUser.id}</p>
  </div>
)}
```

#### 4. Fix Existing Bug

**Issue:** Line 428 in manage page uses `getUserByClerkIdAction` incorrectly
```typescript
// Current (WRONG):
const userResult = await getUserByClerkIdAction(newManagerEmail.trim());
```

**Fix:** Use proper user search by email:
```typescript
// Fixed:
const users = await UserService.searchUsers(selectedUser.email || selectedUser.id, 1);
if (users.length === 0) {
  toast.error("User not found");
  return;
}
const userResult = { success: true, data: users[0] };
```

### Implementation Notes

**Debouncing:**
- Use `useDebouncedValue` hook or implement custom debounce
- 300ms delay to prevent excessive API calls

**Caching:**
- Consider caching search results in component state
- Cache Clerk profile data (already implemented in UserProfileService)

**Validation:**
- Check if user already has role before showing in results
- Prevent selecting current poll owner
- Clear selection after successful addition

**Testing Requirements:**
- Unit tests for searchUsers method
- Component tests for autocomplete (user interactions)
- E2E test for adding manager with autocomplete

---

## Implementation Order

### Recommended Sequence:

1. **Start with Task 2.3** (Manager UX) - Lower complexity, immediate UX benefit
   - Create UserSearchAutocomplete component
   - Add searchUsers method to UserService
   - Update manage page
   - Test thoroughly

2. **Then Task 2.1** (User Management) - More complex, builds on Task 2.3
   - Create UserManagementService
   - Build user list page
   - Create user details modal
   - Add server actions
   - Test with various user counts

### Time Estimate:
- **Task 2.3:** 5-6 hours
- **Task 2.1:** 10-12 hours
- **Total Phase 2:** 15-18 hours

---

## Architecture Guidelines

### Service Layer Pattern
Follow the established pattern in `lib/services/`:
- Business logic in services (NOT in actions or components)
- Services return typed data structures
- Error handling at service level
- Actions are thin wrappers around services

### Database Queries
- Use Drizzle ORM patterns from existing queries
- Leverage `db/queries/` for raw query functions
- Keep queries focused and performant
- Add indexes if querying large tables

### Component Structure
- Use shadcn/ui components for consistency
- Follow existing modal patterns (see `components/modals/`)
- Use Tailwind CSS v4 for styling
- Implement proper loading states

### Error Handling
- Toast notifications for user-facing errors (using sonner)
- Console.error for debugging
- Return `{ success: boolean; error?: string; data?: T }` from actions
- Graceful degradation (show partial data if possible)

### Type Safety
- Define TypeScript interfaces for all data structures
- Use Zod for validation where applicable
- Infer types from database schema using Drizzle
- No `any` types (use `unknown` if necessary)

---

## Testing Requirements

### Unit Tests
- All service methods in UserManagementService
- searchUsers method in UserService
- Autocomplete component logic

### Integration Tests
- Server actions (user list, stats, role assignment)
- Database queries with test fixtures
- Permission checks

### E2E Tests (Playwright)
- Admin user management workflow:
  1. Login as admin
  2. Navigate to user management
  3. Search for user
  4. Open user details
  5. Assign system_admin role
  6. Verify role assignment
- Manager addition workflow:
  1. Login as poll owner
  2. Navigate to manage page
  3. Search for user via autocomplete
  4. Add as manager
  5. Verify manager appears in list

---

## Files to Reference

### Existing Services (Patterns to Follow):
- [lib/services/user-service.ts](../../lib/services/user-service.ts)
- [lib/services/poll-service.ts](../../lib/services/poll-service.ts)
- [lib/services/admin-service.ts](../../lib/services/admin-service.ts)

### Existing Components (UI Patterns):
- [components/modals/transfer-ownership-modal.tsx](../../components/modals/transfer-ownership-modal.tsx)
- [app/admin/polls/page.tsx](../../app/admin/polls/page.tsx)
- [app/admin/moderation/page.tsx](../../app/admin/moderation/page.tsx)

### Database Schema:
- [db/schema/users.ts](../../db/schema/users.ts)
- [db/schema/user-roles.ts](../../db/schema/user-roles.ts)
- [db/queries/user-roles-queries.ts](../../db/queries/user-roles-queries.ts)

### Existing Actions:
- [actions/user-roles-actions.ts](../../actions/user-roles-actions.ts)
- [actions/users-actions.ts](../../actions/users-actions.ts)

---

## Success Criteria

### Task 2.1: User Management Interface
- ✅ Admin can view list of all users with accurate stats
- ✅ Search and filtering work correctly
- ✅ Pagination handles large user counts
- ✅ User details modal shows comprehensive information
- ✅ System_admin role can be assigned/revoked
- ✅ Only system admins can access this interface
- ✅ All actions have proper error handling
- ✅ Tests pass (unit, integration, E2E)

### Task 2.3: Manager Addition UX
- ✅ Autocomplete component works smoothly with debouncing
- ✅ Search finds users by email/name accurately
- ✅ Selected user preview is clear and helpful
- ✅ Users already assigned as managers are excluded
- ✅ Error messages are user-friendly and specific
- ✅ Existing bug in manage page is fixed
- ✅ Component is reusable for other contexts
- ✅ Tests pass (component, E2E)

---

## Additional Context

### Project Tech Stack:
- **Framework:** Next.js 15 with App Router
- **Database:** Supabase (PostgreSQL) with Drizzle ORM
- **Authentication:** Clerk (JWT-only, no webhooks)
- **UI:** Radix UI + Tailwind CSS v4 + shadcn/ui
- **Forms:** React Hook Form + Zod
- **Testing:** Vitest (unit/integration) + Playwright (E2E)

### Key Design Principles:
- Mobile-first responsive design
- Service layer for all business logic
- Server components where possible (better performance)
- Optimistic UI updates with rollback on error
- Accessibility (ARIA labels, keyboard navigation)

### Code Quality Standards:
- Run `npm run build` before committing (ensures TypeScript compiles)
- Follow existing naming conventions
- Add JSDoc comments for complex functions
- Keep components under 300 lines (extract helpers if needed)
- Use meaningful variable names (no abbreviations)

---

## Questions to Consider

Before implementing, think about:

1. **Scalability:** How will user list perform with 100,000+ users?
   - Consider virtual scrolling or cursor-based pagination
   - Implement backend search (don't load all users client-side)

2. **Security:** Are all endpoints properly protected?
   - Verify middleware protects admin routes
   - Check permission in server actions (don't trust client)
   - Audit log for sensitive actions (assign/revoke admin)

3. **UX:** What happens if user searches for themselves?
   - Should they be able to assign roles to themselves?
   - Show helpful message if trying to self-assign

4. **Edge Cases:** What if user has Clerk account but no email?
   - Display Clerk ID or "No email provided"
   - Handle gracefully in autocomplete

5. **Performance:** How to optimize database queries?
   - Use SELECT with specific columns (not SELECT *)
   - Add indexes on frequently searched columns
   - Cache Clerk profile data (already implemented)

---

## Deliverables

Upon completion, you should have:

1. **New Files:**
   - `lib/services/user-management-service.ts`
   - `app/admin/users/page.tsx`
   - `components/admin/user-details-modal.tsx`
   - `components/admin/user-search-autocomplete.tsx`
   - `actions/user-management-actions.ts`

2. **Modified Files:**
   - `lib/services/user-service.ts` (add searchUsers)
   - `app/polls/[slug]/manage/page.tsx` (integrate autocomplete)

3. **Tests:**
   - Unit tests for UserManagementService
   - Component tests for autocomplete
   - E2E tests for both workflows

4. **Documentation:**
   - Update this prompt with "✅ COMPLETED" markers
   - Note any deviations from plan with justification
   - Document any new dependencies added

---

## Getting Started

1. Read [USE_CASES.md](../../USE_CASES.md) sections on Admin & Manager Workflows
2. Review [CLAUDE.md](../../CLAUDE.md) for project structure and conventions
3. Study existing service implementations for patterns
4. Start with Task 2.3 (simpler, builds foundation for Task 2.1)
5. Test thoroughly at each step
6. Run `npm run build` frequently to catch TypeScript errors early

Good luck! 🚀
