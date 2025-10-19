# Pulse

A participatory polling platform inspired by Pol.is that enables democratic engagement through statement-based voting and AI-generated personal insights.

## Overview

**Pulse** allows users to create polls where participants vote agree/disagree/neutral on statements, submit their own statements (when enabled), and receive personalized AI insights based on their voting patterns. The platform supports both anonymous (session-based) and authenticated users with flexible participation options.

## Key Features

- **Statement-based voting** - Users vote agree/disagree/neutral on statements within polls
- **User-generated content** - Participants can submit new statements (when enabled by poll creator)
- **Personal insights** - AI-generated insights based on individual voting patterns
- **Flexible participation** - Support for both anonymous (browser session) and authenticated users
- **Database-managed RBAC** - Fine-grained permissions independent of authentication provider
- **Poll lifecycle management** - Draft → Published → Closed workflow with configurable timing
- **Statement moderation** - Approval/rejection system for user-submitted statements

## Technology Stack

- **Framework**: Next.js 15 with App Router and Turbopack
- **Language**: TypeScript
- **Database**: Supabase (PostgreSQL) with Drizzle ORM
- **Authentication**: Clerk
- **UI**: Radix UI components with Tailwind CSS
- **Forms**: React Hook Form with Zod validation

## Getting Started

### Prerequisites

Ensure you have Node.js installed and create a `.env.local` file with:

```env
# Supabase Database
DATABASE_URL=your_supabase_postgresql_connection_string

# Clerk Authentication
# Add required Clerk environment variables
```

### Development

```bash
# Install dependencies
npm install

# Run development server with Turbopack
npm run dev

# Apply database migrations
npm run db:migrate
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Development Commands

```bash
# Development server
npm run dev

# Production build
npm run build

# Start production server
npm run start

# Linting
npm run lint

# Database operations
npm run db:generate    # Generate migration
npm run db:migrate     # Apply migrations
npm run db:health      # Connection health check
npm run db:stress      # Connection stress test

# Testing
npm run test           # Run tests in watch mode
npm run test:quick     # Quick unit tests
npm run test:integration # Integration tests (requires DB)
npm run test:e2e       # E2E tests with Playwright
npm run test:all       # Run all test suites
npm run test:coverage  # Generate coverage report
```

## Testing

Pulse uses a multi-layered testing strategy with four test categories:

### Test Categories

**Unit Tests** (`tests/unit/`)
- Fast, isolated tests of services and utilities
- No database required (uses mocks)
- Run on every code change
- Command: `npm run test:quick`

**Integration Tests** (`tests/integration/`)
- Test service interactions with database
- Requires running PostgreSQL database
- Run before commits
- Command: `npm run test:integration`

**E2E Tests** (`tests/e2e/`)
- Complete user workflows through browser
- Uses Playwright for automation
- Run before major releases
- Command: `npm run test:e2e`

**Infrastructure Tests** (`scripts/`)
- Validate database connection health
- Run manually or pre-deployment
- Commands: `npm run db:health`, `npm run db:stress`

### Quick Reference

```bash
# Development (fast feedback)
npm run test:quick              # Unit tests only (~5s)
npm run test:watch              # Watch mode

# Pre-commit (comprehensive)
npm run test:all                # All application tests (~60s)

# Infrastructure (manual/scheduled)
npm run db:health               # Connection health check (~10s)
npm run db:stress               # Stress test (~20s)
```

For comprehensive testing documentation, see **[docs/TESTING_GUIDE.md](docs/TESTING_GUIDE.md)**.

### Coverage Requirements

- Services: 90%+ coverage required
- Validations: 100% coverage required
- Utils: 85%+ coverage required

### Key Test Coverage

- ✅ Vote immutability enforcement
- ✅ Demographics gating workflow (12 integration tests)
- ✅ Statement batching logic (33 tests)
- ✅ Database connection health (6 automated tests)
- ✅ Connection stress testing (350 requests)
```

## Architecture

### Database Design

The application follows a 3-layer architecture:
1. **Schemas** (`db/schema/`) - Drizzle table definitions
2. **Queries** (`db/queries/`) - Database query functions
3. **Actions** (`actions/`) - Next.js Server Actions

**Core entities:**
- `polls` - Main poll entities with lifecycle management
- `statements` - Poll statements with approval workflow
- `votes` - User votes with unique constraint per user/statement
- `users` - Supports both anonymous and authenticated users
- `user_poll_insights` - AI-generated personalized insights

### Key Business Rules

- **Vote constraints**: Values limited to `-1` (disagree), `0` (neutral), `1` (agree)
- **Voting threshold**: Users must vote on minimum statements for participation to count
- **Statement moderation**: User submissions require approval before appearing
- **Role-based access**: Database-managed permissions for poll-specific roles

## Roles & Permissions

- **System Admin** - Global system access
- **Poll Owner** - Poll creator with full management rights
- **Poll Manager** - Per-poll role for statement approval and analytics

## Contributing

This project uses comprehensive type safety with Drizzle ORM and follows consistent patterns for database operations and Server Actions. See `CLAUDE.md` for detailed development guidelines and `NEW_TABLE_INSTRUCTIONS.md` for adding new database tables.