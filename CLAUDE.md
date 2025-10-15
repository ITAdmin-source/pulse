# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Pulse** is a participatory polling platform inspired by Pol.is that enables democratic engagement through:
- **Statement-based voting** - Users vote on statements (Agree/Disagree/Pass) in discussions
- **User-generated content** - Participants can submit new positions (when enabled)
- **Personal insights** - AI-generated influence profiles based on voting patterns
- **Flexible participation** - Anonymous (browser session) or authenticated (Clerk) users
- **Database-managed RBAC** - Fine-grained permissions independent of Clerk roles

### UI Terminology (v2.0 - Statement-Based)

**Primary UI Language: Hebrew with RTL support**

The application uses empowering "influence" language. While the database layer uses technical terms like "statement," "vote," and "poll," the user-facing interface uses Hebrew terminology focused on discussion and impact:

| Database/Code (Technical) | User Interface (English) | User Interface (Hebrew) |
|---------------------------|--------------------------|------------------------|
| Poll | Discussion | דיון |
| Statement | Position/Stance | עמדה |
| Vote | Vote/Influence | הצבעה / השפעה |
| Agree (vote value: 1) | Agree | מסכים/ה |
| Disagree (vote value: -1) | Disagree | לא מסכים/ה |
| Unsure/Pass (vote value: 0) | Pass/Skip | דילוג |
| Voting Interface | Voting Interface | ממשק הצבעה |
| Statement Submission | Add Position | הוסף עמדה |
| Vote Distribution | Vote Results | תוצאות הצבעה |
| Personal Insights | Influence Profile | פרופיל ההשפעה |
| Poll Results | Discussion Results | תוצאות הדיון |

**Implementation Notes:**
- Database schema uses "votes," "statements," "polls" (unchanged for stability)
- Service layer and actions use technical terminology internally
- UI components, page text, and user-facing messages use Hebrew terminology from `lib/strings/he.ts`
- All UI text defaults to Hebrew with `dir="auto"` for proper RTL rendering
- Button labels: מסכים/ה (Agree) / לא מסכים/ה (Disagree) / דילוג (Pass)
- Conjugated forms for voting buttons (showing both masculine/feminine endings)
- Plural imperative forms for commands (gender-neutral)

### Additional Documentation

For comprehensive details on design and implementation:
- **[USE_CASES.md](USE_CASES.md)** - Complete user journeys, personas, and detailed workflow documentation
- **[UX_UI_SPEC.md](UX_UI_SPEC.md)** - Full UX/UI specification including component library, layouts, and interaction patterns
- **[.claude/misc/MIGRATION_PLAN.md](.claude/misc/MIGRATION_PLAN.md)** - Complete UX redesign migration plan with phased implementation
- **[.claude/misc/HEBREW_TERMINOLOGY.md](.claude/misc/HEBREW_TERMINOLOGY.md)** - Full Hebrew terminology reference with approved terms

## Development Commands

```bash
# Development server
npm run dev

# Development with clean restart (Windows)
npm run dev:clean   # Kills node processes, cleans cache, and starts dev server

# Production build
npm run build

# Start production server
npm run start

# Code quality
npm run lint

# Database management
npm run db:generate  # Generate database migration
npm run db:migrate   # Apply database migrations

# Testing
npm run test         # Run tests
npm run test:watch   # Run tests in watch mode
npm run test:coverage # Run tests with coverage
npm run test:ui      # Run tests with UI
npm run test:e2e     # Run E2E tests with Playwright
npm run test:quick   # Quick unit test run
npm run test:integration # Run integration tests
npm run test:all     # Run all test suites
```

## Database Architecture

This project uses **Drizzle ORM with PostgreSQL (via Supabase)** and follows a consistent 3-layer architecture:

1. **Schemas** (`db/schema/`) - Table definitions with Drizzle
2. **Queries** (`db/queries/`) - Database query functions
3. **Actions** (`actions/`) - Next.js Server Actions that call queries

### Database Connection
- Uses **Supabase PostgreSQL** via `DATABASE_URL` from `.env.local`
- All schemas are imported and exported through `db/schema/index.ts`
- Database instance created in `db/db.ts` with full schema object

### Key Tables & Relationships

**Core Polling System:**
- `polls` - Main poll entities (decks in UI) with lifecycle (draft→published→closed), control settings, and choosing requirements
- `statements` - Poll statements (cards in UI) with approval workflow (null=pending, true=approved, false=rejected then deleted)
- `votes` - User choices on statements (database term) with unique constraint per (user_id, statement_id), choices are immutable (no updates)
- `user_poll_insights` - AI-generated insights per user/poll (only latest version kept)
- `poll_results_summaries` - Cached AI-generated poll summaries with participant/choice counts (24-hour cache)

