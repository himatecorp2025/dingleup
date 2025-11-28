require('dotenv').config();

module.exports = {
  // App URL
  appUrl: process.env.APP_URL || 'https://1fe67fc5-5c88-483e-b2e5-9ea42baa3c0f.lovableproject.com',
  
  // Frontend test parameters
  concurrentUsers: parseInt(process.env.CONCURRENT_USERS) || 25000,
  rampUpTime: parseInt(process.env.RAMP_UP_TIME) || 300, // 5 minutes to ramp up
  testDuration: parseInt(process.env.TEST_DURATION) || 600, // 10 minutes sustained load
  
  // Browser configuration
  headless: process.env.HEADLESS !== 'false',
  browserType: process.env.BROWSER_TYPE || 'chromium', // chromium, firefox, webkit
  
  // Performance thresholds
  thresholds: {
    pageLoadTime: 3000, // 3 seconds
    firstContentfulPaint: 1800, // 1.8 seconds (Google recommendation)
    largestContentfulPaint: 2500, // 2.5 seconds (Google recommendation)
    timeToInteractive: 3800, // 3.8 seconds
    cumulativeLayoutShift: 0.1, // Google recommendation
    firstInputDelay: 100, // 100ms (Google recommendation)
  },
  
  // Test scenarios
  scenarios: {
    landingPage: true,
    authentication: true,
    dashboard: true,
    gamePlay: true,
    leaderboard: true,
    profile: true,
  },
  
  // Lighthouse configuration
  lighthouse: {
    categories: ['performance', 'accessibility', 'best-practices', 'seo', 'pwa'],
    formFactor: 'mobile', // mobile or desktop
  }
};
