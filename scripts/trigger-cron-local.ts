/**
 * Manually trigger clustering cron endpoint (for local development)
 * Production uses Supabase pg_cron, but this script simulates it locally
 */
import { config } from 'dotenv';

config({ path: '.env.local' });

async function triggerCronLocal() {
  const url = 'http://localhost:3000/api/cron/clustering';
  const secret = process.env.CRON_SECRET;

  if (!secret) {
    console.error('❌ CRON_SECRET not found in .env.local');
    process.exit(1);
  }

  console.log('🔄 Triggering clustering cron endpoint...');
  console.log(`   URL: ${url}`);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${secret}`,
        'Content-Type': 'application/json',
      },
    });

    const result = await response.json();

    if (response.ok) {
      console.log('✅ Cron executed successfully:');
      console.log(`   Duration: ${result.duration}ms`);
      console.log(`   Processed: ${result.processed} jobs`);
      console.log(`   Successful: ${result.successful}`);
      console.log(`   Failed: ${result.failed}`);
      console.log(`   Queue stats:`, result.queueStats);

      if (result.errors.length > 0) {
        console.log('   Errors:', result.errors);
      }
    } else {
      console.error('❌ Cron execution failed:');
      console.error(`   Status: ${response.status}`);
      console.error(`   Error:`, result);
    }
  } catch (error) {
    console.error('❌ Failed to call cron endpoint:', error);
    console.error('   Make sure dev server is running: npm run dev');
  }

  process.exit(0);
}

triggerCronLocal();
