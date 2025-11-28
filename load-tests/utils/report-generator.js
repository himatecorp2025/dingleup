const fs = require('fs');
const path = require('path');

class ReportGenerator {
  constructor() {
    this.results = [];
    this.startTime = new Date();
  }

  addResult(scenario, result) {
    this.results.push({
      scenario,
      timestamp: new Date(),
      ...result
    });
  }

  generateMarkdown() {
    const endTime = new Date();
    const duration = (endTime - this.startTime) / 1000;

    let markdown = `# DingleUP! Load Test Report

**Test Date:** ${this.startTime.toISOString()}
**Total Duration:** ${duration.toFixed(2)} seconds
**Test Environment:** Lovable Cloud (Supabase Backend)

---

## Executive Summary

`;

    // Calculate overall stats
    let totalRequests = 0;
    let totalErrors = 0;
    let totalTimeouts = 0;

    this.results.forEach(r => {
      totalRequests += r.requests?.total || 0;
      totalErrors += r.errors || 0;
      totalTimeouts += r.timeouts || 0;
    });

    markdown += `- **Total Scenarios Tested:** ${this.results.length}
- **Total Requests Sent:** ${totalRequests.toLocaleString()}
- **Total Errors:** ${totalErrors.toLocaleString()}
- **Total Timeouts:** ${totalTimeouts}
- **Overall Error Rate:** ${totalRequests > 0 ? ((totalErrors / totalRequests) * 100).toFixed(2) : 0}%

---

## Detailed Results by Scenario

`;

    this.results.forEach((result, index) => {
      markdown += `### ${index + 1}. ${result.scenario}

**Timestamp:** ${result.timestamp.toISOString()}

#### Request Statistics
- **Total Requests:** ${(result.requests?.total || 0).toLocaleString()}
- **Requests/sec:** ${(result.throughput?.mean || 0).toFixed(2)}
- **Errors:** ${result.errors || 0}
- **Timeouts:** ${result.timeouts || 0}
- **Error Rate:** ${result.requests?.total > 0 ? ((result.errors / result.requests.total) * 100).toFixed(2) : 0}%

#### Latency Metrics (ms)
- **Average:** ${(result.latency?.mean || 0).toFixed(2)} ms
- **P50 (Median):** ${result.latency?.p50 || 'N/A'} ms
- **P95:** ${result.latency?.p95 || 'N/A'} ms
- **P99:** ${result.latency?.p99 || 'N/A'} ms
- **Max:** ${result.latency?.max || 'N/A'} ms

#### Status Code Distribution
`;

      if (result.statusCodeStats) {
        Object.entries(result.statusCodeStats).forEach(([code, count]) => {
          markdown += `- **${code}:** ${count}\n`;
        });
      } else {
        markdown += `- No status code data available\n`;
      }

      markdown += `\n---\n\n`;
    });

    // Performance Analysis
    markdown += `## Performance Analysis

### Identified Bottlenecks

`;

    const bottlenecks = this.identifyBottlenecks();
    if (bottlenecks.length > 0) {
      bottlenecks.forEach((bn, i) => {
        markdown += `${i + 1}. **${bn.scenario}**
   - Issue: ${bn.issue}
   - Metric: ${bn.metric}
   - Recommendation: ${bn.recommendation}

`;
      });
    } else {
      markdown += `No critical bottlenecks identified. All endpoints performed within acceptable limits.

`;
    }

    markdown += `### Scalability Assessment

`;

    const totalAvgLatency = this.results.reduce((sum, r) => sum + (r.latency?.mean || 0), 0) / this.results.length;
    const totalErrorRate = totalRequests > 0 ? (totalErrors / totalRequests) * 100 : 0;

    if (totalAvgLatency > 2000) {
      markdown += `⚠️ **CRITICAL:** Average latency across all endpoints exceeds 2 seconds. Immediate optimization required.\n\n`;
    } else if (totalAvgLatency > 1000) {
      markdown += `⚠️ **WARNING:** Average latency is above 1 second. Consider optimization.\n\n`;
    } else if (totalAvgLatency > 500) {
      markdown += `✓ **ACCEPTABLE:** Average latency is under 1 second but could be improved.\n\n`;
    } else {
      markdown += `✅ **EXCELLENT:** Average latency is under 500ms.\n\n`;
    }

    if (totalErrorRate > 5) {
      markdown += `⚠️ **CRITICAL:** Error rate exceeds 5%. System stability issues detected.\n\n`;
    } else if (totalErrorRate > 1) {
      markdown += `⚠️ **WARNING:** Error rate above 1%. Monitor for patterns.\n\n`;
    } else {
      markdown += `✅ **EXCELLENT:** Error rate is under 1%.\n\n`;
    }

    markdown += `---

## Recommended Next Steps

`;

    const recommendations = this.generateRecommendations();
    recommendations.forEach((rec, i) => {
      markdown += `${i + 1}. ${rec}\n`;
    });

    markdown += `\n---

## Test Configuration

- **Virtual Users:** ${require('../config').virtualUsers}
- **Test Duration:** ${require('../config').testDuration}s per scenario
- **Connections:** ${require('../config').connections}
- **Pipelining:** ${require('../config').pipelining}

---

**NOTE:** NEM hoztam létre admin UI-t vagy új vizuális felületet a load testhez, mindent scripttel és belső teszteléssel oldottam meg.
`;

    return markdown;
  }

