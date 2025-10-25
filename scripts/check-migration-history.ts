/**
 * Check Migration History
 * Queries the drizzle migrations table to see what was actually applied
 */

import { config } from 'dotenv';
import postgres from 'postgres';
import path from 'path';

config({ path: path.resolve(__dirname, '../.env.local') });

async function checkMigrationHistory() {
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('  DATABASE MIGRATION HISTORY');
  console.log('═══════════════════════════════════════════════════════\n');

  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL not found');
    process.exit(1);
  }

  const sql = postgres(process.env.DATABASE_URL, {
    prepare: false,
  });

  try {
    // Check if migrations table exists
    const [tableExists] = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'drizzle'
        AND table_name = '__drizzle_migrations'
      ) as exists
    `;

    if (!tableExists.exists) {
      console.log('⚠️  No drizzle migrations table found');
      console.log('   Either migrations were never run, or using a different migration system');
      await sql.end();
      process.exit(0);
    }

    // Get all applied migrations
    const migrations = await sql`
      SELECT
        id,
        hash,
        created_at
      FROM drizzle.__drizzle_migrations
      ORDER BY created_at
    `;

    console.log('Applied Migrations:');
    console.log('─────────────────────────────────────────────────────────');
    migrations.forEach((m: any, idx: number) => {
      console.log(`${idx}. ${m.hash}`);
      console.log(`   Applied: ${m.created_at}`);
    });
    console.log('');

    // Check for migration 0009
    const migration9 = migrations.find((m: any) => m.hash.includes('0009'));

    console.log('Migration 0009 Analysis:');
    console.log('─────────────────────────────────────────────────────────');
    if (migration9) {
      console.log('Found:', migration9.hash);
      console.log('Applied:', migration9.created_at);

      if (migration9.hash.includes('enable_row_level_security')) {
        console.log('Type: RLS Migration ✅');
      } else if (migration9.hash.includes('furry_marvel_apes')) {
        console.log('Type: Clustering Tables Migration 📊');
      } else {
        console.log('Type: Unknown');
      }
    } else {
      console.log('❌ No migration 0009 found in database');
    }
    console.log('');

    // Check for any RLS-related migrations
    const rlsMigrations = migrations.filter((m: any) =>
      m.hash.includes('rls') ||
      m.hash.includes('row_level_security') ||
      m.hash.includes('enable_row_level_security')
    );

    console.log('RLS Migrations Found:');
    console.log('─────────────────────────────────────────────────────────');
    if (rlsMigrations.length > 0) {
      rlsMigrations.forEach((m: any) => {
        console.log('✅', m.hash);
        console.log('   Applied:', m.created_at);
      });
    } else {
      console.log('❌ No RLS migrations found in database');
      console.log('   This explains why RLS is not enabled!');
    }
    console.log('');

    await sql.end();
    process.exit(0);

  } catch (error) {
    console.error('Error:', error);
    await sql.end();
    process.exit(1);
  }
}

checkMigrationHistory();
