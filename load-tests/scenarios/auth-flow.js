const autocannon = require('autocannon');
const config = require('../config');

async function runAuthLoadTest() {
  console.log('\n🔐 Starting Authentication Flow Load Test...\n');

  const url = `${config.supabaseUrl}${config.endpoints.loginPin}`;

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
      username: `testuser_${Math.random().toString(36).substring(7)}`,
      pin: '1234'
    }),
    // Simulate different users
    setupClient: (client) => {
      client.setBody(JSON.stringify({
        username: `testuser_${Math.random().toString(36).substring(7)}`,
        pin: '1234'
      }));
    }
  });

  autocannon.track(instance, { renderProgressBar: true });

  return new Promise((resolve) => {
    instance.on('done', (result) => {
      console.log('\n✅ Authentication Load Test Complete\n');
      resolve({
        requests: result.requests,
        latency: result.latency,
        throughput: result.throughput,
        errors: result.errors,
        timeouts: result.timeouts,
        statusCodeStats: result.statusCodeStats || result['2xx'] || {}
      });
    });
  });
}

// Allow direct execution
if (require.main === module) {
  runAuthLoadTest()
    .then(result => {
      console.log('\n📊 Results:', JSON.stringify(result, null, 2));
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Test failed:', error);
      process.exit(1);
    });
}

module.exports = runAuthLoadTest;
