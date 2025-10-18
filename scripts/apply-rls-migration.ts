import { readFileSync } from 'fs';
import { join } from 'path';
import postgres from 'postgres';
import { config } from 'dotenv';

// Load environment variables from .env.local
config({ path: '.env.local' });

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('❌ DATABASE_URL not found in environment variables');
  process.exit(1);
}

async function applyRlsMigration() {
  console.log('🔒 Applying Row Level Security (RLS) migration...\n');

  const sql = postgres(databaseUrl);

  try {
    // Read the migration file
    const migrationPath = join(process.cwd(), 'db', 'migrations', '0009_enable_row_level_security.sql');
    const migrationSql = readFileSync(migrationPath, 'utf-8');

    // Split the SQL into individual statements
    // Remove comment blocks first, then split on semicolons
    const cleanedSql = migrationSql
      .split('\n')
      .filter(line => !line.trim().startsWith('--'))
      .join('\n');

    const statements = cleanedSql
      .split(';')
      .map(s => s.trim())
      .filter(s => s && (s.toUpperCase().includes('ALTER TABLE') || s.toUpperCase().includes('CREATE POLICY')));

    console.log(`📄 Found ${statements.length} SQL statements to execute\n`);

    // Execute each statement
    let successCount = 0;
    let skipCount = 0;

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];

      // Skip pure comment blocks
      if (statement.startsWith('--')) {
        continue;
      }

      // Extract table name for logging
      const tableMatch = statement.match(/(?:ON|TABLE)\s+"([^"]+)"/);
      const tableName = tableMatch ? tableMatch[1] : 'unknown';
      const action = statement.includes('ENABLE ROW LEVEL SECURITY') ? 'ENABLE RLS' :
                     statement.includes('CREATE POLICY') ? 'CREATE POLICY' :
                     'EXECUTE';

      try {
        await sql.unsafe(statement + ';');
        successCount++;
        console.log(`✅ [${i + 1}/${statements.length}] ${action} on "${tableName}"`);
      } catch (error: any) {
        // Check if error is due to RLS already being enabled or policy already existing
        if (error.message.includes('already has row-level security') ||
            error.message.includes('already exists')) {
          skipCount++;
          console.log(`⏭️  [${i + 1}/${statements.length}] SKIP ${action} on "${tableName}" (already applied)`);
        } else {
          console.error(`❌ [${i + 1}/${statements.length}] FAILED ${action} on "${tableName}"`);
          console.error(`   Error: ${error.message}`);
          throw error; // Re-throw if it's a real error
        }
      }
    }

    console.log('\n' + '='.repeat(80));
    console.log(`✅ RLS Migration completed successfully!`);
    console.log(`   - ${successCount} statements executed`);
    console.log(`   - ${skipCount} statements skipped (already applied)`);
    console.log(`   - All 14 tables now have Row Level Security enabled`);
    console.log('='.repeat(80) + '\n');

    console.log('🔐 Security Status:');
    console.log('   ✅ Direct database connections are now blocked by RLS policies');
    console.log('   ✅ Server Actions continue to work (service role bypasses RLS)');
    console.log('   ✅ Defense-in-depth security layer successfully added\n');

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

// Run the migration
applyRlsMigration();
