const autocannon = require('autocannon');
const config = require('../config');

async function runRewardsFlowLoadTest() {
  console.log('\n🎁 Starting Rewards Flow Load Test...\n');

  // Test: Get Wallet (includes balance + lives + daily gift eligibility)
  console.log('Testing: Get Wallet endpoint...');
  const getWalletUrl = `${config.supabaseUrl}${config.endpoints.getWallet}`;
  
  const instance = autocannon({
    url: getWalletUrl,
    connections: config.connections,
    pipelining: config.pipelining,
    duration: config.testDuration,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': config.supabaseAnonKey,
      'Authorization': `Bearer ${config.supabaseAnonKey}`
    },
    body: JSON.stringify({
      userId: '00000000-0000-0000-0000-000000000001'
    })
  });

  autocannon.track(instance, { renderProgressBar: true });

  return new Promise((resolve) => {
    instance.on('done', (result) => {
      console.log('\n✅ Rewards Flow Test Complete\n');
      resolve({
        requests: result.requests,
        latency: result.latency,
        throughput: result.throughput,
        errors: result.errors,
        timeouts: result.timeouts,
        statusCodeStats: result.statusCodeStats || {}
      });
    });
  });
}

// Allow direct execution
if (require.main === module) {
  runRewardsFlowLoadTest()
    .then(result => {
      console.log('\n📊 Rewards Results:', JSON.stringify(result, null, 2));
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Test failed:', error);
      process.exit(1);
    });
}

module.exports = runRewardsFlowLoadTest;
