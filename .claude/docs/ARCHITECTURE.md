# System Architecture

Complete system architecture documentation for Pulse platform.

## Technology Stack

- **Framework:** Next.js 15 with App Router
- **Language:** TypeScript
- **Database:** Supabase (PostgreSQL) with Drizzle ORM
- **Authentication:** Clerk (JWT-only, no webhooks)
- **UI:** Radix UI + Tailwind CSS v4 + Lucide icons
- **Animations:** Framer Motion
- **Charts:** Recharts
- **Testing:** Vitest (unit/integration), Playwright (E2E)
- **Forms:** React Hook Form + Zod validation
- **State:** React Context API
- **Notifications:** Sonner
- **Security:** RLS, rate limiting, security headers

## Architecture Patterns

### Service Layer Pattern (RECOMMENDED)

**Centralized business logic in services, not scattered in queries/actions.**

```typescript
// lib/services/user-service.ts
export class UserService {
  static async createUser(data: CreateUserData) {
    // Business logic here
    // Validation
    // Database operations
    // Return typed result
  }
}
```

```typescript
// actions/user-actions.ts
"use server";

import { UserService } from "@/lib/services/user-service";

export async function createUserAction(data: CreateUserData) {
  try {
    const result = await UserService.createUser(data);
    revalidatePath("/users");
    return { success: true, data: result };
  } catch (error) {
    console.error("Failed to create user:", error);
    return { success: false, error: "Failed to create user" };
  }
}
```

### Legacy Server Actions Pattern

**Older pattern (being migrated to services):**

```typescript
"use server";

import { createUser } from "@/db/queries/users";

export async function createUserAction(data: CreateUserData) {
  try {
    const result = await createUser(data);
    revalidatePath("/users");
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: "Error message" };
  }
}
```

**Migration Strategy:**
- New features use Service Layer
- Existing actions gradually migrated
- Both patterns coexist during transition

## Serverless Considerations

### Fire-and-Forget Pattern is Broken

Vercel serverless functions terminate immediately after returning a response, killing any pending promises.

**Why it fails:**
```typescript
// ❌ BROKEN in Vercel serverless:
promise.then(() => console.log("done"))  // Never executes
  .catch(err => console.error(err));     // Never executes
return response;  // ← Function terminates HERE, killing promise
```

**Solutions comparison:**

| Solution | Vercel Plan | Reliability | Delay | Implementation |
|----------|-------------|-------------|-------|----------------|
| Fire-and-forget | Any | ❌ 99% failure | 0ms | Simple but broken |
| Vercel `waitUntil` | Pro ($20/mo) | ✅ 100% | 0ms | Simple, expensive |
| **Supabase pg_cron** | **Hobby** | **✅ 100%** | **~1min** | **Medium, affordable** |
| External cron service | Any | ✅ 100% | ~1min | Complex setup |

**Our Choice:** Supabase pg_cron provides reliability without Pro plan cost.

## Infrastructure Services

### Core Services (`lib/services/`)

#### User Management
- **UserService** (`user-service.ts`)
  - User creation and authentication
  - Role management
  - JIT user creation from Clerk
  - Anonymous to authenticated upgrade

- **UserProfileService** (`user-profile-service.ts`)
  - Clerk profile caching (24-hour TTL)
  - Display name management
  - Social profile integration

- **UserManagementService** (`user-management-service.ts`)
  - Enhanced user operations
  - User workflow management

#### Polling & Voting
- **PollService** (`poll-service.ts`)
  - Poll lifecycle management
  - Statistics and analytics
  - Slug generation
  - Status transitions (draft → published → closed)

- **VotingService** (`voting-service.ts`)
  - Vote recording (with immutability enforcement)
  - Progress tracking
  - Distribution analysis
  - Vote validation

- **StatementService** (`statement-service.ts`)
  - Statement CRUD operations
  - Approval workflow (null → true/false)
  - Moderation
  - User-submitted content handling

