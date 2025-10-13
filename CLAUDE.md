# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Pulse** is a participatory polling platform inspired by Pol.is that enables democratic engagement through:
- **Card-based choosing** - Users choose cards (Keep/Throw/Pass) from a deck within polls
- **User-generated content** - Participants can submit new cards (when enabled)
- **Personal insights** - AI-generated insights based on individual card choices
- **Flexible participation** - Anonymous (browser session) or authenticated (Clerk) users
- **Database-managed RBAC** - Fine-grained permissions independent of Clerk roles

### Card Deck Terminology

**Primary UI Language: Hebrew with RTL support**

The application uses a physical card deck metaphor throughout. While the database layer uses technical terms like "statement," "vote," and "poll," the user-facing interface uses card terminology:

| Database/Code (Technical) | User Interface (English) | User Interface (Hebrew) |
|---------------------------|--------------------------|------------------------|
| Poll | Deck | חפיסה |
| Statement | Card | קלף |
| Vote | Choose | בחר |
| Voter | Player | שחקן |
| Agree (vote value: 1) | Keep | לשמור |
| Disagree (vote value: -1) | Throw | לזרוק |
| Unsure/Pass (vote value: 0) | Pass | לדלג |
| Voting Interface | Card Choosing Interface | ממשק בחירת קלפים |
| Statement Submission | Add Card | הוסף קלף |
| Vote Distribution | Choice Results | תוצאות בחירה |
| Personal Insights | Personal Card | קלף אישי |
| Poll Results | Deck Summary | סיכום חפיסה |

**Implementation Notes:**
- Database schema uses "votes," "statements," "polls" (unchanged for stability)
- Service layer and actions use technical terminology internally
- UI components, page text, and user-facing messages use Hebrew card terminology
- All UI text defaults to Hebrew with `dir="auto"` for proper RTL rendering
- Button labels: לשמור (Keep) / לזרוק (Throw) / לדלג (Pass)

### Additional Documentation

For comprehensive details on user workflows and interface design:
- **[USE_CASES.md](USE_CASES.md)** - Complete user journeys, personas, and detailed workflow documentation
- **[UX_UI_SPEC.md](UX_UI_SPEC.md)** - Full UX/UI specification including component library, layouts, and interaction patterns

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

### UX/UI Design Principles
- **Card deck metaphor** - Each statement is a card, each poll is a deck, voting is sorting cards
- **Stories-style progress bar** - Shows position in the deck (Instagram Stories style)
- **User creation timing** - User record created on demographics save OR first vote (whichever first)
- **Statement batching** - Shows 10 statements at a time with continuation page for larger polls
- **Demographics** - Mandatory one-time prompt before first card (all 4 fields required), never re-requested, only shown if user doesn't already have demographics
- **Closed poll access** - Both voters and non-voters can view results; only voters see personal insights

### Design System & Look-and-Feel (v1.5 - 2025-10-13)

**Philosophy:** Neutral backdrop with warm card accents for maximum visual hierarchy

#### Core Design Tokens (`lib/design-tokens.ts`)
Centralized design system with colors, spacing, typography, and animation constants:
- **Background colors** - Stone gradients for all pages
- **Card colors** - Warm amber for active content, purple for insights, green for results
- **Spacing system** - 8px base unit (8, 16, 24, 32, 40, 48px)
- **Typography scale** - 5 consistent sizes with proper font weights
- **Animation timings** - Standardized durations for all transitions

#### Universal Page Background
**All pages use:** `bg-gradient-to-br from-stone-100 via-stone-50 to-stone-100`
- Applied to: voting, results, insights, polls list, poll entry, admin, auth pages
- Cool neutral gray-beige for 40-50% contrast with warm cards
- Creates professional, cohesive app-wide aesthetic

#### Card System
**Primary Cards (Statements, Active Polls):**
- Gradient: `from-amber-50 via-orange-50/40 to-amber-50`
- Border: `border-amber-200/50`
- Shadow: `shadow-lg` to `shadow-xl`
- Corners: `rounded-3xl` for tactile card aesthetic
- Aspect ratio: 2:3 (consistent across all card types)

**Secondary Cards (Insights):**
- Gradient: `from-violet-50 via-indigo-50/40 to-violet-50`
- Same border/shadow pattern as primary cards

**Results Cards:**
- Gradient: `from-emerald-50 via-teal-50/40 to-emerald-50`
- Consistent card aesthetic

**Closed/Inactive:**
- Gradient: `from-gray-200 via-gray-100 to-gray-200`
- Overlay: `bg-gray-900/10` with status badge

#### Container Patterns
**Headers/Footers:**
- Background: `bg-white/70` to `bg-white/95` with `backdrop-blur-sm`
- Border: `border-stone-200` (top or bottom based on position)

**Content Containers:**
- Poll question pill: `bg-white/80 backdrop-blur-sm border-stone-200`
- Form containers: `bg-white/70` with stone borders
- Card backgrounds within pages: `bg-white/80` (not full stone gradient)

#### Interactive Elements
**Progress Bar:**
- Filled: `bg-amber-500`
- Current: `bg-amber-300` with pulse animation
- Empty: `bg-amber-100`
- Size: `h-2` (thicker for visibility)
- Gap: `gap-1.5` between segments