**User System:**
- `users` - Core user data supporting both anonymous (session_id) and authenticated (clerk_user_id) users
- `user_demographics` - Links users to demographic categories
- `user_profiles` - Extended profile info for authenticated users (name, picture, social links)
- `user_roles` - Database-managed RBAC system independent of Clerk

**Demographics:**
- `age_groups`, `genders`, `ethnicities`, `political_parties` - Lookup tables for user demographics

### Important Constraints & Business Rules

- **Vote values** are constrained to exactly `-1` (disagree), `0` (neutral/unsure), `1` (agree)
- **Votes are immutable** - Once cast, votes cannot be changed (enforced in voting logic, not at DB level)
- **Unique voting** - One vote per user per statement via unique constraint
- **Composite primary key** on user_poll_insights (user_id, poll_id) ensures only latest insight per user/poll
- **Cascade deletes** - Statements/votes deleted when polls removed, insights deleted when users/polls removed
- **Fixed voting threshold** - Users must complete first batch (10 statements) OR all statements if poll has fewer than 10
- **Statement moderation** - Only approved statements appear; rejected statements are deleted
- **Anonymous user transition** - Anonymous users who sign up have their votes transferred to authenticated identity
- **Poll results caching** - AI-generated summaries cached for 24 hours to reduce API calls

## Infrastructure Services

The project includes a comprehensive service layer in `lib/services/` that provides business logic and data access:

### Core Services
- **UserService** (`lib/services/user-service.ts`) - User creation, authentication, role management, JIT user creation from Clerk
- **UserProfileService** (`lib/services/user-profile-service.ts`) - Clerk profile caching, display name management, social profiles
- **PollService** (`lib/services/poll-service.ts`) - Poll lifecycle, statistics, slug generation
- **VotingService** (`lib/services/voting-service.ts`) - Vote recording, progress tracking, distribution analysis
- **StatementService** (`lib/services/statement-service.ts`) - Statement CRUD, approval workflow, moderation
- **PollResultsService** (`lib/services/poll-results-service.ts`) - Aggregate results, vote distributions, demographic breakdowns (planned)
- **AIService** (`lib/services/ai-service.ts`) - Mock AI-generated insights and summaries (ready for API integration)

### Service Layer Benefits
- **Business logic centralization** - All core logic in services, not scattered in actions
- **Reusability** - Services can be called from actions, API routes, or directly
- **Type safety** - Full TypeScript integration with Zod validation
- **Error handling** - Consistent error patterns across all services
- **Testing ready** - Services are pure functions easy to unit test

### Validation Layer
- **Zod schemas** (`lib/validations/`) - Input validation for all entities
- **Business rule enforcement** - Vote values, approval workflows, user permissions
- **Type inference** - Automatic TypeScript types from validation schemas

### Utility Functions
- **Session management** (`lib/utils/session.ts`) - Anonymous user session handling
- **Slug generation** (`lib/utils/slug.ts`) - URL-friendly poll identifiers
- **Voting utilities** (`lib/utils/voting.ts`) - Vote calculations and distributions
- **Permission helpers** (`lib/utils/permissions.ts`) - Role-based access control

## Authentication & User Management

### Clerk Integration
- **Provider setup** - ClerkProvider in root layout with custom UserProvider
- **Middleware** - Route protection with public/protected route matching (middleware.ts)
- **JWT-only authentication** - No webhook dependency, uses JWT tokens from Clerk
- **JIT user creation** - Users created on-demand when first authenticated or when taking first action
- **Profile caching** - 24-hour cache for Clerk profile data to reduce API calls
- **Anonymous support** - Session-based users with seamless upgrade path

### User Context & State Management
- **UserContext** (`contexts/user-context.tsx`) - Global user state with automatic session/auth detection
- **Automatic upgrade flow** - Anonymous users who sign up automatically get their history transferred
- **Session handling** - Browser session IDs for anonymous users, auto-generated and stored in cookies
- **Dual user system** - Anonymous (session_id) and authenticated (clerk_user_id) users supported
- **Seamless upgrade** - Anonymous users can authenticate without losing votes or demographics
- **Role-based permissions** - Database-managed roles independent of Clerk

## Adding New Tables

