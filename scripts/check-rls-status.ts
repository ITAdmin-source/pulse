import postgres from 'postgres';
import { config } from 'dotenv';

// Load environment variables from .env.local
config({ path: '.env.local' });

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('❌ DATABASE_URL not found in environment variables');
  process.exit(1);
}

async function checkRlsStatus() {
  console.log('🔍 Checking Row Level Security (RLS) status...\n');

  const sql = postgres(databaseUrl);

  try {
    // Query to check RLS status on all public tables
    const tables = await sql<{ tablename: string; rowsecurity: boolean }[]>`
      SELECT tablename, rowsecurity
      FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY tablename
    `;

    console.log('📊 RLS Status Report:\n');
    console.log('┌─────────────────────────────┬─────────────┐');
    console.log('│ Table Name                  │ RLS Enabled │');
    console.log('├─────────────────────────────┼─────────────┤');

    let enabledCount = 0;
    let disabledCount = 0;

    for (const table of tables) {
      const status = table.rowsecurity ? '✅ YES' : '❌ NO';
      const paddedName = table.tablename.padEnd(27);
      const paddedStatus = status.padEnd(11);
      console.log(`│ ${paddedName} │ ${paddedStatus} │`);

      if (table.rowsecurity) {
        enabledCount++;
      } else {
        disabledCount++;
      }
    }

    console.log('└─────────────────────────────┴─────────────┘\n');

    console.log('📈 Summary:');
    console.log(`   ✅ ${enabledCount} tables with RLS enabled`);
    console.log(`   ❌ ${disabledCount} tables without RLS`);
    console.log(`   📊 Total: ${tables.length} tables\n`);

    if (disabledCount === 0) {
      console.log('🎉 All tables have Row Level Security enabled!');
      console.log('🔒 Your database is now protected against direct access.\n');
    } else {
      console.log('⚠️  Some tables do not have RLS enabled.');
      console.log('   Run the RLS migration to secure all tables.\n');
    }

    // Check for policies
    const policies = await sql<{ tablename: string; policycount: number }[]>`
      SELECT
        schemaname || '.' || tablename as tablename,
        COUNT(*) as policycount
      FROM pg_policies
      WHERE schemaname = 'public'
      GROUP BY schemaname, tablename
      ORDER BY tablename
    `;

    if (policies.length > 0) {
      console.log('🛡️  RLS Policies Found:\n');
      for (const policy of policies) {
        console.log(`   • ${policy.tablename}: ${policy.policycount} policy/policies`);
      }
      console.log('');
    }

  } catch (error) {
    console.error('\n❌ Error checking RLS status:', error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

// Run the check
checkRlsStatus();