**Buttons:**
- Keep/Agree: `bg-gradient-to-b from-emerald-600 to-emerald-700`
- Throw/Disagree: `bg-gradient-to-b from-red-600 to-red-700`
- Pass/Skip: `bg-gray-600`
- Primary Action: `bg-gradient-to-b from-amber-600 to-amber-700`
- Secondary: `border-amber-200 hover:bg-amber-50`
- All buttons: `shadow-lg hover:shadow-xl` with `h-14` for primary voting actions

#### Typography
**Text Colors:**
- Primary: `text-gray-900` (dark, high contrast)
- Secondary: `text-gray-600` (medium, readable)
- Muted: `text-gray-500` (subtle, helper text)
- On-card: `text-gray-800` (slightly lighter for warm backgrounds)

**Font Sizes:**
- Context (poll questions): `text-base md:text-lg font-semibold`
- Statement (hero): `text-lg md:text-xl font-medium` (enlarged in v1.5)
- Buttons: `text-base font-bold`
- Helper text: `text-sm text-gray-600`

#### Spacing & Rhythm
**Consistent 8px system:**
- xs: 8px, sm: 16px, md: 24px, lg: 32px, xl: 40px, 2xl: 48px
- Page padding: `py-8` to `py-12`
- Card margins: `mb-8` between sections
- Button height: `h-12` for secondary, `h-14` for primary voting actions

#### Component Styling Rules
When creating/styling components:
1. **Always use stone background** for full-page containers
2. **Use white/80 overlays** for nested containers (not stone gradient)
3. **Use amber borders** (`border-amber-200/50`) for warm cards
4. **Use stone borders** (`border-stone-200`) for neutral containers
5. **Maintain 3xl rounding** (`rounded-3xl`) for cards
6. **Apply consistent shadows** (`shadow-lg` standard, `shadow-xl` for hero elements)
7. **Follow RTL principles** with logical properties (ms-*, me-*, start, end)
8. **Keep decorative elements** (✦ symbols) for card authenticity

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

## Application Pages & Routes

### Public Pages
- `/` - Landing page
- `/polls` - Browse all published polls with filtering
- `/polls/[slug]` - Poll overview page
- `/polls/[slug]/vote` - Voting interface (card deck UI)
- `/polls/[slug]/insights` - Personal AI-generated insights (requires minimum votes)
- `/polls/[slug]/results` - Poll results and aggregate data
- `/polls/[slug]/closed` - Closed poll view (accessible to all)

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

### Voting & Poll Features
- **Card deck metaphor** - Visual design inspired by card deck with Stories progress bar for intuitive voting
- **Statement batching** - 10 statements at a time with continuation pages for better UX on large polls
- **Immutable votes** - Once cast, votes cannot be changed (enforced in voting logic)
- **Fixed voting threshold** - Users must complete first batch (10) or all statements if fewer to finish and see insights
- **Universal closed poll access** - Both voters and non-voters can view results; voters get insights
- **Unpublish capability** - Polls can be returned to draft state from published (votes preserved)
- **Button label flexibility** - Poll-specific button labels (support/oppose/unsure) override global defaults when set

### User Experience
- **Anonymous support** - Session-based anonymous users with seamless auth upgrade path
- **Automatic upgrade flow** - Anonymous→authenticated transition preserves all user data
- **User creation flexibility** - Users created on demographics save OR first vote (whichever first)
- **Demographics prompt** - One-time optional prompt, never re-requested
- **Adaptive header system** - Dynamic header variants (voting, management, admin, minimal, default)
- **Real-time vote results** - Immediate feedback after voting with distribution overlay

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
- **`components/voting/`** - Voting interface components (StatementCard, ProgressBar, VoteResultOverlay, ContinuationPage)
- **`components/polls/`** - Poll-specific components (PollCard, DemographicsModal, PollFilters, InsightActions)
- **`components/modals/`** - Modal dialogs (PublishPollModal, UnpublishPollModal, AddStatementModal, EditStatementModal)
- **`components/auth/`** - Authentication components (ProtectedRoute)

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

### Voting Interface Components
- **StatementCard** - Individual statement with vote buttons
- **ProgressBar** - Stories-style progress indicator (Instagram-like)
- **StatementCounter** - Shows current position in batch
- **VoteResultOverlay** - Displays vote distribution after voting
- **ContinuationPage** - Between-batch summary page
- **StatementSubmissionModal** - User-submitted statements modal

## Development Guidelines

### For New Features
1. **Start with services** - Create or extend services in `lib/services/`
2. **Add validation** - Define Zod schemas in `lib/validations/`
3. **Create actions** - Wrap service calls in Server Actions
4. **Build UI** - Use actions in React components
5. **Use contexts** - Leverage UserContext and HeaderContext for state

### Code Quality Standards
- **Always run `npm run build`** - Ensure TypeScript compilation before committing
- **Use provided services** - Don't bypass services to call queries directly
- **Follow validation patterns** - Use Zod schemas for all input validation
- **Handle errors consistently** - Use the established error patterns
- **Leverage contexts** - Use UserContext for user state, HeaderContext for header config
- **Immutable votes** - Never allow vote updates once cast

### Hooks & Utilities
- **`hooks/use-current-user.ts`** - Access user context (wraps UserContext)
- **`hooks/use-mobile.ts`** - Responsive breakpoint detection
- **`hooks/use-toast.ts`** - Toast notification utilities
- **`lib/utils/session.ts`** - Session ID generation and management
- **`lib/utils/voting.ts`** - Vote calculation utilities
- **`lib/utils/slug.ts`** - URL slug generation
- **`lib/utils/permissions.ts`** - Permission checking helpers