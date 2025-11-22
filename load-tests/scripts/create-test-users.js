/**
 * 100 teszt felhasználó létrehozása az adatbázisban
 * Futtasd ezt egyszer a load teszt előtt!
 * 
 * Usage:
 *   node create-test-users.js
 */

import fetch from 'node-fetch';

const BASE_URL = process.env.BASE_URL || 'https://wdpxmwsxhckazwxufttk.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';

const headers = {
  'Content-Type': 'application/json',
  'apikey': SUPABASE_ANON_KEY,
};

async function createTestUser(index) {
  const username = `loadtest_user_${String(index).padStart(3, '0')}`;
  const pin = '123456';

  try {
    const response = await fetch(`${BASE_URL}/functions/v1/register-with-username-pin`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        username,
        pin,
        country_code: 'HU',
      }),
    });

    if (response.ok) {
      console.log(`✅ Created: ${username}`);
      return { success: true, username };
    } else {
      const error = await response.text();
      if (error.includes('már foglalt')) {
        console.log(`⏭️  Skipped: ${username} (already exists)`);
        return { success: true, username, skipped: true };
      } else {
        console.error(`❌ Failed: ${username} - ${error}`);
        return { success: false, username, error };
      }
    }
  } catch (err) {
    console.error(`❌ Error: ${username} - ${err.message}`);
    return { success: false, username, error: err.message };
  }
}

async function main() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║  DingleUP! Test User Creation                              ║');
  console.log('╠════════════════════════════════════════════════════════════╣');
  console.log('║  Creating 100 test users...                                ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  if (!SUPABASE_ANON_KEY) {
    console.error('❌ SUPABASE_ANON_KEY environment variable not set!');
    process.exit(1);
  }

  const results = [];
  const batchSize = 10;

  for (let i = 0; i < 100; i += batchSize) {
    const batch = [];
    for (let j = i; j < Math.min(i + batchSize, 100); j++) {
      batch.push(createTestUser(j));
    }

    const batchResults = await Promise.all(batch);
    results.push(...batchResults);

    // Small delay between batches
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  const skipped = results.filter(r => r.skipped).length;

  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║  Summary                                                   ║');
  console.log('╠════════════════════════════════════════════════════════════╣');
  console.log(`║  Total:      ${String(results.length).padEnd(46)}║`);
  console.log(`║  Successful: ${String(successful).padEnd(46)}║`);
  console.log(`║  Skipped:    ${String(skipped).padEnd(46)}║`);
  console.log(`║  Failed:     ${String(failed).padEnd(46)}║`);
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  if (failed > 0) {
    console.log('Failed users:');
    results.filter(r => !r.success).forEach(r => {
      console.log(`  - ${r.username}: ${r.error}`);
    });
  }

  process.exit(failed > 0 ? 1 : 0);
}

main();