Follow the comprehensive guide in `NEW_TABLE_INSTRUCTIONS.md` which covers:
- Schema definition with proper imports and relationships
- Updating schema index and database connection
- Creating query functions with CRUD operations
- Building Server Actions with error handling and revalidation
- Generating and applying migrations

## Architecture Patterns

### Service Layer Pattern (RECOMMENDED)
New development should use services directly for better architecture:
```typescript
"use server";

import { revalidatePath } from "next/cache";
import { UserService } from "@/lib/services/user-service";

export async function actionName(data: DataType) {
  try {
    const result = await UserService.createUser(data);
    revalidatePath("/relevant-path");
    return { success: true, data: result };
  } catch (error) {
    console.error("Error description:", error);
    return { success: false, error: "User-friendly message" };
  }
}
```

### Legacy Server Actions Pattern
Existing actions follow this pattern (being migrated to services):
```typescript
"use server";

import { revalidatePath } from "next/cache";
import { queryFunction } from "@/db/queries/...";

export async function actionName(data: DataType) {
  try {
    const result = await queryFunction(data);
    revalidatePath("/relevant-path");
    return { success: true, data: result };
  } catch (error) {
    console.error("Error description:", error);
    return { success: false, error: "User-friendly message" };
  }
}
```

### TypeScript Types
- All table types auto-generated using Drizzle's `$inferSelect` and `$inferInsert`
- Consistent naming: `TableName` (select type), `NewTableName` (insert type)
- Export types alongside table definitions

## Roles & Permissions (Database-Managed RBAC)

Roles are managed in the database (not by Clerk) for fine-grained poll-specific permissions:

- **System Admin** - Global role with full system access
- **Poll Owner** - Creator of a poll, can transfer ownership, has all manager permissions
- **Poll Manager** - Per-poll role, can approve/reject statements, edit poll settings, view analytics

## Key Workflows

### Poll Lifecycle
1. **Draft** - Poll created, editable, not visible to participants
2. **Published** - Poll opened at start_time, visible and accepting votes
3. **Unpublish** - Published polls can be returned to draft state (votes preserved)
4. **Closed** - Past end_time, read-only but visible

### Voting Process
1. Users see only approved statements
2. Vote agree/disagree/neutral on statements (card deck metaphor)
3. **Statement batching** - Polls with 10+ statements show in batches of 10 with continuation page
4. Must complete first batch (10 statements) or all statements if fewer than 10 to finish voting
5. Personal insights generated after threshold met
6. **Closed polls** - Accessible to both voters (with insights) and non-voters (results only)

### Statement Management
- User-suggested statements require approval (unless auto_approve_statements enabled)
- Rejected statements are deleted (not archived)
- Only approved statements visible to voters
- **Minimum 6 statements required** to create a poll (mandatory, not just recommended)

### UX/UI Design Principles (v2.0 - 2025-10-15)
- **Statement-based voting** - Direct voting on positions with split-screen Agree/Disagree buttons
- **Stories-style progress bar** - Shows position in current batch (Instagram Stories style)
- **User creation timing** - User record created on demographics save OR first vote (whichever first)
- **Statement batching** - Shows 10 statements at a time with inline "next batch" prompts
- **Demographics** - **Mandatory AFTER 10 votes, BEFORE results** (all 4 fields required), never re-requested
- **Closed poll access** - Both voters and non-voters can view results; only voters see personal insights
- **Single-page architecture** - Combined Vote/Results views with tab navigation (no separate routes)
- **Results unlocking** - Results tab locked until 10 votes completed

### Design System & Look-and-Feel (v2.0 - 2025-10-15)

**Philosophy:** Dark gradient background with vibrant purple/pink accents for modern, social-first aesthetic

#### Core Design Tokens (`lib/design-tokens-v2.ts`)
Centralized design system with new color palette, spacing, typography, and animation constants:
- **Background colors** - Dark purple gradient (`from-slate-900 via-purple-900 to-slate-900`)
- **Card colors** - Simple white cards with purple/pink gradient headers
- **Voting colors** - Flat green (agree), red (disagree), gray (pass) - NO gradients
- **Spacing system** - 8px base unit maintained (8, 16, 24, 32, 40, 48px)
- **Typography scale** - Responsive Tailwind classes (sm:, md:)
- **Animation timings** - Framer Motion variants for all transitions

#### Universal Page Background
**All voting pages use:** `bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900`
- Applied to: voting, results, polls list, poll page
- Dark purple gradient creates modern, app-like aesthetic
- High contrast with white content cards

