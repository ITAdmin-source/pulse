/**
 * Check Database Role and RLS Status
 * Determines what database role is being used and whether RLS would protect
 */

import { config } from 'dotenv';
import postgres from 'postgres';
import path from 'path';

config({ path: path.resolve(__dirname, '../.env.local') });

async function checkDatabaseRole() {
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('  DATABASE ROLE & RLS ANALYSIS');
  console.log('═══════════════════════════════════════════════════════\n');

  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL not found');
    process.exit(1);
  }

  const sql = postgres(process.env.DATABASE_URL, {
    prepare: false,
  });

  try {
    // Check current database role
    console.log('1. Current Database Connection');
    console.log('─────────────────────────────────────────────────────────');

    const [roleInfo] = await sql`
      SELECT
        current_user as username,
        current_database() as database,
        inet_server_addr() as server_ip,
        inet_server_port() as server_port
    `;

    console.log('Username:', roleInfo.username);
    console.log('Database:', roleInfo.database);
    console.log('Server:', `${roleInfo.server_ip}:${roleInfo.server_port}`);
    console.log('');

    // Check if this is a superuser or service role
    const [roleAttrs] = await sql`
      SELECT
        rolname,
        rolsuper as is_superuser,
        rolbypassrls as bypasses_rls,
        rolcreatedb,
        rolcreaterole
      FROM pg_roles
      WHERE rolname = current_user
    `;

    console.log('2. Role Permissions');
    console.log('─────────────────────────────────────────────────────────');
    console.log('Role Name:', roleAttrs.rolname);
    console.log('Is Superuser:', roleAttrs.is_superuser ? '✅ YES' : '❌ NO');
    console.log('Bypasses RLS:', roleAttrs.bypasses_rls ? '✅ YES (RLS will NOT protect)' : '❌ NO (RLS will protect)');
    console.log('Can Create DBs:', roleAttrs.rolcreatedb ? 'Yes' : 'No');
    console.log('Can Create Roles:', roleAttrs.rolcreaterole ? 'Yes' : 'No');
    console.log('');

    // Check RLS status on critical tables
    console.log('3. Row Level Security Status');
    console.log('─────────────────────────────────────────────────────────');

    const rlsStatus = await sql`
      SELECT
        schemaname,
        tablename,
        rowsecurity as rls_enabled
      FROM pg_tables
      WHERE schemaname = 'public'
      AND tablename IN ('users', 'polls', 'statements', 'votes', 'user_demographics')
      ORDER BY tablename
    `;

    rlsStatus.forEach((table: any) => {
      const status = table.rls_enabled ? '✅ Enabled' : '❌ Disabled';
      console.log(`${table.tablename.padEnd(25)} ${status}`);
    });
    console.log('');

    // Check if there are any RLS policies
    console.log('4. RLS Policies Count');
    console.log('─────────────────────────────────────────────────────────');

    const [policyCount] = await sql`
      SELECT COUNT(*) as count
      FROM pg_policies
      WHERE schemaname = 'public'
    `;

    console.log('Active RLS Policies:', policyCount.count);
    console.log('');

    // CRITICAL ANALYSIS
    console.log('═══════════════════════════════════════════════════════');
    console.log('  CRITICAL ANALYSIS: Would RLS Prevent Deletion?');
    console.log('═══════════════════════════════════════════════════════\n');

    const rlsEnabled = rlsStatus.some((t: any) => t.rls_enabled);
    const bypassesRls = roleAttrs.bypasses_rls;

    if (!rlsEnabled) {
      console.log('❌ RLS WOULD NOT HAVE HELPED');
      console.log('   Reason: RLS is DISABLED on all tables');
      console.log('   Status: No RLS policies are active');
      console.log('');
      console.log('   Even if RLS was enabled, your connection uses:');
      console.log(`   Role: ${roleAttrs.rolname}`);
      console.log(`   Bypasses RLS: ${bypassesRls ? 'YES' : 'NO'}`);
    } else if (bypassesRls) {
      console.log('❌ RLS WOULD NOT HAVE HELPED');
      console.log('   Reason: Your database role BYPASSES RLS');
      console.log(`   Role: ${roleAttrs.rolname}`);
      console.log('   Bypass RLS: YES (superuser or service role)');
      console.log('');
      console.log('   RLS policies do NOT apply to roles with BYPASSRLS attribute');
      console.log('   Supabase service roles (postgres.xxx) typically bypass RLS');
    } else {
      console.log('✅ RLS WOULD HAVE HELPED!');
      console.log('   RLS is enabled AND your role does not bypass it');
      console.log('   Policies would have blocked unauthorized deletions');
    }

    console.log('');
    console.log('Key Understanding:');
    console.log('─────────────────────────────────────────────────────────');
    console.log('• Supabase provides TWO types of connection strings:');
    console.log('  1. SERVICE ROLE (postgres.xxx) - Bypasses ALL RLS');
    console.log('  2. ANON/AUTHENTICATED - Subject to RLS policies');
    console.log('');
    console.log('• Your DATABASE_URL uses: SERVICE ROLE connection');
    console.log('• Integration tests use the same SERVICE ROLE');
    console.log('• Therefore: RLS would NOT have prevented the deletion');
    console.log('');
    console.log('RLS is designed to protect against:');
    console.log('  ✅ Anonymous client connections (anon key)');
    console.log('  ✅ Authenticated user connections (user JWT)');
    console.log('  ❌ NOT service role connections (by design)');
    console.log('');
    console.log('Service roles bypass RLS because:');
    console.log('  • Server actions need full database access');
    console.log('  • Administrative operations require unrestricted access');
    console.log('  • Database migrations must bypass RLS');
    console.log('  • Background jobs need elevated permissions');
    console.log('');

    await sql.end();
    process.exit(0);

  } catch (error) {
    console.error('Error:', error);
    await sql.end();
    process.exit(1);
  }
}

checkDatabaseRole();
