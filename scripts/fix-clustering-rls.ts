/**
 * Fix RLS on Clustering Tables
 * The clustering tables have RLS SQL in their migration but it wasn't applied
 */

import { config } from 'dotenv';
import postgres from 'postgres';
import path from 'path';

config({ path: path.resolve(__dirname, '../.env.local') });

async function fixClusteringRls() {
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('  FIXING RLS ON CLUSTERING TABLES');
  console.log('═══════════════════════════════════════════════════════\n');

  const sql = postgres(process.env.DATABASE_URL!, { prepare: false });

  try {
    console.log('Applying RLS to clustering tables...\n');

    // Enable RLS and create policies for clustering tables
    await sql.unsafe(`
      -- POLL_CLUSTERING_METADATA
      ALTER TABLE "poll_clustering_metadata" ENABLE ROW LEVEL SECURITY;

      DROP POLICY IF EXISTS "poll_clustering_metadata_block_direct_access" ON "poll_clustering_metadata";
      CREATE POLICY "poll_clustering_metadata_block_direct_access"
      ON "poll_clustering_metadata"
      FOR ALL
      USING (false);

      -- USER_CLUSTERING_POSITIONS
      ALTER TABLE "user_clustering_positions" ENABLE ROW LEVEL SECURITY;

      DROP POLICY IF EXISTS "user_clustering_positions_block_direct_access" ON "user_clustering_positions";
      CREATE POLICY "user_clustering_positions_block_direct_access"
      ON "user_clustering_positions"
      FOR ALL
      USING (false);

      -- STATEMENT_CLASSIFICATIONS
      ALTER TABLE "statement_classifications" ENABLE ROW LEVEL SECURITY;

      DROP POLICY IF EXISTS "statement_classifications_block_direct_access" ON "statement_classifications";
      CREATE POLICY "statement_classifications_block_direct_access"
      ON "statement_classifications"
      FOR ALL
      USING (false);

      -- STATEMENT_WEIGHTS
      ALTER TABLE "statement_weights" ENABLE ROW LEVEL SECURITY;

      DROP POLICY IF EXISTS "statement_weights_block_direct_access" ON "statement_weights";
      CREATE POLICY "statement_weights_block_direct_access"
      ON "statement_weights"
      FOR ALL
      USING (false);
    `);

    console.log('✅ RLS enabled on all clustering tables!\n');

    // Verify
    const results = await sql`
      SELECT tablename, rowsecurity
      FROM pg_tables
      WHERE schemaname='public'
      AND tablename IN ('poll_clustering_metadata', 'statement_classifications', 'user_clustering_positions', 'statement_weights')
      ORDER BY tablename
    `;

    console.log('Verification:');
    console.log('─────────────────────────────────────────');
    results.forEach((r: any) => {
      console.log(`${r.tablename.padEnd(35)} ${r.rowsecurity ? '✅ Enabled' : '❌ Disabled'}`);
    });
    console.log('');

    await sql.end();
    process.exit(0);

  } catch (error) {
    console.error('Error:', error);
    await sql.end();
    process.exit(1);
  }
}

fixClusteringRls();
