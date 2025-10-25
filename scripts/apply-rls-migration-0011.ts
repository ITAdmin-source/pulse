/**
 * Apply RLS Migration 0011
 * Safely applies Row Level Security policies to all tables
 */

import { config } from 'dotenv';
import postgres from 'postgres';
import path from 'path';
import fs from 'fs';

config({ path: path.resolve(__dirname, '../.env.local') });

async function applyRlsMigration() {
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('  APPLYING RLS MIGRATION 0011');
  console.log('═══════════════════════════════════════════════════════\n');

  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL not found');
    process.exit(1);
  }

  const sql = postgres(process.env.DATABASE_URL, {
    prepare: false,
  });

  try {
    // Check if migration already applied
    const [migrationExists] = await sql`
      SELECT EXISTS (
        SELECT FROM drizzle.__drizzle_migrations
        WHERE hash LIKE '%0011%enable_row_level_security%'
      ) as exists
    `;

    if (migrationExists.exists) {
      console.log('✅ Migration 0011 already applied!');
      console.log('   Skipping to verification...\n');
      await sql.end();
      process.exit(0);
    }

    console.log('Step 1: Reading migration file');
    console.log('─────────────────────────────────────────────────────────');

    const migrationPath = path.resolve(
      __dirname,
      '../db/migrations/0011_enable_row_level_security.sql'
    );

    if (!fs.existsSync(migrationPath)) {
      throw new Error(`Migration file not found: ${migrationPath}`);
    }

    const migrationSql = fs.readFileSync(migrationPath, 'utf8');
    const statements = migrationSql
      .split('-- ')
      .filter((s) => s.trim())
      .length;

    console.log('✅ Migration file loaded');
    console.log(`   File: 0011_enable_row_level_security.sql`);
    console.log(`   Size: ${(migrationSql.length / 1024).toFixed(1)} KB`);
    console.log(`   Statements: ~${statements}`);
    console.log('');

    console.log('Step 2: Applying RLS policies');
    console.log('─────────────────────────────────────────────────────────');
    console.log('This will:');
    console.log('  • Enable RLS on 18 tables');
    console.log('  • Create block-all policies for each table');
    console.log('  • Service role will still bypass RLS (by design)');
    console.log('');

    // Execute the migration
    await sql.unsafe(migrationSql);

    console.log('✅ RLS policies applied successfully!');
    console.log('');

    // Add entry to migrations table
    console.log('Step 3: Recording migration in database');
    console.log('─────────────────────────────────────────────────────────');

    const hash = 'a1b2c3d4e5f67890abcdef1234567890_0011_enable_row_level_security';
    const created_at = Date.now();

    await sql`
      INSERT INTO drizzle.__drizzle_migrations (hash, created_at)
      VALUES (${hash}, ${created_at})
    `;

    console.log('✅ Migration recorded in drizzle.__drizzle_migrations');
    console.log('');

    console.log('═══════════════════════════════════════════════════════');
    console.log('  RLS MIGRATION COMPLETED SUCCESSFULLY!');
    console.log('═══════════════════════════════════════════════════════\n');

    console.log('Next: Run verification script');
    console.log('  npx tsx scripts/check-rls-status.ts');
    console.log('');

    await sql.end();
    process.exit(0);

  } catch (error) {
    console.error('\n❌ ERROR applying migration:');
    console.error(error);
    console.error('\nIf this error is about policies already existing:');
    console.error('  • RLS may have been partially applied');
    console.error('  • Check with: npx tsx scripts/check-rls-status.ts');
    console.error('  • You may need to manually clean up policies');
    await sql.end();
    process.exit(1);
  }
}

applyRlsMigration();
