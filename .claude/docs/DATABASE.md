# Database Architecture

Complete database architecture documentation for Pulse platform.

## Connection Configuration

### Supabase Transaction Mode (Port 6543)

**Optimized for Next.js serverless architecture**

```bash
# Required format
DATABASE_URL=postgresql://postgres.[REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true
```

**Key Requirements:**
- **Port:** 6543 (Transaction Mode) - NOT 5432 (Session Mode)
- **Parameter:** `?pgbouncer=true` (required)
- **Client config:** `prepare: false` (already configured in `db/db.ts`)

**Benefits:**
- 10,000+ concurrent connections (vs 15-50 in Session Mode)
- Singleton pattern prevents connection leaks during HMR
- Small pool size (2) optimized for serverless
- Automatic validation warnings for misconfigurations

### Connection Implementation (`db/db.ts`)

```typescript
// Singleton pattern for development
// Small pool for production serverless
// Automatic port/parameter validation
// prepare: false for Transaction Mode compatibility
```

## Database Architecture

### 3-Layer Pattern

1. **Schemas** (`db/schema/`) - Drizzle table definitions
2. **Queries** (`db/queries/`) - Database query functions
3. **Actions** (`actions/`) - Next.js Server Actions

All schemas exported through `db/schema/index.ts` for centralized management.

## Core Tables & Relationships

### Polling System

#### `polls` Table
Main poll entities with lifecycle management

**Key Fields:**
- `id` - UUID primary key
- `title` - Poll title/question
- `slug` - URL-friendly identifier (unique)
- `description` - Optional detailed description
- `emoji` - Poll emoji/icon
- `status` - Lifecycle: draft → published → closed
- `start_time` / `end_time` - Scheduling
- `allow_statement_submissions` - User content flag
- `auto_approve_statements` - Moderation setting
- `require_demographics` - Demographics gating
- `button_labels` - Custom voting button text (JSON)

**Relationships:**
- One-to-many: statements, user_poll_insights
- Cascade deletes: Remove statements/votes when poll deleted

#### `statements` Table
Poll positions/statements with approval workflow

**Key Fields:**
- `id` - UUID primary key
- `poll_id` - Foreign key to polls
- `content` - Statement text
- `submitted_by` - User who created (nullable for admin)
- `approved` - Approval status (null=pending, true=approved, false=rejected)
- `created_at` - Timestamp

**Approval Workflow:**
- `null` - Pending approval (not shown to voters)
- `true` - Approved (visible to voters)
- `false` - Rejected (deleted, not archived)

**Relationships:**
- Many-to-one: poll
- One-to-many: votes
- Cascade deletes: Remove votes when statement deleted

#### `votes` Table
User voting choices on statements

**Key Fields:**
- `user_id` - Foreign key to users
- `statement_id` - Foreign key to statements
- `vote_value` - Choice: -1 (disagree), 0 (pass), 1 (agree)
- `created_at` - Timestamp

**Constraints:**
- **Unique constraint:** (user_id, statement_id) - one vote per user per statement
- **Vote values:** MUST be exactly -1, 0, or 1
- **Immutability:** Votes cannot be updated once cast (enforced in logic, not DB)

**Relationships:**
- Many-to-one: user, statement

#### `user_poll_insights` Table
AI-generated personal insights per user/poll

**Key Fields:**
- `user_id` - Part of composite primary key
- `poll_id` - Part of composite primary key
- `insight_text` - AI-generated insight content
- `created_at` - Last generation timestamp

**Constraints:**
- **Composite primary key:** (user_id, poll_id) - only latest insight kept
- **Cascade deletes:** Remove when user or poll deleted

**Storage Strategy:**
- Only latest version stored (not historical)
- Regenerated when votes change
- Currently uses mock AI (ready for API integration)

#### `poll_results_summaries` Table
Cached AI-generated poll summaries

**Key Fields:**
- `id` - UUID primary key
- `poll_id` - Foreign key to polls (unique)
- `summary_text` - AI-generated summary
- `participant_count` - Number of voters
- `total_votes_count` - Total vote count
- `created_at` - Cache timestamp

**Caching Strategy:**
- 24-hour cache to reduce AI API calls
- Regenerated after expiration or manual invalidation
- Currently uses mock AI (ready for API integration)

### User System

#### `users` Table
Core user data supporting dual identity system