#### New Component Patterns
**Poll Cards (Gradient Header):**
- Header gradient: `from-purple-600 to-pink-600`
- Body: Simple white (`#ffffff`)
- Border radius: `rounded-2xl` (24px)
- Shadow: `shadow-xl` with `hover:shadow-2xl`
- No aspect ratio constraint (flexible height)

**Split Vote Card:**
- White card with gray header (`bg-gray-50` with `border-b-4 border-purple-200`)
- 50/50 split voting buttons (full height, 50% width each)
- Agree: `bg-green-500` (flat, right side in RTL)
- Disagree: `bg-red-500` (flat, left side in RTL)
- Hover expansion: `hover:flex-[1.2]` (expands to 60/40 ratio)
- Stats appear ON buttons after vote (animated)

**Progress Segments:**
- Height: `h-1` (thinner than v1.5)
- Completed: `bg-purple-500`
- Current: `bg-purple-300 animate-pulse`
- Upcoming: `bg-white/20`
- Gap: `gap-1`

**Question Pill:**
- Blue gradient: `from-blue-600 to-blue-500`
- Rounded: `rounded-xl`
- Shadow: `shadow-lg`
- Text: white, centered

**Tab Navigation:**
- Background: `bg-white/10` with `backdrop-blur`
- Active tab: `bg-white text-purple-900`
- Inactive tab: `bg-white/10 text-white`
- Disabled tab: `bg-white/5 text-white/40`

**Insight Card:**
- Gradient: `from-indigo-600 via-purple-600 to-pink-600`
- Decorative circles: `bg-white/10`
- Text: white
- Shadow: `shadow-2xl`

**Buttons:**
- Agree: `bg-green-500` (flat, no gradient)
- Disagree: `bg-red-500` (flat, no gradient)
- Pass: `bg-gray-100` (light gray)
- Primary Action: `bg-purple-600`
- Secondary: `border-gray-200 hover:bg-gray-50`

#### Typography
**Text Colors:**
- Primary: `text-gray-900` (on white cards)
- Secondary: `text-gray-600` (on white cards)
- Inverse: `text-white` (on dark backgrounds)

**Font Sizes (Responsive):**
- Hero: `text-2xl sm:text-4xl font-bold`
- Statement: `text-lg sm:text-xl font-medium`
- Voting buttons: `text-xl sm:text-2xl font-bold`
- Regular buttons: `text-sm sm:text-base font-semibold`
- Body: `text-sm sm:text-base`

#### Component Styling Rules
When creating/styling components:
1. **Use dark gradient background** for all voting pages
2. **Use white cards** for content (not colored gradients)
3. **Use purple/pink gradients** for headers and special cards
4. **Use flat colors** for voting buttons (no gradients)
5. **Maintain 2xl rounding** (`rounded-2xl`) for cards
6. **Apply consistent shadows** (`shadow-xl` for cards)
7. **Follow RTL principles** with logical properties (ms-*, me-*, start, end)
8. **Import strings from** `lib/strings/he.ts` for all text

#### String Management
All user-facing text managed in `lib/strings/he.ts`:
- Organized by page/component
- Hebrew with gender-neutral forms where possible
- Conjugated forms for voting buttons (מסכים/ה, לא מסכים/ה)
- Utility functions for common patterns
- Type-safe with TypeScript

## Technology Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Database**: Supabase (PostgreSQL) with Drizzle ORM using pooler connections
- **Authentication**: Clerk (JWT-only implementation without webhooks)
- **UI**: Radix UI components with Tailwind CSS v4, Lucide icons
- **Animations**: Framer Motion for smooth transitions
- **Charts**: Recharts for data visualization
- **Testing**: Vitest for unit/integration tests, Playwright for E2E tests
- **Forms**: React Hook Form with Zod validation
- **State Management**: React Context API (UserContext, HeaderContext)
- **Notifications**: Sonner for toast notifications

## Environment Setup

Ensure `.env.local` contains:
```
# Supabase Database (using pooler for IPv4 compatibility)
DATABASE_URL=your_supabase_pooler_connection_string

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/login
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/signup
```

## API Routes

### Health & Testing
- `/api/health/db` - Database connection health check
- `/api/test/database-connection` - Test database connectivity
- `/api/test/jwt-implementation` - Verify JWT auth implementation

### User Management
- `/api/user/current` - Get current user information (handles both auth and anonymous)
- `/api/user/roles` - Fetch user roles and permissions
- `/api/user/upgrade` - Upgrade anonymous user to authenticated (auto-triggered on sign-up)

