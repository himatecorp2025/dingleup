const { chromium } = require('playwright');
const config = require('../frontend-config');

async function simulateConcurrentUsers() {
  console.log(`\n👥 Simulating ${config.concurrentUsers.toLocaleString()} concurrent users...`);
  
  const batchSize = 100; // Process 100 users at a time
  const totalBatches = Math.ceil(config.concurrentUsers / batchSize);
  
  let successfulSessions = 0;
  let failedSessions = 0;
  const loadTimes = [];
  const errors = [];

  console.log(`Processing in ${totalBatches} batches of ${batchSize} users each...`);

  for (let batch = 0; batch < totalBatches; batch++) {
    const currentBatchSize = Math.min(batchSize, config.concurrentUsers - (batch * batchSize));
    console.log(`\nBatch ${batch + 1}/${totalBatches}: ${currentBatchSize} users`);

    const batchPromises = [];
    
    for (let i = 0; i < currentBatchSize; i++) {
      batchPromises.push(simulateSingleUser(i + (batch * batchSize)));
    }

    const batchResults = await Promise.allSettled(batchPromises);
    
    batchResults.forEach(result => {
      if (result.status === 'fulfilled') {
        successfulSessions++;
        if (result.value.loadTime) {
          loadTimes.push(result.value.loadTime);
        }
      } else {
        failedSessions++;
        errors.push(result.reason?.message || 'Unknown error');
      }
    });

    // Progress update
    const totalProcessed = (batch + 1) * batchSize;
    const progress = Math.min(100, (totalProcessed / config.concurrentUsers) * 100);
    console.log(`Progress: ${progress.toFixed(1)}% | Success: ${successfulSessions} | Failed: ${failedSessions}`);

    // Small delay between batches to avoid overwhelming the system
    if (batch < totalBatches - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  // Calculate statistics
  const avgLoadTime = loadTimes.reduce((sum, t) => sum + t, 0) / loadTimes.length;
  const sortedLoadTimes = loadTimes.sort((a, b) => a - b);
  const p95Index = Math.floor(sortedLoadTimes.length * 0.95);
  const p95LoadTime = sortedLoadTimes[p95Index];

  return {
    concurrentUsers: config.concurrentUsers,
    successfulSessions,
    failedSessions,
    successRate: successfulSessions / config.concurrentUsers,
    pageLoadTime: avgLoadTime,
    p95LoadTime,
    errors: errors.slice(0, 10), // Top 10 errors
  };
}

async function simulateSingleUser(userId) {
  const browser = await chromium.launch({ headless: config.headless });
  const context = await browser.newContext({
    viewport: { width: 375, height: 667 }, // Mobile viewport
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15',
  });
  
  const page = await context.newPage();
  
  try {
    const startTime = Date.now();
    
    // Navigate to landing page
    await page.goto(config.appUrl, { 
      waitUntil: 'domcontentloaded',
      timeout: 30000 
    });
    
    // Wait for page to be interactive
    await page.waitForLoadState('networkidle', { timeout: 15000 });
    
    const loadTime = Date.now() - startTime;
    
    // Collect Core Web Vitals
    const vitals = await page.evaluate(() => {
      return new Promise((resolve) => {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lcp = entries.find(e => e.entryType === 'largest-contentful-paint');
          const fcp = entries.find(e => e.name === 'first-contentful-paint');
          
          resolve({
            lcp: lcp?.renderTime || lcp?.loadTime || 0,
            fcp: fcp?.startTime || 0,
          });
        });
        
        observer.observe({ type: 'largest-contentful-paint', buffered: true });
        observer.observe({ type: 'paint', buffered: true });
        
        // Timeout after 5 seconds
        setTimeout(() => resolve({ lcp: 0, fcp: 0 }), 5000);
      });
    });
    
    await browser.close();
    
    return {
      userId,
      loadTime,
      largestContentfulPaint: vitals.lcp,
      firstContentfulPaint: vitals.fcp,
      success: true,
    };
  } catch (error) {
    await browser.close();
    throw error;
  }
}

// Allow direct execution
if (require.main === module) {
  simulateConcurrentUsers()
    .then(result => {
      console.log('\n📊 Concurrent Users Result:', JSON.stringify(result, null, 2));
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Test failed:', error);
      process.exit(1);
    });
}

module.exports = simulateConcurrentUsers;