- **StatementManager** (`statement-manager.ts`)
  - **Core batching logic** (10 statements per batch)
  - Vote tracking
  - Progress management
  - Navigation between batches
  - **33 comprehensive tests**

- **StatementOrderingService** (`statement-ordering-service.ts`)
  - Random statement ordering (prevents bias)
  - Weighted distribution (infrastructure ready)
  - Fair statement exposure

- **PollResultsService** (`poll-results-service.ts`)
  - Aggregate results
  - Vote distributions
  - Demographic breakdowns
  - Results caching

#### Opinion Clustering
- **ClusteringService** (`clustering-service.ts`)
  - **8-step clustering pipeline** (matrix → PCA → K-means → grouping → consensus → persistence)
  - Opinion landscape computation
  - Eligibility validation (10 users, 6 statements)
  - Background clustering triggers
  - Quality metrics (silhouette score, variance explained)
  - Statement classification (consensus/divisive/bridge)
  - Coalition analysis

- **PCAEngine** (`clustering/pca-engine.ts`)
  - Principal Component Analysis
  - Dimensionality reduction (N-dimensions → 2D)
  - Mean imputation for missing values
  - User projection into existing PCA space

- **KMeansEngine** (`clustering/kmeans-engine.ts`)
  - K-means clustering with adaptive K (20/50/100)
  - Silhouette score calculation
  - Hierarchical coarse grouping (2-5 groups)
  - Nearest cluster assignment

- **ConsensusDetector** (`clustering/consensus-detector.ts`)
  - Statement classification by agreement pattern
  - Consensus detection (positive/negative)
  - Divisive statement identification
  - Bridge statement detection

- **StatementClassifier** (`clustering/statement-classifier.ts`)
  - Enhanced classification logic
  - Coalition pattern detection
  - Full/partial consensus identification
  - Split decision analysis

- **CoalitionAnalyzer** (`clustering/coalition-analyzer.ts`)
  - Pairwise group alignment calculation
  - Strongest coalition identification

- **ClusteringQueueService** (`clustering-queue-service.ts`)
  - Database-backed job queue for reliable background processing
  - Enqueue clustering jobs with deduplication (one pending job per poll)
  - Process jobs via Supabase pg_cron (every minute)
  - Retry logic: up to 3 attempts with failure tracking
  - Queue statistics and monitoring endpoints
  - Zero waste: only processes when jobs pending

#### Gamification & Engagement
- **ArtifactRarityService** (`artifact-rarity-service.ts`)
  - Rarity calculations (Common, Rare, Legendary)
  - Artifact unlocking logic
  - Collection management

- **FeedbackService** (`feedback-service.ts`)
  - User feedback submission
  - Feedback management
  - Anonymous + authenticated support

#### System Services
- **AIService** (`ai-service.ts`)
  - Mock AI-generated insights
  - Mock poll summaries
  - Ready for API integration
  - 24-hour cache for results

- **AdminService** (`admin-service.ts`)
  - Admin functionality
  - System management
  - User management

### Service Layer Benefits

1. **Centralized business logic** - All in one place, not scattered
2. **Reusability** - Called from actions, API routes, or directly
3. **Type safety** - Full TypeScript integration
4. **Error handling** - Consistent patterns
5. **Testing ready** - Pure functions, easy to test
6. **Maintainability** - Single source of truth

## Validation Layer

### Zod Schemas (`lib/validations/`)

**Type-first development with runtime validation:**

```typescript
// lib/validations/poll.ts
import { z } from 'zod';

export const createPollSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  emoji: z.string().optional(),
  // ... more fields
});

export type CreatePollInput = z.infer<typeof createPollSchema>;
```

**Benefits:**
- TypeScript types inferred from schemas
- Runtime validation
- Business rule enforcement
- Consistent error messages

**Common Schemas:**
- Vote values: -1, 0, 1 (constrained)
- Poll lifecycle: draft, published, closed
- User roles: system_admin, poll_owner, poll_manager
- Demographics: age_group, gender, ethnicity, political_party