### Voting & Statements
- `/api/vote/cast` - Cast a vote (votes are immutable, cannot update)
- `/api/statement/submit` - Submit a new statement to a poll

## Application Pages & Routes (v2.0 - Single-Page Architecture)

### Public Pages
- `/` - Landing page (redirects to `/polls`)
- `/polls` - Browse all published polls with filtering
- **`/polls/[slug]`** - **Combined poll page with Vote/Results views** (single-page with tabs)
  - Replaces old separate routes: `/vote`, `/insights`, `/results`, `/closed`
  - Vote view: Voting interface with split-screen buttons
  - Results view: Personal insights + aggregate results + demographic heatmap
  - Tab navigation switches between views (no page reload)
  - Results tab locked until 10 votes completed
  - Demographics modal appears after 10th vote (blocks Results until submitted)

### Authenticated Pages
- `/polls/create` - Create new poll (requires sign-in)
- `/polls/[slug]/manage` - Poll management interface (owner/manager only)
- `/admin/dashboard` - Admin dashboard
- `/admin/moderation` - Statement moderation interface
- `/unauthorized` - Access denied page

### Auth Pages
- `/login` - Clerk sign-in page
- `/signup` - Clerk sign-up page

### Test Pages (Development)
All test pages are publicly accessible in development:
- `/test-auth` - Authentication flow testing
- `/test-admin/*` - Admin functionality testing
- `/test-polls/*` - Poll interaction testing
- `/test-dashboard` - Dashboard component testing
- `/test-analytics` - Analytics visualization testing

## Key Design Decisions

### Architecture & Infrastructure
- **Service Layer Architecture** - Business logic centralized in services, not scattered in queries/actions
- **Supabase over Clerk for RBAC** - Database-managed roles allow poll-specific permissions and fine-grained control
- **JWT-only authentication** - Simplified auth without webhook complexity, using Clerk JWTs directly
- **Supabase pooler connections** - Using connection pooling for better IPv4 compatibility and performance
- **Type-first development** - Zod validation schemas drive TypeScript types and runtime validation
- **Context-based state** - UserContext and HeaderContext for global state management
- **Single-page architecture (v2.0)** - Combined Vote/Results views with tab navigation instead of separate routes
- **Centralized strings (v2.0)** - All Hebrew UI text managed in `lib/strings/he.ts` for consistency

### Voting & Poll Features
- **Statement-based voting** - Direct voting on positions with split-screen Agree/Disagree buttons
- **Statement batching** - 10 statements at a time with inline "next batch" prompts for better UX on large polls
- **Immutable votes** - Once cast, votes cannot be changed (enforced in voting logic)
- **Fixed voting threshold** - Users must complete 10 votes to unlock Results view
- **Results unlocking (v2.0)** - Results tab locked until 10 votes completed, shows counter "(7/10)"
- **Universal closed poll access** - Both voters and non-voters can view results; voters get personal insights
- **Unpublish capability** - Polls can be returned to draft state from published (votes preserved)
- **Button label flexibility** - Poll-specific button labels (support/oppose/unsure) override global defaults when set

### User Experience (v2.0)
- **Anonymous support** - Session-based anonymous users with seamless auth upgrade path
- **Automatic upgrade flow** - Anonymous→authenticated transition preserves all user data
- **User creation flexibility** - Users created on demographics save OR first vote (whichever first)
- **Demographics gating** - **Mandatory AFTER 10 votes, BEFORE results** (all 4 fields required), never re-requested
- **Adaptive header system** - Dynamic header variants (voting, management, admin, minimal, default)
- **Real-time vote stats** - Stats appear on voting buttons immediately after each vote (animated)
- **Tab-based navigation** - Client-side view switching between Vote and Results (no page reload)
- **Dark modern aesthetic** - Purple/pink gradient background with white content cards

### Content & Data Management
- **Minimum 6 statements** - Required (not just recommended) to create a poll for meaningful engagement
- **Statement lifecycle** - Rejected statements deleted (not archived) to avoid DB clutter
- **Mock AI insights** - AI service ready for API integration (currently using mock generators)
- **Results caching** - AI-generated summaries cached for 24 hours to reduce API calls
- **Profile caching strategy** - 24-hour cache for user profiles to minimize external API calls
- **Insight regeneration** - Personal insights recalculated when votes change, only latest version stored

## Component Architecture

