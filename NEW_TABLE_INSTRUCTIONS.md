# Adding New Tables to the Pulse Database

This guide provides step-by-step instructions for adding new database tables to the Pulse application.

## Overview

The project uses **Drizzle ORM** with **PostgreSQL (via Supabase)** and follows a 3-layer architecture:
1. **Schema Layer** (`db/schema/`) - Table definitions
2. **Query Layer** (`db/queries/`) - Database operations
3. **Action Layer** (`actions/`) - Next.js Server Actions

## Step-by-Step Guide

### Step 1: Define the Schema

Create a new file in `db/schema/` for your table:

**Example: `db/schema/my-new-table.ts`**

```typescript
import { pgTable, text, uuid, timestamp } from "drizzle-orm/pg-core";
import { users } from "./users"; // Import related tables if needed

export const myNewTable = pgTable("my_new_table", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export type MyNewTable = typeof myNewTable.$inferSelect;
export type NewMyNewTable = typeof myNewTable.$inferInsert;
```

**Key points:**
- Use `snake_case` for column names (database convention)
- Use `camelCase` for TypeScript variable names
- Always include `createdAt` timestamp for audit trails
- Add `updatedAt` if the record will be modified
- Use `.references()` for foreign keys with appropriate `onDelete` behavior
- Export both select (`MyNewTable`) and insert (`NewMyNewTable`) types

### Step 2: Update Schema Index

Add your new table to `db/schema/index.ts`:

```typescript
export * from './my-new-table';
```

This ensures the table is available to the database connection and migrations.

### Step 3: Create Query Functions

Create a new file in `db/queries/` with CRUD operations:

**Example: `db/queries/my-new-table-queries.ts`**

```typescript
import { eq, desc } from "drizzle-orm";
import { db } from "@/db/db";
import { myNewTable, type MyNewTable, type NewMyNewTable } from "@/db/schema";

// Create
export async function createMyNewTable(data: NewMyNewTable): Promise<MyNewTable> {
  const [result] = await db.insert(myNewTable).values(data).returning();
  return result;
}

// Read (single)
export async function getMyNewTableById(id: string): Promise<MyNewTable | undefined> {
  return await db.query.myNewTable.findFirst({
    where: eq(myNewTable.id, id),
  });
}

// Read (list)
export async function getAllMyNewTables(): Promise<MyNewTable[]> {
  return await db.query.myNewTable.findMany({
    orderBy: [desc(myNewTable.createdAt)],
  });
}

// Update
export async function updateMyNewTable(
  id: string,
  data: Partial<NewMyNewTable>
): Promise<MyNewTable> {
  const [result] = await db
    .update(myNewTable)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(myNewTable.id, id))
    .returning();
  return result;
}

// Delete
export async function deleteMyNewTable(id: string): Promise<void> {
  await db.delete(myNewTable).where(eq(myNewTable.id, id));
}
```

**Key points:**
- Use Drizzle's query API for read operations (better type inference)
- Use `.returning()` for insert/update to get the result
- Always update `updatedAt` when modifying records
- Include WHERE clauses for update/delete to prevent accidents

### Step 4: Create Zod Validation Schemas

Create validation schemas in `lib/validations/`:

**Example: `lib/validations/my-new-table-validation.ts`**

```typescript
import { z } from "zod";

export const myNewTableSchema = z.object({
  userId: z.string().uuid("Invalid user ID"),
  name: z.string().min(1, "Name is required").max(255, "Name too long"),
  description: z.string().optional(),
});

export type MyNewTableInput = z.infer<typeof myNewTableSchema>;
```

### Step 5: Create Server Actions

Create Server Actions in `actions/`:

**Example: `actions/my-new-table-actions.ts`**

```typescript
"use server";

import { revalidatePath } from "next/cache";
import {
  createMyNewTable,
  getMyNewTableById,
  getAllMyNewTables,
  updateMyNewTable,
  deleteMyNewTable,
} from "@/db/queries/my-new-table-queries";
import { myNewTableSchema } from "@/lib/validations/my-new-table-validation";
import type { MyNewTableInput } from "@/lib/validations/my-new-table-validation";

export async function createMyNewTableAction(data: MyNewTableInput) {
  try {
    // Validate input
    const validated = myNewTableSchema.parse(data);

    // Create record
    const result = await createMyNewTable(validated);

    // Revalidate relevant pages
    revalidatePath("/my-new-tables");

    return { success: true, data: result };
  } catch (error) {
    console.error("Error creating my new table:", error);
    return { success: false, error: "Failed to create record" };
  }
}

export async function getMyNewTableAction(id: string) {
  try {
    const result = await getMyNewTableById(id);
    if (!result) {
      return { success: false, error: "Record not found" };
    }
    return { success: true, data: result };
  } catch (error) {
    console.error("Error fetching my new table:", error);
    return { success: false, error: "Failed to fetch record" };
  }
}

// Add more actions as needed...
```

**Key points:**
- Always validate input with Zod schemas
- Use try-catch for error handling
- Return consistent `{ success, data?, error? }` format
- Call `revalidatePath()` to update cached pages
- Log errors for debugging

### Step 6: Generate and Apply Migration

Generate a migration file:

```bash
npm run db:generate
```

