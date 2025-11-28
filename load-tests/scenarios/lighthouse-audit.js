const lighthouse = require('lighthouse');
const chromeLauncher = require('chrome-launcher');
const config = require('../frontend-config');

async function runLighthouseAudit(url, formFactor = 'mobile') {
  console.log(`\n🔦 Running Lighthouse audit for: ${url} (${formFactor})`);

  const chrome = await chromeLauncher.launch({ chromeFlags: ['--headless'] });
  
  const options = {
    logLevel: 'error',
    output: 'json',
    onlyCategories: config.lighthouse.categories,
    port: chrome.port,
    formFactor: formFactor,
    screenEmulation: formFactor === 'mobile' ? {
      mobile: true,
      width: 375,
      height: 667,
      deviceScaleFactor: 2,
    } : {
      mobile: false,
      width: 1920,
      height: 1080,
      deviceScaleFactor: 1,
    }
  };

  const runnerResult = await lighthouse(url, options);
  await chrome.kill();

  // Extract relevant metrics
  const { lhr } = runnerResult;
  
  return {
    performance: Math.round(lhr.categories.performance.score * 100),
    accessibility: Math.round(lhr.categories.accessibility.score * 100),
    bestPractices: Math.round(lhr.categories['best-practices'].score * 100),
    seo: Math.round(lhr.categories.seo.score * 100),
    pwa: Math.round(lhr.categories.pwa.score * 100),
    firstContentfulPaint: lhr.audits['first-contentful-paint'].numericValue,
    largestContentfulPaint: lhr.audits['largest-contentful-paint'].numericValue,
    totalBlockingTime: lhr.audits['total-blocking-time'].numericValue,
    cumulativeLayoutShift: lhr.audits['cumulative-layout-shift'].numericValue,
    speedIndex: lhr.audits['speed-index'].numericValue,
  };
}

async function runAllLighthouseAudits() {
  const results = [];
  const baseUrl = config.appUrl;

  // Test key pages
  const pages = [
    { url: baseUrl, name: 'Landing Page' },
    { url: `${baseUrl}/game`, name: 'Game Page' },
    { url: `${baseUrl}/leaderboard`, name: 'Leaderboard' },
  ];

  for (const page of pages) {
    console.log(`\nAuditing: ${page.name}...`);
    try {
      const result = await runLighthouseAudit(page.url, config.lighthouse.formFactor);
      results.push({
        page: page.name,
        ...result
      });
      console.log(`✅ ${page.name} audit complete`);
    } catch (error) {
      console.error(`❌ Failed to audit ${page.name}:`, error.message);
      results.push({
        page: page.name,
        error: error.message
      });
    }
  }

  return results;
}

// Allow direct execution
if (require.main === module) {
  runAllLighthouseAudits()
    .then(results => {
      console.log('\n📊 Lighthouse Results:', JSON.stringify(results, null, 2));
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Lighthouse audit failed:', error);
      process.exit(1);
    });
}

module.exports = runAllLighthouseAudits;
