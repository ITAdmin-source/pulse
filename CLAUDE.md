# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Pulse** is a participatory polling platform inspired by Pol.is that enables democratic engagement through:
- **Statement-based voting** - Users vote agree/disagree/neutral on statements within polls
- **User-generated content** - Participants can submit new statements (when enabled)
- **Personal insights** - AI-generated insights based on individual voting patterns
- **Flexible participation** - Anonymous (browser session) or authenticated (Clerk) users
- **Database-managed RBAC** - Fine-grained permissions independent of Clerk roles

## Development Commands

```bash
# Development server with Turbopack
npm run dev

# Production build with Turbopack
npm run build

# Start production server
npm run start

# Run ESLint
npm run lint

# Generate database migration
npm run db:generate

# Apply database migrations
npm run db:migrate
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
- `statements` - Poll statements that can be user-suggested and require approval before appearing
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

## Adding New Tables

Follow the comprehensive guide in `NEW_TABLE_INSTRUCTIONS.md` which covers:
- Schema definition with proper imports and relationships
- Updating schema index and database connection
- Creating query functions with CRUD operations
- Building Server Actions with error handling and revalidation
- Generating and applying migrations

## Architecture Patterns

### Server Actions Pattern
All Server Actions follow this pattern:
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
3. **Closed** - Past end_time, read-only but visible

### Voting Process
1. Users see only approved statements
2. Vote agree/disagree/neutral on statements
3. Must reach minimum voting threshold for participation to count
4. Personal insights generated after threshold met

### Statement Management
- User-suggested statements require approval (unless auto_approve_statements enabled)
- Rejected statements are deleted (not archived)
- Only approved statements visible to voters

## Technology Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Database**: Supabase (PostgreSQL) with Drizzle ORM
- **Authentication**: Clerk (with database-managed roles/permissions)
- **UI**: Radix UI components with Tailwind CSS
- **Build**: Turbopack for faster development
- **Forms**: React Hook Form with Zod validation

## Environment Setup

Ensure `.env.local` contains:
```
# Supabase Database
DATABASE_URL=your_supabase_postgresql_connection_string

# Clerk Authentication
# Add required Clerk environment variables for auth integration
```

## Key Design Decisions

- **Supabase over Clerk for RBAC** - Database-managed roles allow poll-specific permissions and fine-grained control
- **Button label flexibility** - Poll-specific button labels (support/oppose/unsure) override global defaults when set
- **Statement lifecycle** - Rejected statements deleted (not archived) to avoid DB clutter
- **Voting thresholds** - Configurable minimum engagement ensures meaningful participation
- **Anonymous support** - Session-based anonymous users with seamless auth upgrade path
- **Insight regeneration** - Personal insights recalculated when votes change, only latest version stored