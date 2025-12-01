const autocannon = require('autocannon');
const config = require('../config');

// ============================================================================
// PLAY NOW FLOW LOAD TEST
// Tests the complete game startup sequence with proper auth headers
// ============================================================================

async function runGameFlowLoadTest() {
  console.log('\n🎮 Starting Play Now Flow Load Test...\n');
  console.log('Target: 10,000+ concurrent users capacity\n');
  
  const results = {};

  // Test 1: Start Game Session (CRITICAL PATH - Play Now button)
  // This is the bottleneck that must handle 10K+ concurrent users
  console.log('Testing: Start Game Session (Play Now flow)...');
  const startGameUrl = `${config.supabaseUrl}${config.endpoints.startGame}`;
  
  const startGameInstance = autocannon({
    url: startGameUrl,
    connections: config.connections,
    pipelining: config.pipelining,
    duration: config.testDuration,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': config.supabaseAnonKey,
      'Authorization': `Bearer ${config.supabaseAnonKey}` // JWT token for authenticated route
    },
    body: JSON.stringify({
      lang: 'en' // CRITICAL: Language parameter required for cache selection
    })
  });

  autocannon.track(startGameInstance, { renderProgressBar: true });

  results.startGame = await new Promise((resolve) => {
    startGameInstance.on('done', (result) => {
      console.log('\n✅ Start Game Session Test Complete');
      console.log(`   Target: <50ms p50, <100ms p99`);
      console.log(`   Actual: p50=${result.latency.p50}ms, p99=${result.latency.p99}ms\n`);
      resolve({
        requests: result.requests,
        latency: result.latency,
        throughput: result.throughput,
        errors: result.errors,
        timeouts: result.timeouts,
        statusCodeStats: result.statusCodeStats || {},
        performance: {
          p50_ms: result.latency.p50,
          p99_ms: result.latency.p99,
          target_p50_ms: 50,
          target_p99_ms: 100,
          meets_target: result.latency.p50 < 50 && result.latency.p99 < 100
        }
      });
    });
  });

  // Test 2: Complete Game
  console.log('Testing: Complete Game endpoint...');
  const completeGameUrl = `${config.supabaseUrl}${config.endpoints.completeGame}`;
  
  const completeGameInstance = autocannon({
    url: completeGameUrl,
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
      category: 'mixed',
      correctAnswers: 12,
      totalQuestions: 15,
      averageResponseTime: 3.5
    })
  });

  autocannon.track(completeGameInstance, { renderProgressBar: true });

  results.completeGame = await new Promise((resolve) => {
    completeGameInstance.on('done', (result) => {
      console.log('\n✅ Complete Game Test Complete');
      console.log(`   Target: <200ms p50, <500ms p99`);
      console.log(`   Actual: p50=${result.latency.p50}ms, p99=${result.latency.p99}ms\n`);
      resolve({
        requests: result.requests,
        latency: result.latency,
        throughput: result.throughput,
        errors: result.errors,
        timeouts: result.timeouts,
        statusCodeStats: result.statusCodeStats || {},
        performance: {
          p50_ms: result.latency.p50,
          p99_ms: result.latency.p99,
          target_p50_ms: 200,
          target_p99_ms: 500,
          meets_target: result.latency.p50 < 200 && result.latency.p99 < 500
        }
      });
    });
  });

  return results;
}

// Allow direct execution
if (require.main === module) {
  runGameFlowLoadTest()
    .then(results => {
      console.log('\n📊 Game Flow Results:', JSON.stringify(results, null, 2));
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Test failed:', error);
      process.exit(1);
    });
}

module.exports = runGameFlowLoadTest;
