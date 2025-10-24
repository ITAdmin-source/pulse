# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Pulse** is a participatory polling platform inspired by Pol.is that enables democratic engagement through statement-based voting, user-generated content, AI-generated insights, and opinion clustering visualization.

**Primary UI Language:** Hebrew with RTL support
**Key Features:** Anonymous + authenticated users, database-managed RBAC, gamification system, real-time voting, opinion clustering & visualization

### Quick Reference

- **Tech Stack:** Next.js 15, TypeScript, Supabase (PostgreSQL), Drizzle ORM, Clerk Auth, Tailwind CSS v4
- **Architecture:** 3-layer pattern (Schemas → Queries → Actions) with Service Layer
- **UI Framework:** Radix UI, Framer Motion, Recharts
- **Testing:** Vitest (unit/integration), Playwright (E2E)
- **Clustering:** PCA dimensionality reduction, K-means clustering, consensus detection
- **ML Libraries:** ml-pca, ml-kmeans, ml-distance, ml-matrix

## Development Commands

```bash
# Development
npm run dev              # Start dev server
npm run dev:clean        # Clean restart (kills processes, clears cache)
npm run build            # Production build (ALWAYS run before committing)
npm run lint             # Code quality check

# Database
npm run db:generate      # Generate migration
npm run db:migrate       # Apply migrations
npm run db:health        # Connection health check (6 tests)
npm run db:stress        # Stress test (350 requests)

# Testing
npm run test             # Run all tests
npm run test:quick       # Quick unit tests
npm run test:integration # Integration tests (requires DB)
npm run test:e2e         # E2E tests (Playwright)
```

## UI Terminology (Hebrew/English)

The application uses Hebrew terminology in the UI while maintaining technical English terms in code:

| Code/Database | UI (English) | UI (Hebrew) |
|---------------|--------------|-------------|
| Poll | Discussion | דיון |
| Statement | Position | עמדה |
| Vote | Vote/Influence | הצבעה / השפעה |
| Agree (1) | Agree | מסכים/ה |
| Disagree (-1) | Disagree | לא מסכים/ה |
| Pass (0) | Pass/Skip | דילוג |

**All UI text managed in:** `lib/strings/he.ts` (never hardcode Hebrew strings)

## Architecture Overview

### Service Layer Pattern (RECOMMENDED)
```typescript
"use server";
import { UserService } from "@/lib/services/user-service";

export async function actionName(data: DataType) {
  try {
    const result = await UserService.method(data);
    revalidatePath("/path");
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: "User message" };
  }
}
```

### Database (Supabase + Drizzle ORM)
- **Connection:** Transaction Mode (Port 6543) with `?pgbouncer=true`
- **RLS:** Enabled on ALL 17 tables (defense-in-depth)
- **Pattern:** Schemas (`db/schema/`) → Queries (`db/queries/`) → Actions (`actions/`)
- **Key Tables:** polls, statements, votes, users, user_demographics, user_poll_insights
- **Clustering Tables:** poll_clustering_metadata, user_clustering_positions, statement_classifications

### Authentication (Clerk)
- **JWT-only** (no webhooks) with JIT user creation
- **Dual system:** Anonymous (session_id) + Authenticated (clerk_user_id)
- **Seamless upgrade:** Anonymous users preserve data when signing up

## Key Business Rules

- **Vote immutability:** Votes cannot be changed once cast
- **Voting threshold:** 10 votes required to unlock Results view
- **Demographics:** Mandatory AFTER 10 votes, BEFORE results (all 4 fields required)
- **Statement batching:** 10 statements per batch for polls with 10+ statements
- **Minimum statements:** 6 statements required to create a poll
- **Closed poll access:** Both voters and non-voters can view results; only voters get insights
- **Clustering eligibility:** 20 users + 6 statements minimum for opinion clustering
- **Background clustering:** Automatically triggered after each vote (non-blocking)

## Design System (v2.0)

**Philosophy:** Dark purple gradient background with vibrant accents and white content cards

### Core Styling
- **Page background:** `bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900`
- **Cards:** White (`bg-white`) with `rounded-2xl` and `shadow-xl`
- **Gradients:** Purple/pink headers (`from-purple-600 to-pink-600`)
- **Voting buttons:** Flat colors (green-500, red-500, gray-100) - NO gradients
- **Design tokens:** Import from `lib/design-tokens-v2.ts`
- **RTL support:** Use logical properties (ms-*, me-*, start, end)

### Component Organization
- **v2.0 components** (production): `components/*-v2/` directories
- **UI primitives:** `components/ui/` (Radix UI + Tailwind)
- **Shared layouts:** `components/shared/` (AdaptiveHeader, MobileNav)

## Development Guidelines