**Key Fields:**
- `id` - UUID primary key
- `clerk_user_id` - Clerk authentication ID (nullable, unique)
- `session_id` - Anonymous session ID (nullable)
- `created_at` / `updated_at` - Timestamps

**Dual Identity System:**
- **Anonymous users:** `session_id` populated, `clerk_user_id` null
- **Authenticated users:** `clerk_user_id` populated
- **Seamless upgrade:** Anonymous user data transferred on sign-up

**Relationships:**
- One-to-many: votes, statements, user_poll_insights
- One-to-one: user_profile
- One-to-many: user_demographics, user_roles

#### `user_profiles` Table
Extended profile info for authenticated users

**Key Fields:**
- `user_id` - Foreign key to users (unique)
- `display_name` - User's display name
- `picture_url` - Profile picture URL
- `social_links` - Social media links (JSON)

**Profile Caching:**
- 24-hour cache for Clerk profile data
- Reduces external API calls
- Managed by UserProfileService

#### `user_demographics` Table
Links users to demographic categories

**Key Fields:**
- `id` - UUID primary key
- `user_id` - Foreign key to users
- `age_group_id` - Foreign key (nullable)
- `gender_id` - Foreign key (nullable)
- `ethnicity_id` - Foreign key (nullable)
- `political_party_id` - Foreign key (nullable)

**Demographics Gating:**
- Mandatory AFTER 10 votes, BEFORE results
- All 4 fields required when prompted
- Never re-requested once submitted

#### `user_roles` Table
Database-managed RBAC system

**Key Fields:**
- `id` - UUID primary key
- `user_id` - Foreign key to users
- `role` - Role type (system_admin, poll_owner, poll_manager)
- `poll_id` - Foreign key to polls (nullable for system_admin)

**Role Types:**
- **system_admin:** Global role, full system access, poll_id=null
- **poll_owner:** Creator of poll, can transfer ownership, all manager permissions
- **poll_manager:** Per-poll role, approve/reject statements, edit settings

**Why Database RBAC (not Clerk):**
- Poll-specific permissions (not possible with Clerk roles)
- Fine-grained control per discussion
- Independent of authentication provider

### Demographics Lookup Tables

#### `age_groups`, `genders`, `ethnicities`, `political_parties`

Simple lookup tables with:
- `id` - UUID primary key
- `name` - Display name
- `created_at` - Timestamp

Used for demographic data categorization and analysis.

## Row Level Security (RLS)

### Status: ✅ ENABLED on ALL 14 Tables

**Defense-in-depth security measure protecting against direct database access.**

### Architecture

- **Server Actions:** Use service role credentials (bypass RLS automatically)
- **Direct connections:** Blocked by RLS policies (e.g., stolen DATABASE_URL)
- **Zero app changes:** RLS transparent to application layer

### Security Benefits

1. **DATABASE_URL exposure protection** - Leaked credentials cannot query data
2. **Compliance alignment** - GDPR, SOC 2, ISO 27001 standards
3. **Audit trail ready** - Database logs show unauthorized access attempts

### Tables Protected (14 Total)

**High Sensitivity:**
- `user_demographics` - Personal demographic data
- `votes` - Personal voting choices
- `user_poll_insights` - Personal AI insights

**Medium Sensitivity:**
- `users`, `user_profiles`, `user_roles`
- `user_feedback`
- `polls`, `statements`

**Low Sensitivity:**
- `poll_results_summaries`
- `age_groups`, `genders`, `ethnicities`, `political_parties`

### RLS Policy Pattern

All tables use restrictive "deny by default" policy:

```sql
ALTER TABLE "table_name" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "table_name_block_direct_access"
ON "table_name"
FOR ALL
USING (false);  -- Deny all direct access
```

### Verification

Check RLS status anytime:
```bash
npx tsx scripts/check-rls-status.ts
```

### Important for New Tables

**ALWAYS enable RLS immediately after creating new tables.**

See `NEW_TABLE_INSTRUCTIONS.md` Step 7 for details.

## Performance Optimization

### Indexes

Performance indexes on high-traffic tables:

**votes table:**
- `user_id` - Fast vote history lookups
- `statement_id` - Fast vote distribution queries
- Composite unique index on (user_id, statement_id)

**statements table:**
- `poll_id` - Fast statement fetching per poll
- `approved` - Fast filtering of approved statements

