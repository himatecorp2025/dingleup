const { chromium } = require('playwright');
const config = require('../frontend-config');

async function runUserJourneyTest() {
  console.log('\n🚶 Starting User Journey Load Test...\n');

  const browser = await chromium.launch({ headless: config.headless });
  const context = await browser.newContext({
    viewport: { width: 375, height: 667 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
  });
  
  const page = await context.newPage();
  const metrics = {};

  try {
    // Journey Step 1: Landing Page
    console.log('Step 1: Loading Landing Page...');
    const landingStart = Date.now();
    await page.goto(config.appUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForLoadState('networkidle', { timeout: 15000 });
    metrics.landingPageLoadTime = Date.now() - landingStart;
    console.log(`✅ Landing page loaded in ${metrics.landingPageLoadTime}ms`);

    // Journey Step 2: Navigate to Game
    if (config.scenarios.gamePlay) {
      console.log('Step 2: Navigating to Game...');
      const gameNavStart = Date.now();
      
      // Look for "Play Now" or similar button
      try {
        await page.click('text=/play now/i', { timeout: 5000 });
      } catch {
        // If button not found, navigate directly
        await page.goto(`${config.appUrl}/game`, { waitUntil: 'domcontentloaded' });
      }
      
      await page.waitForLoadState('networkidle', { timeout: 15000 });
      metrics.gamePageLoadTime = Date.now() - gameNavStart;
      console.log(`✅ Game page loaded in ${metrics.gamePageLoadTime}ms`);
    }

    // Journey Step 3: Leaderboard
    if (config.scenarios.leaderboard) {
      console.log('Step 3: Navigating to Leaderboard...');
      const leaderboardStart = Date.now();
      await page.goto(`${config.appUrl}/leaderboard`, { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('networkidle', { timeout: 15000 });
      metrics.leaderboardLoadTime = Date.now() - leaderboardStart;
      console.log(`✅ Leaderboard loaded in ${metrics.leaderboardLoadTime}ms`);
    }

    // Collect resource statistics
    const resourceStats = await page.evaluate(() => {
      const resources = performance.getEntriesByType('resource');
      return {
        totalResources: resources.length,
        jsBundles: resources.filter(r => r.name.endsWith('.js')).length,
        cssFiles: resources.filter(r => r.name.endsWith('.css')).length,
        images: resources.filter(r => r.name.match(/\.(jpg|jpeg|png|gif|svg|webp)$/i)).length,
        totalTransferSize: resources.reduce((sum, r) => sum + (r.transferSize || 0), 0),
      };
    });

    // Collect Core Web Vitals
    const vitals = await page.evaluate(() => {
      return new Promise((resolve) => {
        const data = {
          lcp: 0,
          fcp: 0,
          cls: 0,
        };

        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === 'largest-contentful-paint') {
              data.lcp = entry.renderTime || entry.loadTime;
            }
            if (entry.name === 'first-contentful-paint') {
              data.fcp = entry.startTime;
            }
            if (entry.entryType === 'layout-shift' && !entry.hadRecentInput) {
              data.cls += entry.value;
            }
          }
        });

        observer.observe({ type: 'largest-contentful-paint', buffered: true });
        observer.observe({ type: 'paint', buffered: true });
        observer.observe({ type: 'layout-shift', buffered: true });

        setTimeout(() => resolve(data), 3000);
      });
    });

    await browser.close();

    return {
      ...metrics,
      ...resourceStats,
      largestContentfulPaint: vitals.lcp,
      firstContentfulPaint: vitals.fcp,
      cumulativeLayoutShift: vitals.cls,
      success: true,
    };

  } catch (error) {
    await browser.close();
    console.error('❌ User journey failed:', error.message);
    return {
      ...metrics,
      error: error.message,
      success: false,
    };
  }
}

// Allow direct execution
if (require.main === module) {
  runUserJourneyTest()
    .then(result => {
      console.log('\n📊 User Journey Results:', JSON.stringify(result, null, 2));
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Test failed:', error);
      process.exit(1);
    });
}

module.exports = runUserJourneyTest;