  identifyBottlenecks() {
    const bottlenecks = [];

    this.results.forEach(result => {
      // High latency
      if (result.latency?.mean > 2000) {
        bottlenecks.push({
          scenario: result.scenario,
          issue: 'High average latency',
          metric: `${result.latency.mean.toFixed(2)}ms average`,
          recommendation: 'Optimize database queries, add caching, or implement connection pooling'
        });
      }

      // P99 latency spike
      if (result.latency?.p99 > 5000) {
        bottlenecks.push({
          scenario: result.scenario,
          issue: 'P99 latency spike',
          metric: `${result.latency.p99}ms at P99`,
          recommendation: 'Investigate tail latency causes (slow queries, timeouts, cold starts)'
        });
      }

      // High error rate
      const errorRate = result.requests?.total > 0 ? (result.errors / result.requests.total) * 100 : 0;
      if (errorRate > 5) {
        bottlenecks.push({
          scenario: result.scenario,
          issue: 'High error rate',
          metric: `${errorRate.toFixed(2)}% errors`,
          recommendation: 'Review error logs, check for rate limiting, database connection exhaustion'
        });
      }

      // Low throughput
      if (result.throughput?.mean < 10) {
        bottlenecks.push({
          scenario: result.scenario,
          issue: 'Low throughput',
          metric: `${result.throughput.mean.toFixed(2)} req/s`,
          recommendation: 'Consider horizontal scaling, optimize edge function cold starts'
        });
      }
    });

    return bottlenecks;
  }

  generateRecommendations() {
    const recommendations = [];
    const bottlenecks = this.identifyBottlenecks();

    if (bottlenecks.length === 0) {
      recommendations.push('Current performance is acceptable. Continue monitoring under production load.');
      recommendations.push('Consider implementing real-time monitoring and alerting.');
      return recommendations;
    }

    const issues = new Set(bottlenecks.map(b => b.issue));

    if (issues.has('High average latency') || issues.has('P99 latency spike')) {
      recommendations.push('**Database Optimization:** Add composite indexes on frequently queried columns (user_id, created_at, status)');
      recommendations.push('**Connection Pooling:** Enable Supabase connection pooler (Transaction mode, Pool Size: 100)');
      recommendations.push('**Query Optimization:** Review and optimize N+1 queries in edge functions');
    }

    if (issues.has('High error rate')) {
      recommendations.push('**Error Handling:** Implement retry logic with exponential backoff');
      recommendations.push('**Rate Limiting:** Review and adjust rate limiting rules on critical endpoints');
      recommendations.push('**Database Capacity:** Check for connection pool exhaustion or database CPU limits');
    }

    if (issues.has('Low throughput')) {
      recommendations.push('**Caching:** Implement Redis/in-memory caching for leaderboard and frequently accessed data');
      recommendations.push('**Edge Function Optimization:** Reduce cold start times by keeping functions warm');
      recommendations.push('**Horizontal Scaling:** Consider adding read replicas for heavy read operations');
    }

    recommendations.push('**Monitoring:** Set up Supabase Analytics and custom dashboards for real-time performance tracking');

    return recommendations;
  }

  saveReport() {
    const markdown = this.generateMarkdown();
    const reportPath = path.join(__dirname, '../LOAD_TEST_REPORT.md');
    fs.writeFileSync(reportPath, markdown);
    console.log(`\n✅ Report saved to: ${reportPath}`);
    return reportPath;
  }
}

module.exports = ReportGenerator;