### For New Features
1. **Start with services** (`lib/services/`) - centralized business logic
2. **Add validation** (`lib/validations/`) - Zod schemas
3. **Create actions** (`actions/`) - wrap service calls
4. **Build UI** - use actions in components
5. **Import strings** - from `lib/strings/he.ts` (never hardcode)
6. **Use design tokens** - from `lib/design-tokens-v2.ts`

### Code Quality
- ✅ **ALWAYS run `npm run build`** before committing
- ✅ Use services (don't bypass to call queries directly)
- ✅ Use Zod schemas for validation
- ✅ Import Hebrew strings from `lib/strings/he.ts`
- ✅ Follow design tokens for styling consistency
- ✅ Never allow vote updates (immutability)

### Key Contexts & Hooks
- **UserContext** (`contexts/user-context.tsx`) - Global user state
- **HeaderContext** (`contexts/header-context.tsx`) - Header configuration
- **useCurrentUser** (`hooks/use-current-user.ts`) - Access user context
- **useMobile** (`hooks/use-mobile.ts`) - Responsive breakpoints

## Documentation Structure

For detailed information, see specialized documentation:

- **[.claude/docs/DATABASE.md](.claude/docs/DATABASE.md)** - Database architecture, tables, RLS, connection troubleshooting
- **[.claude/docs/ARCHITECTURE.md](.claude/docs/ARCHITECTURE.md)** - System architecture, services, patterns, workflows
- **[.claude/docs/CLUSTERING.md](.claude/docs/CLUSTERING.md)** - Opinion clustering algorithms, visualization, caching
- **[.claude/docs/UI_DESIGN.md](.claude/docs/UI_DESIGN.md)** - Design system, components, styling, gamification
- **[.claude/docs/DEVELOPMENT.md](.claude/docs/DEVELOPMENT.md)** - Development guidelines, testing, deployment
- **[USE_CASES.md](USE_CASES.md)** - User journeys and personas
- **[UX_UI_SPEC.md](UX_UI_SPEC.md)** - Complete UX/UI specification
- **[.claude/misc/HEBREW_TERMINOLOGY.md](.claude/misc/HEBREW_TERMINOLOGY.md)** - Hebrew terminology reference

## Environment Setup

Required in `.env.local`:
```bash
# Supabase (Transaction Mode - Port 6543)
DATABASE_URL=postgresql://postgres.[REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_key
CLERK_SECRET_KEY=your_secret
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/login
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/signup
```

## Quick Troubleshooting

### Database Connection Issues
```bash
npm run db:health    # Run 6 diagnostic tests
npm run db:stress    # Run stress test (350 requests)
```

Common fixes:
- Use port **6543** (Transaction Mode) not 5432
- Include `?pgbouncer=true` in connection string
- Ensure `prepare: false` in db config (already set)

### Build Failures
```bash
npm run build        # Check for TypeScript errors
npm run lint         # Check for linting issues
```

## API Routes

- `/api/health/db` - Database health check
- `/api/user/current` - Current user info
- `/api/vote/cast` - Cast vote (immutable)
- `/api/statement/submit` - Submit statement

## Application Routes

- `/` → `/polls` - Browse discussions
- `/polls/[slug]` - **Combined Vote/Results page** (single-page with tabs)
- `/polls/[slug]/opinionmap` - Opinion clustering visualization (requires 20+ users)
- `/polls/create` - Create poll (authenticated)
- `/polls/[slug]/manage` - Poll management (owner/manager)
- `/admin/*` - Admin interfaces

## Key Design Decisions

- **Service Layer:** Centralized business logic (not scattered in queries/actions)
- **Database RBAC:** Poll-specific permissions via database (not Clerk)
- **JWT-only auth:** No webhooks, direct JWT validation
- **Transaction Mode:** Port 6543 for 10,000+ concurrent connections
- **Single-page architecture:** Tab navigation (no separate routes for vote/results)
- **Immutable votes:** Enforce once-cast policy
- **Statement batching:** 10 statements per batch for better UX
- **Gamification:** Milestone-based encouragement with confetti effects
- **Opinion clustering:** Pol.is-inspired PCA + K-means clustering for visualizing opinion groups
- **Privacy-preserving visualization:** Opinion map shows group boundaries, not individual positions
- **Multi-tier caching:** In-memory (10ms) → Database (50-100ms) for clustering performance

## Testing Coverage (Oct 2025)

✅ Vote immutability - enforced and tested
✅ StatementManager - 33 comprehensive tests
✅ Demographics gating - 12 integration tests
✅ Infrastructure health - 6 automated tests
✅ Load testing - 350 requests across 6 scenarios
⚠️ Integration tests require running PostgreSQL
⚠️ Infrastructure tests require live Supabase connection

---

**For comprehensive details on specific topics, refer to the specialized documentation in `.claude/docs/`**