This creates a new migration file in `db/migrations/`. Review the generated SQL to ensure it's correct.

Apply the migration using Drizzle Kit push:

```bash
npx drizzle-kit push
```

Or apply manually via the migration script if needed.

### Step 7: Enable Row Level Security (RLS)

**IMPORTANT: All new tables MUST have RLS enabled for security.**

Create a migration file manually or add to an existing one:

**Example: `db/migrations/00XX_enable_rls_my_new_table.sql`**

```sql
-- Enable Row Level Security on the new table
ALTER TABLE "my_new_table" ENABLE ROW LEVEL SECURITY;

-- Create a restrictive policy that blocks direct database access
-- (Server Actions using service role will bypass this policy automatically)
CREATE POLICY "my_new_table_block_direct_access"
ON "my_new_table"
FOR ALL
USING (false);
```

Apply the RLS migration:

```bash
npx tsx scripts/apply-rls-migration.ts
```

Or use the `check-rls-status.ts` script to verify:

```bash
npx tsx scripts/check-rls-status.ts
```

**Why RLS is Required:**
- **Defense-in-depth security**: Protects against direct database access if `DATABASE_URL` is exposed
- **Zero application changes**: Server Actions use service role credentials that bypass RLS
- **Best practice**: Industry standard for sensitive data protection (GDPR, SOC 2, ISO 27001 compliance)

### Step 8: Update Database Connection (if needed)

If you're adding enums or complex types, ensure they're included in the schema object in `db/db.ts`:

```typescript
import * as schema from "./schema";

export const db = drizzle(queryClient, { schema });
```

The wildcard import `* as schema` should already include your new table.

### Step 9: Test Your Implementation

Create test cases to verify:

1. **Schema validation** - Ensure types are correct
2. **CRUD operations** - Test create, read, update, delete
3. **RLS protection** - Verify direct database access is blocked
4. **Server Actions** - Ensure actions work correctly with RLS enabled

Example test:

```typescript
import { describe, it, expect } from 'vitest';
import { createMyNewTable, getMyNewTableById } from '@/db/queries/my-new-table-queries';

describe('MyNewTable Queries', () => {
  it('should create and retrieve a record', async () => {
    const data = {
      userId: 'test-user-id',
      name: 'Test Name',
      description: 'Test Description',
    };

    const created = await createMyNewTable(data);
    expect(created).toBeDefined();
    expect(created.name).toBe(data.name);

    const retrieved = await getMyNewTableById(created.id);
    expect(retrieved).toEqual(created);
  });
});
```

## Best Practices

### Naming Conventions
- **Table names**: `snake_case` in database (e.g., `my_new_table`)
- **Column names**: `snake_case` in database (e.g., `user_id`)
- **TypeScript variables**: `camelCase` (e.g., `myNewTable`, `userId`)
- **Types**: `PascalCase` (e.g., `MyNewTable`)

### Foreign Keys
Always specify `onDelete` behavior:
- `cascade` - Delete child records when parent is deleted (common)
- `set null` - Set foreign key to null when parent is deleted
- `restrict` - Prevent deletion if child records exist

### Indexes
Add indexes for:
- Foreign keys (automatic in PostgreSQL for references)
- Frequently queried columns
- Columns used in WHERE clauses or JOINs

Example:
```typescript
import { pgTable, uuid, text, index } from "drizzle-orm/pg-core";

export const myNewTable = pgTable("my_new_table", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  status: text("status").notNull(),
}, (table) => ({
  userIdIdx: index("my_new_table_user_id_idx").on(table.userId),
  statusIdx: index("my_new_table_status_idx").on(table.status),
}));
```

### Security Considerations
1. **Always enable RLS** on new tables (no exceptions)
2. **Validate all inputs** with Zod schemas
3. **Use parameterized queries** (Drizzle does this automatically)
4. **Log errors** but don't expose sensitive details to users
5. **Check permissions** before operations (use `lib/utils/permissions.ts`)

### Performance Tips
1. **Use indexes** for frequently queried columns
2. **Limit SELECT fields** to only what you need
3. **Use pagination** for large result sets
4. **Cache expensive queries** with Next.js caching strategies
5. **Avoid N+1 queries** - use JOINs or batch operations

## Example: Complete Implementation

See existing tables for reference:
- `db/schema/polls.ts` - Complex table with enums and relationships
- `db/schema/votes.ts` - Table with constraints and indexes
- `db/schema/user-demographics.ts` - Table with multiple foreign keys

## Troubleshooting

### Migration fails
- Check for syntax errors in schema definition
- Ensure all imported types are correct
- Verify foreign key references exist

### RLS blocks application
- Verify you're using `DATABASE_URL` with service role credentials
- Check that RLS policies are correctly defined (USING false for default deny)
- Test with `scripts/check-rls-status.ts`

### Type errors
- Ensure schema is exported from `db/schema/index.ts`
- Check that types are properly inferred with `$inferSelect` and `$inferInsert`
- Rebuild the project with `npm run build`

## Additional Resources

- [Drizzle ORM Documentation](https://orm.drizzle.team/)
- [PostgreSQL RLS Documentation](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [Supabase RLS Guide](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Zod Validation](https://zod.dev/)
