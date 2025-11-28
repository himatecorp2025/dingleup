const fs = require('fs');
const path = require('path');

class FrontendReportGenerator {
  constructor() {
    this.results = [];
    this.lighthouseResults = [];
    this.startTime = new Date();
  }

  addResult(scenario, result) {
    this.results.push({
      scenario,
      timestamp: new Date(),
      ...result
    });
  }

  addLighthouseResult(page, result) {
    this.lighthouseResults.push({
      page,
      timestamp: new Date(),
      ...result
    });
  }

  generateMarkdown() {
    const endTime = new Date();
    const duration = (endTime - this.startTime) / 1000;

    let markdown = `# DingleUP! Frontend Performance & Load Test Report

**Test Date:** ${this.startTime.toISOString()}
**Total Duration:** ${duration.toFixed(2)} seconds
**Test Environment:** Lovable Preview (Frontend)
**App URL:** ${require('../frontend-config').appUrl}

---

## Executive Summary

`;

    // Calculate overall stats
    const config = require('../frontend-config');
    const totalScenarios = this.results.length;
    const totalUsers = config.concurrentUsers;

    markdown += `- **Concurrent Virtual Users:** ${totalUsers.toLocaleString()}
- **Scenarios Tested:** ${totalScenarios}
- **Lighthouse Audits:** ${this.lighthouseResults.length}
- **Test Duration:** ${duration.toFixed(2)}s

---

## Core Web Vitals Analysis

`;

    // Aggregate Core Web Vitals
    const vitals = this.aggregateWebVitals();
    
    markdown += `### Largest Contentful Paint (LCP)
- **Average:** ${vitals.lcp.avg.toFixed(2)}ms
- **P95:** ${vitals.lcp.p95.toFixed(2)}ms
- **Threshold:** < 2,500ms (Good)
- **Status:** ${vitals.lcp.avg < 2500 ? '✅ PASS' : '⚠️ NEEDS IMPROVEMENT'}

### First Input Delay (FID)
- **Average:** ${vitals.fid.avg.toFixed(2)}ms
- **P95:** ${vitals.fid.p95.toFixed(2)}ms
- **Threshold:** < 100ms (Good)
- **Status:** ${vitals.fid.avg < 100 ? '✅ PASS' : '⚠️ NEEDS IMPROVEMENT'}

### Cumulative Layout Shift (CLS)
- **Average:** ${vitals.cls.avg.toFixed(3)}
- **P95:** ${vitals.cls.p95.toFixed(3)}
- **Threshold:** < 0.1 (Good)
- **Status:** ${vitals.cls.avg < 0.1 ? '✅ PASS' : '⚠️ NEEDS IMPROVEMENT'}

### First Contentful Paint (FCP)
- **Average:** ${vitals.fcp.avg.toFixed(2)}ms
- **P95:** ${vitals.fcp.p95.toFixed(2)}ms
- **Threshold:** < 1,800ms (Good)
- **Status:** ${vitals.fcp.avg < 1800 ? '✅ PASS' : '⚠️ NEEDS IMPROVEMENT'}

---

## Scenario Performance Results

`;

    this.results.forEach((result, index) => {
      markdown += `### ${index + 1}. ${result.scenario}

**Timestamp:** ${result.timestamp.toISOString()}

#### Page Load Metrics
- **Total Page Load Time:** ${result.pageLoadTime ? result.pageLoadTime.toFixed(2) : 'N/A'}ms
- **DOM Content Loaded:** ${result.domContentLoaded ? result.domContentLoaded.toFixed(2) : 'N/A'}ms
- **Time to Interactive:** ${result.timeToInteractive ? result.timeToInteractive.toFixed(2) : 'N/A'}ms

#### User Experience Metrics
- **Concurrent Users Simulated:** ${result.concurrentUsers?.toLocaleString() || 'N/A'}
- **Successful Sessions:** ${result.successfulSessions?.toLocaleString() || 'N/A'}
- **Failed Sessions:** ${result.failedSessions || 0}
- **Success Rate:** ${result.successRate ? (result.successRate * 100).toFixed(2) : 'N/A'}%

#### Resource Loading
- **Total Resources:** ${result.totalResources || 'N/A'}
- **Total Transfer Size:** ${result.totalTransferSize ? (result.totalTransferSize / 1024 / 1024).toFixed(2) : 'N/A'} MB
- **JS Bundles:** ${result.jsBundles || 'N/A'}
- **CSS Files:** ${result.cssFiles || 'N/A'}
- **Images:** ${result.images || 'N/A'}

---

`;
    });

    // Lighthouse Results
    if (this.lighthouseResults.length > 0) {
      markdown += `## Lighthouse Audit Results

`;

      this.lighthouseResults.forEach((result, index) => {
        markdown += `### ${index + 1}. ${result.page}

**Timestamp:** ${result.timestamp.toISOString()}

#### Lighthouse Scores (0-100)
- **Performance:** ${result.performance || 'N/A'}/100 ${this.getScoreEmoji(result.performance)}
- **Accessibility:** ${result.accessibility || 'N/A'}/100 ${this.getScoreEmoji(result.accessibility)}
- **Best Practices:** ${result.bestPractices || 'N/A'}/100 ${this.getScoreEmoji(result.bestPractices)}
- **SEO:** ${result.seo || 'N/A'}/100 ${this.getScoreEmoji(result.seo)}
- **PWA:** ${result.pwa || 'N/A'}/100 ${this.getScoreEmoji(result.pwa)}

#### Key Metrics
- **First Contentful Paint:** ${result.firstContentfulPaint || 'N/A'}ms
- **Largest Contentful Paint:** ${result.largestContentfulPaint || 'N/A'}ms
- **Total Blocking Time:** ${result.totalBlockingTime || 'N/A'}ms
- **Cumulative Layout Shift:** ${result.cumulativeLayoutShift || 'N/A'}
- **Speed Index:** ${result.speedIndex || 'N/A'}ms

---

`;
      });
    }

    // Performance Analysis
    markdown += `## Frontend Performance Analysis

### Identified Issues

`;

    const issues = this.identifyFrontendIssues();
    if (issues.length > 0) {
      issues.forEach((issue, i) => {
        markdown += `${i + 1}. **${issue.scenario}**
   - Issue: ${issue.issue}
   - Metric: ${issue.metric}
   - Recommendation: ${issue.recommendation}

`;
      });
    } else {
      markdown += `✅ No critical frontend performance issues identified. All metrics within acceptable thresholds.

`;
    }

    markdown += `### Scalability Assessment (${config.concurrentUsers.toLocaleString()} Users)

`;

    const avgLoadTime = this.results.reduce((sum, r) => sum + (r.pageLoadTime || 0), 0) / this.results.length;
    const avgSuccessRate = this.results.reduce((sum, r) => sum + (r.successRate || 0), 0) / this.results.length;

    if (avgLoadTime > 5000) {
      markdown += `⚠️ **CRITICAL:** Average page load time exceeds 5 seconds under load. Frontend optimization required.\n\n`;
    } else if (avgLoadTime > 3000) {
      markdown += `⚠️ **WARNING:** Average page load time above 3 seconds. Consider optimization.\n\n`;
    } else {
      markdown += `✅ **EXCELLENT:** Average page load time is acceptable under high load.\n\n`;
    }

    if (avgSuccessRate < 0.95) {
      markdown += `⚠️ **CRITICAL:** Success rate below 95%. Users experiencing failures under load.\n\n`;
    } else if (avgSuccessRate < 0.99) {
      markdown += `⚠️ **WARNING:** Success rate below 99%. Some users experiencing issues.\n\n`;
    } else {
      markdown += `✅ **EXCELLENT:** Success rate is excellent even under high load.\n\n`;
    }

    markdown += `---

## Recommended Frontend Optimizations

`;

    const recommendations = this.generateFrontendRecommendations();
    recommendations.forEach((rec, i) => {
      markdown += `${i + 1}. ${rec}\n`;
    });

    markdown += `\n---

## Test Configuration

- **Concurrent Virtual Users:** ${config.concurrentUsers.toLocaleString()}
- **Ramp-Up Time:** ${config.rampUpTime}s
- **Sustained Load Duration:** ${config.testDuration}s
- **Browser Type:** ${config.browserType}
- **Test Mode:** ${config.headless ? 'Headless' : 'Headed'}

---

**NOTE:** NEM hoztam létre admin UI-t vagy új vizuális felületet a frontend load testhez, mindent scripttel és belső teszteléssel oldottam meg.
`;

    return markdown;
  }

