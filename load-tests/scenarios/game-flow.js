const autocannon = require('autocannon');
const config = require('../config');

async function runGameFlowLoadTest() {
  console.log('\n🎮 Starting Game Flow Load Test...\n');
  
  const results = {};

  // Test 1: Start Game Session
  console.log('Testing: Start Game Session endpoint...');
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
      'Authorization': `Bearer ${config.supabaseAnonKey}`
    },
    body: JSON.stringify({
      category: 'mixed',
      userId: '00000000-0000-0000-0000-000000000001' // Test user ID
    })
  });

  autocannon.track(startGameInstance, { renderProgressBar: true });

  results.startGame = await new Promise((resolve) => {
    startGameInstance.on('done', (result) => {
      console.log('\n✅ Start Game Test Complete\n');
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

  // Test 2: Get Questions
  console.log('Testing: Get Questions endpoint...');
  const getQuestionsUrl = `${config.supabaseUrl}${config.endpoints.getQuestions}`;
  
  const getQuestionsInstance = autocannon({
    url: getQuestionsUrl,
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
      userId: '00000000-0000-0000-0000-000000000001',
      sessionId: 'test-session-123'
    })
  });

  autocannon.track(getQuestionsInstance, { renderProgressBar: true });

  results.getQuestions = await new Promise((resolve) => {
    getQuestionsInstance.on('done', (result) => {
      console.log('\n✅ Get Questions Test Complete\n');
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

  // Test 3: Complete Game
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
      sessionId: 'test-session-123',
      correctAnswers: 12,
      totalQuestions: 15,
      category: 'mixed',
      averageResponseTime: 3.5
    })
  });

  autocannon.track(completeGameInstance, { renderProgressBar: true });

  results.completeGame = await new Promise((resolve) => {
    completeGameInstance.on('done', (result) => {
      console.log('\n✅ Complete Game Test Complete\n');
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
