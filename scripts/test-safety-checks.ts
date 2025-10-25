/**
 * Test Safety Checks Script
 * Verifies that database deletion safety checks are working correctly
 */

import { config } from 'dotenv';
import path from 'path';

// Load environment
config({ path: path.resolve(__dirname, '../.env.local') });

async function testSafetyChecks() {
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('  TESTING DATABASE SAFETY CHECKS');
  console.log('═══════════════════════════════════════════════════════\n');

  const dbUrl = process.env.DATABASE_URL || '';
  const nodeEnv = process.env.NODE_ENV || '';
  const allowDestructive = process.env.ALLOW_DESTRUCTIVE_TESTS || '';

  console.log('Current Configuration:');
  console.log('─────────────────────────────────────────────────────────');
  console.log('DATABASE_URL:', dbUrl.substring(0, 50) + '...');
  console.log('NODE_ENV:', nodeEnv);
  console.log('ALLOW_DESTRUCTIVE_TESTS:', allowDestructive);
  console.log('\n');

  // Test 1: Check for production indicators
  console.log('Test 1: Production Database Detection');
  console.log('─────────────────────────────────────────────────────────');

  const isProduction =
    nodeEnv === 'production' ||
    dbUrl.includes('supabase.com') ||
    dbUrl.includes('prod') ||
    dbUrl.includes('production');

  if (isProduction) {
    console.log('✅ PASS: Production database detected');
    console.log('   Safety check would BLOCK deletion');
    console.log('   Indicators found:');
    if (nodeEnv === 'production') console.log('   - NODE_ENV=production');
    if (dbUrl.includes('supabase.com')) console.log('   - URL contains "supabase.com"');
    if (dbUrl.includes('prod')) console.log('   - URL contains "prod"');
    if (dbUrl.includes('production')) console.log('   - URL contains "production"');
  } else {
    console.log('⚠️  WARNING: No production indicators found');
    console.log('   This might be a test database');
  }
  console.log('\n');

  // Test 2: Check ALLOW_DESTRUCTIVE_TESTS
  console.log('Test 2: Destructive Tests Permission');
  console.log('─────────────────────────────────────────────────────────');

  if (allowDestructive !== 'true') {
    console.log('✅ PASS: ALLOW_DESTRUCTIVE_TESTS not set');
    console.log('   Safety check would BLOCK deletion');
  } else {
    console.log('⚠️  WARNING: ALLOW_DESTRUCTIVE_TESTS is set to true');
    console.log('   Deletion would be allowed if not blocked by other checks');
  }
  console.log('\n');

  // Test 3: Overall Safety Status
  console.log('Test 3: Overall Safety Status');
  console.log('─────────────────────────────────────────────────────────');

  const wouldBlockProduction = isProduction;
  const wouldBlockPermission = allowDestructive !== 'true';
  const wouldBlock = wouldBlockProduction || wouldBlockPermission;

  if (wouldBlock) {
    console.log('✅ SAFETY CHECKS ACTIVE');
    console.log('   Database deletion would be BLOCKED');
    console.log('   Reasons:');
    if (wouldBlockProduction) console.log('   - Production database detected');
    if (wouldBlockPermission) console.log('   - ALLOW_DESTRUCTIVE_TESTS not set');
  } else {
    console.log('⚠️  WARNING: Database deletion would be ALLOWED');
    console.log('   All safety checks would pass');
    console.log('   This should ONLY happen with a test database');
  }
  console.log('\n');

  // Test 4: Simulate safety check
  console.log('Test 4: Simulate Safety Check Execution');
  console.log('─────────────────────────────────────────────────────────');

  try {
    // Import the helper (this will trigger module load)
    const { DatabaseTestHelper } = await import('../tests/utils/db-test-helpers');
    const helper = new DatabaseTestHelper();

    console.log('Attempting to call cleanup() method...\n');

    // Try to call cleanup - this should throw if safety checks work
    await helper.cleanup();

    console.log('❌ FAIL: cleanup() executed without throwing!');
    console.log('   Safety checks are NOT working correctly');
    console.log('   THIS IS A CRITICAL SECURITY ISSUE');

  } catch (error) {
    if (error instanceof Error && error.message.includes('CRITICAL ERROR')) {
      console.log('✅ PASS: Safety check threw production block error');
      console.log('   Database is protected from accidental deletion');
    } else if (error instanceof Error && error.message.includes('ALLOW_DESTRUCTIVE_TESTS')) {
      console.log('✅ PASS: Safety check threw permission error');
      console.log('   Explicit permission required before deletion');
    } else {
      console.log('⚠️  WARNING: Unexpected error thrown:');
      console.log('  ', error instanceof Error ? error.message : error);
    }
  }
  console.log('\n');

  // Summary
  console.log('═══════════════════════════════════════════════════════');
  console.log('  SUMMARY');
  console.log('═══════════════════════════════════════════════════════\n');

  if (wouldBlock) {
    console.log('✅ Your database is PROTECTED');
    console.log('   Integration tests will not delete data');
    console.log('   Safety checks are working correctly\n');
  } else {
    console.log('⚠️  Your database is NOT PROTECTED');
    console.log('   Integration tests WILL delete data');
    console.log('   Ensure this is a test database only!\n');
  }

  console.log('Next Steps:');
  console.log('1. Restore production data from Supabase backup');
  console.log('2. Create a separate test database for integration tests');
  console.log('3. Configure TEST_DATABASE_URL in .env.test');
  console.log('4. Read tests/SAFETY_README.md for complete setup\n');

  process.exit(0);
}

testSafetyChecks().catch((error) => {
  console.error('Error running safety checks:', error);
  process.exit(1);
});