## Authentication & User Management

### Clerk Integration

**JWT-only implementation (no webhooks):**

- **ClerkProvider** - Root layout integration
- **Middleware** - Route protection (`middleware.ts`)
- **JWT validation** - Direct token validation
- **JIT user creation** - On first action or auth
- **Profile caching** - 24-hour cache reduces API calls

**Key Files:**
- `app/layout.tsx` - ClerkProvider setup
- `middleware.ts` - Route protection
- `contexts/user-context.tsx` - User state management

### User Context & State

**UserContext** (`contexts/user-context.tsx`):
- Global user state
- Automatic session/auth detection
- Anonymous → authenticated upgrade
- Role-based permissions

**Key Features:**
- **Dual identity system:**
  - Anonymous: `session_id` populated
  - Authenticated: `clerk_user_id` populated
- **Seamless upgrade:** Data preserved on sign-up
- **Session handling:** Browser session IDs for anonymous users
- **Auto-upgrade flow:** Triggered on authentication

### Header Management

**HeaderContext** (`contexts/header-context.tsx`):
- Global header configuration
- Dynamic variant switching

**Header Variants:**
- `default` - Standard navigation with logo/auth
- `voting` - Compact header with progress bar
- `management` - Poll owner/manager interface
- `admin` - Admin dashboard header
- `minimal` - Simple header for auth/results
- `hidden` - No header rendered

## Key Workflows

### Poll Lifecycle

```
Draft → Published → Closed
   ↓       ↑
   └──────┘ (Unpublish)
```

1. **Draft**
   - Poll created
   - Editable by owner
   - Not visible to participants
   - Can add/edit statements

2. **Published**
   - Opened at `start_time`
   - Visible and accepting votes
   - Statements can be submitted (if enabled)
   - Auto-approval optional

3. **Unpublish** (optional)
   - Return to draft from published
   - Votes preserved
   - Can edit settings again

4. **Closed**
   - Past `end_time`
   - Read-only
   - Results visible to all
   - Insights visible to voters

### Voting Process

1. **Initial load** - User sees approved statements
2. **Statement batching** - 10 statements per batch (if 10+ total)
3. **Vote on statements** - Agree/Disagree/Pass
4. **Progress tracking** - Real-time vote count
5. **Gamification milestones:**
   - 30% progress → Encouragement toast
   - 50% progress → Halfway celebration
   - 70% progress → Momentum message
   - Vote 4 → Add button pulse (encourage submissions)
   - 10 votes → Demographics modal (mandatory)
   - Completion → Confetti celebration
6. **Results unlocked** - After 10 votes + demographics
7. **Personal insights** - AI-generated profile shown
8. **Continue voting** - Optional, can vote on remaining statements

### Statement Management

1. **Creation**
   - Admin creates initial statements (minimum 6)
   - Users submit if enabled
   - Validation and sanitization

2. **Approval Workflow**
   - User submissions start as `approved: null` (pending)
   - Poll managers review
   - Approve (`approved: true`) → visible to voters
   - Reject (`approved: false`) → deleted from DB

3. **Display**
   - Only approved statements shown
   - Random ordering (prevents bias)
   - Batched in groups of 10

### Anonymous to Authenticated Upgrade

1. **Anonymous user** - Session ID generated, stored in cookie
2. **User votes** - Votes associated with session ID
3. **User signs up** - Clerk authentication
4. **Automatic upgrade** - Triggered on sign-up
5. **Data transfer** - All votes/demographics transferred
6. **Session cleanup** - Old session data migrated

**Implementation:**
- `lib/services/user-service.ts` - upgradeAnonymousUser()
- Preserves all user data
- Seamless UX (no data loss)

### Opinion Clustering Pipeline

**Automatic background process triggered after each vote:**

1. **Eligibility check** (fast, <50ms)
   - Minimum 10 users who voted
   - Minimum 6 approved statements
   - Skip if not eligible