  aggregateWebVitals() {
    const lcpValues = [];
    const fidValues = [];
    const clsValues = [];
    const fcpValues = [];

    this.results.forEach(r => {
      if (r.largestContentfulPaint) lcpValues.push(r.largestContentfulPaint);
      if (r.firstInputDelay) fidValues.push(r.firstInputDelay);
      if (r.cumulativeLayoutShift) clsValues.push(r.cumulativeLayoutShift);
      if (r.firstContentfulPaint) fcpValues.push(r.firstContentfulPaint);
    });

    return {
      lcp: this.calculateStats(lcpValues),
      fid: this.calculateStats(fidValues),
      cls: this.calculateStats(clsValues),
      fcp: this.calculateStats(fcpValues),
    };
  }

  calculateStats(values) {
    if (values.length === 0) return { avg: 0, p95: 0 };
    
    const sorted = values.sort((a, b) => a - b);
    const avg = sorted.reduce((sum, v) => sum + v, 0) / sorted.length;
    const p95Index = Math.floor(sorted.length * 0.95);
    const p95 = sorted[p95Index] || sorted[sorted.length - 1];
    
    return { avg, p95 };
  }

  getScoreEmoji(score) {
    if (!score) return '';
    if (score >= 90) return '🟢';
    if (score >= 50) return '🟡';
    return '🔴';
  }