### UI Components
- **`components/ui/`** - Radix UI primitives styled with Tailwind CSS v4
- **`components/shared/`** - Shared layout components (AdaptiveHeader, MobileNav)
- **`components/modals/`** - Modal dialogs (PublishPollModal, UnpublishPollModal, AddStatementModal, EditStatementModal)
- **`components/auth/`** - Authentication components (ProtectedRoute)

### v1.x Components (Legacy - Being Replaced)
- **`components/voting/`** - Old voting interface (StatementCard, ProgressBar, VoteResultOverlay, ContinuationPage)
- **`components/polls/`** - Old poll components (PollDeckCard, CardDeckPackage, ClickableCardDeck)

### v2.0 Components (New Architecture)
- **`components/voting-v2/`** - New voting interface components
  - `SplitVoteCard` - 50/50 split Agree/Disagree buttons with stats overlay
  - `ProgressSegments` - Stories-style progress bar (thinner, purple theme)
  - `QuestionPill` - Blue gradient pill displaying poll question
  - `NextBatchPrompt` - Inline prompt between batches
- **`components/polls-v2/`** - New poll components
  - `PollCardGradient` - Purple/pink gradient header with white body
  - `TabNavigation` - Vote/Results tab switcher
  - `ResultsLockedBanner` - Shows when results are locked with counter
- **`components/results-v2/`** - Results view components
  - `InsightCard` - Gradient card with personal influence profile
  - `AggregateStats` - Vote distribution visualization
  - `DemographicHeatmap` - Demographic breakdown charts
- **`components/banners/`** - Informational banners
  - `DemographicsBanner` - Prompts demographics after 10 votes
  - `ResultsLockedBanner` - Explains results unlocking requirement

### Header System
- **AdaptiveHeader** (`components/shared/adaptive-header.tsx`) - Context-aware header with multiple variants
- **HeaderContext** (`contexts/header-context.tsx`) - Global header configuration
- **Header Variants**:
  - `default` - Standard navigation with logo and auth
  - `voting` - Compact header with progress bar and actions
  - `management` - Poll owner/manager interface
  - `admin` - Admin dashboard header
  - `minimal` - Simple header for auth/results pages
  - `hidden` - No header rendered

## Development Guidelines

### For New Features
1. **Start with services** - Create or extend services in `lib/services/`
2. **Add validation** - Define Zod schemas in `lib/validations/`
3. **Create actions** - Wrap service calls in Server Actions
4. **Build UI** - Use actions in React components
5. **Use contexts** - Leverage UserContext and HeaderContext for state
6. **Import strings** - All UI text from `lib/strings/he.ts` (never hardcode Hebrew text)
7. **Use design tokens** - Import from `lib/design-tokens-v2.ts` for styling consistency

### v2.0 Development Guidelines
- **Component isolation** - New components in `components/*-v2/` directories
- **Reference migration plan** - Follow `.claude/misc/MIGRATION_PLAN.md` for implementation sequence
- **Preserve infrastructure** - Never modify DB schema, queries, actions, or services during UI migration
- **Hebrew terminology** - Use approved terms from `lib/strings/he.ts` (דיון for poll, עמדה for statement)
- **Design system adherence** - Follow `lib/design-tokens-v2.ts` for colors, spacing, animations
- **Single-page architecture** - Build tab-based views, not separate routes
- **RTL layout** - Use logical properties (ms-*, me-*, start, end) not directional (ml-*, mr-*, left, right)

### Code Quality Standards
- **Always run `npm run build`** - Ensure TypeScript compilation before committing
- **Use provided services** - Don't bypass services to call queries directly
- **Follow validation patterns** - Use Zod schemas for all input validation
- **Handle errors consistently** - Use the established error patterns
- **Leverage contexts** - Use UserContext for user state, HeaderContext for header config
- **Immutable votes** - Never allow vote updates once cast
- **Centralized strings** - Import all UI text from `lib/strings/he.ts`

### Hooks & Utilities
- **`hooks/use-current-user.ts`** - Access user context (wraps UserContext)
- **`hooks/use-mobile.ts`** - Responsive breakpoint detection
- **`hooks/use-toast.ts`** - Toast notification utilities
- **`lib/utils/session.ts`** - Session ID generation and management
- **`lib/utils/voting.ts`** - Vote calculation utilities
- **`lib/utils/slug.ts`** - URL slug generation
- **`lib/utils/permissions.ts`** - Permission checking helpers

### Design & Localization Utilities (v2.0)
- **`lib/design-tokens-v2.ts`** - Complete design system (colors, spacing, typography, components)
- **`lib/strings/he.ts`** - Centralized Hebrew strings organized by page/component