2. **Build opinion matrix** [users × statements]
   - Fetch all votes for poll
   - Group by user
   - Values: -1 (disagree), 0 (pass), 1 (agree), null (not voted)

3. **PCA dimensionality reduction**
   - Mean imputation for missing values (pass votes → null → column mean)
   - Center data (subtract mean vector)
   - Extract 2 principal components (PC1, PC2)
   - Transform users to 2D coordinates
   - Validate: variance explained should be >40%

4. **K-means fine clustering**
   - Adaptive K selection: 20 (small), 50 (medium), 100 (large)
   - Cluster users in 2D space
   - Calculate silhouette score (quality metric)
   - Validate: silhouette should be >0.25

5. **Hierarchical coarse grouping**
   - Apply K-means on fine cluster centroids
   - Test K=2 through K=5
   - Select K with best silhouette score
   - Create 2-5 opinion groups for visualization

6. **Consensus detection**
   - For each statement, calculate group-level agreement
   - Classify as: positive_consensus, negative_consensus, divisive, bridge, normal
   - Identify bridge statements connecting opposing groups

7. **Database persistence** (transactional)
   - Delete existing clustering data for poll
   - Insert poll_clustering_metadata
   - Insert user_clustering_positions (batch)
   - Insert statement_classifications (batch)

8. **Cache invalidation**
   - Invalidate in-memory cache
   - Revalidate opinion map page

**Non-blocking execution:**
- Triggered via `ClusteringService.triggerBackgroundClustering()`
- Errors logged but not thrown
- Never blocks vote confirmation

## State Management

### React Context API

**UserContext** - Global user state
- Current user data
- Authentication status
- Role permissions
- Loading states

**HeaderContext** - Header configuration
- Variant selection
- Dynamic updates
- Component-specific customization

**Benefits:**
- No external state library needed
- Type-safe with TypeScript
- Built-in React support
- Simple and performant

## API Routes

### Health & Testing
- `/api/health/db` - Database connection health
- `/api/test/database-connection` - Connection test
- `/api/test/jwt-implementation` - JWT verification

### User Management
- `/api/user/current` - Current user info (auth + anonymous)
- `/api/user/roles` - User roles and permissions
- `/api/user/upgrade` - Upgrade anonymous to authenticated

### Voting & Statements
- `/api/vote/cast` - Cast vote (immutable)
- `/api/statement/submit` - Submit new statement

## Application Routes (v2.0)

### Public Pages
- `/` - Landing page (redirects to `/polls`)
- `/polls` - Browse published polls
- `/polls/[slug]` - **Combined Vote/Results page** (single-page)
  - Tab navigation (Vote ↔ Results)
  - No separate routes
  - Results locked until 10 votes
- `/polls/[slug]/opinionmap` - **Opinion clustering visualization**
  - Privacy-preserving 2D opinion map
  - Shows group boundaries and current user position
  - Requires 10+ users and 6+ statements
  - Desktop: SVG-based interactive canvas
  - Mobile: Card-based group statistics

### Authenticated Pages
- `/polls/create` - Create new poll
- `/polls/[slug]/manage` - Poll management (owner/manager)
- `/admin/dashboard` - Admin dashboard
- `/admin/moderation` - Statement moderation

### Auth Pages
- `/login` - Clerk sign-in
- `/signup` - Clerk sign-up

### Test Pages (Development)
- `/test-auth` - Auth flow testing
- `/test-admin/*` - Admin testing
- `/test-polls/*` - Poll interaction testing

## Security

### Row Level Security (RLS)
- Enabled on ALL 17 tables (including 3 clustering tables)
- Defense-in-depth protection
- Blocks direct database access
- Server Actions bypass automatically

See [DATABASE.md](DATABASE.md) for details.

### Rate Limiting

**In-memory token bucket rate limiter** (`lib/utils/rate-limit.ts`):

```typescript
import { voteLimiter, statementLimiter, apiLimiter } from '@/lib/utils/rate-limit';

// In API route or action
const allowed = await voteLimiter.check(userId);
if (!allowed) {
  return { success: false, error: "Rate limit exceeded" };
}
```

