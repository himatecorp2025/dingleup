const autocannon = require('autocannon');
const config = require('../config');

async function runLeaderboardLoadTest() {
  console.log('\n🏆 Starting Leaderboard Load Test...\n');

  const url = `${config.supabaseUrl}${config.endpoints.leaderboard}`;
  
  const instance = autocannon({
    url,
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
      countryCode: 'HU'
    })
  });

  autocannon.track(instance, { renderProgressBar: true });

  return new Promise((resolve) => {
    instance.on('done', (result) => {
      console.log('\n✅ Leaderboard Test Complete\n');
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
  runLeaderboardLoadTest()
    .then(result => {
      console.log('\n📊 Leaderboard Results:', JSON.stringify(result, null, 2));
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Test failed:', error);
      process.exit(1);
    });
}

module.exports = runLeaderboardLoadTest;