  identifyFrontendIssues() {
    const issues = [];
    const config = require('../frontend-config');

    this.results.forEach(result => {
      // Slow page load
      if (result.pageLoadTime && result.pageLoadTime > config.thresholds.pageLoadTime) {
        issues.push({
          scenario: result.scenario,
          issue: 'Slow page load time',
          metric: `${result.pageLoadTime.toFixed(2)}ms`,
          recommendation: 'Optimize bundle size, enable code splitting, lazy load images'
        });
      }

      // Poor LCP
      if (result.largestContentfulPaint && result.largestContentfulPaint > config.thresholds.largestContentfulPaint) {
        issues.push({
          scenario: result.scenario,
          issue: 'Poor Largest Contentful Paint',
          metric: `${result.largestContentfulPaint.toFixed(2)}ms`,
          recommendation: 'Optimize hero images, preload critical resources, reduce server response time'
        });
      }

      // High CLS
      if (result.cumulativeLayoutShift && result.cumulativeLayoutShift > config.thresholds.cumulativeLayoutShift) {
        issues.push({
          scenario: result.scenario,
          issue: 'High Cumulative Layout Shift',
          metric: result.cumulativeLayoutShift.toFixed(3),
          recommendation: 'Add explicit width/height to images, reserve space for dynamic content'
        });
      }

      // Low success rate
      if (result.successRate && result.successRate < 0.95) {
        issues.push({
          scenario: result.scenario,
          issue: 'Low success rate under load',
          metric: `${(result.successRate * 100).toFixed(2)}%`,
          recommendation: 'Investigate client-side errors, add error boundaries, improve error handling'
        });
      }
    });

    return issues;
  }

  generateFrontendRecommendations() {
    const recommendations = [];
    const issues = this.identifyFrontendIssues();

    if (issues.length === 0) {
      recommendations.push('Current frontend performance is excellent. Continue monitoring in production.');
      return recommendations;
    }

    const issueTypes = new Set(issues.map(i => i.issue));

    if (issueTypes.has('Slow page load time')) {
      recommendations.push('**Bundle Optimization:** Use Vite\'s code splitting and tree-shaking. Analyze bundle with `npm run build -- --analyze`');
      recommendations.push('**Image Optimization:** Compress images, use WebP format, implement lazy loading for below-fold images');
      recommendations.push('**Resource Hints:** Add preload/prefetch for critical assets (fonts, hero images)');
    }

    if (issueTypes.has('Poor Largest Contentful Paint')) {
      recommendations.push('**Critical CSS:** Inline critical CSS for above-the-fold content');
      recommendations.push('**CDN:** Use CDN for static assets to reduce latency');
      recommendations.push('**Server Response:** Optimize backend API responses (see backend load test report)');
    }

    if (issueTypes.has('High Cumulative Layout Shift')) {
      recommendations.push('**Layout Stability:** Add explicit dimensions to images and dynamic content containers');
      recommendations.push('**Font Loading:** Use font-display: swap and preload fonts to prevent layout shifts');
    }

    if (issueTypes.has('Low success rate under load')) {
      recommendations.push('**Error Boundaries:** Implement React error boundaries to prevent full page crashes');
      recommendations.push('**Retry Logic:** Add exponential backoff retry for failed API requests');
      recommendations.push('**Loading States:** Improve loading state UX to prevent user frustration');
    }

    recommendations.push('**Monitoring:** Implement Real User Monitoring (RUM) with tools like Sentry or LogRocket');
    recommendations.push('**Progressive Enhancement:** Ensure core functionality works even with slow connections');

    return recommendations;
  }

  saveReport() {
    const markdown = this.generateMarkdown();
    const reportPath = path.join(__dirname, '../FRONTEND_LOAD_TEST_REPORT.md');
    fs.writeFileSync(reportPath, markdown);
    console.log(`\n✅ Frontend report saved to: ${reportPath}`);
    return reportPath;
  }
}

module.exports = FrontendReportGenerator;
