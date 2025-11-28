#!/usr/bin/env node

const ReportGenerator = require('./utils/report-generator');
const runAuthLoadTest = require('./scenarios/auth-flow');
const runGameFlowLoadTest = require('./scenarios/game-flow');
const runRewardsFlowLoadTest = require('./scenarios/rewards-flow');
const runLeaderboardLoadTest = require('./scenarios/leaderboard-flow');

const config = require('./config');

console.log(`
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║           DingleUP! Comprehensive Load Test Suite             ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝

Configuration:
- Virtual Users: ${config.virtualUsers}
- Test Duration: ${config.testDuration}s per scenario
- Connections: ${config.connections}
- Pipelining: ${config.pipelining}
- Backend: Lovable Cloud (Supabase)

Starting comprehensive load tests...
`);

async function runAllTests() {
  const reporter = new ReportGenerator();

  try {
    // Test 1: Authentication Flow
    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('TEST 1: Authentication Flow (Login with PIN)');
    console.log('═══════════════════════════════════════════════════════════════');
    const authResult = await runAuthLoadTest();
    reporter.addResult('Authentication Flow (login-with-username-pin)', authResult);
    await sleep(5000); // 5s cooldown between tests

    // Test 2: Game Flow (Start, Questions, Complete)
    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('TEST 2: Game Flow (Start → Questions → Complete)');
    console.log('═══════════════════════════════════════════════════════════════');
    const gameResults = await runGameFlowLoadTest();
    
    reporter.addResult('Game Flow: Start Session', gameResults.startGame);
    await sleep(5000);
    
    reporter.addResult('Game Flow: Get Questions', gameResults.getQuestions);
    await sleep(5000);
    
    reporter.addResult('Game Flow: Complete Game', gameResults.completeGame);
    await sleep(5000);

    // Test 3: Rewards Flow
    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('TEST 3: Rewards Flow (Wallet + Daily Gifts)');
    console.log('═══════════════════════════════════════════════════════════════');
    const rewardsResult = await runRewardsFlowLoadTest();
    reporter.addResult('Rewards Flow: Get Wallet', rewardsResult);
    await sleep(5000);

    // Test 4: Leaderboard
    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('TEST 4: Leaderboard (Daily Rankings by Country)');
    console.log('═══════════════════════════════════════════════════════════════');
    const leaderboardResult = await runLeaderboardLoadTest();
    reporter.addResult('Leaderboard: Get Daily Rankings', leaderboardResult);

    // Generate report
    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('Generating comprehensive test report...');
    console.log('═══════════════════════════════════════════════════════════════');
    
    const reportPath = reporter.saveReport();

    console.log(`
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║              Load Test Execution Complete! ✅                  ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝

📄 Detailed report saved to: ${reportPath}

Summary:
- Total Scenarios Tested: ${reporter.results.length}
- Report includes: latency metrics, throughput, error rates, bottlenecks
- Recommendations provided for optimization

Next steps:
1. Review the generated LOAD_TEST_REPORT.md file
2. Identify critical bottlenecks from the analysis
3. Implement recommended optimizations sequentially
4. Re-run tests after each optimization to measure impact

═══════════════════════════════════════════════════════════════
`);

  } catch (error) {
    console.error('\n❌ Load test execution failed:', error);
    process.exit(1);
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Execute all tests
runAllTests()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
