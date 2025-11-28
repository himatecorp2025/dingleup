#!/usr/bin/env node

const FrontendReportGenerator = require('./utils/frontend-report-generator');
const runAllLighthouseAudits = require('./scenarios/lighthouse-audit');
const runUserJourneyTest = require('./scenarios/user-journey');
const simulateConcurrentUsers = require('./scenarios/concurrent-users');

const config = require('./frontend-config');

console.log(`
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║       DingleUP! Frontend Performance & Load Test Suite        ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝

Configuration:
- Concurrent Virtual Users: ${config.concurrentUsers.toLocaleString()}
- Ramp-Up Time: ${config.rampUpTime}s
- Sustained Load: ${config.testDuration}s
- Browser: ${config.browserType}
- Mode: ${config.headless ? 'Headless' : 'Headed'}
- App URL: ${config.appUrl}

Starting frontend performance tests...
`);

async function runAllFrontendTests() {
  const reporter = new FrontendReportGenerator();

  try {
    // Test 1: Lighthouse Audits
    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('TEST 1: Lighthouse Performance Audits');
    console.log('═══════════════════════════════════════════════════════════════');
    const lighthouseResults = await runAllLighthouseAudits();
    lighthouseResults.forEach(result => {
      reporter.addLighthouseResult(result.page, result);
    });
    await sleep(5000);

    // Test 2: User Journey Test
    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('TEST 2: Complete User Journey (Landing → Game → Leaderboard)');
    console.log('═══════════════════════════════════════════════════════════════');
    const journeyResult = await runUserJourneyTest();
    reporter.addResult('Complete User Journey', journeyResult);
    await sleep(5000);

    // Test 3: Concurrent Users Load Test
    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log(`TEST 3: ${config.concurrentUsers.toLocaleString()} Concurrent Users Simulation`);
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('⚠️  This test will take significant time...');
    const concurrentResult = await simulateConcurrentUsers();
    reporter.addResult(`${config.concurrentUsers.toLocaleString()} Concurrent Users`, concurrentResult);

    // Generate report
    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('Generating comprehensive frontend test report...');
    console.log('═══════════════════════════════════════════════════════════════');
    
    const reportPath = reporter.saveReport();

    console.log(`
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║         Frontend Load Test Execution Complete! ✅              ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝

📄 Detailed report saved to: ${reportPath}

Summary:
- Lighthouse Audits: ${lighthouseResults.length} pages
- User Journey Test: ${journeyResult.success ? 'PASS' : 'FAIL'}
- Concurrent Users: ${concurrentResult.successfulSessions.toLocaleString()} successful, ${concurrentResult.failedSessions} failed
- Success Rate: ${((concurrentResult.successRate || 0) * 100).toFixed(2)}%

Next steps:
1. Review the generated FRONTEND_LOAD_TEST_REPORT.md file
2. Identify Core Web Vitals that need improvement
3. Implement recommended frontend optimizations
4. Re-run tests after optimizations to measure impact

═══════════════════════════════════════════════════════════════
`);

  } catch (error) {
    console.error('\n❌ Frontend load test execution failed:', error);
    process.exit(1);
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Execute all tests
runAllFrontendTests()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