**Pre-configured Limiters:**
- `voteLimiter` - Vote submission endpoints
- `statementLimiter` - Statement creation
- `apiLimiter` - General API protection

### Security Headers

**Configured in `next.config.js`:**
- HSTS (HTTP Strict Transport Security)
- X-Frame-Options (clickjacking protection)
- CSP (Content Security Policy)
- X-Content-Type-Options

## Utility Functions

### Session Management (`lib/utils/session.ts`)
- Anonymous session ID generation
- Cookie management
- Session validation

### Slug Generation (`lib/utils/slug.ts`)
- URL-friendly poll identifiers
- Unique slug generation
- Collision handling

### Voting Utilities (`lib/utils/voting.ts`)
- Vote distribution calculations
- Progress tracking
- Threshold checking

### Permission Helpers (`lib/utils/permissions.ts`)
- Role-based access control
- Poll ownership checks
- Manager permission validation

## Hooks

### Custom Hooks (`hooks/`)

- **useCurrentUser** (`use-current-user.ts`)
  - Access UserContext
  - Get current user data
  - Authentication status

- **useMobile** (`use-mobile.ts`)
  - Responsive breakpoint detection
  - Mobile-first development

- **useToast** (`use-toast.ts`)
  - Toast notification utilities
  - Sonner integration

## Key Design Decisions

### Architecture Decisions

1. **Service Layer over Query Layer**
   - Centralizes business logic
   - Better testability
   - Reusability across actions/routes

2. **Database RBAC over Clerk Roles**
   - Poll-specific permissions
   - Fine-grained control
   - Independent of auth provider

3. **JWT-only Auth (no webhooks)**
   - Simplified architecture
   - Reduced complexity
   - Direct token validation

4. **Transaction Mode (Port 6543)**
   - 10,000+ concurrent connections
   - Optimized for serverless
   - Singleton pattern prevents leaks

5. **Context-based State**
   - No external state library
   - Type-safe with TypeScript
   - Built-in React support

6. **Single-page Architecture**
   - Tab navigation (no route changes)
   - Better UX (no page reloads)
   - Simpler state management

### Feature Decisions

1. **Immutable Votes**
   - Once cast, cannot change
   - Prevents manipulation
   - Clear audit trail

2. **Statement Batching**
   - 10 statements per batch
   - Better UX for large polls
   - Reduces cognitive load

3. **Fixed Voting Threshold**
   - 10 votes to unlock Results
   - Ensures meaningful insights
   - Encourages participation

4. **Gamification System**
   - Milestone-based encouragement
   - Visual feedback (confetti)
   - Artifact collection system

5. **Universal Closed Poll Access**
   - Both voters and non-voters see results
   - Only voters get personal insights
   - Encourages participation

6. **Mandatory Demographics**
   - After 10 votes, before results
   - All 4 fields required
   - Never re-requested

### Data Management Decisions

1. **Minimum 6 Statements**
   - Required (not recommended)
   - Ensures meaningful polls
   - Better insights

2. **Delete Rejected Statements**
   - Not archived
   - Reduces DB clutter
   - Clear lifecycle

3. **Mock AI Insights**
   - Ready for API integration
   - 24-hour caching
   - Consistent interface

4. **Profile Caching**
   - 24-hour TTL
   - Reduces API calls
   - Better performance

## Performance Considerations

### Database
- Connection pooling (Transaction Mode)
- Indexes on high-traffic tables
- Batch operations where possible
- Query optimization with Drizzle

### Caching
- AI results (24 hours)
- User profiles (24 hours)
- Next.js automatic caching

### Frontend
- Code splitting (Next.js automatic)
- Lazy loading components
- Optimistic UI updates
- Framer Motion animations (performant)

### Monitoring
- Weekly: `npm run db:health`
- Monthly: `npm run db:stress`
- Production: Supabase dashboard