**user_poll_insights:**
- Composite primary key (user_id, poll_id) - Fast insight lookups

### Query Optimization

- Use Drizzle query builder for type safety
- Leverage indexes for WHERE clauses
- Batch operations where possible
- Cache AI-generated content (24-hour TTL)

## Connection Troubleshooting

### Diagnostic Tools

#### Health Check Script
```bash
npm run db:health    # 6 automated tests (~10s)
```

**Tests:**
1. Basic Connection - Minimal config
2. Transaction Mode Compatibility - prepare: false
3. Connection Latency - 5 sequential queries with timing
4. Concurrent Connections - 10 parallel queries
5. Pool Behavior - Idle timeout and reconnection
6. Active Connections - Pool usage monitoring

#### Stress Test Script
```bash
npm run db:stress    # 350 requests across 6 scenarios (~20s)
```

**Scenarios:**
1. 50 Rapid Sequential Requests
2. 100 Requests with 10 Concurrent
3. 50 Requests with 20 Concurrent (high load)
4. 30 Database-Intensive Queries
5. 100 Concurrent Requests (pool exhaustion test)
6. Post-Idle Recovery Test

### Common Issues & Solutions

#### "Too Many Connections" Error
- **Cause:** Session Mode (port 5432) with limited connections
- **Solution:** Switch to Transaction Mode (port 6543) with `?pgbouncer=true`
- **Impact:** 200x+ connection capacity increase

#### "Prepared Statement" Errors
- **Cause:** Transaction Mode without `prepare: false`
- **Solution:** Already configured in `db/db.ts`
- **Verification:** Check postgres client config

#### Connection Leaks (Development)
- **Cause:** HMR creating new clients without closing old ones
- **Solution:** Singleton pattern (already implemented)
- **Verification:** Check logs for "Reusing existing database client"

#### Intermittent Failures
- **Cause:** Port/parameter configuration mismatch
- **Solution:** Run `npm run db:health` to verify
- **Auto-Detection:** `db/db.ts` warns about mismatches

### Documentation Resources

- **`docs/CONNECTION_DIAGNOSIS_REPORT.md`** - Full diagnostic report
- **`docs/SUPABASE_CONNECTION_TROUBLESHOOTING.md`** - Complete guide
- **`docs/CONNECTION_FIX_SUMMARY.md`** - Quick reference

### Monitoring Best Practices

- **Weekly:** `npm run db:health` for stability check
- **Monthly:** `npm run db:stress` for load testing
- **Pre-deployment:** Verify `/api/health/db` endpoint
- **Production:** Monitor Supabase dashboard for connection patterns

## Important Constraints & Business Rules

### Vote Constraints
- **Values:** Exactly -1 (disagree), 0 (pass/neutral), 1 (agree)
- **Immutability:** Cannot update votes once cast
- **Uniqueness:** One vote per user per statement

### Poll Constraints
- **Minimum statements:** 6 statements required to create poll
- **Voting threshold:** 10 votes to unlock Results view
- **Statement batching:** 10 statements per batch for 10+ statement polls

### User Constraints
- **Demographics:** Mandatory after 10 votes, before results
- **Anonymous upgrade:** Preserves all data on sign-up
- **JIT creation:** Users created on first vote OR demographics save

### Content Lifecycle
- **Statement moderation:** Only approved statements visible
- **Rejected statements:** Deleted (not archived)
- **Poll lifecycle:** draft → published → closed (can unpublish)
- **Cascade deletes:** Statements/votes removed with poll

## Adding New Tables

Follow comprehensive guide in `NEW_TABLE_INSTRUCTIONS.md`:

1. Define schema in `db/schema/`
2. Update schema index
3. Create query functions
4. Build Server Actions
5. Generate migrations
6. Apply migrations
7. **ENABLE RLS** (critical security step)

## TypeScript Types

All types auto-generated using Drizzle:

```typescript
import { type InferSelectModel, type InferInsertModel } from 'drizzle-orm';

// Select type (reading from DB)
export type Poll = InferSelectModel<typeof polls>;

// Insert type (writing to DB)
export type NewPoll = InferInsertModel<typeof polls>;
```

**Naming Convention:**
- Select: `TableName` (e.g., Poll, Statement, Vote)
- Insert: `NewTableName` (e.g., NewPoll, NewStatement, NewVote)
