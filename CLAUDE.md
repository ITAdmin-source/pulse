# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Pulse** is a participatory polling platform inspired by Pol.is that enables democratic engagement through:
- **Statement-based voting** - Users vote agree/disagree/neutral on statements within polls
- **User-generated content** - Participants can submit new statements (when enabled)
- **Personal insights** - AI-generated insights based on individual voting patterns
- **Flexible participation** - Anonymous (browser session) or authenticated (Clerk) users
- **Database-managed RBAC** - Fine-grained permissions independent of Clerk roles

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
- `polls` - Main poll entities with lifecycle (draft→published→closed), control settings, and voting requirements
- `statements` - Poll statements with approval workflow (null=pending, true=approved, false=rejected then deleted)
- `votes` - User votes on statements with unique constraint per (user_id, statement_id)
- `user_poll_insights` - AI-generated insights per user/poll (only latest version kept)

**User System:**
- `users` - Core user data supporting both anonymous (session_id) and authenticated (clerk_user_id) users
- `user_demographics` - Links users to demographic categories
- `user_profiles` - Extended profile info for authenticated users (name, picture, social links)
- `user_roles` - Database-managed RBAC system independent of Clerk

**Demographics:**
- `age_groups`, `genders`, `ethnicities`, `political_parties` - Lookup tables for user demographics

### Important Constraints & Business Rules

- **Vote values** are constrained to exactly `-1` (disagree), `0` (neutral/unsure), `1` (agree)
- **Unique voting** - One vote per user per statement via unique constraint (users can update votes)
- **Composite primary key** on user_poll_insights (user_id, poll_id) ensures only latest insight per user/poll
- **Cascade deletes** - Statements/votes deleted when polls removed, insights deleted when users/polls removed
- **Voting threshold** - Users must vote on `min_statements_voted_to_end` statements (default 5, min 1) for participation to count
- **Statement moderation** - Only approved statements appear; rejected statements are deleted
- **Anonymous user transition** - Anonymous users who sign up have their votes transferred to authenticated identity

## Infrastructure Services (NEW)

The project now includes a comprehensive service layer in `lib/services/` that provides business logic and data access:

### Core Services
- **UserService** (`lib/services/user-service.ts`) - User creation, authentication, role management, JIT user creation from Clerk
- **UserProfileService** (`lib/services/user-profile-service.ts`) - Clerk profile caching, display name management, social profiles
- **PollService** (`lib/services/poll-service.ts`) - Poll lifecycle, statistics, slug generation
- **VotingService** (`lib/services/voting-service.ts`) - Vote recording, progress tracking, distribution analysis
- **StatementService** (`lib/services/statement-service.ts`) - Statement CRUD, approval workflow, moderation

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

## Authentication & Middleware (NEW)

### Clerk Integration
- **Provider setup** - ClerkProvider in root layout
- **Middleware** - Route protection with public/protected route matching
- **JWT-only authentication** - No webhook dependency, uses JWT tokens from Clerk
- **JIT user creation** - Users created on-demand when first authenticated
- **Profile caching** - 24-hour cache for Clerk profile data to reduce API calls
- **Anonymous support** - Session-based users with seamless upgrade path

### User Management
- **Dual user system** - Anonymous (session_id) and authenticated (clerk_user_id)
- **Seamless upgrade** - Anonymous users can authenticate without losing data
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
4. Must reach minimum voting threshold for participation to count
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
- **Demographics** - One-time optional prompt before first card, never re-requested
- **Closed poll access** - Both voters and non-voters can view results; only voters see personal insights

## Technology Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Database**: Supabase (PostgreSQL) with Drizzle ORM using pooler connections
- **Authentication**: Clerk (JWT-only implementation without webhooks)
- **UI**: Radix UI components with Tailwind CSS, Lucide icons
- **Testing**: Vitest for unit/integration tests, Playwright for E2E tests
- **Forms**: React Hook Form with Zod validation
- **State Management**: React Context API (UserContext for user state)

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
- `/api/user/current` - Get current user information
- `/api/user/roles` - Fetch user roles and permissions
- `/api/user/upgrade` - Upgrade anonymous user to authenticated

### Voting & Statements
- `/api/vote/cast` - Cast or update a vote
- `/api/statement/submit` - Submit a new statement to a poll

## Test Pages

Development includes comprehensive test pages for all major features:
- `/test-auth` - Authentication flow testing
- `/test-admin/*` - Admin functionality testing
- `/test-polls/*` - Poll interaction testing
- `/test-dashboard` - Dashboard component testing
- `/test-analytics` - Analytics visualization testing

## Key Design Decisions

- **Service Layer Architecture** - Business logic centralized in services, not scattered in queries/actions
- **Supabase over Clerk for RBAC** - Database-managed roles allow poll-specific permissions and fine-grained control
- **Card deck metaphor** - Visual design inspired by card deck with Stories progress bar for intuitive voting
- **Statement batching** - 10 statements at a time with continuation pages for better UX on large polls
- **Unpublish capability** - Polls can be returned to draft state from published (votes preserved)
- **Universal closed poll access** - Both voters and non-voters can view results; voters get insights
- **Minimum 6 statements** - Required (not just recommended) to create a poll for meaningful engagement
- **User creation flexibility** - Users created on demographics save OR first vote (whichever first)
- **Button label flexibility** - Poll-specific button labels (support/oppose/unsure) override global defaults when set
- **Statement lifecycle** - Rejected statements deleted (not archived) to avoid DB clutter
- **Voting thresholds** - Configurable minimum engagement ensures meaningful participation
- **Anonymous support** - Session-based anonymous users with seamless auth upgrade path
- **Insight regeneration** - Personal insights recalculated when votes change, only latest version stored
- **Type-first development** - Zod validation schemas drive TypeScript types and runtime validation
- **JWT-only authentication** - Simplified auth without webhook complexity, using Clerk JWTs directly
- **Profile caching strategy** - 24-hour cache for user profiles to minimize external API calls
- **Supabase pooler connections** - Using connection pooling for better IPv4 compatibility and performance

## Development Guidelines (NEW)

### For New Features
1. **Start with services** - Create or extend services in `lib/services/`
2. **Add validation** - Define Zod schemas in `lib/validations/`
3. **Create actions** - Wrap service calls in Server Actions
4. **Build UI** - Use actions in React components

### Code Quality Standards
- **Always run `npm run build`** - Ensure TypeScript compilation before committing
- **Use provided services** - Don't bypass services to call queries directly
- **Follow validation patterns** - Use Zod schemas for all input validation
- **Handle errors consistently** - Use the established error patterns