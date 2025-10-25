import { config } from 'dotenv';
import postgres from 'postgres';

config({ path: '.env.local' });

const sql = postgres(process.env.DATABASE_URL!, { prepare: false });

sql`
  SELECT tablename, rowsecurity
  FROM pg_tables
  WHERE schemaname='public'
  AND tablename IN ('poll_clustering_metadata', 'statement_classifications', 'user_clustering_positions', 'statement_weights')
  ORDER BY tablename
`.then(results => {
  console.log('\nClustering Tables RLS Status:');
  console.log('─────────────────────────────────────────');
  results.forEach((r: any) => {
    console.log(`${r.tablename}: ${r.rowsecurity ? '✅ Enabled' : '❌ Disabled'}`);
  });
  console.log('');
  return sql.end();
}).then(() => process.exit(0));
